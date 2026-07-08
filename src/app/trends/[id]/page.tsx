import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getScoredCatalog, getTrendClusters, getSavedProductIds } from "@/lib/data";
import { explainProduct } from "@/lib/scoring";
import { ProductCard } from "@/components/product-card";

export default async function TrendDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trendId = Number(id);
  if (!Number.isFinite(trendId)) notFound();

  const [clusters, scored, saved] = await Promise.all([getTrendClusters(), getScoredCatalog(), getSavedProductIds()]);
  const trend = clusters.find((t) => t.id === trendId);
  if (!trend) notFound();

  const items = scored.filter((p) => p.trend_matches.some((m) => m.trend_cluster_id === trendId));

  return (
    <div>
      <Link href="/trends" className="flex items-center gap-1 text-sm mb-3 w-fit" style={{ color: "var(--td-muted)" }}>
        <ChevronLeft size={16} /> All trends
      </Link>
      <h1 className="td-disp text-2xl font-bold">{trend.trend_name}</h1>
      <p className="text-sm mt-1 mb-1" style={{ color: "var(--td-muted)" }}>
        Keywords: {trend.keywords.join(", ")}
      </p>
      <div className="flex flex-wrap gap-1 mb-4">
        {trend.hashtags.map((h) => (
          <span key={h} className="td-mono text-[10px]" style={{ color: "var(--td-accent)" }}>
            {h}
          </span>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--td-muted)" }}>
          No products currently match this trend.
        </p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))" }}>
          {items.map((p) => (
            <ProductCard key={p.id} product={p} saved={saved.has(p.id)} explanation={explainProduct(p, p.matchedGap, p.complementCount)} />
          ))}
        </div>
      )}
    </div>
  );
}
