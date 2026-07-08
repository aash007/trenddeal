import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { runIngestion } from "@/lib/ingest";

// Vercel Cron target (spec §8, §17) — runs daily at ~06:00 IST via vercel.json.
// Vercel signs cron requests with `Authorization: Bearer $CRON_SECRET`; set
// CRON_SECRET in the deployment env to enable this check (skipped locally).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runIngestion(supabase);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
