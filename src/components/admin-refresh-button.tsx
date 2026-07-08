"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function AdminRefreshButton() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const trigger = async () => {
    setRunning(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/refresh", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Refresh failed");
      const totalFound = json.retailers.reduce((a: number, r: { productsFound: number }) => a + r.productsFound, 0);
      setMessage(`Refreshed ${json.retailers.length} retailer(s), ${totalFound} products found, ${json.gapsCreated} gaps recomputed.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setRunning(false);
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={trigger}
        disabled={running}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
        style={{ background: "var(--td-accent)" }}
      >
        <RefreshCw size={15} className={running ? "animate-spin" : ""} /> {running ? "Refreshing…" : "Trigger daily refresh"}
      </button>
      {message && (
        <span className="td-mono text-[11px] max-w-xs text-right" style={{ color: "var(--td-muted)" }}>
          {message}
        </span>
      )}
    </div>
  );
}
