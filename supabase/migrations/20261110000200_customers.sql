-- Customers and their saved addresses.
--
-- A customer row can exist without a login (guest checkout in a later
-- phase). When a shopper signs up with Supabase Auth, `user_id` links the
-- row to auth.users and RLS lets that shopper see and edit only their data.

create table public.customers (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid unique references auth.users (id) on delete set null,
  email             text not null
                    check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
                           and length(email) <= 254),
  full_name         text not null default ''
                    check (length(full_name) <= 200),
  -- E.164 style, e.g. +966501234567
  phone             text check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  preferred_locale  text not null default 'ar' check (preferred_locale in ('ar', 'en')),
  marketing_opt_in  boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create unique index customers_email_lower_idx on public.customers (lower(email));

create table public.addresses (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references public.customers (id) on delete cascade,
  label           text not null default '' check (length(label) <= 50),
  recipient_name  text not null check (length(btrim(recipient_name)) between 1 and 200),
  phone           text not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  line1           text not null check (length(btrim(line1)) between 1 and 200),
  line2           text not null default '' check (length(line2) <= 200),
  district        text not null default '' check (length(district) <= 100),
  city            text not null check (length(btrim(city)) between 1 and 100),
  region          text not null default '' check (length(region) <= 100),
  postal_code     text check (postal_code ~ '^[0-9]{5}$'),
  -- Saudi National Address short code, e.g. RRRD2929
  short_address   text check (short_address ~ '^[A-Z]{4}[0-9]{4}$'),
  country_code    text not null default 'SA' check (country_code ~ '^[A-Z]{2}$'),
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Lets orders reference an address of the *same* customer.
  unique (customer_id, id)
);
create index addresses_customer_id_idx on public.addresses (customer_id);
create unique index addresses_one_default_idx
  on public.addresses (customer_id) where is_default;

create trigger customers_set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();
create trigger addresses_set_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------ row level security
alter table public.customers enable row level security;
alter table public.addresses enable row level security;

-- `(select auth.uid())` is evaluated once per query rather than per row.
create policy "Customers read their own profile"
  on public.customers for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Customers create their own profile"
  on public.customers for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Customers update their own profile"
  on public.customers for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Customers manage their own addresses"
  on public.addresses for all to authenticated
  using (
    customer_id in (
      select c.id from public.customers c where c.user_id = (select auth.uid())
    )
  )
  with check (
    customer_id in (
      select c.id from public.customers c where c.user_id = (select auth.uid())
    )
  );

-- Guests have no access at all; deleting a customer is a server-only action.
revoke all on public.customers, public.addresses from anon;
revoke delete, truncate on public.customers from authenticated;
revoke truncate on public.addresses from authenticated;
