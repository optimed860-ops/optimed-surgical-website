-- 03 · Catalogue: categories, subcategories, products, product images
-- No price columns, by design.

-- ── Categories ──────────────────────────────────────────────────────────────
create table public.categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 120),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description   text check (char_length(description) <= 2000),
  image_path    text,
  is_published  boolean not null default false,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index categories_published_order_idx
  on public.categories (is_published, display_order);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function app.set_updated_at();

-- ── Subcategories ───────────────────────────────────────────────────────────
create table public.subcategories (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.categories (id) on delete restrict,
  name          text not null check (char_length(name) between 1 and 120),
  slug          text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description   text check (char_length(description) <= 2000),
  image_path    text,
  is_published  boolean not null default false,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (category_id, slug)
);

create index subcategories_category_order_idx
  on public.subcategories (category_id, display_order);

create trigger subcategories_set_updated_at
  before update on public.subcategories
  for each row execute function app.set_updated_at();

-- ── Products ────────────────────────────────────────────────────────────────
create table public.products (
  id                uuid primary key default gen_random_uuid(),
  category_id       uuid not null references public.categories (id) on delete restrict,
  subcategory_id    uuid references public.subcategories (id) on delete restrict,
  name              text not null check (char_length(name) between 1 and 200),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  product_code      text check (char_length(product_code) <= 80),
  manufacturer      text check (char_length(manufacturer) <= 160),
  short_description text check (char_length(short_description) <= 500),
  description       text check (char_length(description) <= 20000),
  -- Ordered list of {"label": "...", "value": "..."} pairs.
  specifications    jsonb not null default '[]'::jsonb
                    check (jsonb_typeof(specifications) = 'array'),
  is_featured       boolean not null default false,
  featured_order    integer not null default 0,
  is_published      boolean not null default false,
  search_vector     tsvector generated always as (
                      setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
                      setweight(to_tsvector('simple',  coalesce(product_code, '')), 'A') ||
                      setweight(to_tsvector('english', coalesce(manufacturer, '')), 'B') ||
                      setweight(to_tsvector('english', coalesce(short_description, '')), 'C')
                    ) stored,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index products_category_idx     on public.products (category_id);
create index products_subcategory_idx  on public.products (subcategory_id);
create index products_published_idx    on public.products (created_at desc) where is_published;
create index products_featured_idx     on public.products (featured_order) where is_featured and is_published;
create index products_product_code_idx on public.products (product_code);
create index products_search_idx       on public.products using gin (search_vector);
create index products_name_trgm_idx    on public.products using gin (name extensions.gin_trgm_ops);
create index products_code_trgm_idx    on public.products using gin (product_code extensions.gin_trgm_ops);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function app.set_updated_at();

-- A product's subcategory must belong to the product's category.
create or replace function app.check_product_subcategory()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.subcategory_id is not null and not exists (
    select 1 from public.subcategories s
    where s.id = new.subcategory_id and s.category_id = new.category_id
  ) then
    raise exception 'Subcategory does not belong to the selected category'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger products_check_subcategory
  before insert or update of category_id, subcategory_id on public.products
  for each row execute function app.check_product_subcategory();

-- ── Product images ──────────────────────────────────────────────────────────
create table public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  storage_path  text not null unique,
  alt_text      text check (char_length(alt_text) <= 250),
  display_order integer not null default 0,
  is_primary    boolean not null default false,
  created_at    timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id, display_order);
create unique index product_images_one_primary_idx
  on public.product_images (product_id) where is_primary;
