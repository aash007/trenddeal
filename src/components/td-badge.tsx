import type { ReactNode } from "react";

export type BadgeTone = "good" | "warn" | "accent" | "muted" | "ink";

const TONE_STYLES: Record<BadgeTone, { background: string; color: string }> = {
  good: { background: "var(--good-soft)", color: "var(--good)" },
  warn: { background: "var(--warn-soft)", color: "var(--warn)" },
  accent: { background: "var(--accent-soft)", color: "var(--td-accent)" },
  muted: { background: "var(--line2)", color: "var(--td-muted)" },
  ink: { background: "#15140F", color: "#fff" },
};

export function TdBadge({ tone = "muted", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className="td-mono inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium leading-tight whitespace-nowrap"
      style={TONE_STYLES[tone]}
    >
      {children}
    </span>
  );
}
