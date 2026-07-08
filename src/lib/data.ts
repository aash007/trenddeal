// Server-only data-fetching + score assembly. Every page/route that needs the
// scored catalog calls getScoredCatalog() so ranking stays consistent across
// feed/browse/trends/product-detail, mirroring how the prototype computed one
// `scored` memo and derived every view from it.
import "server-only";
import { supabase } from "./supabase";
import { buildProfile, complementCount } from "./wardrobe";
import { matchedGapFor, scoreProduct } from "./scoring";
import { fetchAllRows, PAGE_SIZE } from "./recompute";
import { DEMO_USER_ID } from "./constants";
import type {
  OwnedItem,
  Product,
  ProductWithStats,
  Retailer,
  ScoredProduct,
  TrendCluster,
  WardrobeGap,
  WardrobeProfile,
} from "./types";

export async function getRetailers(): Promise<Retailer[]> {
  const { data, error } = await supabase.from("retailers").select("*").order("priority");
  if (error) throw error;
  return data as Retailer[];
}

export async function getOwnedItems(userId: string = DEMO_USER_ID): Promise<OwnedItem[]> {
  const { data, error } = await supabase.from("owned_items").select("*").eq("user_id", userId).order("created_at");
  if (error) throw error;
  return data as OwnedItem[];
}

export async function getWardrobeProfile(userId: string = DEMO_USER_ID) {
  const owned = await getOwnedItems(userId);
  const { data } = await supabase.from("wardrobe_profile").select("*").eq("user_id", userId).maybeSingle();
  const profile = (data as WardrobeProfile | null) ?? buildProfile(owned);
  // buildProfile's return also carries `counts`, needed by scoring; DB rows don't have it.
  const counts = "counts" in profile ? (profile as ReturnType<typeof buildProfile>).counts : buildProfile(owned).counts;
  return { ...profile, counts } as ReturnType<typeof buildProfile>;
}

export async function getWardrobeGaps(userId: string = DEMO_USER_ID): Promise<WardrobeGap[]> {
  const { data, error } = await supabase
    .from("wardrobe_gaps")
    .select("*")
    .eq("user_id", userId)
    .order("priority", { ascending: true });
  if (error) throw error;
  // sort High -> Medium -> Low explicitly (alphabetic order isn't priority order)
  const rank: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  return (data as WardrobeGap[]).sort((a, b) => rank[a.priority] - rank[b.priority]);
}

export async function getTrendClusters(): Promise<TrendCluster[]> {
  const { data, error } = await supabase.from("trend_clusters").select("*").eq("enabled", true);
  if (error) throw error;
  return data as TrendCluster[];
}

export async function getCatalogWithStats(): Promise<ProductWithStats[]> {
  type Row = Product & {
    retailer: Pick<Retailer, "id" | "name" | "trust_score" | "enabled">;
    stats: ProductWithStats["stats"] | null;
    trend_matches: ProductWithStats["trend_matches"];
  };

  // Paginated: PostgREST caps unpaginated selects at 1000 rows, and live
  // ingestion can pull thousands of products.
  const rows: Row[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("products")
      .select(
        "*, retailer:retailers!inner(id, name, trust_score, enabled), stats:product_price_stats(*), trend_matches:product_trend_matches(trend_cluster_id, match_score)"
      )
      .eq("retailer.enabled", true)
      .eq("in_stock", true)
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as unknown as Row[]));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return rows.filter((p) => p.stats).map((p) => ({ ...p, stats: p.stats! })); // skip products whose stats haven't been materialized yet
}

// "Saved" is presence/absence of a `save` row (toggled by insert/delete from
// the API route, not by superseding events) — simplest correct semantics
// given user_events' fixed event_type enum has no "unsave".
export async function getSavedProductIds(userId: string = DEMO_USER_ID): Promise<Set<number>> {
  const { data, error } = await supabase.from("user_events").select("product_id").eq("user_id", userId).eq("event_type", "save");
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.product_id));
}

// Hides are one-directional (matches the prototype: "Not my style" removes a
// product from the feed permanently, no undo UI in MVP scope).
export async function getHiddenProductIds(userId: string = DEMO_USER_ID): Promise<Set<number>> {
  const { data, error } = await supabase
    .from("user_events")
    .select("product_id")
    .eq("user_id", userId)
    .in("event_type", ["hide", "not_my_style"]);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.product_id));
}

export async function getScoredCatalog(userId: string = DEMO_USER_ID): Promise<ScoredProduct[]> {
  const [catalog, owned, gaps, profile, retailers, hidden] = await Promise.all([
    getCatalogWithStats(),
    getOwnedItems(userId),
    getWardrobeGaps(userId),
    getWardrobeProfile(userId),
    getRetailers(),
    getHiddenProductIds(userId),
  ]);

  const visible = catalog.filter((p) => !hidden.has(p.id));

  // distinct-retailer density per trend cluster (cross_retailer_density_score input)
  const retailersByTrend = new Map<number, Set<number>>();
  for (const p of visible) {
    for (const m of p.trend_matches) {
      if (!retailersByTrend.has(m.trend_cluster_id)) retailersByTrend.set(m.trend_cluster_id, new Set());
      retailersByTrend.get(m.trend_cluster_id)!.add(p.retailer_id);
    }
  }
  const retailerCountByTrend = new Map<number, number>();
  for (const [trendId, set] of retailersByTrend) retailerCountByTrend.set(trendId, set.size);

  const totalRetailers = Math.max(1, retailers.length);

  const scored: ScoredProduct[] = visible.map((p) => {
    const scores = scoreProduct(p, { owned, gaps, profile, all: visible, retailerCountByTrend, totalRetailers });
    const matchedGap = matchedGapFor(p, gaps);
    return { ...p, scores, complementCount: complementCount(p, owned), matchedGap };
  });

  scored.sort((a, b) => b.scores.final - a.scores.final);
  return scored;
}

export async function getScraperRuns(limit = 20) {
  const { data, error } = await supabase
    .from("scraper_runs")
    .select("*, retailer:retailers(name)")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as (import("./types").ScraperRun & { retailer: { name: string } })[];
}

export async function getAdminStats() {
  const [{ count: productCount }, { count: statsCount }, { count: trackedCount }] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("product_price_stats").select("*", { count: "exact", head: true }),
    supabase.from("product_price_stats").select("*", { count: "exact", head: true }).gte("tracking_days", 30),
  ]);
  return { productCount: productCount ?? 0, statsCount: statsCount ?? 0, trackedCount: trackedCount ?? 0 };
}

export async function getPriceChartData(productId: number): Promise<{ day: number; price: number }[]> {
  const { data, error } = await supabase
    .from("price_snapshots")
    .select("price, captured_at")
    .eq("product_id", productId)
    .gte("captured_at", new Date(Date.now() - 30 * 86400000).toISOString())
    .order("captured_at", { ascending: true });
  if (error) throw error;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (data ?? []).map((s) => {
    const d = new Date(s.captured_at);
    d.setHours(0, 0, 0, 0);
    const day = Math.round((d.getTime() - today.getTime()) / 86400000);
    return { day, price: s.price };
  });
}
