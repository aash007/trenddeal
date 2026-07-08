"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Info } from "lucide-react";
import { TdBadge } from "@/components/td-badge";
import { SWATCH } from "@/lib/constants";

const RETAILERS = ["Snitch", "Powerlook", "The Souled Store", "Bewakoof", "Uniqlo India", "Rare Rabbit", "Myntra", "AJIO", "H&M India", "Zara India"];
const CATEGORIES = ["t-shirts", "shirts", "trousers", "jeans", "co-ords", "jackets", "sneakers", "loafers", "sandals", "accessories"];
const FITS = ["oversized", "relaxed", "regular", "slim", "wide"];
const OCCASIONS = ["casual", "streetwear", "smart casual", "date/night-out", "party", "winter/layering"];

const SAMPLE_CSV = `retailer,brand,product_name,category,price,purchase_date,size,color,product_url,image_url
Snitch,Snitch,Black relaxed shorts,trousers,999,2025-05-10,M,black,,
The Souled Store,TSS,Marvel graphic tee,t-shirts,699,2025-04-02,L,navy,,
AJIO,Levis,Slim fit black jeans,jeans,1799,2025-03-18,32,black,,`;

type ParsedRow = {
  retailer: string;
  brand: string;
  name: string;
  category: string;
  color: string;
  price: string;
};

