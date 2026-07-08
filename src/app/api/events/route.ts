import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { DEMO_USER_ID } from "@/lib/constants";
import type { UserEventType } from "@/lib/types";

type Body = {
  productId: number;
  eventType: UserEventType | "unsave";
};

export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  if (!body?.productId || !body?.eventType) {
    return NextResponse.json({ error: "productId and eventType are required" }, { status: 400 });
  }

  if (body.eventType === "unsave") {
    const { error } = await supabase
      .from("user_events")
      .delete()
      .eq("user_id", DEMO_USER_ID)
      .eq("product_id", body.productId)
      .eq("event_type", "save");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from("user_events")
    .insert({ user_id: DEMO_USER_ID, product_id: body.productId, event_type: body.eventType });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
