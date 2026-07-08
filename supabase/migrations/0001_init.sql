-- TrendDeal MVP schema (spec §6)
create extension if not exists pgcrypto;

-- ============================================================ retailers
create table retailers (
  id bigint generated always as identity primary key,
  name text not null unique,
  base_url text not null,
  platform text not null default 'shopify' check (platform in ('shopify')),
  trust_score numeric not null default 0.8,
  enabled boolean not null default true,
  priority int not null default 0,
  adapter_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================ products
create table products (
  id bigint generated always as identity primary key,
  retailer_id bigint not null references retailers(id) on delete cascade,
  external_product_id text not null,
  product_url text not null,
  handle text not null,
  title text not null,
  normalized_title text,
  category text not null,
  sub_category text,
  color text,
  secondary_colors text[] not null default '{}',
  fit text,
  style_tags text[] not null default '{}',
  seasonal_tags text[] not null default '{}',
  occasion text,
  image_url text,
  current_price numeric not null,
  mrp numeric,
  discount_pct numeric,
  currency text not null default 'INR',
  in_stock boolean not null default true,
  sizes_available text[] not null default '{}',
  sizes_total text[] not null default '{}',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (retailer_id, external_product_id)
);
create index products_category_idx on products(category);
create index products_retailer_idx on products(retailer_id);

-- ============================================================ price_snapshots
create table price_snapshots (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  retailer_id bigint not null references retailers(id) on delete cascade,
  price numeric not null,
  mrp numeric,
  in_stock boolean not null default true,
  sizes_available text[] not null default '{}',
  is_simulated boolean not null default false,
  captured_at timestamptz not null default now()
);
create index price_snapshots_product_captured_idx on price_snapshots(product_id, captured_at);
create index price_snapshots_retailer_captured_idx on price_snapshots(retailer_id, captured_at);

-- ============================================================ product_price_stats (materialized daily, §9)
create table product_price_stats (
  product_id bigint primary key references products(id) on delete cascade,
  current_price numeric not null,
  lowest_price_7d numeric,
  lowest_price_30d numeric,
  median_price_30d numeric,
  average_price_30d numeric,
  highest_price_30d numeric,
  tracking_days int not null default 0,
  is_30d_low boolean not null default false,
  is_near_30d_low boolean not null default false,
  is_below_30d_median boolean not null default false,
  price_vs_30d_low_pct numeric,
  price_vs_30d_median_pct numeric,
  price_badge text not null default 'Insufficient price history',
  is_simulated boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ============================================================ trend_clusters
create table trend_clusters (
  id bigint generated always as identity primary key,
  trend_name text not null,
  category text not null,
  keywords text[] not null default '{}',
  hashtags text[] not null default '{}',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================ product_trend_matches
create table product_trend_matches (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  trend_cluster_id bigint not null references trend_clusters(id) on delete cascade,
  match_score numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, trend_cluster_id)
);

-- ============================================================ owned_items
create table owned_items (
  id bigint generated always as identity primary key,
  user_id text not null,
  source text not null default 'manual' check (source in ('manual', 'csv_upload')),
  retailer text,
  brand text,
  product_name text not null,
  category text not null,
  sub_category text,
  fit text,
  color text,
  secondary_colors text[] not null default '{}',
  style_tags text[] not null default '{}',
  occasion text,
  image_url text,
  purchase_price numeric,
  purchase_date date,
  size text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index owned_items_user_idx on owned_items(user_id);

-- ============================================================ wardrobe_profile
create table wardrobe_profile (
  user_id text primary key,
  dominant_categories text[] not null default '{}',
  dominant_colors text[] not null default '{}',
  dominant_fits text[] not null default '{}',
  dominant_brands text[] not null default '{}',
  dominant_retailers text[] not null default '{}',
  dominant_style_tags text[] not null default '{}',
  wardrobe_color_palette text[] not null default '{}',
  under_owned_categories text[] not null default '{}',
  over_owned_categories text[] not null default '{}',
  occasion_coverage jsonb not null default '{}'::jsonb,
  accessory_gaps text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- ============================================================ wardrobe_gaps
create table wardrobe_gaps (
  id bigint generated always as identity primary key,
  user_id text not null,
  gap_type text not null check (gap_type in ('category_gap', 'accessory_gap', 'seasonal_gap', 'occasion_gap')),
  category text,
  sub_category text,
  style_tag text,
  color_recommendation text[] not null default '{}',
  priority text not null check (priority in ('High', 'Medium', 'Low')),
  reason text not null,
  created_at timestamptz not null default now()
);
create index wardrobe_gaps_user_idx on wardrobe_gaps(user_id);

-- ============================================================ user_events
create table user_events (
  id bigint generated always as identity primary key,
  user_id text not null,
  product_id bigint not null references products(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'clickout', 'save', 'hide', 'not_my_style', 'more_like_this')),
  event_value numeric,
  created_at timestamptz not null default now()
);
create index user_events_user_idx on user_events(user_id);
create index user_events_product_idx on user_events(product_id);

-- ============================================================ scraper_runs (ingestion log)
create table scraper_runs (
  id bigint generated always as identity primary key,
  retailer_id bigint not null references retailers(id) on delete cascade,
  page_url text,
  status text not null default 'running' check (status in ('running', 'success', 'warning', 'failed')),
  products_found int not null default 0,
  products_inserted int not null default 0,
  products_updated int not null default 0,
  failed_extractions int not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index scraper_runs_retailer_idx on scraper_runs(retailer_id);

-- ============================================================ grants
-- MVP has no auth/RLS boundary (single demo user, server-only access via the
-- service role key). Grant broadly so the app and scripts can read/write.
grant usage on schema public to anon, authenticated, service_role;
grant all privileges on all tables in schema public to anon, authenticated, service_role;
grant all privileges on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all privileges on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all privileges on sequences to anon, authenticated, service_role;
