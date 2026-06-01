-- Permite ações da B3 (market_type = 'stock') nos snapshots de mercado.
-- A constraint original só previa index/fx/crypto/commodity/rate.
alter table qj_market_snapshots
  drop constraint if exists qj_market_snapshots_market_type_check;

alter table qj_market_snapshots
  add constraint qj_market_snapshots_market_type_check
  check (market_type in ('index', 'fx', 'crypto', 'commodity', 'rate', 'stock'));
