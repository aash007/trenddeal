// Scoring engine — ported from TrendDeal_1.jsx, formulas per spec §10.
// The Phase-6 feedback loop (user_events -> behavior score) is intentionally
// NOT wired up here per product owner's instruction; personalFit's behavior
// term is left neutral (0.5) rather than adjusted from event history.
import { PREFS } from "./constants";
import { priceHistoryScore } from "./priceHistory";
import { colorsComplement, complementCount, gapMatchesProduct } from "./wardrobe";
import type { OwnedItem, ProductWithStats, SubScores, WardrobeGap } from "./types";
import type { buildProfile } from "./wardrobe";

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

type Profile = ReturnType<typeof buildProfile>;

function colorCompat(color: string | null, dominantColors: string[]): number {
  if (!color) return 0.4;
  if (dominantColors.includes(color)) return 0.6;
  let hits = 0;
  dominantColors.forEach((dc) => {
    if (colorsComplement(dc, color)) hits++;
  });
  return clamp01(0.4 + hits * 0.2);
}

function complementScore(p: ProductWithStats, owned: OwnedItem[]): number {
  const relevant = owned.filter((o) => o.category !== p.category);
  if (!relevant.length) return 0;
  const n = relevant.filter((o) => colorsComplement(o.color, p.color)).length;
  return clamp01(n / relevant.length);
}

export function matchedGapFor(p: ProductWithStats, gaps: WardrobeGap[]): WardrobeGap | null {
  return gaps.find((g) => gapMatchesProduct(g, p)) ?? null;
}

function gapScoreValue(gap: WardrobeGap | null): number {
  if (!gap) return 0;
  return gap.priority === "High" ? 1.0 : gap.priority === "Medium" ? 0.7 : 0.4;
}

function outfitGenScore(p: ProductWithStats, owned: OwnedItem[]): number {
  return clamp01(complementCount(p, owned) / 6);
}

function occasionCoverageScore(p: ProductWithStats, profile: Profile): number {
  if (!p.occasion) return 0.5;
  const covered = profile.occasion_coverage[p.occasion] || 0;
  return covered === 0 ? 1 : covered <= 1 ? 0.7 : 0.3;
}

function wardrobeRelevance(p: ProductWithStats, owned: OwnedItem[], gaps: WardrobeGap[], profile: Profile): number {
  const cs = complementScore(p, owned);
  const gs = gapScoreValue(matchedGapFor(p, gaps));
  const cc = colorCompat(p.color, profile.dominant_colors);
  const og = outfitGenScore(p, owned);
  const oc = occasionCoverageScore(p, profile);
  return 0.3 * cs + 0.25 * gs + 0.2 * cc + 0.15 * og + 0.1 * oc;
}

function relativeValue(p: ProductWithStats, all: ProductWithStats[]): number {
  const peers = all.filter((q) => q.category === p.category);
  if (peers.length < 2) return 0.5;
  const cheaper = peers.filter((q) => q.current_price > p.current_price).length;
  return clamp01(0.2 + 0.8 * (cheaper / peers.length));
}

export function inventoryScore(p: Pick<ProductWithStats, "sizes_available" | "sizes_total">): number {
  const total = Math.max(1, p.sizes_total.length);
  const ratio = p.sizes_available.length / total;
  return ratio >= 0.75 ? 1 : ratio >= 0.4 ? 0.7 : ratio > 0 ? 0.3 : 0;
}

function dealScore(p: ProductWithStats, all: ProductWithStats[]): number {
  const dd = clamp01((p.discount_pct || 0) / 60);
  const phs = priceHistoryScore({
    tracking_days: p.stats.tracking_days,
    current_price: p.stats.current_price,
    lowest_price_30d: p.stats.lowest_price_30d,
    median_price_30d: p.stats.median_price_30d,
  });
  const rv = relativeValue(p, all);
  const inv = inventoryScore(p);
  return 0.3 * dd + 0.4 * phs + 0.2 * rv + 0.1 * inv;
}

