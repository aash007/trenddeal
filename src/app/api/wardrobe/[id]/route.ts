import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { recomputeWardrobe } from "@/lib/recompute";
import { DEMO_USER_ID } from "@/lib/constants";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from("owned_items").delete().eq("id", Number(id)).eq("user_id", DEMO_USER_ID);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recomputeWardrobe(supabase, DEMO_USER_ID);
  return NextResponse.json({ ok: true });
}
