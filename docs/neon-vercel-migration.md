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
5. Port `updateMarketSnapshots`.
6. Port `processRawNews`.
7. Port `collectLatestNews`.
8. Port `backfillNews`.
9. Port `sendDailyNewsletter`.
10. Add real admin authentication.

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