function personalFit(p: ProductWithStats): number {
  const catM = PREFS.categories.includes(p.category) ? 1 : 0.3;
  const retM = PREFS.retailers.includes(p.retailer.name) ? 1 : 0.4;
  const priceM = p.current_price >= PREFS.priceMin && p.current_price <= PREFS.priceMax ? 1 : 0.4;
  const styleM = (p.style_tags || []).some((t) => PREFS.styleTags.some((s) => t.includes(s) || s.includes(t)))
    ? 1
    : 0.4;
  const brandMatch = 0.6; // no owned-brand affinity signal in MVP
  const behavior = 0.5; // Phase 6 feedback loop intentionally not wired up
  return clamp01(0.25 * catM + 0.2 * retM + 0.2 * priceM + 0.15 * styleM + 0.1 * brandMatch + 0.1 * behavior);
}

function newnessScore(p: ProductWithStats): number {
  if (!p.published_at) return 0.3;
  const days = (Date.now() - new Date(p.published_at).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 21 ? 1 : 0.3;
}

function trendScore(p: ProductWithStats, retailerCountByTrend: Map<number, number>, totalRetailers: number): number {
  // retailer_native_score: MVP default per §10 (no per-collection rank fetch).
  const native = 0.4;
  const density = p.trend_matches.length
    ? clamp01(
        Math.max(
          ...p.trend_matches.map((m) => (retailerCountByTrend.get(m.trend_cluster_id) || 0) / Math.max(1, totalRetailers))
        )
      )
    : 0;
  const hashtag = 0; // hashtag_soft_signal_score = 0 in MVP (out of scope)
  const newness = newnessScore(p);
  const styleMatch = (p.style_tags || []).some((t) => PREFS.styleTags.some((s) => t.includes(s))) ? 1 : 0.4;
  return 0.4 * native + 0.25 * density + 0.15 * hashtag + 0.1 * newness + 0.1 * styleMatch;
}

export function scoreProduct(
  p: ProductWithStats,
  ctx: {
    owned: OwnedItem[];
    gaps: WardrobeGap[];
    profile: Profile;
    all: ProductWithStats[];
    retailerCountByTrend: Map<number, number>;
    totalRetailers: number;
  }
): SubScores {
  const wr = wardrobeRelevance(p, ctx.owned, ctx.gaps, ctx.profile);
  const ds = dealScore(p, ctx.all);
  const pf = personalFit(p);
  const ts = trendScore(p, ctx.retailerCountByTrend, ctx.totalRetailers);
  const rt = p.retailer.trust_score;
  const av = inventoryScore(p);
  const final = 0.3 * wr + 0.25 * ds + 0.15 * pf + 0.15 * ts + 0.1 * rt + 0.05 * av;
  return { wardrobeRelevance: wr, deal: ds, personalFit: pf, trend: ts, retailerTrust: rt, availability: av, final };
}

export function explainProduct(
  p: ProductWithStats,
  gap: WardrobeGap | null,
  compCount: number
): string {
  const bits: string[] = [];
  if (gap) bits.push(`fills your ${gap.category ?? gap.gap_type.replace("_", " ")} gap`);
  if (compCount >= 3) bits.push(`complements ${compCount} items you own`);
  const badge = p.stats.price_badge;
  if ((badge === "30-day lowest price" || badge === "Near 30-day low" || badge === "Below 30-day median") ) {
    bits.push(badge.toLowerCase());
  } else if (p.stats.is_below_30d_median && p.stats.price_vs_30d_median_pct != null) {
    bits.push(`${Math.abs(p.stats.price_vs_30d_median_pct * 100).toFixed(0)}% below its usual price`);
  }
  if (p.seasonal_tags?.[0] === "winter") bits.push("a smart off-season buy");
  if (!bits.length) bits.push(`matches your ${p.style_tags?.[0] || "style"}`);
  const s0 = bits[0][0].toUpperCase() + bits[0].slice(1);
  return "Shown because it " + [s0.toLowerCase(), ...bits.slice(1)].join(", ").replace(/^./, (c) => c.toUpperCase()) + ".";
}
