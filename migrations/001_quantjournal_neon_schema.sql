create extension if not exists pgcrypto;

create or replace function qj_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_date = now();
  return new;
end;
$$;

create table if not exists qj_articles (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  title text not null,
  slug text unique,
  summary text,
  what_happened text,
  why_it_matters text,
  impacts jsonb not null default '{}'::jsonb,
  affected_companies text,
  tickers text,
  conclusion text,
  investor_summary text,
  assets_to_watch text,
  source_links jsonb not null default '[]'::jsonb,
  key_takeaways text,
  sentiment text check (sentiment is null or sentiment in ('positivo', 'negativo', 'neutro', 'misto')),
  impact_level text check (impact_level is null or impact_level in ('baixo', 'medio', 'alto', 'critico')),
  category text not null check (category in ('bolsa', 'renda_fixa', 'juros', 'dolar', 'economia', 'criptomoedas', 'commodities', 'empresas', 'internacional')),
  tags text,
  source text,
  source_url text,
  image_url text,
  meta_title text,
  meta_description text,
  social_summary text,
  ai_confidence numeric default 0,
  source_quality text default 'medium' check (source_quality in ('low', 'medium', 'high')),
  relevance text default 'media' check (relevance in ('baixa', 'media', 'alta', 'urgente')),
  country text,
  sector text,
  status text default 'publicado' check (status in ('rascunho', 'publicado', 'arquivado', 'revisao')),
  is_featured boolean not null default false,
  is_breaking boolean not null default false,
  premium_only boolean not null default false,
  views integer not null default 0
);

create table if not exists qj_raw_news_feed (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  source_url text,
  source_name text,
  source_type text,
  external_id text,
  content_hash text,
  raw_title text not null,
  raw_content text,
  fetched_at timestamptz,
  published_at timestamptz,
  processed boolean not null default false,
  article_id uuid references qj_articles(id) on delete set null,
  category_hint text,
  relevance_score numeric,
  status text not null default 'pending' check (status in ('pending', 'processing', 'processed', 'duplicate', 'failed', 'rejected')),
  error_message text
);

create table if not exists qj_news_sources (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  name text not null,
  type text not null default 'rss',
  url text not null unique,
  country text,
  category text,
  is_active boolean not null default true,
  last_checked_at timestamptz,
  error_count integer not null default 0,
  priority integer not null default 2
);

create table if not exists qj_market_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  symbol text not null unique,
  name text not null,
  price numeric not null,
  change_percent numeric not null default 0,
  market_type text not null check (market_type in ('index', 'fx', 'crypto', 'commodity', 'rate')),
  updated_at timestamptz not null default now()
);

create table if not exists qj_newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  email text not null unique,
  name text,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  confirmed boolean not null default false,
  is_active boolean not null default true
);

create table if not exists qj_system_logs (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  action text not null,
  details text,
  log_type text not null default 'info' check (log_type in ('info', 'warning', 'error', 'success')),
  source text
);

create table if not exists qj_asset_pages (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  slug text not null unique,
  name text not null,
  type text not null check (type in ('empresa', 'indice', 'moeda', 'juros', 'cripto', 'commodity')),
  ticker text,
  description text,
  sector text,
  country text,
  related_keywords text,
  logo_url text,
  is_active boolean not null default true
);

create table if not exists qj_chat_conversations (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  session_id text not null unique,
  messages jsonb not null default '[]'::jsonb,
  total_messages integer not null default 0
);

create index if not exists qj_articles_status_created_idx on qj_articles(status, created_date desc);
create index if not exists qj_articles_category_created_idx on qj_articles(category, created_date desc);
create index if not exists qj_articles_featured_idx on qj_articles(is_featured, created_date desc);
create index if not exists qj_raw_status_created_idx on qj_raw_news_feed(status, created_date desc);
create unique index if not exists qj_raw_content_hash_idx on qj_raw_news_feed(content_hash) where content_hash is not null;
create unique index if not exists qj_raw_external_id_idx on qj_raw_news_feed(external_id) where external_id is not null;

drop trigger if exists qj_articles_touch_updated_at on qj_articles;
create trigger qj_articles_touch_updated_at before update on qj_articles for each row execute function qj_touch_updated_at();
drop trigger if exists qj_raw_news_feed_touch_updated_at on qj_raw_news_feed;
create trigger qj_raw_news_feed_touch_updated_at before update on qj_raw_news_feed for each row execute function qj_touch_updated_at();
drop trigger if exists qj_news_sources_touch_updated_at on qj_news_sources;
create trigger qj_news_sources_touch_updated_at before update on qj_news_sources for each row execute function qj_touch_updated_at();
drop trigger if exists qj_market_snapshots_touch_updated_at on qj_market_snapshots;
create trigger qj_market_snapshots_touch_updated_at before update on qj_market_snapshots for each row execute function qj_touch_updated_at();
drop trigger if exists qj_newsletter_subscribers_touch_updated_at on qj_newsletter_subscribers;
create trigger qj_newsletter_subscribers_touch_updated_at before update on qj_newsletter_subscribers for each row execute function qj_touch_updated_at();
drop trigger if exists qj_system_logs_touch_updated_at on qj_system_logs;
create trigger qj_system_logs_touch_updated_at before update on qj_system_logs for each row execute function qj_touch_updated_at();
drop trigger if exists qj_asset_pages_touch_updated_at on qj_asset_pages;
create trigger qj_asset_pages_touch_updated_at before update on qj_asset_pages for each row execute function qj_touch_updated_at();
drop trigger if exists qj_chat_conversations_touch_updated_at on qj_chat_conversations;
create trigger qj_chat_conversations_touch_updated_at before update on qj_chat_conversations for each row execute function qj_touch_updated_at();
