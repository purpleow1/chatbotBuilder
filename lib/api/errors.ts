import { NextResponse } from "next/server";
import { SupabaseConfigError } from "@/lib/supabase/config";

function serializeError(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return error;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = "api_error",
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiErrorResponse(error: unknown, context?: string) {
  const serializedError = serializeError(error);

  console.error(context ? `API error in ${context}` : "API error", serializedError);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details
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
          missing: error.missing,
          details: serializedError
        }
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "internal_server_error",
        message: error instanceof Error ? error.message : "Unexpected server error.",
        details: serializedError
      }
    },
    { status: 500 }
  );
}
