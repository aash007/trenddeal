import Link from "next/link";
import { Plus } from "lucide-react";
import { getOwnedItems, getWardrobeProfile, getWardrobeGaps, getScoredCatalog, getSavedProductIds } from "@/lib/data";
import { explainProduct } from "@/lib/scoring";
import { ProductCard } from "@/components/product-card";
import { TdBadge } from "@/components/td-badge";
import { WardrobeChip, WardrobePanel } from "@/components/wardrobe-chip";
import { WardrobeItemCard } from "@/components/wardrobe-item-card";
import { SWATCH } from "@/lib/constants";
import type { OwnedItem } from "@/lib/types";

export default async function WardrobePage() {
  const [owned, profile, gaps, scored, saved] = await Promise.all([
    getOwnedItems(),
    getWardrobeProfile(),
    getWardrobeGaps(),
    getScoredCatalog(),
    getSavedProductIds(),
  ]);

  const nextBuys = scored.filter((p) => p.matchedGap).slice(0, 4);
  const categoryCounts = Object.entries(profile.counts.cat).sort((a, b) => b[1] - a[1]);

  const byCategory = new Map<string, OwnedItem[]>();
  for (const o of owned) {
    if (!byCategory.has(o.category)) byCategory.set(o.category, []);
    byCategory.get(o.category)!.push(o);
  }
  const categoriesInOrder = [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <div>
      <div className="flex items-end gap-3 mb-5">
        <div>
          <div className="td-mono text-xs" style={{ color: "var(--td-muted)" }}>
            WARDROBE PROFILE · {owned.length} ITEMS
          </div>
          <h1 className="td-disp text-2xl font-bold mt-0.5">Your style, decoded</h1>
        </div>
        <Link href="/wardrobe/import" className="ml-auto flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--td-accent)" }}>
          <Plus size={15} /> Add items
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-5">
        <WardrobePanel title="Your style profile">
          <p className="text-sm leading-relaxed">
            Your wardrobe is mostly <b>{profile.dominant_style_tags.slice(0, 3).join(", ") || "unclassified"}</b>, built around{" "}
            <b>{profile.dominant_categories.slice(0, 2).join(" & ")}</b> in <b>{profile.dominant_fits[0] ?? "mixed"}</b> fits.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.dominant_style_tags.map((t) => (
              <WardrobeChip key={t}>{t}</WardrobeChip>
            ))}
          </div>
        </WardrobePanel>
        <WardrobePanel title="Your dominant colors">
          <div className="flex flex-wrap gap-1.5">
            {profile.dominant_colors.map((c) => (
              <WardrobeChip key={c} dot={c}>
                {c}
              </WardrobeChip>
            ))}
          </div>
        </WardrobePanel>
        <WardrobePanel title="Most-owned categories">
          {categoryCounts.map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 mb-1.5">
              <span className="text-sm w-24 shrink-0">{k}</span>
              <div className="flex-1 rounded-full" style={{ height: 8, background: "var(--line2)" }}>
                <div className="rounded-full" style={{ height: 8, width: `${(v / owned.length) * 100}%`, background: "var(--td-accent)" }} />
              </div>
              <span className="td-mono text-xs" style={{ color: "var(--td-muted)" }}>
                {v}
              </span>
            </div>
          ))}
        </WardrobePanel>
        <WardrobePanel title="Fits & favorite retailers">
          <div className="text-xs td-mono mb-1" style={{ color: "var(--td-muted)" }}>
            FITS
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {profile.dominant_fits.map((f) => (
              <WardrobeChip key={f}>{f}</WardrobeChip>
            ))}
          </div>
          <div className="text-xs td-mono mb-1" style={{ color: "var(--td-muted)" }}>
            RETAILERS
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.dominant_retailers.map((r) => (
              <WardrobeChip key={r}>{r}</WardrobeChip>
            ))}
          </div>
        </WardrobePanel>
      </div>

      <WardrobePanel title={`Your wardrobe gaps (${gaps.length})`}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {gaps.map((g) => (
            <div key={g.id} className="p-3 rounded-xl" style={{ border: "1px solid var(--line)" }}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold capitalize">{g.category ?? g.gap_type.replace("_", " ")}</span>
                <TdBadge tone={g.priority === "High" ? "warn" : g.priority === "Medium" ? "accent" : "muted"}>{g.priority}</TdBadge>
              </div>
              <p className="text-xs mt-1 leading-snug" style={{ color: "var(--td-muted)" }}>
                {g.reason}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="td-mono text-[10px]" style={{ color: "var(--td-muted)" }}>
                  suggested:
                </span>
                {g.color_recommendation.map((c) => (
                  <span key={c} className="w-3.5 h-3.5 rounded-full" style={{ background: SWATCH[c] || "#999" }} title={c} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </WardrobePanel>

      <div className="mt-5">
        <h2 className="td-disp text-base font-semibold mb-2.5">Recommended next buys</h2>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))" }}>
          {nextBuys.map((p) => (
            <ProductCard key={p.id} product={p} saved={saved.has(p.id)} explanation={explainProduct(p, p.matchedGap, p.complementCount)} />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-baseline gap-2 mb-3">
          <h2 className="td-disp text-lg font-semibold">Your wardrobe</h2>
          <span className="text-xs" style={{ color: "var(--td-muted)" }}>
            · {owned.length} items across {categoriesInOrder.length} categories
          </span>
        </div>
        {categoriesInOrder.map(([category, items]) => (
          <section key={category} className="mb-6">
            <div className="flex items-baseline gap-2 mb-2.5">
              <h3 className="td-disp text-sm font-semibold capitalize">{category}</h3>
              <span className="td-mono text-xs" style={{ color: "var(--td-muted)" }}>
                {items.length}
              </span>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))" }}>
              {items.map((o) => (
                <WardrobeItemCard key={o.id} item={o} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
