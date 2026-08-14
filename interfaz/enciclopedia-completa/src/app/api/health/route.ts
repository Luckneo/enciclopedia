import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL)?.replace(/\/$/, "");
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, database: "supabase", error: "missing_environment" },
      { status: 503 },
    );
  }

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
