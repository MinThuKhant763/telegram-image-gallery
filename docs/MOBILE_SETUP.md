# Mobile migration setup

The website and its existing `/api/*` routes are intentionally unchanged. The Expo app uses the authenticated `/api/v1/*` routes only.

## 1. Apply the migration

Run the SQL migration in `supabase/migrations/20260712072408_mobile_auth_and_gallery_hardening.sql` against the production Supabase project before deploying the new server code. It adds:

- a `profiles` table with `viewer`, `editor`, and `admin` roles;
- automatic viewer-profile creation for new Auth users;
- gallery and note audit / soft-delete fields;
- Telegram update idempotency;
- timestamps for mutations.

Set the first administrator explicitly in the Supabase SQL editor after that migration succeeds:

```sql
update public.profiles
set role = 'admin'
where id = '<auth-user-uuid>';
```

Roles are never read from `user_metadata`, because users can edit it themselves.

## 2. Enable authentication

In Supabase Auth, configure the preferred sign-in method (email/password for the MVP) and create or invite the gallery members. Every account is a `viewer` until elevated in `profiles`.

The server validates every mobile bearer token with Supabase Auth, then reads the role through its server-only key. Client-side route guards are therefore convenience only; they are not the authorization boundary.

## 3. Configure the mobile app

Copy `mobile/.env.example` to `mobile/.env` and set only public values:

```bash
EXPO_PUBLIC_API_BASE_URL=https://your-domain.example
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Do not put service-role / secret keys, Telegram credentials, `ADMIN_TOKEN`, or webhook secrets in the Expo environment.

## 4. Deploy order

1. Apply the SQL migration.
2. Deploy the server routes.
3. Verify `GET /api/v1/me` with an Auth access token.
4. Install the mobile dependencies and produce a development build.

The current public gallery stays available during this transition. Moving to private Storage and signed image URLs is a later, deliberate migration because it changes the existing website's image delivery model.