export default function WardrobeImportPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"manual" | "csv" | "shot">("manual");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    retailer: "Snitch",
    brand: "",
    category: "t-shirts",
    color: "black",
    fit: "oversized",
    occasion: "casual",
    size: "M",
    price: "",
  });

  const [csv, setCsv] = useState("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submitManual = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    await fetch("/api/wardrobe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            productName: form.name,
            retailer: form.retailer,
            brand: form.brand || form.retailer,
            category: form.category,
            color: form.color,
            fit: form.fit,
            occasion: form.occasion,
            size: form.size,
            purchasePrice: form.price ? Number(form.price) : undefined,
            styleTags: [form.fit],
            source: "manual",
          },
        ],
      }),
    });
    setSubmitting(false);
    router.push("/wardrobe");
    router.refresh();
  };

  const parseCsv = () => {
    const lines = csv.trim().split("\n").filter(Boolean);
    if (lines.length < 2) return;
    const cols = lines[0].split(",").map((c) => c.trim());
    const rows = lines.slice(1).map((ln) => {
      const cells = ln.split(",");
      const obj: Record<string, string> = {};
      cols.forEach((c, j) => (obj[c] = (cells[j] || "").trim()));
      return {
        retailer: obj.retailer || "Unknown",
        brand: obj.brand || obj.retailer || "Unknown",
        name: obj.product_name || "Untitled",
        category: (obj.category || "t-shirts").toLowerCase(),
        color: (obj.color || "black").toLowerCase(),
        price: obj.price || "",
      };
    });
    setParsed(rows);
  };

  const confirmCsv = async () => {
    setSubmitting(true);
    await fetch("/api/wardrobe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: parsed.map((r) => ({
          productName: r.name,
          retailer: r.retailer,
          brand: r.brand,
          category: r.category,
          color: r.color,
          purchasePrice: r.price ? Number(r.price) : undefined,
          source: "csv_upload",
        })),
      }),
    });
    setSubmitting(false);
    setParsed([]);
    setCsv("");
    router.push("/wardrobe");
    router.refresh();
  };

  const inputCls = "w-full px-3 py-2 rounded-lg text-sm mt-0.5";
  const inputStyle = { border: "1px solid var(--line)", background: "#fff", color: "var(--ink)" };
  const lbl = { fontSize: "12px" };

  return (
    <div className="max-w-2xl">
      <div className="td-mono text-xs" style={{ color: "var(--td-muted)" }}>
        WARDROBE IMPORT
      </div>
      <h1 className="td-disp text-2xl font-bold mt-0.5 mb-1">Add what you own</h1>
      <p className="text-sm mb-4" style={{ color: "var(--td-muted)" }}>
        No retailer login needed. Everything you add sharpens your profile, gaps and feed instantly.
      </p>

      <div className="flex gap-1 mb-4">
        {(
          [
            ["manual", "Manual entry"],
            ["csv", "CSV upload"],
            ["shot", "Screenshot"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: tab === k ? "var(--ink)" : "#fff", color: tab === k ? "#fff" : "var(--td-muted)", border: "1px solid var(--line)" }}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "manual" && (
        <div className="rounded-2xl p-4 grid gap-3 sm:grid-cols-2" style={{ background: "#fff", border: "1px solid var(--line)" }}>
          <label className="block sm:col-span-2">
            <span className="td-mono" style={{ ...lbl, color: "var(--td-muted)" }}>
              Product name
            </span>
            <input value={form.name} onChange={upd("name")} className={inputCls} style={inputStyle} placeholder="e.g. Washed black oversized tee" />
          </label>
          <label className="block">
            <span className="td-mono" style={{ ...lbl, color: "var(--td-muted)" }}>
              Retailer
            </span>
            <select value={form.retailer} onChange={upd("retailer")} className={inputCls} style={inputStyle}>
              {RETAILERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="td-mono" style={{ ...lbl, color: "var(--td-muted)" }}>
              Brand
            </span>
            <input value={form.brand} onChange={upd("brand")} className={inputCls} style={inputStyle} />
          </label>
          <label className="block">
            <span className="td-mono" style={{ ...lbl, color: "var(--td-muted)" }}>
              Category
            </span>
            <select value={form.category} onChange={upd("category")} className={inputCls} style={inputStyle}>
              {CATEGORIES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="td-mono" style={{ ...lbl, color: "var(--td-muted)" }}>
              Color
            </span>
            <select value={form.color} onChange={upd("color")} className={inputCls} style={inputStyle}>
              {Object.keys(SWATCH).map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="td-mono" style={{ ...lbl, color: "var(--td-muted)" }}>
              Fit
            </span>
            <select value={form.fit} onChange={upd("fit")} className={inputCls} style={inputStyle}>
              {FITS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="td-mono" style={{ ...lbl, color: "var(--td-muted)" }}>
              Occasion
            </span>
            <select value={form.occasion} onChange={upd("occasion")} className={inputCls} style={inputStyle}>
              {OCCASIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="td-mono" style={{ ...lbl, color: "var(--td-muted)" }}>
              Size
            </span>
            <input value={form.size} onChange={upd("size")} className={inputCls} style={inputStyle} />
          </label>
          <label className="block">
            <span className="td-mono" style={{ ...lbl, color: "var(--td-muted)" }}>
              Purchase price (₹)
            </span>
            <input type="number" value={form.price} onChange={upd("price")} className={inputCls} style={inputStyle} />
          </label>
          <div className="sm:col-span-2">
            <button disabled={submitting} onClick={submitManual} className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "var(--td-accent)" }}>
              {submitting ? "Adding…" : "Add to wardrobe"}
            </button>
          </div>
        </div>
      )}

      {tab === "csv" && (
        <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid var(--line)" }}>
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <span className="text-xs td-mono" style={{ color: "var(--td-muted)" }}>
              Columns: retailer, brand, product_name, category, price, purchase_date, size, color, product_url, image_url
            </span>
            <button onClick={() => setCsv(SAMPLE_CSV)} className="text-xs td-mono px-2 py-1 rounded" style={{ background: "var(--accent-soft)", color: "var(--td-accent)" }}>
              Load sample
            </button>
          </div>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={7}
            placeholder="Paste CSV rows here…"
            className="w-full td-mono text-xs p-3 rounded-lg"
            style={{ border: "1px solid var(--line)" }}
          />
          <button onClick={parseCsv} className="mt-2 px-3 py-2 rounded-lg text-sm font-medium" style={{ border: "1px solid var(--line)" }}>
            Parse rows
          </button>

          {parsed.length > 0 && (
            <div className="mt-4">
              <div className="text-xs td-mono mb-2" style={{ color: "var(--td-muted)" }}>
                REVIEW {parsed.length} ITEMS BEFORE SAVING
              </div>
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
                {parsed.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 text-sm" style={{ borderBottom: "1px solid var(--line2)" }}>
                    <span className="w-5 h-5 rounded shrink-0" style={{ background: SWATCH[r.color] || "#999" }} />
                    <span className="flex-1 truncate">{r.name}</span>
                    <span className="td-mono text-xs" style={{ color: "var(--td-muted)" }}>
                      {r.retailer} · {r.category}
                    </span>
                  </div>
                ))}
              </div>
              <button disabled={submitting} onClick={confirmCsv} className="mt-3 w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "var(--td-accent)" }}>
                {submitting ? "Adding…" : `Confirm & add ${parsed.length} items`}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "shot" && (
        <div className="rounded-2xl p-6 text-center" style={{ background: "#fff", border: "1px dashed var(--line)" }}>
          <Upload size={28} className="mx-auto mb-2" style={{ color: "var(--td-muted)" }} />
          <p className="text-sm font-medium">Screenshot import</p>
          <p className="text-xs mt-1 mb-3" style={{ color: "var(--td-muted)" }}>
            In the full build, order-confirmation screenshots run through OCR/LLM extraction — retailer, product, price, date — and every extracted item gets a
            confirmation step before saving. Stubbed in this prototype.
          </p>
          <TdBadge tone="muted">
            <Info size={11} /> Post-MVP hook
          </TdBadge>
        </div>
      )}
    </div>
  );
}
