-- 13 · Unique item codes for every product
-- Run AFTER files 01–12. Safe to run again.
--
-- Every product gets an item code like OPM-688-428:
--   * products without a code get one now,
--   * new products get one automatically when the code is left empty,
--   * admins can change a code any time in Admin → Products,
--   * two products can never share the same code (case-insensitive).

create or replace function app.generate_product_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_code text;
begin
  loop
    v_code := 'OPM-' || lpad((floor(random() * 900) + 100)::int::text, 3, '0')
                || '-' || lpad((floor(random() * 900) + 100)::int::text, 3, '0');
    exit when not exists (select 1 from public.products where lower(product_code) = lower(v_code));
  end loop;
  return v_code;
end;
$$;

-- Clean up codes: trim, upper-case, empty → null.
update public.products set product_code = nullif(upper(btrim(product_code)), '')
where product_code is distinct from nullif(upper(btrim(product_code)), '');

-- If two products already share a code, keep it on the oldest one and clear the others.
update public.products p set product_code = null
where p.product_code is not null
  and exists (
    select 1 from public.products q
  
    where lower(q.product_code) = lower(p.product_code)
      and (q.created_at, q.id) < (p.created_at, p.id)
  );

-- Give every product without a code a new one.
update public.products set product_code = app.generate_product_code() where product_code is null;

create unique index if not exists products_product_code_unique_idx on public.products (lower(product_code));

-- Empty code on insert → generate one. Empty code on update → keep the old code.
create or replace function app.products_fill_code()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.product_code := nullif(upper(btrim(coalesce(new.product_code, ''))), '');
  if new.product_code is null then
    if tg_op = 'UPDATE' and old.product_code is not null then
      new.product_code := old.product_code;
    else
      new.product_code := app.generate_product_code();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_fill_code on public.products;
create trigger products_fill_code
  before insert or update of product_code on public.products
  for each row execute function app.products_fill_code();

select count(*) as products, count(product_code) as with_code from public.products;
