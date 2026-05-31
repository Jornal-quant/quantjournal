# Neon Vercel Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move QuantJournal from Base44-managed data/functions to Neon Postgres and Vercel API routes without breaking the current Base44 deployment.

**Architecture:** Keep Base44 as the default runtime and add a selectable `VITE_DATA_BACKEND=neon` runtime. The React app keeps its existing `base44.entities.*` call shape while `src/api/base44Client.js` routes those calls to Vercel API routes backed by Neon. Server-only routes use `DATABASE_URL`, DeepSeek, and later email providers.

**Tech Stack:** Vite, React, Vercel API Routes, Neon Serverless Postgres, `@neondatabase/serverless`, DeepSeek API.

---

### Task 1: Apply Neon Schema

**Files:**
- Create: `migrations/001_quantjournal_neon_schema.sql`
- Create: `scripts/apply-neon-schema.mjs`
- Modify: `package.json`

- [ ] **Step 1: Set `DATABASE_URL` locally**

Create `.env.local` from `.env.example` and set `DATABASE_URL` to the pooled Neon connection string for project `jornalquant`.

- [ ] **Step 2: Apply schema**

Run:

```bash
DATABASE_URL='postgresql://...' node scripts/apply-neon-schema.mjs
```

Expected output:

```text
Neon schema applied: migrations/001_quantjournal_neon_schema.sql
```

### Task 2: Switch Frontend Runtime

**Files:**
- Modify: `src/api/base44Client.js`
- Modify: `src/lib/AuthContext.jsx`
- Create: `api/entities/[entity].js`
- Create: `api/_db.js`

- [ ] **Step 1: Keep Base44 default**

Confirm `.env.example` has:

```bash
VITE_DATA_BACKEND=base44
```

- [ ] **Step 2: Test Neon mode locally after schema is applied**

Run:

```bash
VITE_DATA_BACKEND=neon npm run dev
```

Expected: public pages request data from `/api/entities/*`. Admin auth is temporarily bypassed for migration.

### Task 3: Port Base44 Functions

**Files:**
- Modify: `api/functions/[name].js`
- Read: `base44/functions/processRawNews/entry.ts`
- Read: `base44/functions/collectLatestNews/entry.ts`
- Read: `base44/functions/backfillNews/entry.ts`
- Read: `base44/functions/updateMarketSnapshots/entry.ts`
- Read: `base44/functions/sendDailyNewsletter/entry.ts`

- [ ] **Step 1: Port `updateMarketSnapshots`**

Move the real market data fetchers into `api/functions/[name].js` and handle `name === 'updateMarketSnapshots'`.

- [ ] **Step 2: Port `processRawNews`**

Use `/api/ai/invoke` with DeepSeek and write generated articles into `qj_articles`.

- [ ] **Step 3: Port `collectLatestNews`**

Fetch RSS feeds, dedupe against `qj_raw_news_feed`, insert new rows, and optionally process the top three.

- [ ] **Step 4: Port `backfillNews`**

Generate topic-based historical articles in batches. Keep batch limits low to avoid Vercel timeouts.

- [ ] **Step 5: Port `sendDailyNewsletter`**

Use Resend with `RESEND_API_KEY` and active rows in `qj_newsletter_subscribers`.

### Task 4: Export Base44 Data

**Files:**
- Create: `scripts/export-base44-data.mjs`
- Create: `scripts/import-neon-data.mjs`

- [ ] **Step 1: Export entities from Base44**

Export `Article`, `RawNewsFeed`, `NewsSource`, `MarketSnapshot`, `NewsletterSubscriber`, `SystemLog`, `AssetPage`, and `ChatConversation` to `exports/*.json`.

- [ ] **Step 2: Import into Neon**

Transform Base44 JSON fields into Neon JSONB columns and insert rows into `qj_*` tables.

### Task 5: Deploy To Vercel

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Configure environment variables**

Set these in Vercel:

```bash
VITE_DATA_BACKEND=neon
DATABASE_URL=...
DEEPSEEK_API_KEY=...
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_CHEAP_MODEL=deepseek-chat
DEEPSEEK_QUALITY_MODEL=deepseek-reasoner
```

- [ ] **Step 2: Deploy**

Run:

```bash
vercel --prod
```

Expected: frontend loads from Vercel and API routes read/write Neon.

### Self-Review

- Base44 remains the default runtime, so current production is not broken.
- Neon schema covers all current Base44 entity names used by the frontend.
- Secrets are not committed; only `.env.example` is tracked.
- Function routes are intentionally stubbed at this checkpoint except AI invocation and entity CRUD. Porting functions is the next execution phase.
