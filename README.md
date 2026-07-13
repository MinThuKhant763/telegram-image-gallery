# Telegram Image Gallery

A small website that updates automatically when you send a photo to a Telegram bot.

## Stack

- Static HTML/CSS/JS frontend
- Node/Vercel API routes
- Telegram Bot API webhook
- Supabase Postgres + Storage

## 1. Create Supabase Resources

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Create a storage bucket named `gallery-images`.
5. Make the bucket public if you want public images.

## 2. Configure Environment

Copy `.env.example` to `.env` and fill in the values.

```bash
cp .env.example .env
```

Required variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` or `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`
- `SUPABASE_BUCKET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_SECRET_TOKEN`
- `ALLOWED_TELEGRAM_USER_IDS`
- `ADMIN_TOKEN`

## 3. Run Locally

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

Admin page:

```txt
http://localhost:3000/admin.html
```

Notes page:

```txt
http://localhost:3000/notes.html
```

## 4. Create Telegram Bot

1. Open Telegram and message `@BotFather`.
2. Run `/newbot`.
3. Copy the bot token into `TELEGRAM_BOT_TOKEN`.
4. Get your Telegram numeric user ID and add it to `ALLOWED_TELEGRAM_USER_IDS`.

## 5. Set Telegram Webhook

After deploying, set the webhook:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://your-domain.com/api/telegram-webhook" \
  -d "secret_token=$TELEGRAM_SECRET_TOKEN"
```

Telegram will now send photo messages to your app.

## API Routes

- `GET /api/gallery` returns published images.
- `GET /api/notes` returns saved notes.
- `GET /api/admin-images` returns all images for admin users.
- `PATCH /api/admin-images` updates captions and publish status.
- `DELETE /api/admin-images?id=...` deletes an image record and storage object.
- `POST /api/admin-notes` saves a note for admin users.
- `DELETE /api/admin-notes?id=...` deletes a note for admin users.
- `GET /api/public-config` returns public Supabase browser config.
- `POST /api/telegram-webhook` receives Telegram updates.

## Mobile app

`mobile/` contains the Expo Router iOS, Android, and web client. It uses Supabase Auth for individual accounts and the authenticated `/api/v1/*` backend routes; it never receives the Telegram or Supabase server credentials.

Before running it, follow [the mobile migration guide](docs/MOBILE_SETUP.md), then:

```bash
cd mobile
cp .env.example .env
npm install
npm run start
```

Run `npm run typecheck` in `mobile/` to validate the TypeScript app. EAS profiles are included in `mobile/eas.json` for development, preview, and production builds.

## Deployment Notes

This project is Vercel-ready because API routes live in `api/`.

Set the same environment variables in your Vercel project settings, deploy, then set the Telegram webhook to your Vercel URL.
# telegram-image-gallery
