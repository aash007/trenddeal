import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { runIngestion } from "@/lib/ingest";

// Manual "Refresh now" button (spec §8) — same pipeline the daily cron calls.
export async function POST() {
  try {
    const result = await runIngestion(supabase);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
