"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { ProductTile } from "./product-tile";
import { TdBadge } from "./td-badge";
import type { OwnedItem } from "@/lib/types";

export function WardrobeItemCard({ item }: { item: OwnedItem }) {
  const router = useRouter();
  const remove = async () => {
    await fetch(`/api/wardrobe/${item.id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: "var(--td-card)", border: "1px solid var(--line)" }}>
      <div className="relative p-2 pb-0">
        <ProductTile imageUrl={item.image_url} color={item.color} category={item.category} size={150} />
        <button
          onClick={remove}
          aria-label="Remove"
          className="absolute top-3.5 right-3.5 p-1 rounded-full"
          style={{ background: "#00000066", color: "#fff" }}
        >
          <X size={13} />
        </button>
      </div>
      <div className="p-2.5">
        <div className="text-sm font-medium leading-snug truncate">{item.product_name}</div>
        <div className="td-mono text-[10px] mt-0.5" style={{ color: "var(--td-muted)" }}>
          {item.retailer || item.brand || "—"}
          {item.size ? ` · size ${item.size}` : ""}
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {item.fit && <TdBadge tone="muted">{item.fit}</TdBadge>}
          {item.occasion && <TdBadge tone="accent">{item.occasion}</TdBadge>}
        </div>
      </div>
    </div>
  );
}
