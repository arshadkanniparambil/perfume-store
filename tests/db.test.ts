/**
 * Database tests: migrations, constraints, Row Level Security and the seed.
 *
 * Needs a PostgreSQL 15+ server you can create databases on:
 *
 *   TEST_DATABASE_URL=postgres://postgres@localhost:5432/postgres npm run test:db
 *
 * A fresh, randomly named database is created, migrated and dropped for each
 * run, so this never touches your Supabase project or any existing data.
 * Without TEST_DATABASE_URL the suite is skipped.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { after, before, describe, test } from "node:test";
import postgres from "postgres";
import { sampleProducts } from "../lib/sample-catalog.ts";
import { parseCatalog } from "../lib/validation.ts";
import { seed } from "../scripts/seed.ts";
import { buildSeedSql } from "../scripts/generate-seed-sql.ts";

const adminUrl = process.env.TEST_DATABASE_URL;
const root = new URL("..", import.meta.url);
const migrationsDir = new URL("supabase/migrations/", root);

describe("database", { skip: !adminUrl && "TEST_DATABASE_URL not set" }, () => {
  const dbName = `perfume_test_${process.pid}_${Date.now()}`;
  let admin: postgres.Sql;
  let sql: postgres.Sql;

  before(async () => {
    admin = postgres(adminUrl!, { max: 1, onnotice: () => {} });
    await admin.unsafe(`create database ${dbName}`);
    const url = new URL(adminUrl!);
    url.pathname = `/${dbName}`;
    sql = postgres(url.toString(), { max: 1, onnotice: () => {} });
    await sql.unsafe(
      readFileSync(new URL("tests/db/supabase-shim.sql", root), "utf8"),
    );
    for (const file of readdirSync(migrationsDir).sort()) {
      await sql.unsafe(readFileSync(new URL(file, migrationsDir), "utf8"));
    }
    await seed(sql);
  });

  after(async () => {
    await sql?.end();
    await admin?.unsafe(`drop database if exists ${dbName} with (force)`);
    await admin?.end();
  });

  /** Runs `fn` as a Supabase API role inside a transaction that rolls back. */
  async function as<T>(
    role: "anon" | "authenticated",
    userId: string | null,
    fn: (tx: postgres.TransactionSql) => Promise<T>,
  ): Promise<T> {
    let result: T;
    try {
      await sql.begin(async (tx) => {
        await tx.unsafe(`set local role ${role}`);
        if (userId) {
          await tx`select set_config('request.jwt.claim.sub', ${userId}, true)`;
        }
        result = await fn(tx);
        throw new Rollback();
      });
    } catch (error) {
      if (!(error instanceof Rollback)) throw error;
    }
    return result!;
  }
  class Rollback extends Error {}

  /** Asserts that a statement fails, rolling back so nothing is kept. */
  async function rejects(
    fn: (tx: postgres.TransactionSql) => Promise<unknown>,
    pattern: RegExp,
  ) {
    await assert.rejects(sql.begin(fn), pattern);
  }

  describe("catalog migration and seed", () => {
    test("loads the whole sample catalog", async () => {
      const [counts] = await sql`
        select
          (select count(*)::int from public.brands) as brands,
          (select count(*)::int from public.categories) as categories,
          (select count(*)::int from public.products) as products,
          (select count(*)::int from public.product_variants) as variants,
          (select count(*)::int from public.inventory) as inventory`;
      assert.deepEqual(counts, {
        brands: 5,
        categories: 6,
        products: 8,
        variants: 10,
        inventory: 10,
      });
    });

    test("get_catalog() round-trips exactly to the sample catalog", async () => {
      const catalog = await as("anon", null, async (tx) => {
        const [row] = await tx`select public.get_catalog() as catalog`;
        return parseCatalog(row.catalog);
      });
      assert.deepEqual(catalog, sampleProducts);
    });

    test("prices are stored as integer halalas", async () => {
      const rows = await sql`
        select sku, price_halalas, pg_typeof(price_halalas)::text as type
        from public.product_variants where sku like 'AFNAN-9PM-%'
        order by size_ml`;
      assert.deepEqual(
        rows.map((row) => [row.sku, row.price_halalas, row.type]),
        [
          ["AFNAN-9PM-30ML", 4900, "integer"],
          ["AFNAN-9PM-50ML", 8900, "integer"],
          ["AFNAN-9PM-100ML", 13900, "integer"],
        ],
      );
    });

    test("seeding again changes nothing and keeps stock", async () => {
      await sql`
        update public.inventory set quantity_on_hand = 42
        where variant_id = (select id from public.product_variants
                            where sku = 'LATTAFA-KHAMRAH-100ML')`;
      await seed(sql);
      const [{ products, stock }] = await sql`
        select (select count(*)::int from public.products) as products,
               (select quantity_on_hand from public.inventory i
                join public.product_variants v on v.id = i.variant_id
                where v.sku = 'LATTAFA-KHAMRAH-100ML') as stock`;
      assert.equal(products, 8);
      assert.equal(stock, 42);

      await seed(sql, { resetStock: true });
      const [{ reset }] = await sql`
        select quantity_on_hand as reset from public.inventory i
        join public.product_variants v on v.id = i.variant_id
        where v.sku = 'LATTAFA-KHAMRAH-100ML'`;
      assert.equal(reset, 2);
    });
  });

  describe("supabase/seed.sql (for the SQL Editor)", () => {
    test("is up to date with the sample catalog", () => {
      const committed = readFileSync(new URL("supabase/seed.sql", root), "utf8");
      assert.equal(committed, buildSeedSql(), "run `npm run db:seed-sql`");
    });

    test("loads exactly the sample catalog into a fresh database", async () => {
      const name = `${dbName}_sql`;
      await admin.unsafe(`create database ${name}`);
      const url = new URL(adminUrl!);
      url.pathname = `/${name}`;
      const fresh = postgres(url.toString(), { max: 1, onnotice: () => {} });
      try {
        await fresh.unsafe(
          readFileSync(new URL("tests/db/supabase-shim.sql", root), "utf8"),
        );
        for (const file of readdirSync(migrationsDir).sort()) {
          await fresh.unsafe(readFileSync(new URL(file, migrationsDir), "utf8"));
        }
        const seedSql = readFileSync(new URL("supabase/seed.sql", root), "utf8");
        await fresh.unsafe(seedSql);
        await fresh.unsafe(seedSql); // running it twice is safe
        const [row] = await fresh`select public.get_catalog() as catalog`;
        assert.deepEqual(parseCatalog(row.catalog), sampleProducts);
      } finally {
        await fresh.end();
        await admin.unsafe(`drop database if exists ${name} with (force)`);
      }
    });
  });

  describe("constraints", () => {
    const variant = (sku: string) =>
      sql`(select id from public.product_variants where sku = ${sku})`;

    test("rejects negative prices", () =>
      rejects(
        (tx) =>
          tx`update public.product_variants set price_halalas = -1
             where sku = 'AFNAN-9PM-30ML'`,
        /price_halalas_check/,
      ));

    test("rejects fractional prices given as text", () =>
      rejects(
        (tx) =>
          tx`update public.product_variants set price_halalas = '49.50'
             where sku = 'AFNAN-9PM-30ML'`,
        /invalid input syntax for type integer/,
      ));

    test("rejects duplicate SKUs and duplicate sizes of one product", async () => {
      await rejects(
        (tx) =>
          tx`insert into public.product_variants (product_id, sku, size_ml, price_halalas)
             select product_id, 'AFNAN-9PM-30ML', 75, 100 from public.product_variants
             where sku = 'AFNAN-9PM-50ML'`,
        /product_variants_sku_key/,
      );
      await rejects(
        (tx) =>
          tx`insert into public.product_variants (product_id, sku, size_ml, price_halalas)
             select product_id, 'AFNAN-9PM-30ML-B', 30, 100 from public.product_variants
             where sku = 'AFNAN-9PM-50ML'`,
        /product_variants_product_id_size_ml_key/,
      );
    });

    test("rejects badly formatted SKUs and slugs", async () => {
      await rejects(
        (tx) =>
          tx`update public.product_variants set sku = 'afnan 9pm'
             where sku = 'AFNAN-9PM-30ML'`,
        /product_variants_sku_check/,
      );
      await rejects(
        (tx) => tx`update public.brands set slug = 'Bad Slug' where slug = 'afnan'`,
        /brands_slug_check/,
      );
    });

    test("rejects negative stock and over-reservation", async () => {
      await rejects(
        (tx) =>
          tx`update public.inventory set quantity_on_hand = -1
             where variant_id = ${variant("AFNAN-9PM-30ML")}`,
        /violates check constraint "inventory_(quantity_on_hand_)?check"/,
      );
      await rejects(
        (tx) =>
          tx`update public.inventory set quantity_reserved = quantity_on_hand + 1
             where variant_id = ${variant("AFNAN-9PM-30ML")}`,
        /inventory_check/,
      );
    });

    test("an image can only point at a variant of the same product", () =>
      rejects(
        (tx) =>
          tx`insert into public.product_images (product_id, variant_id, url)
             values (
               (select id from public.products where slug = 'lattafa-asad'),
               ${variant("AFNAN-9PM-30ML")},
               'https://example.com/a.jpg')`,
        /product_images_product_id_variant_id_fkey/,
      ));

    test("a brand that still has products can't be deleted", () =>
      rejects(
        (tx) => tx`delete from public.brands where slug = 'afnan'`,
        /products_brand_id_fkey/,
      ));

    test("order totals must add up", async () => {
      const [customer] = await sql`
        insert into public.customers (email) values ('totals@example.com')
        returning id`;
      await rejects(
        (tx) =>
          tx`insert into public.orders (
               customer_id, fulfillment_method, contact_email, contact_phone,
               subtotal_halalas, shipping_halalas, total_halalas)
             values (${customer.id}, 'pickup', 'totals@example.com',
                     '+966501234567', 10000, 2500, 10000)`,
        /orders_check/,
      );
      await rejects(
        (tx) =>
          tx`insert into public.orders (
               customer_id, fulfillment_method, contact_email, contact_phone,
               subtotal_halalas, total_halalas)
             values (${customer.id}, 'delivery', 'totals@example.com',
                     '+966501234567', 10000, 10000)`,
        /orders_check/,
      );
    });

    test("only one default address per customer", async () => {
      const [customer] = await sql`
        insert into public.customers (email) values ('addr@example.com')
        returning id`;
      await rejects(
        (tx) =>
          tx`insert into public.addresses
               (customer_id, recipient_name, phone, line1, city, is_default)
             values
               (${customer.id}, 'A', '+966501234567', 'Street 1', 'Riyadh', true),
               (${customer.id}, 'A', '+966501234567', 'Street 2', 'Riyadh', true)`,
        /addresses_one_default_idx/,
      );
    });

    test("an order can't use another customer's address", async () => {
      const [a] = await sql`
        insert into public.customers (email) values ('owner@example.com') returning id`;
      const [b] = await sql`
        insert into public.customers (email) values ('other@example.com') returning id`;
      const [address] = await sql`
        insert into public.addresses (customer_id, recipient_name, phone, line1, city)
        values (${a.id}, 'Owner', '+966501234567', 'Street 1', 'Riyadh')
        returning id`;
      await rejects(
        (tx) =>
          tx`insert into public.orders (
               customer_id, address_id, fulfillment_method, contact_email,
               contact_phone, shipping_address, subtotal_halalas, total_halalas)
             values (${b.id}, ${address.id}, 'delivery', 'other@example.com',
                     '+966501234567',
                     '{"recipient_name":"x","line1":"y","city":"z"}',
                     100, 100)`,
        /orders_customer_id_address_id_fkey/,
      );
    });

    test("order line totals are computed by the database", async () => {
      const [customer] = await sql`
        insert into public.customers (email) values ('lines@example.com') returning id`;
      const [order] = await sql`
        insert into public.orders (customer_id, fulfillment_method, contact_email,
          contact_phone, subtotal_halalas, total_halalas)
        values (${customer.id}, 'pickup', 'lines@example.com', '+966501234567',
          9800, 9800)
        returning id, order_number`;
      assert.match(order.order_number, /^PS-\d+$/);
      const [item] = await sql`
        insert into public.order_items (order_id, variant_id, sku,
          product_name_en, product_name_ar, brand_name_en, brand_name_ar,
          size_ml, unit_price_halalas, quantity)
        values (${order.id}, ${variant("AFNAN-9PM-30ML")}, 'AFNAN-9PM-30ML',
          '9PM', '9PM', 'Afnan', 'أفنان', 30, 4900, 2)
        returning line_total_halalas`;
      assert.equal(item.line_total_halalas, 9800);
    });
  });

  describe("row level security", () => {
    let userA: string;
    let userB: string;
    let customerB: string;

    before(async () => {
      [{ id: userA }] = await sql`
        insert into auth.users (email) values ('a@example.com') returning id`;
      [{ id: userB }] = await sql`
        insert into auth.users (email) values ('b@example.com') returning id`;
      const [a] = await sql`
        insert into public.customers (user_id, email, full_name)
        values (${userA}, 'a@example.com', 'Customer A') returning id`;
      const [b] = await sql`
        insert into public.customers (user_id, email, full_name)
        values (${userB}, 'b@example.com', 'Customer B') returning id`;
      customerB = b.id;
      for (const [customer, email] of [[a.id, "a@example.com"], [b.id, "b@example.com"]]) {
        const [order] = await sql`
          insert into public.orders (customer_id, fulfillment_method,
            contact_email, contact_phone, subtotal_halalas, total_halalas)
          values (${customer}, 'pickup', ${email}, '+966501234567', 4900, 4900)
          returning id`;
        await sql`
          insert into public.order_items (order_id, sku, product_name_en,
            product_name_ar, brand_name_en, brand_name_ar, size_ml,
            unit_price_halalas, quantity)
          values (${order.id}, 'AFNAN-9PM-30ML', '9PM', '9PM', 'Afnan', 'أفنان',
            30, 4900, 1)`;
      }
    });

    test("anyone can read active catalog rows", async () => {
      const counts = await as("anon", null, async (tx) => {
        const [row] = await tx`
          select
            (select count(*)::int from public.products) as products,
            (select count(*)::int from public.product_variants) as variants,
            (select count(*)::int from public.inventory) as inventory`;
        return row;
      });
      assert.deepEqual({ ...counts }, { products: 8, variants: 10, inventory: 10 });
    });

    test("inactive products, variants and brands are hidden", async () => {
      await sql.begin(async (tx) => {
        await tx`update public.products set is_active = false where slug = 'lattafa-asad'`;
        await tx`update public.product_variants set is_active = false
                 where sku = 'AFNAN-9PM-30ML'`;
        await tx`update public.brands set is_active = false where slug = 'armaf'`;
        await tx.unsafe("set local role anon");
        const [row] = await tx`select public.get_catalog() as catalog`;
        const catalog = parseCatalog(row.catalog);
        assert.equal(catalog.length, 6);
        assert.ok(!catalog.some((p) => p.slug === "lattafa-asad"));
        assert.ok(!catalog.some((p) => p.brandSlug === "armaf"));
        assert.deepEqual(
          catalog.find((p) => p.slug === "afnan-9pm")!.sizes.map((s) => s.ml),
          [50, 100],
        );
        throw new Rollback();
      }).catch((error) => {
        if (!(error instanceof Rollback)) throw error;
      });
    });

    for (const role of ["anon", "authenticated"] as const) {
      test(`${role} can't change the catalog or stock`, async () => {
        const user = role === "authenticated" ? userA : null;
        await assert.rejects(
          as(role, user, (tx) =>
            tx`insert into public.brands (slug, name_en, name_ar)
               values ('fake', 'Fake', 'Fake')`),
          /permission denied/,
        );
        await assert.rejects(
          as(role, user, (tx) =>
            tx`update public.product_variants set price_halalas = 1`),
          /permission denied/,
        );
        await assert.rejects(
          as(role, user, (tx) => tx`update public.inventory set quantity_on_hand = 999`),
          /permission denied/,
        );
      });
    }

    test("guests can't read customers, addresses or orders", async () => {
      for (const table of ["customers", "addresses", "orders", "order_items"]) {
        await assert.rejects(
          as("anon", null, (tx) => tx.unsafe(`select * from public.${table}`)),
          /permission denied/,
          table,
        );
      }
    });

    test("a signed-in customer sees only their own profile and orders", async () => {
      const seen = await as("authenticated", userA, async (tx) => {
        const customers = await tx`select email from public.customers`;
        const orders = await tx`select contact_email from public.orders`;
        const items = await tx`select count(*)::int as n from public.order_items`;
        return {
          customers: customers.map((row) => row.email),
          orders: orders.map((row) => row.contact_email),
          items: items[0].n,
        };
      });
      assert.deepEqual(seen, {
        customers: ["a@example.com"],
        orders: ["a@example.com"],
        items: 1,
      });
    });

    test("a customer can't edit someone else's profile", async () => {
      const updated = await as("authenticated", userA, (tx) =>
        tx`update public.customers set full_name = 'Hacked'
           where id = ${customerB} returning id`);
      assert.equal(updated.length, 0);
      await assert.rejects(
        as("authenticated", userA, (tx) =>
          tx`update public.customers set user_id = ${userB}
             where user_id = ${userA}`),
        /row-level security/,
      );
    });

    test("a customer manages only their own addresses", async () => {
      const own = await as("authenticated", userA, async (tx) => {
        const [me] = await tx`select id from public.customers`;
        return tx`
          insert into public.addresses (customer_id, recipient_name, phone, line1, city)
          values (${me.id}, 'A', '+966501234567', 'Street 1', 'Riyadh')
          returning id`;
      });
      assert.equal(own.length, 1);
      await assert.rejects(
        as("authenticated", userA, (tx) =>
          tx`insert into public.addresses (customer_id, recipient_name, phone, line1, city)
             values (${customerB}, 'B', '+966501234567', 'Street 1', 'Riyadh')`),
        /row-level security/,
      );
    });

    test("customers can't create or change orders directly", async () => {
      await assert.rejects(
        as("authenticated", userA, async (tx) => {
          const [me] = await tx`select id from public.customers`;
          return tx`
            insert into public.orders (customer_id, fulfillment_method,
              contact_email, contact_phone, subtotal_halalas, total_halalas)
            values (${me.id}, 'pickup', 'a@example.com', '+966501234567', 1, 1)`;
        }),
        /permission denied/,
      );
      await assert.rejects(
        as("authenticated", userA, (tx) =>
          tx`update public.orders set status = 'delivered'`),
        /permission denied/,
      );
    });
  });
});
