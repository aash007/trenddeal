import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { runIngestion } from "@/lib/ingest";

// Originally the Vercel Cron target (spec §8, §17), but confirmed in
// production that Vercel's serverless function timeout kills this well
// before ~2500 products finish ingesting (504 Gateway Timeout). The real
// daily schedule now runs via .github/workflows/daily-ingest.yml, which has
// no such limit. This route is left in place for smaller catalogs or once
// ingestion is optimized to fit a serverless timeout; not currently relied
// on. Auth: Vercel signs cron requests with `Authorization: Bearer
// $CRON_SECRET`; set CRON_SECRET in the deployment env to enable this check
// (skipped locally).
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
