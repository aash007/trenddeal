// Domain types mirroring the Supabase schema (spec §6). snake_case to match DB rows directly.

export type Retailer = {
  id: number;
  name: string;
  base_url: string;
  platform: "shopify";
  trust_score: number;
  enabled: boolean;
  priority: number;
  adapter_config: AdapterConfig;
  created_at: string;
  updated_at: string;
};

export type AdapterConfig = {
  sizeOptionIndex?: number | null;
  colorFromTitleOnly?: boolean;
  excludeTags?: string[];
  productTypeReliable?: boolean;
};

export type Product = {
  id: number;
  retailer_id: number;
  external_product_id: string;
  product_url: string;
  handle: string;
  title: string;
  normalized_title: string | null;
  category: string;
  sub_category: string | null;
  color: string | null;
  secondary_colors: string[];
  fit: string | null;
  style_tags: string[];
  seasonal_tags: string[];
  occasion: string | null;
  image_url: string | null;
  current_price: number;
  mrp: number | null;
  discount_pct: number | null;
  currency: string;
  in_stock: boolean;
  sizes_available: string[];
  sizes_total: string[];
  first_seen_at: string;
  last_seen_at: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PriceSnapshot = {
  id: number;
  product_id: number;
  retailer_id: number;
  price: number;
  mrp: number | null;
  in_stock: boolean;
  sizes_available: string[];
  is_simulated: boolean;
  captured_at: string;
};

export type PriceBadge =
  | "Insufficient price history"
  | "Lowest since tracking began"
  | "Below median since tracking began"
  | `Tracking ${number}d`
  | "30-day lowest price"
  | "Near 30-day low"
  | "Below 30-day median"
  | "At 30-day median"
  | "Above 30-day median"
  | string;

export type ProductPriceStats = {
  product_id: number;
  current_price: number;
  lowest_price_7d: number | null;
  lowest_price_30d: number | null;
  median_price_30d: number | null;
  average_price_30d: number | null;
  highest_price_30d: number | null;
  tracking_days: number;
  is_30d_low: boolean;
  is_near_30d_low: boolean;
  is_below_30d_median: boolean;
  price_vs_30d_low_pct: number | null;
  price_vs_30d_median_pct: number | null;
  price_badge: PriceBadge;
  is_simulated: boolean;
  updated_at: string;
};

export type TrendCluster = {
  id: number;
  trend_name: string;
  category: string;
  keywords: string[];
  hashtags: string[];
  enabled: boolean;
  created_at: string;
};

export type ProductTrendMatch = {
  id: number;
  product_id: number;
  trend_cluster_id: number;
  match_score: number;
  created_at: string;
};

export type OwnedItem = {
  id: number;
  user_id: string;
  source: "manual" | "csv_upload";
  retailer: string | null;
  brand: string | null;
  product_name: string;
  category: string;
  sub_category: string | null;
  fit: string | null;
  color: string | null;
  secondary_colors: string[];
  style_tags: string[];
  occasion: string | null;
  image_url: string | null;
  purchase_price: number | null;
  purchase_date: string | null;
  size: string | null;
  created_at: string;
  updated_at: string;
};

export type WardrobeProfile = {
  user_id: string;
  dominant_categories: string[];
  dominant_colors: string[];
  dominant_fits: string[];
  dominant_brands: string[];
  dominant_retailers: string[];
  dominant_style_tags: string[];
  wardrobe_color_palette: string[];
  under_owned_categories: string[];
  over_owned_categories: string[];
  occasion_coverage: Record<string, number>;
  accessory_gaps: string[];
  updated_at: string;
};

export type GapPriority = "High" | "Medium" | "Low";

export type WardrobeGap = {
  id: number;
  user_id: string;
  gap_type: "category_gap" | "accessory_gap" | "seasonal_gap" | "occasion_gap";
  category: string | null;
  sub_category: string | null;
  style_tag: string | null;
  color_recommendation: string[];
  priority: GapPriority;
  reason: string;
  created_at: string;
};

export type UserEventType = "view" | "clickout" | "save" | "hide" | "not_my_style" | "more_like_this";

export type UserEvent = {
  id: number;
  user_id: string;
  product_id: number;
  event_type: UserEventType;
  event_value: number | null;
  created_at: string;
};

export type ScraperRunStatus = "running" | "success" | "warning" | "failed";

export type ScraperRun = {
  id: number;
  retailer_id: number;
  page_url: string | null;
  status: ScraperRunStatus;
  products_found: number;
  products_inserted: number;
  products_updated: number;
  failed_extractions: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
};

// ---- composite / view-model types used across scoring + UI ----

export type ProductWithStats = Product & {
  retailer: Pick<Retailer, "id" | "name" | "trust_score">;
  stats: ProductPriceStats;
  trend_matches: { trend_cluster_id: number; match_score: number }[];
};

export type SubScores = {
  wardrobeRelevance: number;
  deal: number;
  personalFit: number;
  trend: number;
  retailerTrust: number;
  availability: number;
  final: number;
};

export type ScoredProduct = ProductWithStats & {
  scores: SubScores;
  complementCount: number;
  matchedGap: WardrobeGap | null;
};
