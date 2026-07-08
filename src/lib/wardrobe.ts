// Wardrobe profile + gap detection — ported from TrendDeal_1.jsx (buildProfile / buildGaps).
import { COLOR_RULES } from "./constants";
import type { OwnedItem, WardrobeGap, WardrobeProfile } from "./types";

function topKeys(counts: Record<string, number>, n: number): string[] {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

export type ProfileCounts = {
  cat: Record<string, number>;
  col: Record<string, number>;
  fit: Record<string, number>;
  occ: Record<string, number>;
};

export function buildProfile(owned: OwnedItem[]): WardrobeProfile & { counts: ProfileCounts } {
  const cat: Record<string, number> = {};
  const col: Record<string, number> = {};
  const fit: Record<string, number> = {};
  const brand: Record<string, number> = {};
  const ret: Record<string, number> = {};
  const tags: Record<string, number> = {};
  const occ: Record<string, number> = {};

  owned.forEach((o) => {
    if (o.category) cat[o.category] = (cat[o.category] || 0) + 1;
    if (o.color) col[o.color] = (col[o.color] || 0) + 1;
    if (o.fit) fit[o.fit] = (fit[o.fit] || 0) + 1;
    if (o.brand) brand[o.brand] = (brand[o.brand] || 0) + 1;
    if (o.retailer) ret[o.retailer] = (ret[o.retailer] || 0) + 1;
    (o.style_tags || []).forEach((t) => (tags[t] = (tags[t] || 0) + 1));
    if (o.occasion) occ[o.occasion] = (occ[o.occasion] || 0) + 1;
  });

  const dominantCategories = topKeys(cat, 4);
  const allCategories = Object.keys(cat);
  const underOwned = allCategories.filter((c) => cat[c] <= 1);
  const overOwned = topKeys(cat, 2);

  return {
    user_id: "",
    counts: { cat, col, fit, occ },
    dominant_categories: dominantCategories,
    dominant_colors: topKeys(col, 5),
    dominant_fits: topKeys(fit, 3),
    dominant_brands: topKeys(brand, 4),
    dominant_retailers: topKeys(ret, 4),
    dominant_style_tags: topKeys(tags, 6),
    wardrobe_color_palette: Object.keys(col),
    under_owned_categories: underOwned,
    over_owned_categories: overOwned,
    occasion_coverage: occ,
    accessory_gaps: cat["accessories"] ? [] : ["chain", "cap", "watch", "belt"],
    updated_at: new Date(0).toISOString(),
  };
}

export type GapDraft = Omit<WardrobeGap, "id" | "user_id" | "created_at">;

// Fixed rule set (spec §11 / prototype buildGaps). sub_category doubles as an
// "OR" alternate category for gaps that match more than one product category
// (e.g. loafers OR sandals).
export function buildGaps(owned: OwnedItem[], profile: ReturnType<typeof buildProfile>): GapDraft[] {
  const gaps: GapDraft[] = [];
  const cat = profile.counts.cat;
  const tops = (cat["t-shirts"] || 0) + (cat["shirts"] || 0);
  const bottoms = (cat["trousers"] || 0) + (cat["jeans"] || 0);
  const has = (fn: (o: OwnedItem) => boolean) => owned.some(fn);

  if (bottoms < Math.ceil(tops / 3)) {
    gaps.push({
      gap_type: "category_gap",
      category: "trousers",
      sub_category: null,
      style_tag: null,
      color_recommendation: ["beige", "olive", "black", "denim blue"],
      priority: "High",
      reason: "You own many oversized tops but few complementary bottoms.",
    });
  }
  if (!has((o) => o.category === "sneakers")) {
    gaps.push({
      gap_type: "category_gap",
      category: "sneakers",
      sub_category: null,
      style_tag: null,
      color_recommendation: ["white"],
      priority: "High",
      reason: "Your streetwear tops need a versatile footwear base — you own none.",
    });
  }
  if (!has((o) => o.category === "accessories")) {
    gaps.push({
      gap_type: "accessory_gap",
      category: "accessories",
      sub_category: null,
      style_tag: null,
      color_recommendation: ["black", "grey"],
      priority: "Medium",
      reason: "Many casual outfits, nothing to finish them. A chain, cap, watch or belt completes the look.",
    });
  }
  if (!has((o) => ["overshirt", "winter"].includes(o.sub_category || "") || o.category === "jackets")) {
    gaps.push({
      gap_type: "seasonal_gap",
      category: "jackets",
      sub_category: null,
      style_tag: null,
      color_recommendation: ["beige", "charcoal", "black"],
      priority: "Medium",
      reason: "No overshirts or jackets — you can't layer for cooler evenings or smarter looks.",
    });
  }
  const dateShirts = owned.filter((o) => o.occasion === "date/night-out").length;
  if (dateShirts === 0) {
    gaps.push({
      gap_type: "occasion_gap",
      category: "shirts",
      sub_category: null,
      style_tag: null,
      color_recommendation: ["black", "navy"],
      priority: "Medium",
      reason: "Wardrobe skews casual — you lack a sharper shirt for evenings out.",
    });
  }
  if (!has((o) => ["loafers", "sandals"].includes(o.category))) {
    gaps.push({
      gap_type: "category_gap",
      category: "loafers",
      sub_category: "sandals",
      style_tag: null,
      color_recommendation: ["tan", "brown"],
      priority: "Low",
      reason: "For your linen & Cuban-collar shirts, loafers or sandals dress things up.",
    });
  }
  return gaps;
}

export function gapMatchesProduct(
  gap: Pick<WardrobeGap, "gap_type" | "category" | "sub_category">,
  product: { category: string; occasion?: string | null }
): boolean {
  if (gap.gap_type === "occasion_gap") {
    return product.occasion === "date/night-out" && product.category === gap.category;
  }
  if (gap.category && product.category === gap.category) return true;
  if (gap.sub_category && product.category === gap.sub_category) return true;
  return false;
}

export function colorsComplement(colorA: string | null, colorB: string | null): boolean {
  if (!colorA || !colorB) return false;
  if (colorA === colorB) return true;
  if ((COLOR_RULES[colorA] || []).includes(colorB)) return true;
  if ((COLOR_RULES[colorB] || []).includes(colorA)) return true;
  return false;
}

export function complementCount(
  product: { category: string; color: string | null },
  owned: OwnedItem[]
): number {
  return owned.filter((o) => o.category !== product.category && colorsComplement(o.color, product.color)).length;
}

export function complementingOwnedItems(
  product: { category: string; color: string | null },
  owned: OwnedItem[]
): OwnedItem[] {
  return owned.filter((o) => o.category !== product.category && colorsComplement(o.color, product.color));
}
