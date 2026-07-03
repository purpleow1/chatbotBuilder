import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { applyAuthCookies, authenticateRequest } from "@/lib/db/auth";
import { searchBotKnowledge } from "@/lib/db/knowledge";
import { ensureAccountForUser } from "@/lib/db/onboarding";

export const runtime = "nodejs";

const retrievalTestSchema = z.object({
  query: z.string().trim().min(1, "Enter a query to search."),
  matchCount: z.coerce.number().int().min(1).max(10).default(5)
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  try {
    const { botId } = await params;
    const { searchParams } = new URL(request.url);
    const parsed = retrievalTestSchema.safeParse({
      query: searchParams.get("query"),
      matchCount: searchParams.get("matchCount") ?? undefined
    });

    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid retrieval test query.", "invalid_retrieval_test");
    }

    const { user, cookiesToSet } = await authenticateRequest(request);
    const account = await ensureAccountForUser(user);
    const matches = await searchBotKnowledge(
      account.activeWorkspace.id,
      botId,
      parsed.data.query,
      parsed.data.matchCount
    );
    const response = NextResponse.json({ matches });

    return applyAuthCookies(response, cookiesToSet);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
