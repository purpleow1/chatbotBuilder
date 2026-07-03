import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { applyAuthCookies, authenticateRequest } from "@/lib/db/auth";
import { getDocumentCapacityForBot, getDocumentForBot, listDocumentsForBot, uploadDocumentForBot } from "@/lib/db/documents";
import { ensureAccountForUser } from "@/lib/db/onboarding";

export const runtime = "nodejs";

function getUploadedFile(formData: FormData) {
  const value = formData.get("file");

  if (!(value instanceof File)) {
    throw new ApiError(400, "Choose a file before uploading.", "missing_source_file");
  }

  return value;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  try {
    const { botId } = await params;
    const { user, cookiesToSet } = await authenticateRequest(request);
    const account = await ensureAccountForUser(user);
    const [documents, capacity] = await Promise.all([
      listDocumentsForBot(account.activeWorkspace.id, botId),
      getDocumentCapacityForBot(account.activeWorkspace.id, botId)
    ]);
    const response = NextResponse.json({ documents, capacity });

    return applyAuthCookies(response, cookiesToSet);
  } catch (error) {
    return apiErrorResponse(error, "GET /api/bots/[botId]/documents");
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  try {
    const { botId } = await params;
    const { user, cookiesToSet } = await authenticateRequest(request);
    const account = await ensureAccountForUser(user);
    console.info("Document upload request received.", {
      botId,
      workspaceId: account.activeWorkspace.id,
      userId: user.id
    });
    const document = await uploadDocumentForBot(
      account.activeWorkspace.id,
      botId,
      user.id,
      getUploadedFile(await request.formData())
    );
    const { ingestDocumentForBot } = await import("@/lib/db/knowledge");

    let responseDocument = document;

    try {
      responseDocument = await ingestDocumentForBot(account.activeWorkspace.id, botId, document.id);
    } catch (ingestionError) {
      console.error("Upload succeeded, but immediate document ingestion failed.", {
        botId,
        documentId: document.id,
        error: ingestionError
      });
      responseDocument = await getDocumentForBot(account.activeWorkspace.id, botId, document.id);
    }

    const response = NextResponse.json({ document: responseDocument }, { status: 201 });

    return applyAuthCookies(response, cookiesToSet);
  } catch (error) {
    return apiErrorResponse(error, "POST /api/bots/[botId]/documents");
  }
}
