// Shared recompute routines — called from the seed script, the ingestion
// pipeline (§8 steps 7-9), and the admin "Refresh now" button. Kept separate
// from the Supabase client module so scripts/seed.ts (run outside Next.js)
// can import it without pulling in the app's env-validated singleton.
import type { SupabaseClient } from "@supabase/supabase-js";
import { derivePriceStats } from "./priceHistory";
import { buildProfile, buildGaps } from "./wardrobe";
import type { OwnedItem } from "./types";

// PostgREST caps unpaginated selects at 1000 rows by default — with live
// ingestion pulling thousands of products, every full-table read here MUST
// page through with .range() or it silently truncates.
export const PAGE_SIZE = 1000;
export async function fetchAllRows<T>(
  db: SupabaseClient,
  table: string,
  select: string
): Promise<T[]> {
  const all: T[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await db.from(table).select(select).range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    all.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return all;
}

export async function recomputeAllPriceStats(db: SupabaseClient): Promise<number> {
  const products = await fetchAllRows<{ id: number; current_price: number }>(db, "products", "id, current_price");
  let updated = 0;
  for (const p of products) {
    const { data: snapshots, error: snapErr } = await db
      .from("price_snapshots")
      .select("price, captured_at, in_stock, is_simulated")
      .eq("product_id", p.id)
      .gte("captured_at", new Date(Date.now() - 30 * 86400000).toISOString());
    if (snapErr) throw snapErr;
    const stats = derivePriceStats({ currentPrice: p.current_price, snapshots: snapshots ?? [] });
    const { error: upErr } = await db.from("product_price_stats").upsert({ product_id: p.id, ...stats, updated_at: new Date().toISOString() });
    if (upErr) throw upErr;
    updated++;
  }
  return updated;
}

export async function recomputeWardrobe(db: SupabaseClient, userId: string): Promise<{ gapsCreated: number }> {
  const { data: ownedRaw, error } = await db.from("owned_items").select("*").eq("user_id", userId);
  if (error) throw error;
  const owned = (ownedRaw ?? []) as OwnedItem[];

  const profile = buildProfile(owned);
  const { counts: _counts, ...profileRow } = profile;
  void _counts;
  const { error: profErr } = await db.from("wardrobe_profile").upsert({ ...profileRow, user_id: userId, updated_at: new Date().toISOString() });
  if (profErr) throw profErr;

  const gaps = buildGaps(owned, profile);
  const { error: delErr } = await db.from("wardrobe_gaps").delete().eq("user_id", userId);
  if (delErr) throw delErr;
  if (gaps.length) {
    const { error: insErr } = await db.from("wardrobe_gaps").insert(gaps.map((g) => ({ ...g, user_id: userId })));
    if (insErr) throw insErr;
  }
  return { gapsCreated: gaps.length };
}

export async function recomputeTrendMatches(
  db: SupabaseClient
): Promise<number> {
  const { data: clusters, error: cErr } = await db.from("trend_clusters").select("id, category, keywords").eq("enabled", true);
  if (cErr) throw cErr;
  const products = await fetchAllRows<{ id: number; category: string; title: string; style_tags: string[] }>(
    db,
    "products",
    "id, category, title, style_tags"
  );

  let matches = 0;
  for (const p of products) {
    for (const t of clusters ?? []) {
      if (t.category !== p.category) continue;
      const haystack = `${p.title} ${(p.style_tags || []).join(" ")}`.toLowerCase();
      const hits = (t.keywords as string[]).filter((k) => haystack.includes(k.toLowerCase())).length;
      if (hits === 0) continue;
      const score = Math.min(1, hits / Math.max(2, (t.keywords as string[]).length / 2));
      const { error } = await db
        .from("product_trend_matches")
        .upsert({ product_id: p.id, trend_cluster_id: t.id, match_score: score }, { onConflict: "product_id,trend_cluster_id" });
      if (error) throw error;
      matches++;
    }
  }
  return matches;
}
