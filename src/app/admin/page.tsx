import { Check, AlertTriangle, Clock } from "lucide-react";
import { getRetailers, getTrendClusters, getScraperRuns, getAdminStats } from "@/lib/data";
import { TdBadge } from "@/components/td-badge";
import { WardrobePanel } from "@/components/wardrobe-chip";
import { AdminRefreshButton } from "@/components/admin-refresh-button";

export default async function AdminPage() {
  const [retailers, trends, runs, stats] = await Promise.all([getRetailers(), getTrendClusters(), getScraperRuns(), getAdminStats()]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div>
          <div className="td-mono text-xs" style={{ color: "var(--td-muted)" }}>
            ADMIN · INGESTION HEALTH
          </div>
          <h1 className="td-disp text-2xl font-bold mt-0.5">Pipeline</h1>
        </div>
        <div className="ml-auto">
          <AdminRefreshButton />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 mb-5">
        <Stat label="Products in DB" value={stats.productCount} />
        <Stat label="With price snapshots" value={`${stats.statsCount} · ${stats.productCount ? Math.round((stats.statsCount / stats.productCount) * 100) : 0}%`} />
        <Stat label="With 30-day history" value={`${stats.trackedCount} · ${stats.productCount ? Math.round((stats.trackedCount / stats.productCount) * 100) : 0}%`} />
      </div>

      <WardrobePanel title="Ingestion runs (most recent first)">
        {runs.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--td-muted)" }}>
            No ingestion runs yet. Trigger a refresh or run <code className="td-mono">npm run ingest:once</code>.
          </p>
        ) : (
          <div className="td-scroll overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="td-mono text-[11px]" style={{ color: "var(--td-muted)" }}>
                  {["Retailer", "Found", "Inserted", "Updated", "Failed", "Status", "Started"].map((h) => (
                    <th key={h} className="text-left font-normal pb-2 pr-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} style={{ borderTop: "1px solid var(--line2)" }}>
                    <td className="py-2 pr-3">{r.retailer?.name}</td>
                    <td className="td-mono pr-3">{r.products_found}</td>
                    <td className="td-mono pr-3">{r.products_inserted}</td>
                    <td className="td-mono pr-3">{r.products_updated}</td>
                    <td className="td-mono pr-3">{r.failed_extractions}</td>
                    <td className="pr-3">
                      {r.status === "success" ? (
                        <TdBadge tone="good">
                          <Check size={11} /> ok
                        </TdBadge>
                      ) : r.status === "running" ? (
                        <TdBadge tone="muted">
                          <Clock size={11} /> running
                        </TdBadge>
                      ) : (
                        <TdBadge tone="warn">
                          <AlertTriangle size={11} /> {r.status}
                        </TdBadge>
                      )}
                    </td>
                    <td className="td-mono text-xs" style={{ color: "var(--td-muted)" }}>
                      {new Date(r.started_at).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WardrobePanel>

      <div className="grid gap-3 sm:grid-cols-2 mt-4">
        <WardrobePanel title="Trend clusters">
          {trends.map((t) => (
            <div key={t.id} className="flex justify-between py-1.5 text-sm" style={{ borderBottom: "1px solid var(--line2)" }}>
              <span>{t.trend_name}</span>
              <span className="td-mono text-xs" style={{ color: "var(--td-muted)" }}>
                {t.category}
              </span>
            </div>
          ))}
        </WardrobePanel>
        <WardrobePanel title="Retailer trust weights">
          {retailers.map((r) => (
            <div key={r.id} className="flex justify-between py-1.5 text-sm" style={{ borderBottom: "1px solid var(--line2)" }}>
              <span>
                {r.name} {!r.enabled && <span style={{ color: "var(--td-muted)" }}>(disabled)</span>}
              </span>
              <span className="td-mono text-xs" style={{ color: "var(--td-muted)" }}>
                {r.trust_score.toFixed(2)}
              </span>
            </div>
          ))}
        </WardrobePanel>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid var(--line)" }}>
      <div className="td-mono text-[11px]" style={{ color: "var(--td-muted)" }}>
        {label.toUpperCase()}
      </div>
      <div className="td-disp text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
