import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { getScoredCatalog, getSavedProductIds, getWardrobeGaps } from "@/lib/data";
import { buildFeedSections } from "@/lib/feed";
import { explainProduct } from "@/lib/scoring";
import { ProductCard } from "@/components/product-card";

export default async function FeedPage() {
  const [scored, saved, gaps] = await Promise.all([getScoredCatalog(), getSavedProductIds(), getWardrobeGaps()]);
  const sections = buildFeedSections(scored, saved);
  const highGaps = gaps.filter((g) => g.priority === "High").length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-5">
        <div>
          <div className="td-mono text-xs" style={{ color: "var(--td-muted)" }}>
            YOUR WARDROBE FEED · MEN
          </div>
          <h1 className="td-disp text-2xl font-bold leading-tight mt-0.5">What to buy next</h1>
          <p className="text-sm mt-1" style={{ color: "var(--td-muted)" }}>
            Ranked by wardrobe fit first, then deal quality. {gaps.length} gaps found
            {highGaps ? ` · ${highGaps} high-priority` : ""}.
          </p>
        </div>
        <Link
          href="/feed/browse"
          className="sm:ml-auto flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: "#fff", border: "1px solid var(--line)" }}
        >
          <SlidersHorizontal size={15} /> Browse all · filter & sort
        </Link>
      </div>

      {sections.length === 0 && (
        <p className="text-sm" style={{ color: "var(--td-muted)" }}>
          No products in the catalog yet — run the ingestion job or seed script.
        </p>
      )}

      {sections.map((sec) => (
        <section key={sec.key} className="mb-7">
          <div className="flex items-baseline gap-2 mb-2.5">
            <h2 className="td-disp text-base font-semibold">{sec.title}</h2>
            <span className="text-xs" style={{ color: "var(--td-muted)" }}>
              · {sec.sub}
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto td-scroll pb-2 -mx-1 px-1">
            {sec.items.map((p) => (
              <div key={p.id} className="shrink-0" style={{ width: 230 }}>
                <ProductCard product={p} saved={saved.has(p.id)} explanation={explainProduct(p, p.matchedGap, p.complementCount)} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
