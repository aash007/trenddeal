"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, X } from "lucide-react";

export function ProductActions({
  productId,
  productUrl,
  retailerName,
  initialSaved,
}: {
  productId: number;
  productUrl: string;
  retailerName: string;
  initialSaved: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);

  const fireEvent = (eventType: string) =>
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, eventType }),
    });

  const toggleSave = async () => {
    const next = !saved;
    setSaved(next);
    await fireEvent(next ? "save" : "unsave");
    router.refresh();
  };

  const notMyStyle = async () => {
    await fireEvent("not_my_style");
    router.push("/feed");
  };

  return (
    <div className="flex gap-2 mt-3">
      <a
        href={productUrl}
        target="_blank"
        rel="noreferrer"
        onClick={() => fireEvent("clickout")}
        className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white text-center"
        style={{ background: "var(--td-accent)" }}
      >
        View on {retailerName}
      </a>
      <button onClick={toggleSave} className="px-3 rounded-lg" style={{ border: "1px solid var(--line)", background: "#fff", color: saved ? "var(--td-accent)" : "var(--td-muted)" }}>
        <Heart size={16} fill={saved ? "var(--td-accent)" : "none"} />
      </button>
      <button onClick={notMyStyle} className="px-3 rounded-lg" style={{ border: "1px solid var(--line)", background: "#fff", color: "var(--td-muted)" }}>
        <X size={16} />
      </button>
    </div>
  );
}
