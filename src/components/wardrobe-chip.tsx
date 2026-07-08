import { SWATCH } from "@/lib/constants";

export function WardrobeChip({ children, dot }: { children: React.ReactNode; dot?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs" style={{ background: "#fff", border: "1px solid var(--line)" }}>
      {dot && <span className="w-2.5 h-2.5 rounded-full" style={{ background: SWATCH[dot] || "#999" }} />}
      {children}
    </span>
  );
}

export function WardrobePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid var(--line)" }}>
      <div className="td-mono text-[11px] mb-2.5 tracking-wide" style={{ color: "var(--td-muted)" }}>
        {title.toUpperCase()}
      </div>
      {children}
    </div>
  );
}
