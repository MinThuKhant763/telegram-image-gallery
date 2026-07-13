begin;

-- Keep app-only helper functions out of the exposed public schema.
create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'viewer' check (role in ('viewer', 'editor', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

revoke all on table public.profiles from anon;
grant select on table public.profiles to authenticated;

-- Do not take roles from user_metadata. New accounts are always viewers; role
-- elevation is an explicit server-side / SQL administration action.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.handle_new_user();

-- Backfill accounts that existed before the trigger was introduced.
insert into public.profiles (id, display_name)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', email)
from auth.users
on conflict (id) do nothing;

alter table public.gallery_images
  add column if not exists telegram_update_id bigint,
  add column if not exists width integer check (width is null or width > 0),
  add column if not exists height integer check (height is null or height > 0),
  add column if not exists mime_type text,
  add column if not exists file_size bigint check (file_size is null or file_size >= 0),
  add column if not exists blurhash text,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

create unique index if not exists gallery_images_telegram_update_id_key
  on public.gallery_images (telegram_update_id)
  where telegram_update_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gallery_images_status_check'
      and conrelid = 'public.gallery_images'::regclass
  ) then
    alter table public.gallery_images
      add constraint gallery_images_status_check
      check (status in ('published', 'hidden', 'deleted')) not valid;
  end if;
end;
$$;

alter table public.gallery_notes
  add column if not exists author_id uuid references auth.users(id),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;

drop trigger if exists gallery_images_set_updated_at on public.gallery_images;
create trigger gallery_images_set_updated_at
  before update on public.gallery_images
  for each row execute procedure private.set_updated_at();

drop trigger if exists gallery_notes_set_updated_at on public.gallery_notes;
create trigger gallery_notes_set_updated_at
  before update on public.gallery_notes
  for each row execute procedure private.set_updated_at();

commit;
