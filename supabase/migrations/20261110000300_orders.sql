-- Orders and order items.
--
-- Orders copy ("snapshot") the price, name, SKU and address at the moment
-- they are placed, so later catalog or address edits never change history.
-- Payment processing is NOT implemented yet; payment_status stays 'unpaid'.

create type public.order_status as enum (
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
);
create type public.payment_status as enum ('unpaid', 'paid', 'refunded');
create type public.fulfillment_method as enum ('delivery', 'pickup');

create sequence public.order_number_seq start 1001;

create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text not null unique
                      default ('PS-' || nextval('public.order_number_seq')::text),
  customer_id         uuid not null references public.customers (id) on delete restrict,
  -- Address used for delivery; must belong to the same customer.
  address_id          uuid,
  status              public.order_status not null default 'pending',
  payment_status      public.payment_status not null default 'unpaid',
  fulfillment_method  public.fulfillment_method not null default 'delivery',
  -- Contact and address as they were when the order was placed.
  contact_email       text not null
                      check (contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  contact_phone       text not null check (contact_phone ~ '^\+[1-9][0-9]{7,14}$'),
  shipping_address    jsonb,
  currency            text not null default 'SAR' check (currency = 'SAR'),
  subtotal_halalas    integer not null check (subtotal_halalas >= 0),
  shipping_halalas    integer not null default 0 check (shipping_halalas >= 0),
  discount_halalas    integer not null default 0 check (discount_halalas >= 0),
  total_halalas       integer not null check (total_halalas >= 0),
  -- VAT already included in the prices above (15% in Saudi Arabia).
  vat_halalas         integer not null default 0 check (vat_halalas >= 0),
  customer_note       text not null default '' check (length(customer_note) <= 1000),
  placed_at           timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  foreign key (customer_id, address_id)
    references public.addresses (customer_id, id) on delete set null (address_id),
  check (total_halalas = subtotal_halalas + shipping_halalas - discount_halalas),
  check (vat_halalas <= total_halalas),
  check (
    (fulfillment_method = 'pickup')
    or (
      shipping_address is not null
      and jsonb_typeof(shipping_address) = 'object'
      and shipping_address ? 'recipient_name'
      and shipping_address ? 'line1'
      and shipping_address ? 'city'
    )
  )
);
create index orders_customer_id_idx on public.orders (customer_id, placed_at desc);
create index orders_status_idx on public.orders (status, placed_at desc);
create index orders_address_id_idx on public.orders (address_id)
  where address_id is not null;

create table public.order_items (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders (id) on delete cascade,
  -- Kept nullable so deleting a variant never deletes order history.
  variant_id          uuid references public.product_variants (id) on delete set null,
  sku                 text not null,
  product_name_en     text not null,
  product_name_ar     text not null,
  brand_name_en       text not null,
  brand_name_ar       text not null,
  size_ml             integer not null check (size_ml > 0),
  unit_price_halalas  integer not null check (unit_price_halalas >= 0),
  quantity            integer not null check (quantity between 1 and 99),
  line_total_halalas  integer generated always as (unit_price_halalas * quantity) stored,
  created_at          timestamptz not null default now(),
  unique (order_id, sku)
);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_variant_id_idx on public.order_items (variant_id)
  where variant_id is not null;

create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------ row level security
-- Customers can read their own orders. Creating and changing orders is a
-- server-only action (service role), so prices and stock are always checked
-- on the server and can't be forged from the browser.
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

create policy "Customers read their own orders"
  on public.orders for select to authenticated
  using (
    customer_id in (
      select c.id from public.customers c where c.user_id = (select auth.uid())
    )
  );

create policy "Customers read items of their own orders"
  on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

revoke all on public.orders, public.order_items from anon;
revoke insert, update, delete, truncate
  on public.orders, public.order_items from authenticated;
revoke all on sequence public.order_number_seq from anon, authenticated;
