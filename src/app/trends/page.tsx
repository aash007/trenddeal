import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getScoredCatalog, getTrendClusters } from "@/lib/data";
import { TdBadge } from "@/components/td-badge";

export default async function TrendsPage() {
  const [clusters, scored] = await Promise.all([getTrendClusters(), getScoredCatalog()]);

  const stats = clusters.map((t) => {
    const matches = scored.filter((p) => p.trend_matches.some((m) => m.trend_cluster_id === t.id));
    const retailerCount = new Set(matches.map((p) => p.retailer_id)).size;
    const confidence = retailerCount >= 2 ? "High" : retailerCount === 1 ? "Medium" : "Low";
    return { ...t, matchCount: matches.length, retailerCount, confidence };
  });

  return (
    <div>
      <div className="td-mono text-xs" style={{ color: "var(--td-muted)" }}>
        TREND SIGNALS · CROSS-RETAILER
      </div>
      <h1 className="td-disp text-2xl font-bold mt-0.5 mb-4">What&apos;s trending in Indian menswear</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {stats.map((t) => (
          <Link key={t.id} href={`/trends/${t.id}`} className="text-left rounded-2xl p-4 block" style={{ background: "#fff", border: "1px solid var(--line)" }}>
            <div className="flex items-center gap-2">
              <h2 className="td-disp font-semibold">{t.trend_name}</h2>
              <TdBadge tone={t.confidence === "High" ? "good" : t.confidence === "Medium" ? "accent" : "muted"}>{t.confidence} confidence</TdBadge>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--td-muted)" }}>
              Appearing across {t.retailerCount} retailer{t.retailerCount === 1 ? "" : "s"} · {t.matchCount} matching products in your feed
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {t.hashtags.map((h) => (
                <span key={h} className="td-mono text-[10px]" style={{ color: "var(--td-accent)" }}>
                  {h}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: "var(--td-accent)" }}>
              Explore <ChevronRight size={13} />
            </div>
          </Link>
        ))}
      </div>
      <p className="text-xs mt-4" style={{ color: "var(--td-muted)" }}>
        Trend score = retailer-native signal (MVP default) + cross-retailer density. Hashtag pulse is capped at 15% and off in this MVP.
      </p>
    </div>
  );
}
