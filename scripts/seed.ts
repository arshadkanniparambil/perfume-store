/**
 * Loads the sample catalog (lib/sample-catalog.ts) into the database.
 *
 *   npm run db:seed                  # insert or update the sample products
 *   npm run db:seed -- --reset-stock # also overwrite stock with sample numbers
 *
 * Needs DATABASE_URL (the Postgres connection string from Supabase:
 * Project Settings → Database). It is read from the environment or from
 * .env.local, never hard-coded.
 *
 * Safe to run more than once: rows are matched by slug / SKU and updated in
 * place. It never deletes anything. Existing stock levels are left alone
 * unless --reset-stock is passed, so re-seeding can't wipe real inventory.
 */
import postgres from "postgres";
import {
  sampleBrands,
  sampleCategories,
  sampleProducts,
} from "../lib/sample-catalog.ts";

export async function seed(sql: postgres.Sql, { resetStock = false } = {}) {
  return sql.begin(async (tx) => {
    for (const [index, brand] of sampleBrands.entries()) {
      await tx`
        insert into public.brands (slug, name_en, name_ar, sort_order)
        values (${brand.slug}, ${brand.name}, ${brand.nameAr}, ${index})
        on conflict (slug) do update set
          name_en = excluded.name_en,
          name_ar = excluded.name_ar,
          sort_order = excluded.sort_order`;
    }

    for (const [index, category] of sampleCategories.entries()) {
      await tx`
        insert into public.categories (slug, name_en, name_ar, sort_order)
        values (${category.slug}, ${category.name}, ${category.nameAr}, ${index})
        on conflict (slug) do update set
          name_en = excluded.name_en,
          name_ar = excluded.name_ar,
          sort_order = excluded.sort_order`;
    }

    let variants = 0;
    for (const [index, product] of sampleProducts.entries()) {
      const [{ id: productId }] = await tx`
        insert into public.products (
          brand_id, slug, name_en, name_ar, description_en, description_ar,
          concentration, notes_top_en, notes_heart_en, notes_base_en,
          notes_top_ar, notes_heart_ar, notes_base_ar, accent_color, sort_order
        )
        values (
          (select id from public.brands where slug = ${product.brandSlug}),
          ${product.slug}, ${product.name}, ${product.nameAr},
          ${product.description}, ${product.descriptionAr},
          ${product.concentration},
          ${product.notes.top}, ${product.notes.heart}, ${product.notes.base},
          ${product.notes.topAr}, ${product.notes.heartAr}, ${product.notes.baseAr},
          ${product.tone}, ${index}
        )
        on conflict (slug) do update set
          brand_id = excluded.brand_id,
          name_en = excluded.name_en,
          name_ar = excluded.name_ar,
          description_en = excluded.description_en,
          description_ar = excluded.description_ar,
          concentration = excluded.concentration,
          notes_top_en = excluded.notes_top_en,
          notes_heart_en = excluded.notes_heart_en,
          notes_base_en = excluded.notes_base_en,
          notes_top_ar = excluded.notes_top_ar,
          notes_heart_ar = excluded.notes_heart_ar,
          notes_base_ar = excluded.notes_base_ar,
          accent_color = excluded.accent_color,
          sort_order = excluded.sort_order
        returning id`;

      for (const categorySlug of product.categories) {
        await tx`
          insert into public.product_categories (product_id, category_id)
          values (
            ${productId},
            (select id from public.categories where slug = ${categorySlug})
          )
          on conflict do nothing`;
      }

      for (const [sizeIndex, size] of product.sizes.entries()) {
        const [{ id: variantId }] = await tx`
          insert into public.product_variants (
            product_id, sku, size_ml, price_halalas, sort_order
          )
          values (
            ${productId}, ${size.sku}, ${size.ml}, ${size.priceHalalas},
            ${sizeIndex}
          )
          on conflict (sku) do update set
            product_id = excluded.product_id,
            size_ml = excluded.size_ml,
            price_halalas = excluded.price_halalas,
            sort_order = excluded.sort_order
          returning id`;
        variants += 1;

        if (resetStock) {
          await tx`
            insert into public.inventory (variant_id, quantity_on_hand)
            values (${variantId}, ${size.stock})
            on conflict (variant_id) do update set
              quantity_on_hand = excluded.quantity_on_hand,
              quantity_reserved = 0`;
        } else {
          await tx`
            insert into public.inventory (variant_id, quantity_on_hand)
            values (${variantId}, ${size.stock})
            on conflict (variant_id) do nothing`;
        }
      }
    }

    return {
      brands: sampleBrands.length,
      categories: sampleCategories.length,
      products: sampleProducts.length,
      variants,
    };
  });
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "DATABASE_URL is not set. Add it to .env.local (see .env.example).",
    );
    process.exit(1);
  }
  // prepare: false keeps it compatible with Supabase's connection pooler.
  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  try {
    const result = await seed(sql, {
      resetStock: process.argv.includes("--reset-stock"),
    });
    console.log(
      `Seeded ${result.brands} brands, ${result.categories} categories, ` +
        `${result.products} products and ${result.variants} variants.`,
    );
  } finally {
    await sql.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
