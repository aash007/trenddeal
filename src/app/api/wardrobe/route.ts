import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { recomputeWardrobe } from "@/lib/recompute";
import { DEMO_USER_ID } from "@/lib/constants";

type OwnedItemInput = {
  retailer?: string;
  brand?: string;
  productName: string;
  category: string;
  color?: string;
  fit?: string;
  occasion?: string;
  size?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  styleTags?: string[];
  source?: "manual" | "csv_upload";
};

export async function POST(request: Request) {
  const body = (await request.json()) as { items: OwnedItemInput[] };
  if (!body?.items?.length) return NextResponse.json({ error: "items[] is required" }, { status: 400 });

  const rows = body.items.map((i) => ({
    user_id: DEMO_USER_ID,
    source: i.source ?? "manual",
    retailer: i.retailer ?? null,
    brand: i.brand ?? i.retailer ?? null,
    product_name: i.productName,
    category: i.category,
    color: i.color ?? null,
    fit: i.fit ?? null,
    occasion: i.occasion ?? null,
    size: i.size ?? null,
    purchase_price: i.purchasePrice ?? null,
    purchase_date: i.purchaseDate ?? null,
    style_tags: i.styleTags ?? [],
  }));

  const { error } = await supabase.from("owned_items").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { gapsCreated } = await recomputeWardrobe(supabase, DEMO_USER_ID);
  return NextResponse.json({ ok: true, inserted: rows.length, gapsCreated });
}
