import { NextResponse } from "next/server";
import { supabaseConfig } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const { url, publishableKey: key } = supabaseConfig;

  try {
    const response = await fetch(`${url}/rest/v1/creatures?select=source_id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    return NextResponse.json(
      { ok: response.ok, database: "supabase", status: response.status },
      { status: response.ok ? 200 : 503 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, database: "supabase", error: "unreachable" },
      { status: 503 },
    );
  }
}
