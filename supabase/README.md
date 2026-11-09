# Database (Supabase / PostgreSQL)

## Tables

```
brands ──< products >── product_categories ──< categories (self-nesting)
              │
              ├──< product_variants (one row = one SKU, e.g. 9PM 50 ml)
              │        ├── inventory (1:1, stock per SKU)
              │        └──< product_images (optional per-size photo)
              └──< product_images

auth.users ── customers ──< addresses
                  │
                  └──< orders ──< order_items ──> product_variants
```

| Table | What it holds |
|---|---|
| `brands` | Afnan, Lattafa… (English and Arabic names) |
| `categories` | Men, Women, Oud & attar… Can be nested through `parent_id` |
| `products` | One perfume: names, descriptions, notes, placeholder colour |
| `product_categories` | Which categories a product is in (many-to-many) |
| `product_variants` | One sellable size, with its unique `sku` and `price_halalas` |
| `inventory` | `quantity_on_hand`, `quantity_reserved`, computed `quantity_available` |
| `product_images` | Photo URLs, alt text in both languages, one primary image per product |
| `customers` | Shopper profile, linked to a Supabase Auth login when they have one |
| `addresses` | Saved delivery addresses, at most one default per customer |
| `orders` | Status, totals, and a copy of the contact details and address at order time |
| `order_items` | A copy of the SKU, names, size and unit price at order time |

### Rules the database enforces

- **Money:** integer halalas only (`SAR 49.50` = `4950`). Totals must add up:
  `total = subtotal + shipping − discount`.
- **Stock:** can't go negative, and reserved units can't exceed units on hand.
- **Unique codes:** slugs and SKUs are unique and must match a fixed format.
  A product can't have the same size twice.
- **History is kept:**
  - A brand with products can't be deleted.
  - Deleting a variant keeps old order lines, because each line stores its own copy of the details.
  - An order can only use an address that belongs to the same customer.

### Who can do what (Row Level Security)

| | Guest (`anon`) | Signed-in shopper | Server / service role |
|---|---|---|---|
| Active catalog and stock | read | read | everything |
| Hidden (inactive) products | — | — | everything |
| Own customer profile | — | read, create, update | everything |
| Own addresses | — | read, create, update, delete | everything |
| Own orders and items | — | read | everything |
| Other people's data | — | — | everything |

Shoppers can never create or change orders, prices or stock directly. Those
writes will happen on the server in the checkout phase, after prices and stock
have been checked.

## Setting up Supabase

1. **Create the project.** Create a project at supabase.com. Choose the region
   closest to your customers.
2. **Run the migrations**, using one of these options:
   - **Supabase CLI:** run `npx supabase login`, then `npx supabase init`
     (this keeps the existing `migrations` folder), then
     `npx supabase link --project-ref <ref>`, then `npx supabase db push`.
   - **Without the CLI:** open the SQL Editor and run each file in
     `supabase/migrations/` in filename order.
3. **Set up environment variables.** Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`:
     from Project Settings → API. Use the **publishable** key (`sb_publishable_…`),
     never a secret or service-role key.
   - `DATABASE_URL`: from Project Settings → Database → Connection string.
4. **Load the sample products** with `npm run db:seed`. It is safe to run again.
   To also reset stock to the sample numbers, run
   `npm run db:seed -- --reset-stock`.
5. **Start the site** with `npm run dev`. Products now come from the database.
   Without `NEXT_PUBLIC_SUPABASE_URL` the site falls back to the built-in sample catalog
   and logs a warning.
6. **Configure hosting.** On your hosting provider (e.g. Vercel), add
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as
   environment variables. Don't add `DATABASE_URL` there; only the seed script
   needs it.

### Which keys are safe where

- **Publishable key** (`sb_publishable_…`): public by design and may reach the
  browser. Row Level Security limits it to what a guest or the signed-in
  shopper may see.
- **Secret / service-role key** (`sb_secret_…`): bypasses Row Level Security.
  Never put it in a `NEXT_PUBLIC_` variable or in any file that runs in the
  browser. The site refuses to start if it finds one in the publishable-key
  variable.
- **`DATABASE_URL`**: contains the database password. Keep it in `.env.local`
  for the seed script only.

### Supabase client helpers

| File | Use it for |
|---|---|
| `lib/server/supabase.ts` | Public catalog reads on the server. Reads no cookies, so pages stay cached. |
| `utils/supabase/server.ts` | Server code acting as the signed-in shopper (cookies), e.g. their orders. |
| `utils/supabase/client.ts` | Browser code, e.g. sign-in forms in a later phase. |
| `utils/supabase/middleware.ts` + `middleware.ts` | Refreshes the shopper's login session on each page request. |

## Testing

`npm run test:db` creates a temporary database on any PostgreSQL 15+ server
you point it at, runs the migrations and seed, and checks the constraints and
RLS rules. It then deletes the temporary database.

```
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm run test:db
```

`tests/db/supabase-shim.sql` imitates Supabase's `auth` schema and API roles
on plain Postgres. Use it for tests only, never on a real project.
