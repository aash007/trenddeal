// Generic Shopify adapter (spec §7) — the heart of the MVP. One adapter
// ingests any Shopify store's public /products.json; new brands are a config
// row, not new code. Deliberately no headless browser: plain server fetch().
import { CATEGORY_MAP, CATEGORY_FALLBACK, COLOR_KEYWORD_MAP, STYLE_VOCAB, SIZE_TOKEN_RE } from "../constants";
import type { AdapterConfig } from "../types";

type ShopifyVariant = {
  price: string;
  compare_at_price: string | null;
  available: boolean;
  title: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
};

type ShopifyImage = { src: string };

type ShopifyProduct = {
  id: number;
  title: string;
  product_type: string;
  tags: string[];
  handle: string;
  images: ShopifyImage[];
  published_at: string | null;
  variants: ShopifyVariant[];
};

export type NormalizedProduct = {
  external_product_id: string;
  handle: string;
  title: string;
  normalized_title: string;
  category: string;
  color: string | null;
  fit: string;
  style_tags: string[];
  seasonal_tags: string[];
  image_url: string | null;
  current_price: number;
  mrp: number | null;
  discount_pct: number | null;
  in_stock: boolean;
  sizes_available: string[];
  sizes_total: string[];
  published_at: string | null;
  isLowConfidence: boolean;
};

const MAX_PAGES = 5;
const THROTTLE_MS = 1100; // ≤1 req/sec/brand

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchShopifyProducts(baseUrl: string, userAgent: string): Promise<ShopifyProduct[]> {
  const all: ShopifyProduct[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${baseUrl.replace(/\/$/, "")}/products.json?limit=250&page=${page}`;
    const res = await fetch(url, { headers: { "User-Agent": userAgent }, cache: "no-store" });
    if (!res.ok) throw new Error(`${baseUrl} products.json page ${page} -> HTTP ${res.status}`);
    const json = (await res.json()) as { products: ShopifyProduct[] };
    const products = json.products ?? [];
    if (products.length === 0) break;
    all.push(...products);
    if (page < MAX_PAGES) await sleep(THROTTLE_MS);
  }
  return all;
}

function deriveCategory(product: ShopifyProduct, config: AdapterConfig): string {
  const haystack = config.productTypeReliable !== false ? `${product.product_type} ${product.title}` : product.title;
  for (const [re, category] of CATEGORY_MAP) {
    if (re.test(haystack)) return category;
  }
  return CATEGORY_FALLBACK;
}

// Returns [color, wasInferred]. Falls back to "black" when nothing matches
// (spec §7: "a colorless title falls back to black" — acceptable MVP heuristic).
function deriveColor(product: ShopifyProduct, config: AdapterConfig): [string, boolean] {
  const excludeTags = new Set((config.excludeTags ?? []).map((t) => t.toLowerCase()));
  const titleHit = matchColorKeyword(product.title);
  if (titleHit) return [titleHit, true];
  if (!config.colorFromTitleOnly) {
    const tagText = product.tags.filter((t) => !excludeTags.has(t.toLowerCase())).join(" ");
    const tagHit = matchColorKeyword(tagText);
    if (tagHit) return [tagHit, true];
  }
  return ["black", false];
}

function matchColorKeyword(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [keyword, palette] of Object.entries(COLOR_KEYWORD_MAP)) {
    if (new RegExp(`\\b${keyword}\\b`, "i").test(lower)) return palette;
  }
  return null;
}

function deriveFit(text: string): string {
  const lower = text.toLowerCase();
  if (/oversized|boxy/.test(lower)) return "oversized";
  if (/baggy|relaxed|wide|barrel/.test(lower)) return "relaxed";
  if (/slim/.test(lower)) return "slim";
  return "regular";
}

function deriveStyleTags(product: ShopifyProduct): string[] {
  const haystack = `${product.title} ${product.tags.join(" ")}`.toLowerCase();
  return STYLE_VOCAB.filter((s) => haystack.includes(s));
}

function deriveSeasonalTags(text: string): string[] {
  const lower = text.toLowerCase();
  if (/linen|shorts/.test(lower)) return ["summer"];
  if (/jacket|sweat/.test(lower)) return ["winter"];
  return ["all-season"];
}

function deriveSizes(product: ShopifyProduct, config: AdapterConfig): { total: string[]; available: string[] } {
  const total = new Set<string>();
  const available = new Set<string>();
  for (const v of product.variants) {
    let candidates: (string | null)[];
    if (config.sizeOptionIndex === 1) candidates = [v.option1];
    else if (config.sizeOptionIndex === 2) candidates = [v.option2];
    else if (config.sizeOptionIndex === 3) candidates = [v.option3];
    else candidates = [v.option1, v.option2, v.option3, v.title];

    for (const c of candidates) {
      if (!c) continue;
      const token = c.trim().toUpperCase();
      if (SIZE_TOKEN_RE.test(token)) {
        total.add(token);
        if (v.available) available.add(token);
        break;
      }
    }
  }
  return { total: [...total], available: [...available] };
}

export function normalizeShopifyProduct(product: ShopifyProduct, config: AdapterConfig): NormalizedProduct {
  const prices = product.variants.map((v) => parseFloat(v.price)).filter((p) => !Number.isNaN(p));
  const currentPrice = Math.min(...prices);
  const compareAtPrices = product.variants.map((v) => parseFloat(v.compare_at_price || "0")).filter((p) => !Number.isNaN(p) && p > 0);
  const maxCompareAt = compareAtPrices.length ? Math.max(...compareAtPrices) : 0;
  const mrp = maxCompareAt > currentPrice ? maxCompareAt : null;

  const category = deriveCategory(product, config);
  const [color, colorInferred] = deriveColor(product, config);
  const fit = deriveFit(`${product.title} ${product.tags.join(" ")}`);
  const { total: sizesTotal, available: sizesAvailable } = deriveSizes(product, config);
  const inStock = product.variants.some((v) => v.available);
  const image = product.images?.[0]?.src ? product.images[0].src.split("?")[0] : null;

  return {
    external_product_id: String(product.id),
    handle: product.handle,
    title: product.title,
    normalized_title: product.title.toLowerCase(),
    category,
    color,
    fit,
    style_tags: deriveStyleTags(product),
    seasonal_tags: deriveSeasonalTags(`${product.title} ${product.tags.join(" ")}`),
    image_url: image,
    current_price: currentPrice,
    mrp,
    discount_pct: mrp ? Math.round((1 - currentPrice / mrp) * 100) : null,
    in_stock: inStock,
    sizes_available: sizesAvailable,
    sizes_total: sizesTotal,
    published_at: product.published_at,
    // low-confidence heuristic (§7): no color inferred at all, or no sizes detected
    isLowConfidence: !colorInferred || sizesTotal.length === 0,
  };
}
