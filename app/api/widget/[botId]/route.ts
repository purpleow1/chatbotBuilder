import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse } from "@/lib/api/errors";
import { getPublicWidgetConfig } from "@/lib/db/widget";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  try {
    const { botId } = await params;
    const config = await getPublicWidgetConfig(botId);

    return NextResponse.json(
      {
        widget: config
      },
      {
        headers: corsHeaders
      }
    );
  } catch (error) {
    const response = apiErrorResponse(error);

    Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));

    return response;
  }
}
