import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getScoredCatalog, getSavedProductIds } from "@/lib/data";
import { explainProduct } from "@/lib/scoring";
import { ProductCard } from "@/components/product-card";
import { BrowseFilterBar } from "@/components/browse-filter-bar";
import type { ScoredProduct } from "@/lib/types";

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

const SORTERS: Record<string, (a: ScoredProduct, b: ScoredProduct) => number> = {
  recommended: (a, b) => b.scores.final - a.scores.final,
  wardrobe: (a, b) => b.scores.wardrobeRelevance - a.scores.wardrobeRelevance,
  deal: (a, b) => b.scores.deal - a.scores.deal,
  trending: (a, b) => b.scores.trend - a.scores.trend,
  lowprice: (a, b) => a.current_price - b.current_price,
  discount: (a, b) => (b.discount_pct || 0) - (a.discount_pct || 0),
  belowmedian: (a, b) => (a.stats.price_vs_30d_median_pct ?? 0) - (b.stats.price_vs_30d_median_pct ?? 0),
  complement: (a, b) => b.complementCount - a.complementCount,
};

export default async function BrowsePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const [scored, saved] = await Promise.all([getScoredCatalog(), getSavedProductIds()]);

  const retailer = first(params.retailer) ?? "all";
  const category = first(params.category) ?? "all";
  const belowMedian = first(params.belowMedian) === "1";
  const dealsOnly = first(params.dealsOnly) === "1";
  const gapOnly = first(params.gapOnly) === "1";
  const sort = first(params.sort) ?? "recommended";

  let list = scored.filter((p) => {
    if (retailer !== "all" && p.retailer.name !== retailer) return false;
    if (category !== "all" && p.category !== category) return false;
    if (belowMedian && !p.stats.is_below_30d_median) return false;
    if (dealsOnly && p.scores.deal < 0.55) return false;
    if (gapOnly && !p.matchedGap) return false;
    return true;
  });
  list = [...list].sort(SORTERS[sort] ?? SORTERS.recommended);

  const retailers = Array.from(new Set(scored.map((p) => p.retailer.name))).sort();
  const categories = Array.from(new Set(scored.map((p) => p.category))).sort();

  return (
    <div>
      <Link href="/feed" className="flex items-center gap-1 text-sm mb-3 w-fit" style={{ color: "var(--td-muted)" }}>
        <ChevronLeft size={16} /> Back to feed
      </Link>
      <BrowseFilterBar retailers={retailers} categories={categories} resultCount={list.length} />
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {list.map((p) => (
          <ProductCard key={p.id} product={p} saved={saved.has(p.id)} explanation={explainProduct(p, p.matchedGap, p.complementCount)} />
        ))}
      </div>
    </div>
  );
}
