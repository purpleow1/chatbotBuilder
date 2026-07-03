import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse } from "@/lib/api/errors";
import { applyAuthCookies, authenticateRequest } from "@/lib/db/auth";
import { ingestDocumentForBot } from "@/lib/db/knowledge";
import { ensureAccountForUser } from "@/lib/db/onboarding";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string; documentId: string }> }
) {
  try {
    const { botId, documentId } = await params;
    const { user, cookiesToSet } = await authenticateRequest(request);
    const account = await ensureAccountForUser(user);
    console.info("Document ingestion retry request received.", {
      botId,
      documentId,
      workspaceId: account.activeWorkspace.id,
      userId: user.id
    });
    const document = await ingestDocumentForBot(account.activeWorkspace.id, botId, documentId);
    const response = NextResponse.json({ document });

    return applyAuthCookies(response, cookiesToSet);
  } catch (error) {
    return apiErrorResponse(error, "POST /api/bots/[botId]/documents/[documentId]/ingest");
  }
}
