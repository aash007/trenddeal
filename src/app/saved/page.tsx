import Link from "next/link";
import { Heart } from "lucide-react";
import { getScoredCatalog, getSavedProductIds } from "@/lib/data";
import { explainProduct } from "@/lib/scoring";
import { ProductCard } from "@/components/product-card";

export default async function SavedPage() {
  const [scored, saved] = await Promise.all([getScoredCatalog(), getSavedProductIds()]);
  const list = scored.filter((p) => saved.has(p.id));

  if (!list.length) {
    return (
      <div className="text-center py-16">
        <Heart size={30} className="mx-auto mb-2" style={{ color: "var(--td-muted)" }} />
        <p className="td-disp font-semibold">Nothing saved yet</p>
        <p className="text-sm mt-1 mb-4" style={{ color: "var(--td-muted)" }}>
          Tap the heart on any product to track its price here.
        </p>
        <Link href="/feed" className="px-4 py-2 rounded-lg text-sm font-medium text-white inline-block" style={{ background: "var(--td-accent)" }}>
          Browse the feed
        </Link>
      </div>
    );
  }

  const belowMedianCount = list.filter((p) => p.stats.is_below_30d_median).length;

  return (
    <div>
      <h1 className="td-disp text-2xl font-bold mb-1">Saved</h1>
      <p className="text-sm mb-4" style={{ color: "var(--td-muted)" }}>
        {list.length} tracked · {belowMedianCount} below their 30-day median right now.
      </p>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))" }}>
        {list.map((p) => (
          <ProductCard key={p.id} product={p} saved={true} explanation={explainProduct(p, p.matchedGap, p.complementCount)} />
        ))}
      </div>
    </div>
  );
}
