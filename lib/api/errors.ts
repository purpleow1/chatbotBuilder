import { NextResponse } from "next/server";
import { SupabaseConfigError } from "@/lib/supabase/service";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = "api_error"
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message
        }
      },
      { status: error.status }
    );
  }

  if (error instanceof SupabaseConfigError) {
    return NextResponse.json(
      {
        error: {
          code: "supabase_not_configured",
          message: error.message,
          missing: error.missing
        }
      },
      { status: 503 }
    );
  }

  console.error(error);

  return NextResponse.json(
    {
      error: {
        code: "internal_server_error",
        message: "Unexpected server error."
      }
    },
    { status: 500 }
  );
}
