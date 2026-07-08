import { inr } from "@/lib/format";

// Signature element from the prototype: a 30-day (or partial-tracking) low-high
// range strip with a median tick and a current-price marker.
export function PriceStrip({
  low,
  high,
  median,
  current,
  trackingDays,
  height = 34,
}: {
  low: number;
  high: number;
  median: number;
  current: number;
  trackingDays: number;
  height?: number;
}) {
  const range = Math.max(1, high - low);
  const clampPos = (x: number) => Math.max(2, Math.min(98, x));
  const posCur = clampPos(((current - low) / range) * 100);
  const posMed = clampPos(((median - low) / range) * 100);
  const good = current <= median;

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex justify-between td-mono text-[10px]" style={{ color: "var(--td-muted)" }}>
        <span>low {inr(low)}</span>
        <span>{trackingDays >= 30 ? "30-day range" : `${trackingDays}d range`}</span>
        <span>high {inr(high)}</span>
      </div>
      <div className="relative mt-1 rounded-full" style={{ height: 6, background: "var(--line)" }}>
        <div
          className="absolute rounded-full"
          style={{ left: 0, width: `${posCur}%`, height: 6, background: good ? "var(--good)" : "var(--warn)" }}
        />
        <div
          className="absolute"
          style={{ left: `calc(${posMed}% - 1px)`, top: -3, width: 2, height: 12, background: "var(--ink)", opacity: 0.55 }}
          title="median"
        />
        <div
          className="absolute rounded-full"
          style={{
            left: `calc(${posCur}% - 5px)`,
            top: -2,
            width: 10,
            height: 10,
            background: good ? "var(--good)" : "var(--warn)",
            border: "2px solid #fff",
          }}
        />
      </div>
      <div className="flex justify-between mt-1 td-mono text-[10px]" style={{ color: "var(--td-muted)" }}>
        <span>|</span>
        <span>▲ median {inr(median)}</span>
        <span />
      </div>
    </div>
  );
}
