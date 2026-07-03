import "server-only";
import { ApiError } from "@/lib/api/errors";
import {
  MAX_SOURCE_DOCUMENT_BYTES,
  SOURCE_DOCUMENTS_BUCKET,
  getSourceMimeType,
  validateSourceFile
} from "@/lib/api/document-validation";
import type { DocumentStatus, Json, SubscriptionPlan } from "@/lib/db/database.types";
import { getBotForWorkspace } from "@/lib/db/bots";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export const documentColumns =
  "id, workspace_id, bot_id, uploaded_by, file_name, storage_path, mime_type, size_bytes, status, error_message, metadata, created_at, updated_at, processed_at";

export type SourceDocumentRecord = {
  id: string;
  workspace_id: string;
  bot_id: string;
  uploaded_by: string | null;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number;
  status: DocumentStatus;
  error_message: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
};

export type DocumentCapacity = {
  plan: SubscriptionPlan;
  document_limit: number;
  used: number;
  can_upload: boolean;
};

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/[/\\]/g, "-")
    .replace(/[^a-zA-Z0-9._ -]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 120);
}

export async function getDocumentCapacityForBot(workspaceId: string, botId: string): Promise<DocumentCapacity> {
  return getDocumentCapacity(workspaceId, botId);
}

async function getDocumentCapacity(workspaceId: string, botId: string): Promise<DocumentCapacity> {
  const supabase = getSupabaseServiceClient();
  const [{ count, error: countError }, { data: subscription, error: subscriptionError }] = await Promise.all([
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("bot_id", botId),
    supabase.from("subscriptions").select("plan, document_limit").eq("workspace_id", workspaceId).maybeSingle()
  ]);

  if (countError) {
    throw countError;
  }

  if (subscriptionError) {
    throw subscriptionError;
  }

  const used = count ?? 0;
  const documentLimit = subscription?.document_limit ?? 5;

  return {
    plan: subscription?.plan ?? "free",
    document_limit: documentLimit,
    used,
    can_upload: used < documentLimit
  };
}

export async function listDocumentsForBot(workspaceId: string, botId: string): Promise<SourceDocumentRecord[]> {
  await getBotForWorkspace(workspaceId, botId);

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("documents")
    .select(documentColumns)
    .eq("workspace_id", workspaceId)
    .eq("bot_id", botId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function getDocumentForBot(
  workspaceId: string,
  botId: string,
  documentId: string
): Promise<SourceDocumentRecord> {
  await getBotForWorkspace(workspaceId, botId);

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("documents")
    .select(documentColumns)
    .eq("workspace_id", workspaceId)
    .eq("bot_id", botId)
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new ApiError(404, "Document not found.", "document_not_found");
  }

  return data;
}

export async function uploadDocumentForBot(
  workspaceId: string,
  botId: string,
  userId: string,
  file: File
): Promise<SourceDocumentRecord> {
  await getBotForWorkspace(workspaceId, botId);

  const validationMessage = validateSourceFile(file);

  if (validationMessage) {
    throw new ApiError(400, validationMessage, "invalid_source_file");
  }

  const capacity = await getDocumentCapacity(workspaceId, botId);

  if (!capacity.can_upload) {
    throw new ApiError(
      403,
      `Your ${capacity.plan} plan includes ${capacity.document_limit} document${capacity.document_limit === 1 ? "" : "s"} per bot. Upgrade to upload more.`,
      "document_limit_reached"
    );
  }

  const safeFileName = sanitizeFileName(file.name) || "source-document";
  const storagePath = `${workspaceId}/${botId}/${crypto.randomUUID()}-${safeFileName}`;
  const supabase = getSupabaseServiceClient();
  const { error: uploadError } = await supabase.storage.from(SOURCE_DOCUMENTS_BUCKET).upload(storagePath, file, {
    contentType: getSourceMimeType(file.name, file.type || undefined),
    upsert: false
  });

  if (uploadError) {
    throw new ApiError(500, `Could not store the file in Supabase Storage: ${uploadError.message}`, "storage_upload_failed");
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      workspace_id: workspaceId,
      bot_id: botId,
      uploaded_by: userId,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: getSourceMimeType(file.name, file.type || undefined),
      size_bytes: file.size,
      status: "queued",
      metadata: {
        originalName: file.name,
        maxBytes: MAX_SOURCE_DOCUMENT_BYTES
      }
    })
    .select(documentColumns)
    .single();

  if (error) {
    await supabase.storage.from(SOURCE_DOCUMENTS_BUCKET).remove([storagePath]);
    throw error;
  }

  await supabase.from("usage_events").insert({
    workspace_id: workspaceId,
    bot_id: botId,
    event_type: "document_uploaded",
    quantity: 1,
    metadata: {
      documentId: data.id,
      fileName: file.name,
      sizeBytes: file.size
    }
  });

  return data;
}

export async function deleteDocumentForBot(workspaceId: string, botId: string, documentId: string) {
  await getBotForWorkspace(workspaceId, botId);

  const supabase = getSupabaseServiceClient();
  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, storage_path")
    .eq("workspace_id", workspaceId)
    .eq("bot_id", botId)
    .eq("id", documentId)
    .maybeSingle();

  if (documentError) {
    throw documentError;
  }

  if (!document) {
    throw new ApiError(404, "Document not found.", "document_not_found");
  }

  const { error: chunksError } = await supabase
    .from("document_chunks")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("bot_id", botId)
    .eq("document_id", document.id);

  if (chunksError) {
    throw chunksError;
  }

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("bot_id", botId)
    .eq("id", document.id);

  if (deleteError) {
    throw deleteError;
  }

  const { error: storageError } = await supabase.storage.from(SOURCE_DOCUMENTS_BUCKET).remove([document.storage_path]);

  if (storageError) {
    throw new ApiError(500, `Document row was removed, but storage cleanup failed: ${storageError.message}`, "storage_delete_failed");
  }
}
