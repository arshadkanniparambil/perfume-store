-- Catalog: brands, categories, products, variants (SKUs), inventory, images.
--
-- Money is stored as integer halalas (1 SAR = 100 halalas). Never use
-- floating-point types for prices.

-- Keeps updated_at current on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- brands
create table public.brands (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique
              check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en     text not null check (length(btrim(name_en)) between 1 and 120),
  name_ar     text not null check (length(btrim(name_ar)) between 1 and 120),
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------ categories
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references public.categories (id) on delete restrict,
  slug        text not null unique
              check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en     text not null check (length(btrim(name_en)) between 1 and 120),
  name_ar     text not null check (length(btrim(name_ar)) between 1 and 120),
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (parent_id is distinct from id)
);
create index categories_parent_id_idx on public.categories (parent_id);

-- -------------------------------------------------------------- products
create table public.products (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references public.brands (id) on delete restrict,
  slug            text not null unique
                  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en         text not null check (length(btrim(name_en)) between 1 and 200),
  name_ar         text not null check (length(btrim(name_ar)) between 1 and 200),
  description_en  text not null default '',
  description_ar  text not null default '',
  concentration   text not null default 'Eau de Parfum',
  notes_top_en    text not null default '',
  notes_heart_en  text not null default '',
  notes_base_en   text not null default '',
  notes_top_ar    text not null default '',
  notes_heart_ar  text not null default '',
  notes_base_ar   text not null default '',
  -- Colour of the placeholder bottle shown when a product has no photo.
  accent_color    text not null default '#3E5C76'
                  check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index products_brand_id_idx on public.products (brand_id);
create index products_active_sort_idx on public.products (sort_order)
  where is_active;

create table public.product_categories (
  product_id   uuid not null references public.products (id) on delete cascade,
  category_id  uuid not null references public.categories (id) on delete cascade,
  primary key (product_id, category_id)
);
create index product_categories_category_id_idx
  on public.product_categories (category_id);

-- ------------------------------------------------- variants (= SKUs)
-- One row per sellable unit, e.g. "9PM 50 ml". The `sku` column is the
-- unique stock-keeping code used by staff, suppliers and order history.
create table public.product_variants (
  id                       uuid primary key default gen_random_uuid(),
  product_id               uuid not null
                           references public.products (id) on delete cascade,
  sku                      text not null unique
                           check (sku ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$'),
  size_ml                  integer not null check (size_ml between 1 and 5000),
  price_halalas            integer not null check (price_halalas >= 0),
  compare_at_price_halalas integer
                           check (compare_at_price_halalas > price_halalas),
  barcode                  text unique,
  is_active                boolean not null default true,
  sort_order               integer not null default 0,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (product_id, size_ml),
  -- Lets product_images point at a variant of the *same* product.
  unique (product_id, id)
);
create index product_variants_product_id_idx
  on public.product_variants (product_id);

-- ------------------------------------------------------------- inventory
create table public.inventory (
  variant_id          uuid primary key
                      references public.product_variants (id) on delete cascade,
  quantity_on_hand    integer not null default 0 check (quantity_on_hand >= 0),
  -- Units held by orders that are placed but not yet shipped.
  quantity_reserved   integer not null default 0 check (quantity_reserved >= 0),
  quantity_available  integer generated always as
                      (quantity_on_hand - quantity_reserved) stored,
  low_stock_threshold integer not null default 5
                      check (low_stock_threshold >= 0),
  updated_at          timestamptz not null default now(),
  check (quantity_reserved <= quantity_on_hand)
);

-- -------------------------------------------------------- product images
create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  -- Optional: an image that only applies to one size.
  variant_id  uuid,
  -- Public URL, or a path inside a Supabase Storage bucket.
  url         text not null check (length(btrim(url)) > 0),
  alt_en      text not null default '',
  alt_ar      text not null default '',
  is_primary  boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  foreign key (product_id, variant_id)
    references public.product_variants (product_id, id) on delete cascade
);
create index product_images_product_id_idx
  on public.product_images (product_id, sort_order);
create index product_images_variant_id_idx
  on public.product_images (variant_id) where variant_id is not null;
create unique index product_images_one_primary_idx
  on public.product_images (product_id) where is_primary;

-- -------------------------------------------------------------- triggers
create trigger brands_set_updated_at before update on public.brands
  for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();
create trigger inventory_set_updated_at before update on public.inventory
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------ row level security
-- Shoppers (anon and signed-in) may only READ active catalog rows. All
-- writes go through the server using the service role, which bypasses RLS.
alter table public.brands             enable row level security;
alter table public.categories         enable row level security;
alter table public.products           enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_variants   enable row level security;
alter table public.inventory          enable row level security;
alter table public.product_images     enable row level security;

create policy "Active brands are public"
  on public.brands for select to anon, authenticated
  using (is_active);

create policy "Active categories are public"
  on public.categories for select to anon, authenticated
  using (is_active);

create policy "Active products are public"
  on public.products for select to anon, authenticated
  using (
    is_active
    and exists (
      select 1 from public.brands b
      where b.id = brand_id and b.is_active
    )
  );

create policy "Category links of visible products are public"
  on public.product_categories for select to anon, authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id)
    and exists (select 1 from public.categories c where c.id = category_id)
  );

create policy "Active variants of visible products are public"
  on public.product_variants for select to anon, authenticated
  using (
    is_active
    and exists (select 1 from public.products p where p.id = product_id)
  );

create policy "Stock of visible variants is public"
  on public.inventory for select to anon, authenticated
  using (
    exists (select 1 from public.product_variants v where v.id = variant_id)
  );

create policy "Images of visible products are public"
  on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));

-- Defence in depth: even if a permissive policy were added by mistake,
-- browser roles hold no write privileges on catalog tables.
revoke insert, update, delete, truncate on
  public.brands, public.categories, public.products,
  public.product_categories, public.product_variants,
  public.inventory, public.product_images
  from anon, authenticated;
