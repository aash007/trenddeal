// Feed section assembly — spec §12. Order matters; empty sections are dropped
// by the caller (page component), not here.
import { PREFS } from "./constants";
import type { ScoredProduct } from "./types";

export type FeedSection = {
  key: string;
  title: string;
  sub: string;
  items: ScoredProduct[];
};

export function buildFeedSections(scored: ScoredProduct[], savedIds: Set<number>): FeedSection[] {
  const byGap = scored.filter((p) => p.matchedGap && ["High", "Medium"].includes(p.matchedGap.priority));
  const accessories = scored.filter((p) => p.category === "accessories");
  const offSeason = scored.filter(
    (p) => (p.seasonal_tags?.includes("winter") || p.seasonal_tags?.includes("summer")) && p.stats.is_below_30d_median
  );
  const lows = scored.filter(
    (p) => p.stats.is_30d_low || p.stats.is_near_30d_low || (p.stats.tracking_days < 30 && p.stats.lowest_price_30d != null && p.current_price <= p.stats.lowest_price_30d)
  );
  const belowMedian = scored.filter((p) => p.stats.is_below_30d_median);
  const trending = scored.filter((p) => p.scores.trend > 0.55);
  const complements = [...scored].filter((p) => p.complementCount >= 3).sort((a, b) => b.complementCount - a.complementCount);
  const newDrops = scored.filter((p) => {
    if (!p.published_at) return false;
    const days = (Date.now() - new Date(p.published_at).getTime()) / 86400000;
    return days <= 21 && PREFS.retailers.includes(p.retailer.name);
  });
  const savedDrops = scored.filter((p) => savedIds.has(p.id) && p.stats.is_below_30d_median);
  const bestDeals = [...scored].sort((a, b) => b.scores.deal - a.scores.deal);

  const sections: FeedSection[] = [
    { key: "gap", title: "Complete your wardrobe", sub: "Fills your highest-priority gaps", items: byGap.slice(0, 6) },
    { key: "deals", title: "Best deals for your style", sub: "Strong price × your taste", items: bestDeals.slice(0, 6) },
    { key: "comp", title: "Complements what you own", sub: "Pairs with your existing pieces", items: complements.slice(0, 6) },
    { key: "acc", title: "Accessories that finish your outfits", sub: "Small pieces, big difference", items: accessories.slice(0, 6) },
    { key: "off", title: "Off-season value buys", sub: "Buy low now, wear later", items: offSeason.slice(0, 6) },
    { key: "trend", title: "Trending styles that fit you", sub: "Rising across your retailers", items: trending.slice(0, 6) },
    { key: "low", title: "30-day lowest price picks", sub: "At or near their tracked low", items: lows.slice(0, 6) },
    { key: "bmed", title: "Below 30-day median picks", sub: "Cheaper than they usually are", items: belowMedian.slice(0, 6) },
    { key: "new", title: "New drops from your favorite retailers", sub: "Fresh from Snitch & Powerlook", items: newDrops.slice(0, 6) },
    { key: "savedrop", title: "Saved products with price drops", sub: "Now below their median", items: savedDrops.slice(0, 6) },
  ];

  return sections.filter((s) => s.items.length > 0);
}
