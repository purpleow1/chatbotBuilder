import { NextResponse } from "next/server";
import { getMissingSupabaseEnv } from "@/lib/supabase/service";

export const runtime = "nodejs";

export function GET() {
  const missingSupabaseEnv = getMissingSupabaseEnv();

  return NextResponse.json(
    {
      ok: missingSupabaseEnv.length === 0,
      supabase: {
        configured: missingSupabaseEnv.length === 0,
        missingEnv: missingSupabaseEnv
      },
      dataAccess: {
        boundary: "REST API routes",
        supabaseClient: "server service role only",
        rls: "not used for MVP CRUD access"
      }
    },
    { status: missingSupabaseEnv.length === 0 ? 200 : 503 }
  );
}
