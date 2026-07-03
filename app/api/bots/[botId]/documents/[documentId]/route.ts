import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { documentIdSchema } from "@/lib/api/document-validation";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { applyAuthCookies, authenticateRequest } from "@/lib/db/auth";
import { deleteDocumentForBot } from "@/lib/db/documents";
import { ensureAccountForUser } from "@/lib/db/onboarding";

export const runtime = "nodejs";

function validationError(error: ZodError) {
  return new ApiError(400, error.issues[0]?.message ?? "Document id is invalid.", "invalid_document_id");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string; documentId: string }> }
) {
  try {
    const { botId, documentId } = await params;
    const parsedDocumentId = documentIdSchema.safeParse(documentId);

    if (!parsedDocumentId.success) {
      throw validationError(parsedDocumentId.error);
    }

    const { user, cookiesToSet } = await authenticateRequest(request);
    const account = await ensureAccountForUser(user);

    await deleteDocumentForBot(account.activeWorkspace.id, botId, parsedDocumentId.data);

    const response = new NextResponse(null, { status: 204 });

    return applyAuthCookies(response, cookiesToSet);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
