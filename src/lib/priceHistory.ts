// Price-history engine + trust rules — spec §9. Never claim a 30-day low/median
// without >=30 days of tracked snapshots; this module is the single place that
// derives price_badge so that rule can't be violated from elsewhere.
import type { PriceBadge, PriceSnapshot } from "./types";

export type PriceStatsInput = {
  currentPrice: number;
  snapshots: Pick<PriceSnapshot, "price" | "captured_at" | "in_stock" | "is_simulated">[];
};

export type DerivedPriceStats = {
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
};

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function derivePriceStats({ currentPrice, snapshots }: PriceStatsInput): DerivedPriceStats {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const inWindow = snapshots.filter((s) => s.in_stock && new Date(s.captured_at).getTime() >= thirtyDaysAgo);
  const in7d = inWindow.filter((s) => new Date(s.captured_at).getTime() >= sevenDaysAgo);

  const trackingDays = new Set(inWindow.map((s) => new Date(s.captured_at).toISOString().slice(0, 10))).size;
  const isSimulated = inWindow.some((s) => s.is_simulated);

  if (inWindow.length === 0) {
    return {
      current_price: currentPrice,
      lowest_price_7d: null,
      lowest_price_30d: null,
      median_price_30d: null,
      average_price_30d: null,
      highest_price_30d: null,
      tracking_days: 0,
      is_30d_low: false,
      is_near_30d_low: false,
      is_below_30d_median: false,
      price_vs_30d_low_pct: null,
      price_vs_30d_median_pct: null,
      price_badge: "Insufficient price history",
      is_simulated: false,
    };
  }

  const prices = inWindow.map((s) => s.price);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const med = median(prices);
  const low7 = in7d.length ? Math.min(...in7d.map((s) => s.price)) : null;

  const is30dLow = trackingDays >= 30 && currentPrice <= low;
  const isNearLow = trackingDays >= 30 && currentPrice <= low * 1.05;
  const isBelowMed = currentPrice < med;

  let badge: PriceBadge;
  if (trackingDays < 7) {
    badge = "Insufficient price history";
  } else if (trackingDays < 30) {
    if (currentPrice <= low) badge = "Lowest since tracking began";
    else if (currentPrice < med) badge = "Below median since tracking began";
    else badge = `Tracking ${trackingDays}d`;
  } else if (currentPrice <= low) {
    badge = "30-day lowest price";
  } else if (currentPrice <= low * 1.05) {
    badge = "Near 30-day low";
  } else if (currentPrice < med) {
    badge = "Below 30-day median";
  } else if (currentPrice === med) {
    badge = "At 30-day median";
  } else {
    badge = "Above 30-day median";
  }

  return {
    current_price: currentPrice,
    lowest_price_7d: low7,
    lowest_price_30d: low,
    median_price_30d: med,
    average_price_30d: avg,
    highest_price_30d: high,
    tracking_days: trackingDays,
    is_30d_low: is30dLow,
    is_near_30d_low: isNearLow,
    is_below_30d_median: isBelowMed,
    price_vs_30d_low_pct: (currentPrice - low) / low,
    price_vs_30d_median_pct: (currentPrice - med) / med,
    price_badge: badge,
    is_simulated: isSimulated,
  };
}

export function badgeTone(badge: PriceBadge): "good" | "warn" | "muted" {
  if (
    badge === "30-day lowest price" ||
    badge === "Near 30-day low" ||
    badge === "Below 30-day median" ||
    badge === "Lowest since tracking began" ||
    badge === "Below median since tracking began"
  )
    return "good";
  if (badge === "Above 30-day median") return "warn";
  return "muted";
}

// deal_score's price_history_score sub-component (§10 bands).
export function priceHistoryScore(stats: {
  tracking_days: number;
  current_price: number;
  lowest_price_30d: number | null;
  median_price_30d: number | null;
}): number {
  const { tracking_days, current_price, lowest_price_30d: low, median_price_30d: med } = stats;
  if (low == null || med == null) return 0.3;
  if (tracking_days >= 30) {
    if (current_price <= low) return 1.0;
    if (current_price <= low * 1.05) return 0.9;
    if (current_price < med) return 0.75;
    if (current_price === med) return 0.55;
    return 0.3;
  }
  if (tracking_days < 7) return 0.3;
  return current_price <= low ? 0.7 : 0.5;
}
