import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { applyAuthCookies, authenticateRequest } from "@/lib/db/auth";
import { listDocumentsForBot, uploadDocumentForBot } from "@/lib/db/documents";
import { ingestDocumentForBot } from "@/lib/db/knowledge";
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
    const documents = await listDocumentsForBot(account.activeWorkspace.id, botId);
    const response = NextResponse.json({ documents });

    return applyAuthCookies(response, cookiesToSet);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  try {
    const { botId } = await params;
    const { user, cookiesToSet } = await authenticateRequest(request);
    const account = await ensureAccountForUser(user);
    const document = await uploadDocumentForBot(
      account.activeWorkspace.id,
      botId,
      user.id,
      getUploadedFile(await request.formData())
    );
    const ingestedDocument = await ingestDocumentForBot(account.activeWorkspace.id, botId, document.id);
    const response = NextResponse.json({ document: ingestedDocument }, { status: 201 });

    return applyAuthCookies(response, cookiesToSet);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
