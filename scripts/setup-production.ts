// One-off: seed retailers + trend clusters, insert the real wardrobe, then
// run live ingestion — all directly against the hosted Supabase project via
// .env.production. Does NOT touch local dev's .env.local / local Supabase,
// and deliberately skips the fictional demo products/owned_items that
// scripts/seed.ts uses for local development.
import { config } from "dotenv";
config({ path: ".env.production" });
import { createClient } from "@supabase/supabase-js";
import { RETAILER_SEED, TREND_CLUSTER_SEED, DEMO_USER_ID } from "../src/lib/constants";
import { recomputeWardrobe } from "../src/lib/recompute";
import { runIngestion } from "../src/lib/ingest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !serviceKey) throw new Error("Missing Supabase env vars — check .env.production");

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const REAL_WARDROBE = [
  { productName: "Flat Knit Stripes Polo T-Shirt", retailer: "Snitch", brand: "Snitch", category: "t-shirts", subCategory: "polo", color: "white", fit: "regular", occasion: "smart casual", size: "M", purchasePrice: 1699, styleTags: ["polo"] },
  { productName: "Grunge Blue Bootcut Jeans", retailer: "Snitch", brand: "Snitch", category: "jeans", color: "denim blue", fit: "regular", occasion: "casual", size: "32", purchasePrice: 1689, styleTags: ["bootcut"] },
  { productName: "Kung Fu Panda: Sketchy Panda Tee", retailer: "The Souled Store", brand: "TSS", category: "t-shirts", color: "beige", fit: "oversized", occasion: "casual", purchasePrice: 799, styleTags: ["graphic tees", "oversized"] },
  { productName: "The Big Bang Theory: Bazinga Tee", retailer: "The Souled Store", brand: "TSS", category: "t-shirts", color: "white", fit: "oversized", occasion: "casual", purchasePrice: 949, styleTags: ["graphic tees", "oversized"] },
  { productName: "Solids: Off White Tee", retailer: "The Souled Store", brand: "TSS", category: "t-shirts", color: "white", fit: "oversized", occasion: "casual", purchasePrice: 849, styleTags: ["oversized", "basics"] },
  { productName: "Brown Chinos", retailer: "Westside", brand: "Westside", category: "trousers", color: "brown", fit: "regular", occasion: "smart casual", styleTags: ["chinos"] },
  { productName: "Black Chinos", retailer: "Westside", brand: "Westside", category: "trousers", color: "black", fit: "regular", occasion: "smart casual", styleTags: ["chinos"] },
  { productName: "Black Loose Trousers", retailer: "Snitch", brand: "Snitch", category: "trousers", color: "black", fit: "relaxed", occasion: "casual", styleTags: ["relaxed"] },
  { productName: "Beige Regular Trousers", retailer: "Snitch", brand: "Snitch", category: "trousers", color: "beige", fit: "regular", occasion: "casual", styleTags: [] },
  { productName: "Jacquard Polo: Twilight", retailer: "The Souled Store", brand: "TSS", category: "t-shirts", subCategory: "polo", color: "denim blue", fit: "oversized", occasion: "smart casual", purchasePrice: 999, styleTags: ["polo", "oversized"] },
  { productName: "Endless Escape Oversized Stretch T-Shirt", retailer: "Snitch", brand: "Snitch", category: "t-shirts", color: "olive", fit: "oversized", occasion: "casual", size: "M", purchasePrice: 1299, styleTags: ["oversized", "graphic"] },
  { productName: "Crushed Mandarin Kurta Shirt", retailer: "Snitch", brand: "Snitch", category: "shirts", subCategory: "kurta", color: "white", fit: "relaxed", occasion: "smart casual", size: "XL", purchasePrice: 1399, styleTags: ["resort"] },
  { productName: "Textured Stripes Regular Fit Shirt", retailer: "Snitch", brand: "Snitch", category: "shirts", color: "beige", fit: "regular", occasion: "casual", size: "M", purchasePrice: 1299, styleTags: ["textured"] },
  { productName: "ETA Light Knit Wear", retailer: "Westside", brand: "Westside", category: "t-shirts", color: "brown", fit: "regular", occasion: "casual", purchasePrice: 799, styleTags: ["knit", "winter"] },
];

async function main() {
  console.log("Seeding retailers...");
  for (const r of RETAILER_SEED) {
    const { error } = await db
      .from("retailers")
      .upsert(
        { name: r.name, base_url: r.base_url, trust_score: r.trust_score, priority: r.priority, adapter_config: r.adapter_config, platform: "shopify", enabled: true },
        { onConflict: "name" }
      );
    if (error) throw error;
  }

  console.log("Seeding trend clusters...");
  for (const t of TREND_CLUSTER_SEED) {
    const { data: existing } = await db.from("trend_clusters").select("id").eq("trend_name", t.trend_name).maybeSingle();
    if (existing) continue;
    const { error } = await db.from("trend_clusters").insert({ trend_name: t.trend_name, category: t.category, keywords: t.keywords, hashtags: t.hashtags, enabled: true });
    if (error) throw error;
  }

  console.log("Inserting real wardrobe...");
  const rows = REAL_WARDROBE.map((i) => ({
    user_id: DEMO_USER_ID,
    source: "manual" as const,
    retailer: i.retailer,
    brand: i.brand,
    product_name: i.productName,
    category: i.category,
    sub_category: i.subCategory ?? null,
    color: i.color,
    fit: i.fit,
    occasion: i.occasion,
    size: i.size ?? null,
    purchase_price: i.purchasePrice ?? null,
    style_tags: i.styleTags,
  }));
  const { error: ownedErr } = await db.from("owned_items").insert(rows);
  if (ownedErr) throw ownedErr;

  console.log("Running live ingestion (Snitch + Powerlook)...");
  const result = await runIngestion(db);
  console.log(JSON.stringify(result, null, 2));

  console.log("Recomputing wardrobe once more (in case ingestion's pass ran before owned_items settled)...");
  const { gapsCreated } = await recomputeWardrobe(db, DEMO_USER_ID);
  console.log(`Done. ${gapsCreated} gaps created.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
