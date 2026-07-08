"use client";

import { LineChart, Line, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { inr } from "@/lib/format";

export function PriceChart({
  data,
  median,
  low,
}: {
  data: { day: number; price: number }[];
  median: number;
  low: number;
}) {
  return (
    <div style={{ height: 150 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="var(--line2)" />
          <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: "monospace", fill: "var(--td-muted)" }} tickFormatter={(d) => (d === 0 ? "now" : d)} />
          <YAxis tick={{ fontSize: 10, fontFamily: "monospace", fill: "var(--td-muted)" }} domain={["dataMin - 100", "dataMax + 100"]} />
          <Tooltip
            formatter={(v) => inr(Number(v))}
            labelFormatter={(d) => (Number(d) === 0 ? "Today" : `${-Number(d)}d ago`)}
            contentStyle={{ fontSize: 12, fontFamily: "monospace", borderRadius: 8, border: "1px solid var(--line)" }}
          />
          <ReferenceLine y={median} stroke="var(--ink)" strokeDasharray="4 4" strokeOpacity={0.5} />
          <ReferenceLine y={low} stroke="var(--good)" strokeDasharray="4 4" strokeOpacity={0.6} />
          <Line type="monotone" dataKey="price" stroke="var(--td-accent)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
