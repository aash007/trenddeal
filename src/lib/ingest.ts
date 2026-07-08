// Daily ingestion pipeline (spec §8). Shared by scripts/ingest.ts (CLI /
// cron) and the admin "Refresh now" route.
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchShopifyProducts, normalizeShopifyProduct } from "./adapters/shopify";
import { recomputeAllPriceStats, recomputeTrendMatches, recomputeWardrobe } from "./recompute";
import { DEMO_USER_ID } from "./constants";
import type { AdapterConfig } from "./types";

const USER_AGENT = process.env.INGEST_USER_AGENT || "TrendDeal/1.0";

export type RetailerRunResult = {
  retailerId: number;
  retailerName: string;
  status: "success" | "warning" | "failed";
  productsFound: number;
  productsInserted: number;
  productsUpdated: number;
  failedExtractions: number;
  errorMessage: string | null;
};

async function ingestRetailer(db: SupabaseClient, retailer: { id: number; name: string; base_url: string; adapter_config: AdapterConfig }): Promise<RetailerRunResult> {
  const { data: run, error: runErr } = await db
    .from("scraper_runs")
    .insert({ retailer_id: retailer.id, page_url: `${retailer.base_url}/products.json`, status: "running" })
    .select("id")
    .single();
  if (runErr) throw runErr;

  let productsFound = 0;
  let productsInserted = 0;
  let productsUpdated = 0;
  let failedExtractions = 0;
  let status: RetailerRunResult["status"] = "success";
  let errorMessage: string | null = null;

  try {
    const rawProducts = await fetchShopifyProducts(retailer.base_url, USER_AGENT);
    productsFound = rawProducts.length;

    for (const raw of rawProducts) {
      const normalized = normalizeShopifyProduct(raw, retailer.adapter_config);
      if (normalized.isLowConfidence) failedExtractions++;

      const { data: existing } = await db
        .from("products")
        .select("id")
        .eq("retailer_id", retailer.id)
        .eq("external_product_id", normalized.external_product_id)
        .maybeSingle();

      const productRow = {
        retailer_id: retailer.id,
        external_product_id: normalized.external_product_id,
        product_url: `${retailer.base_url.replace(/\/$/, "")}/products/${normalized.handle}`,
        handle: normalized.handle,
        title: normalized.title,
        normalized_title: normalized.normalized_title,
        category: normalized.category,
        color: normalized.color,
        fit: normalized.fit,
        style_tags: normalized.style_tags,
        seasonal_tags: normalized.seasonal_tags,
        image_url: normalized.image_url,
        current_price: normalized.current_price,
        mrp: normalized.mrp,
        discount_pct: normalized.discount_pct,
        in_stock: normalized.in_stock,
        sizes_available: normalized.sizes_available,
        sizes_total: normalized.sizes_total,
        published_at: normalized.published_at,
        last_seen_at: new Date().toISOString(),
      };

      const { data: product, error: upsertErr } = await db
        .from("products")
        .upsert({ ...productRow, first_seen_at: existing ? undefined : new Date().toISOString() }, { onConflict: "retailer_id,external_product_id" })
        .select("id")
        .single();
      if (upsertErr) throw upsertErr;
      if (existing) productsUpdated++;
      else productsInserted++;

      // one snapshot per product per day — today's latest observed price wins
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      await db.from("price_snapshots").delete().eq("product_id", product.id).gte("captured_at", todayStart.toISOString());
      await db.from("price_snapshots").insert({
        product_id: product.id,
        retailer_id: retailer.id,
        price: normalized.current_price,
        mrp: normalized.mrp,
        in_stock: normalized.in_stock,
        sizes_available: normalized.sizes_available,
        is_simulated: false,
        captured_at: new Date().toISOString(),
      });
    }

    const failureRatio = productsFound > 0 ? failedExtractions / productsFound : 0;
    if (productsFound === 0 || failureRatio > 0.2) status = "warning";
  } catch (err) {
    status = "failed";
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  await db
    .from("scraper_runs")
    .update({
      status,
      products_found: productsFound,
      products_inserted: productsInserted,
      products_updated: productsUpdated,
      failed_extractions: failedExtractions,
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq("id", run.id);

  return { retailerId: retailer.id, retailerName: retailer.name, status, productsFound, productsInserted, productsUpdated, failedExtractions, errorMessage };
}

export async function runIngestion(db: SupabaseClient): Promise<{ retailers: RetailerRunResult[]; statsUpdated: number; trendMatches: number; gapsCreated: number }> {
  const { data: retailers, error } = await db.from("retailers").select("id, name, base_url, adapter_config").eq("enabled", true).eq("platform", "shopify");
  if (error) throw error;

  const results: RetailerRunResult[] = [];
  for (const r of retailers ?? []) {
    results.push(await ingestRetailer(db, r));
  }

  const statsUpdated = await recomputeAllPriceStats(db);
  const trendMatches = await recomputeTrendMatches(db);
  const { gapsCreated } = await recomputeWardrobe(db, DEMO_USER_ID);

  return { retailers: results, statsUpdated, trendMatches, gapsCreated };
}
