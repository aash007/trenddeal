"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Check } from "lucide-react";

const SORT_OPTIONS: [string, string][] = [
  ["recommended", "Recommended"],
  ["wardrobe", "Best wardrobe fit"],
  ["deal", "Best deal"],
  ["trending", "Trending"],
  ["lowprice", "Lowest price"],
  ["discount", "Highest discount"],
  ["belowmedian", "Most below 30-day median"],
  ["complement", "Most complementary"],
];

export function BrowseFilterBar({
  retailers,
  categories,
  resultCount,
}: {
  retailers: string[];
  categories: string[];
  resultCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const get = (key: string, fallback: string) => searchParams.get(key) ?? fallback;
  const isOn = (key: string) => searchParams.get(key) === "1";

  const set = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "" || value === "0") params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggle = (key: string) => set(key, isOn(key) ? "0" : "1");

  return (
    <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl" style={{ background: "#fff", border: "1px solid var(--line)" }}>
      <SelectField label="Retailer" value={get("retailer", "all")} onChange={(v) => set("retailer", v)} options={["all", ...retailers]} />
      <SelectField label="Category" value={get("category", "all")} onChange={(v) => set("category", v)} options={["all", ...categories]} />
      <SelectField label="Sort" value={get("sort", "recommended")} onChange={(v) => set("sort", v)} options={SORT_OPTIONS} />
      <ToggleField label="Below median" on={isOn("belowMedian")} onClick={() => toggle("belowMedian")} />
      <ToggleField label="Good deals" on={isOn("dealsOnly")} onClick={() => toggle("dealsOnly")} />
      <ToggleField label="Fills a gap" on={isOn("gapOnly")} onClick={() => toggle("gapOnly")} />
      <span className="ml-auto td-mono text-xs" style={{ color: "var(--td-muted)" }}>
        {resultCount} products
      </span>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | [string, string])[];
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--td-muted)" }}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="td-mono text-xs px-2 py-1.5 rounded-lg"
        style={{ border: "1px solid var(--line)", background: "#fff", color: "var(--ink)" }}
      >
        {options.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>))}
      </select>
    </label>
  );
}

function ToggleField({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="td-mono text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1"
      style={{
        background: on ? "var(--accent-soft)" : "#fff",
        color: on ? "var(--td-accent)" : "var(--td-muted)",
        border: `1px solid ${on ? "var(--td-accent)" : "var(--line)"}`,
      }}
    >
      {on && <Check size={12} />}
      {label}
    </button>
  );
}
