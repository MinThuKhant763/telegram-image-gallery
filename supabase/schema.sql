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

create table if not exists public.gallery_notes (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists gallery_notes_created_at_idx
  on public.gallery_notes (created_at desc);

grant select on table public.gallery_notes to anon, authenticated;

alter table public.gallery_notes enable row level security;

drop policy if exists "Public can read gallery notes"
  on public.gallery_notes;

create policy "Public can read gallery notes"
  on public.gallery_notes
  for select
  to anon, authenticated
  using (true);

-- Note creation and deletion go through the server route with ADMIN_TOKEN.
