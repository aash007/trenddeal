"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Heart, X, TrendingUp, Shirt } from "lucide-react";
import { ProductTile } from "./product-tile";
import { PriceStrip } from "./price-strip";
import { TdBadge, type BadgeTone } from "./td-badge";
import { inr } from "@/lib/format";
import { badgeTone } from "@/lib/priceHistory";
import type { ScoredProduct } from "@/lib/types";

export function ProductCard({
  product,
  saved,
  explanation,
}: {
  product: ScoredProduct;
  saved: boolean;
  explanation: string;
}) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(saved);
  const [hidden, setHidden] = useState(false);
  const [, startTransition] = useTransition();

  if (hidden) return null;

  const fireEvent = (eventType: string) =>
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, eventType }),
    });

  const toggleSave = async () => {
    const next = !isSaved;
    setIsSaved(next);
    await fireEvent(next ? "save" : "unsave");
    startTransition(() => router.refresh());
  };

  const notMyStyle = async () => {
    setHidden(true);
    await fireEvent("not_my_style");
    startTransition(() => router.refresh());
  };

  const stats = product.stats;
  const tone: BadgeTone = badgeTone(stats.price_badge);

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{ background: "var(--td-card)", border: "1px solid var(--line)" }}
    >
      <Link href={`/products/${product.id}`} className="p-2.5 pb-0 block">
        <ProductTile imageUrl={product.image_url} color={product.color} category={product.category} size={130} />
      </Link>
      <div className="p-2.5 flex-1 flex flex-col">
        <div className="flex items-start gap-1.5">
          <Link href={`/products/${product.id}`} className="flex-1 min-w-0">
            <div className="td-mono text-[10px]" style={{ color: "var(--td-muted)" }}>
              {product.retailer.name}
            </div>
            <div className="text-sm font-medium leading-snug truncate">{product.title}</div>
          </Link>
          <button onClick={toggleSave} className="p-1 rounded-md" aria-label="Save" style={{ color: isSaved ? "var(--td-accent)" : "var(--td-muted)" }}>
            <Heart size={16} fill={isSaved ? "var(--td-accent)" : "none"} />
          </button>
        </div>

        <div className="flex items-baseline gap-2 mt-2">
          <span className="td-mono text-lg font-semibold">{inr(product.current_price)}</span>
          {product.mrp && product.mrp > product.current_price && (
            <span className="td-mono text-xs line-through" style={{ color: "var(--td-muted)" }}>
              {inr(product.mrp)}
            </span>
          )}
          {product.discount_pct && product.discount_pct > 0 && (
            <span className="td-mono text-xs font-medium" style={{ color: "var(--good)" }}>
              {product.discount_pct}% off
            </span>
          )}
        </div>

        <div className="mt-2">
          {stats.lowest_price_30d != null && stats.median_price_30d != null && stats.highest_price_30d != null ? (
            <PriceStrip
              low={stats.lowest_price_30d}
              high={stats.highest_price_30d}
              median={stats.median_price_30d}
              current={product.current_price}
              trackingDays={stats.tracking_days}
            />
          ) : (
            <div className="td-mono text-[10px]" style={{ color: "var(--td-muted)" }}>
              No price history yet
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mt-2.5">
          <TdBadge tone={tone}>
            {stats.price_badge}
            {stats.is_simulated ? " (demo)" : ""}
          </TdBadge>
          {product.complementCount >= 2 && (
            <TdBadge tone="accent">
              <Shirt size={11} strokeWidth={2.4} /> Pairs with {product.complementCount}
            </TdBadge>
          )}
          {product.matchedGap && <TdBadge tone="ink">{(product.matchedGap.category ?? "").split(" ")[0]} gap</TdBadge>}
          {product.scores.trend > 0.55 && (
            <TdBadge tone="muted">
              <TrendingUp size={11} strokeWidth={2.4} /> Trending
            </TdBadge>
          )}
        </div>

        <p className="text-xs mt-2.5 leading-snug" style={{ color: "var(--td-muted)" }}>
          {explanation}
        </p>

        <div className="flex gap-1.5 mt-3">
          <a
            href={product.product_url}
            target="_blank"
            rel="noreferrer"
            onClick={() => fireEvent("clickout")}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium text-white text-center"
            style={{ background: "var(--td-accent)" }}
          >
            View on {product.retailer.name.split(" ")[0]}
          </a>
          <button
            onClick={notMyStyle}
            className="px-2 py-1.5 rounded-lg text-xs"
            style={{ border: "1px solid var(--line)", color: "var(--td-muted)" }}
            title="Not my style"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
