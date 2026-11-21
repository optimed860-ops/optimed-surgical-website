-- 12 · Blog
-- Run AFTER files 01–11. Safe to run again.
--
-- Articles written in Admin → Blog. Visitors see only published articles whose
-- publish date has arrived. Cover images go in the public site-assets bucket
-- under blog/…  Body text uses a small Markdown subset (## headings, lists,
-- **bold**, [links](https://…)).

create table if not exists public.blog_posts (
  id               uuid primary key default gen_random_uuid(),
  title            text not null check (char_length(title) between 1 and 200),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  excerpt          text not null check (char_length(excerpt) between 1 and 320),
  body             text not null check (char_length(body) between 1 and 100000),
  seo_title        text check (char_length(seo_title) <= 70),
  seo_description  text check (char_length(seo_description) <= 170),
  cover_image_path text check (char_length(cover_image_path) <= 300),
  cover_image_alt  text check (char_length(cover_image_alt) <= 250),
  author_name      text not null default 'Optimed Surgical' check (char_length(author_name) between 1 and 120),
  tags             text[] not null default '{}' check (cardinality(tags) <= 12),
  is_published     boolean not null default false,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists blog_posts_published_idx on public.blog_posts (is_published, published_at desc);

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function app.set_updated_at();

alter table public.blog_posts enable row level security;

revoke all on public.blog_posts from anon, authenticated;
grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;

drop policy if exists "blog_posts: public reads published" on public.blog_posts;
create policy "blog_posts: public reads published" on public.blog_posts
  for select to anon, authenticated
  using (is_published and published_at is not null and published_at <= now());

drop policy if exists "blog_posts: admin full access" on public.blog_posts;
create policy "blog_posts: admin full access" on public.blog_posts
  for all to authenticated
  using ((select app.is_admin())) with check ((select app.is_admin()));
