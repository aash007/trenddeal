"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { SWATCH } from "@/lib/constants";

export function OwnedItemRow({ id, name, retailer, color }: { id: number; name: string; retailer: string | null; color: string | null }) {
  const router = useRouter();
  const remove = async () => {
    await fetch(`/api/wardrobe/${id}`, { method: "DELETE" });
    router.refresh();
  };
  return (
    <div className="rounded-xl p-2 flex items-center gap-2" style={{ background: "#fff", border: "1px solid var(--line)" }}>
      <span className="w-8 h-8 rounded-lg shrink-0" style={{ background: (color && SWATCH[color]) || "#999" }} />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium truncate">{name}</div>
        <div className="td-mono text-[10px]" style={{ color: "var(--td-muted)" }}>
          {retailer}
        </div>
      </div>
      <button onClick={remove} style={{ color: "var(--td-muted)" }}>
        <X size={13} />
      </button>
    </div>
  );
}
