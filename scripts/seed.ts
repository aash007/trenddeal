// npm run db:seed — seeds retailers, trend_clusters, demo owned_items, and the
// Appendix C sample products with a labeled-simulated 30-day price history.
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { RETAILER_SEED, TREND_CLUSTER_SEED, DEMO_USER_ID } from "../src/lib/constants";
import { SEED_PRODUCTS, SEED_OWNED_ITEMS, type SeedProductRaw } from "./seedData";
import { recomputeWardrobe } from "../src/lib/recompute";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !serviceKey) throw new Error("Missing Supabase env vars — check .env.local");

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const round10 = (n: number) => Math.round(n / 10) * 10;
const median = (arr: number[]) => {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const PRICE_MODES = ["low", "near", "belowMed", "atMed", "above"] as const;

function simulateHistory(seedIdx: number, usual: number, days: number) {
  const rng = mulberry32(seedIdx * 7 + 13);
  const hist: { day: number; price: number }[] = [];
  for (let i = 0; i < days; i++) {
    const wobble = (rng() - 0.5) * 0.22 + Math.sin(i / 4) * 0.05;
    hist.push({ day: -(days - i), price: Math.max(100, round10(usual * (1 + wobble))) });
  }
  const prices = hist.map((h) => h.price);
  const low = Math.min(...prices);
  const med = median(prices);
  const mode = PRICE_MODES[seedIdx % PRICE_MODES.length];
  let current: number;
  switch (mode) {
    case "low": current = low; break;
    case "near": current = round10(low * 1.04); break;
    case "belowMed": current = round10((low + med) / 2); break;
    case "atMed": current = round10(med); break;
    case "above": current = round10(med * 1.08); break;
  }
  return { hist, current };
}

async function main() {
  console.log("Seeding retailers...");
  const retailerIds = new Map<string, number>();
  for (const r of RETAILER_SEED) {
    const { data, error } = await db
      .from("retailers")
      .upsert(
        { name: r.name, base_url: r.base_url, trust_score: r.trust_score, priority: r.priority, adapter_config: r.adapter_config, platform: "shopify", enabled: true },
        { onConflict: "name" }
      )
      .select("id, name")
      .single();
    if (error) throw error;
    retailerIds.set(data.name, data.id);
  }

  console.log("Seeding trend clusters...");
  const trendIds = new Map<string, number>();
  for (const t of TREND_CLUSTER_SEED) {
    const { data: existing } = await db.from("trend_clusters").select("id").eq("trend_name", t.trend_name).maybeSingle();
    if (existing) {
      trendIds.set(t.trend_name, existing.id);
      continue;
    }
    const { data, error } = await db
      .from("trend_clusters")
      .insert({ trend_name: t.trend_name, category: t.category, keywords: t.keywords, hashtags: t.hashtags, enabled: true })
      .select("id")
      .single();
    if (error) throw error;
    trendIds.set(t.trend_name, data.id);
  }

  console.log("Seeding demo owned items...");
  await db.from("owned_items").delete().eq("user_id", DEMO_USER_ID).eq("source", "manual").like("product_name", "%");
  const ownedRows = SEED_OWNED_ITEMS.map((o) => ({
    user_id: DEMO_USER_ID,
    source: "manual" as const,
    retailer: o.retailer,
    brand: o.brand,
    product_name: o.name,
    category: o.category,
    color: o.color,
    fit: o.fit,
    occasion: o.occasion,
    style_tags: o.styleTags,
  }));
  const { error: ownedErr } = await db.from("owned_items").insert(ownedRows);
  if (ownedErr) throw ownedErr;

  console.log(`Seeding ${SEED_PRODUCTS.length} sample products + 30d price history...`);
  let idx = 0;
  for (const raw of SEED_PRODUCTS as SeedProductRaw[]) {
    const retailerId = retailerIds.get(raw.retailer)!;
    const handle = raw.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const externalId = `seed-${raw.retailer.toLowerCase()}-${idx}`;
    const days = idx % 7 === 0 ? 18 : 30; // a few partial-history items to exercise the trust-rule badges
    const publishedDaysAgo = raw.newArrival ? 5 + (idx % 10) : 45 + (idx % 60);
    const { hist, current } = simulateHistory(idx, raw.price, days);

    const productRow = {
      retailer_id: retailerId,
      external_product_id: externalId,
      product_url: `${RETAILER_SEED.find((r) => r.name === raw.retailer)!.base_url}/products/${handle}`,
      handle,
      title: raw.title,
      normalized_title: raw.title.toLowerCase(),
      category: raw.category,
      sub_category: raw.subCategory,
      color: raw.color,
      fit: raw.fit,
      style_tags: raw.styleTags,
      seasonal_tags: raw.seasonalTags,
      occasion: raw.occasion,
      image_url: null,
      current_price: current,
      mrp: raw.mrp > 0 ? raw.mrp : null,
      discount_pct: raw.mrp > 0 && raw.mrp > current ? Math.round((1 - current / raw.mrp) * 100) : null,
      currency: "INR",
      in_stock: true,
      sizes_available: raw.sizesTotal.slice(0, raw.sizesAvailable),
      sizes_total: raw.sizesTotal,
      published_at: new Date(Date.now() - publishedDaysAgo * 86400000).toISOString(),
    };

    const { data: product, error: prodErr } = await db
      .from("products")
      .upsert(productRow, { onConflict: "retailer_id,external_product_id" })
      .select("id")
      .single();
    if (prodErr) throw prodErr;

    await db.from("price_snapshots").delete().eq("product_id", product.id);
    const snapshotRows = hist.map((h) => ({
      product_id: product.id,
      retailer_id: retailerId,
      price: h.price,
      mrp: productRow.mrp,
      in_stock: true,
      sizes_available: productRow.sizes_available,
      is_simulated: true,
      captured_at: new Date(Date.now() + h.day * 86400000).toISOString(),
    }));
    snapshotRows.push({
      product_id: product.id,
      retailer_id: retailerId,
      price: current,
      mrp: productRow.mrp,
      in_stock: true,
      sizes_available: productRow.sizes_available,
      is_simulated: true,
      captured_at: new Date().toISOString(),
    });
    const { error: snapErr } = await db.from("price_snapshots").insert(snapshotRows);
    if (snapErr) throw snapErr;

    // trend matches: naive keyword overlap against title + style_tags
    for (const t of TREND_CLUSTER_SEED) {
      const haystack = `${raw.title} ${raw.styleTags.join(" ")}`.toLowerCase();
      const hits = t.keywords.filter((k) => haystack.includes(k.toLowerCase())).length;
      if (hits > 0 && t.category === raw.category) {
        const score = Math.min(1, hits / Math.max(2, t.keywords.length / 2));
        await db
          .from("product_trend_matches")
          .upsert(
            { product_id: product.id, trend_cluster_id: trendIds.get(t.trend_name)!, match_score: score },
            { onConflict: "product_id,trend_cluster_id" }
          );
      }
    }

    idx++;
  }

  console.log("Materializing product_price_stats via recompute()...");
  const { recomputeAllPriceStats } = await import("../src/lib/recompute");
  await recomputeAllPriceStats(db);

  console.log("Recomputing wardrobe profile + gaps...");
  const { gapsCreated } = await recomputeWardrobe(db, DEMO_USER_ID);
  console.log(`  -> ${gapsCreated} gaps created`);

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
