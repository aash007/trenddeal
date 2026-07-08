import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Sparkles } from "lucide-react";
import { getScoredCatalog, getSavedProductIds, getOwnedItems, getPriceChartData } from "@/lib/data";
import { complementingOwnedItems } from "@/lib/wardrobe";
import { badgeTone } from "@/lib/priceHistory";
import { inr, pct } from "@/lib/format";
import { ProductTile } from "@/components/product-tile";
import { PriceChart } from "@/components/price-chart";
import { TdBadge } from "@/components/td-badge";
import { ProductActions } from "@/components/product-actions";
import { SWATCH } from "@/lib/constants";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) notFound();

  const [scored, saved, owned, chartData] = await Promise.all([
    getScoredCatalog(),
    getSavedProductIds(),
    getOwnedItems(),
    getPriceChartData(productId),
  ]);

  const product = scored.find((p) => p.id === productId);
  if (!product) notFound();

  const stats = product.stats;
  const complements = complementingOwnedItems(product, owned).slice(0, 5);
  const outfits = complements.slice(0, 3).map((o, i) => ({
    items: [o.product_name, product.title.toLowerCase(), i === 0 ? "white sneakers" : i === 1 ? "loafers" : "cap + chain"],
  }));

  const rows: [string, string][] = [
    ["Current price", inr(product.current_price)],
    [stats.tracking_days >= 30 ? "30-day lowest" : "Lowest tracked", stats.lowest_price_30d != null ? inr(stats.lowest_price_30d) : "—"],
    [stats.tracking_days >= 30 ? "30-day median" : "Median tracked", stats.median_price_30d != null ? inr(stats.median_price_30d) : "—"],
    ["30-day average", stats.average_price_30d != null ? inr(stats.average_price_30d) : "—"],
    ["30-day highest", stats.highest_price_30d != null ? inr(stats.highest_price_30d) : "—"],
    ["vs low", stats.price_vs_30d_low_pct != null ? pct(stats.price_vs_30d_low_pct) : "—"],
    ["vs median", stats.price_vs_30d_median_pct != null ? pct(stats.price_vs_30d_median_pct) : "—"],
    ["Tracking days", `${stats.tracking_days}d`],
  ];

  return (
    <div>
      <Link href="/feed" className="flex items-center gap-1 text-sm mb-3 w-fit" style={{ color: "var(--td-muted)" }}>
        <ChevronLeft size={16} /> Back
      </Link>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <ProductTile imageUrl={product.image_url} color={product.color} category={product.category} size={280} />
          <div className="flex items-baseline gap-2 mt-3">
            <span className="td-mono text-2xl font-bold">{inr(product.current_price)}</span>
            {product.mrp && product.mrp > product.current_price && (
              <span className="td-mono text-sm line-through" style={{ color: "var(--td-muted)" }}>
                {inr(product.mrp)}
              </span>
            )}
            {product.discount_pct && product.discount_pct > 0 && (
              <span className="td-mono text-sm font-medium" style={{ color: "var(--good)" }}>
                {product.discount_pct}% off
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            <TdBadge tone={badgeTone(stats.price_badge)}>
              {stats.price_badge}
              {stats.is_simulated ? " (demo)" : ""}
            </TdBadge>
            <TdBadge tone="muted">Trust {product.retailer.trust_score.toFixed(2)}</TdBadge>
            <TdBadge tone="accent">
              {product.sizes_available.length}/{product.sizes_total.length} sizes
            </TdBadge>
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {product.sizes_total.map((s) => {
              const available = product.sizes_available.includes(s);
              return (
                <span
                  key={s}
                  className="td-mono text-xs px-2 py-1 rounded"
                  style={{
                    border: "1px solid var(--line)",
                    background: available ? "#fff" : "var(--line2)",
                    color: available ? "var(--ink)" : "var(--td-muted)",
                    textDecoration: available ? "none" : "line-through",
                  }}
                >
                  {s}
                </span>
              );
            })}
          </div>
          <ProductActions productId={product.id} productUrl={product.product_url} retailerName={product.retailer.name} initialSaved={saved.has(product.id)} />
        </div>

        <div>
          <div className="rounded-2xl p-3" style={{ background: "#fff", border: "1px solid var(--line)" }}>
            <div className="td-mono text-[11px] mb-2" style={{ color: "var(--td-muted)" }}>
              PRICE HISTORY · {stats.tracking_days} DAYS{stats.is_simulated ? " · SIMULATED (DEMO)" : ""}
            </div>
            {chartData.length > 1 && stats.median_price_30d != null && stats.lowest_price_30d != null ? (
              <PriceChart data={chartData} median={stats.median_price_30d} low={stats.lowest_price_30d} />
            ) : (
              <p className="text-sm" style={{ color: "var(--td-muted)" }}>
                Not enough tracked history yet to chart.
              </p>
            )}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between td-mono text-xs">
                  <span style={{ color: "var(--td-muted)" }}>{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid var(--line)" }}>
          <div className="td-mono text-[11px] mb-2" style={{ color: "var(--td-muted)" }}>
            HOW THIS FITS YOUR WARDROBE
          </div>
          {complements.length ? (
            <>
              <p className="text-sm mb-2">
                Complements <b>{complements.length}</b> items you own:
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {complements.map((o) => (
                  <span key={o.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs" style={{ background: "var(--line2)" }}>
                    <span className="w-3 h-3 rounded-full" style={{ background: (o.color && SWATCH[o.color]) || "#999" }} />
                    {o.product_name}
                  </span>
                ))}
              </div>
              <div className="td-mono text-[11px] mb-1.5" style={{ color: "var(--td-muted)" }}>
                SUGGESTED OUTFITS
              </div>
              {outfits.map((o, i) => (
                <div key={i} className="text-sm mb-1">
                  · {o.items.join(" + ")}
                </div>
              ))}
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--td-muted)" }}>
              This is a foundational piece — it opens up new outfits rather than pairing with current items.
            </p>
          )}
          {product.matchedGap && (
            <div className="mt-3 p-2.5 rounded-lg flex items-start gap-2" style={{ background: "var(--accent-soft)" }}>
              <Sparkles size={15} style={{ color: "var(--td-accent)" }} className="mt-0.5" />
              <span className="text-sm" style={{ color: "var(--td-accent)" }}>
                Fills your <b>{product.matchedGap.category}</b> gap ({product.matchedGap.priority.toLowerCase()} priority).
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
