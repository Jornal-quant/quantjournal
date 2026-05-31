# QuantJournal Neon/Vercel Migration

This branch prepares QuantJournal to run outside Base44 while keeping the current Base44 deployment intact.

## Current Strategy

- `VITE_DATA_BACKEND=base44`: current production behavior.
- `VITE_DATA_BACKEND=neon`: React uses Vercel API routes, API routes use Neon Postgres.
- `DATABASE_URL` is server-only and must never be exposed as `VITE_*`.
- DeepSeek is the default AI provider for the Vercel runtime.

## What Moves From Base44

- Articles: `Article` -> `qj_articles`
- Raw queue: `RawNewsFeed` -> `qj_raw_news_feed`
- Sources: `NewsSource` -> `qj_news_sources`
- Market data: `MarketSnapshot` -> `qj_market_snapshots`
- Newsletter: `NewsletterSubscriber` -> `qj_newsletter_subscribers`
- Logs: `SystemLog` -> `qj_system_logs`
- Asset pages: `AssetPage` -> `qj_asset_pages`
- Chat sessions: `ChatConversation` -> `qj_chat_conversations`

## What We Lose From Base44

- Visual builder and Base44 chat-based edits.
- Base44 entity SDK and managed function runtime.
- Base44 auth and app public settings.
- Base44 integration credits and built-in `InvokeLLM`/`SendEmail`.
- Base44 preview/publish flow.

## What Replaces It

- Vercel for frontend and API routes.
- Neon for Postgres.
- DeepSeek for AI generation.
- Resend or Brevo for newsletter.
- Vercel Cron for collectors.
- A later auth provider for admin, such as Clerk, Auth.js, or Neon Auth.

## Migration Order

1. Apply `migrations/001_quantjournal_neon_schema.sql`.
2. Port Base44 data export/import scripts.
3. Deploy current frontend to Vercel with `VITE_DATA_BACKEND=base44` as a smoke test.
4. Configure `DATABASE_URL` and switch Vercel to `VITE_DATA_BACKEND=neon`.
5. Port `updateMarketSnapshots`. Done in `api/functions/[name].js`.
6. Port `processRawNews`. Done in `api/functions/[name].js`.
7. Port `collectLatestNews`. Done in `api/functions/[name].js`.
8. Port `backfillNews`. Done in `api/functions/[name].js`.
9. Port `sendDailyNewsletter`. Done in `api/functions/[name].js`, requires `RESEND_API_KEY`.
10. Add real admin authentication.

## Current Neon Runtime Status

Implemented:

- Generic entity CRUD for the current frontend entity API shape.
- DeepSeek invocation route.
- `updateMarketSnapshots`.
- `collectLatestNews` and `collectNewsSources`.
- `processRawNews`.
- `backfillNews`.
- `sendDailyNewsletter`.
- `ingestNews`.
- `autoPublishNews`.

Verified against Neon:

- `updateMarketSnapshots` created 9 market snapshots.
- `collectLatestNews` collected 115 raw RSS items with `auto_process: false`.

Still pending:

- Running `npm run base44:export` with Base44 credentials to export production data into ignored `exports/*.json`.
- Running `npm run neon:import` with `DATABASE_URL` to import exported data into Neon.
- Replacing the temporary migration admin bypass with real authentication.
- Setting Vercel environment variables and deploying the Neon runtime.

## Data Migration Commands

Export from Base44:

```bash
BASE44_APP_ID=... BASE44_ACCESS_TOKEN=... BASE44_APP_BASE_URL=... npm run base44:export
```

Import into Neon:

```bash
DATABASE_URL='postgresql://...' npm run neon:import
```

## Required Vercel Variables

```bash
VITE_DATA_BACKEND=neon
DATABASE_URL=...
DEEPSEEK_API_KEY=...
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_CHEAP_MODEL=deepseek-chat
DEEPSEEK_QUALITY_MODEL=deepseek-reasoner
RESEND_API_KEY=...
NEWSLETTER_FROM=FinAI Pulse <news@your-domain.com>
```

## DeepSeek Analysis Setup

Use a new DeepSeek key only. If a key was pasted into chat, revoke it in DeepSeek and generate another one before deploying.

Local test:

```bash
cp .env.example .env.local
# Fill DEEPSEEK_API_KEY with a new key in .env.local, then:
npm run deepseek:smoke
```

The smoke command calls DeepSeek with a sample market item and prints only non-secret output:

- Model used.
- Generated title.
- Category.
- AI confidence.
- Whether impact analysis was returned.

Production flow:

- `processRawNews` takes queued RSS items from `qj_raw_news_feed`, asks DeepSeek for a structured article, and saves it in `qj_articles`.
- `autoPublishNews` collects fresh RSS items and processes the most relevant ones.
- `backfillNews` generates older/context articles to fill the portal.
- `sendDailyNewsletter` uses DeepSeek to create the daily newsletter body.

Vercel should store `DEEPSEEK_API_KEY` as a server-side environment variable. Do not prefix it with `VITE_`, because `VITE_*` variables are exposed to the browser.
