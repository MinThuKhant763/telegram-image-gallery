create extension if not exists pgcrypto;

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  storage_path text,
  telegram_file_id text,
  caption text,
  sender_id text,
  sender_name text,
  status text not null default 'published',
  created_at timestamptz not null default now()
);

create index if not exists gallery_images_created_at_idx
  on public.gallery_images (created_at desc);

create index if not exists gallery_images_status_idx
  on public.gallery_images (status);

alter table public.gallery_images enable row level security;

drop policy if exists "Public can read published gallery images"
  on public.gallery_images;

create policy "Public can read published gallery images"
  on public.gallery_images
  for select
  using (status = 'published');

-- The Telegram webhook uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS for inserts.
