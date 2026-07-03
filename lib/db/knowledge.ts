import "server-only";
import { ApiError } from "@/lib/api/errors";
import { SOURCE_DOCUMENTS_BUCKET } from "@/lib/api/document-validation";
import {
  GEMINI_EMBEDDING_DIMENSIONS,
  GEMINI_EMBEDDING_MODEL,
  generateGeminiEmbedding,
  toPgVector
} from "@/lib/ai/gemini";
import { getBotForWorkspace } from "@/lib/db/bots";
import type { Json } from "@/lib/db/database.types";
import { documentColumns, type SourceDocumentRecord } from "@/lib/db/documents";
import { chunkExtractedText } from "@/lib/ingestion/chunking";
import { extractTextSectionsFromSource } from "@/lib/ingestion/text-extraction";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export type KnowledgeSearchMatch = {
  id: string;
  document_id: string;
  file_name: string | null;
  content: string;
  chunk_index: number;
  page_number: number | null;
  metadata: Json;
  similarity: number;
};

type SourceDocumentMetadata = Record<string, Json | undefined>;

function logIngestionStep(message: string, details: Record<string, unknown>) {
  console.info(`Document ingestion: ${message}`, details);
}

function getSupabaseErrorMessage(operation: string, error: { message?: string }) {
  return `${operation} failed${error.message ? `: ${error.message}` : "."}`;
}

function asMetadata(value: Json): SourceDocumentMetadata {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Document ingestion failed.";
}

async function failDocument(workspaceId: string, botId: string, documentId: string, error: unknown) {
  const supabase = getSupabaseServiceClient();
  const { error: updateError } = await supabase
    .from("documents")
    .update({
      status: "failed",
      error_message: getErrorMessage(error),
      processed_at: new Date().toISOString()
    })
    .eq("workspace_id", workspaceId)
    .eq("bot_id", botId)
    .eq("id", documentId);

  if (updateError) {
    console.error("Failed to persist document ingestion error.", updateError);
    throw updateError;
  }
}

async function getDocumentForIngestion(workspaceId: string, botId: string, documentId: string) {
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

export async function ingestDocumentForBot(workspaceId: string, botId: string, documentId: string): Promise<SourceDocumentRecord> {
  await getBotForWorkspace(workspaceId, botId);

  const supabase = getSupabaseServiceClient();
  const document = await getDocumentForIngestion(workspaceId, botId, documentId);

  try {
    logIngestionStep("starting", {
      workspaceId,
      botId,
      documentId: document.id,
      fileName: document.file_name,
      storagePath: document.storage_path,
      mimeType: document.mime_type,
      sizeBytes: document.size_bytes,
      previousStatus: document.status
    });

    const { error: processingError } = await supabase
      .from("documents")
      .update({ status: "processing", error_message: null })
      .eq("workspace_id", workspaceId)
      .eq("bot_id", botId)
      .eq("id", document.id);

    if (processingError) {
      throw new ApiError(500, getSupabaseErrorMessage("Marking document as processing", processingError), "document_status_update_failed", {
        operation: "documents.update.processing",
        error: processingError
      });
    }

    logIngestionStep("downloading source file", {
      documentId: document.id,
      bucket: SOURCE_DOCUMENTS_BUCKET,
      storagePath: document.storage_path
    });

    const { data: file, error: downloadError } = await supabase.storage
      .from(SOURCE_DOCUMENTS_BUCKET)
      .download(document.storage_path);

    if (downloadError) {
      throw new ApiError(500, `Could not download the source file: ${downloadError.message}`, "storage_download_failed", {
        bucket: SOURCE_DOCUMENTS_BUCKET,
        storagePath: document.storage_path,
        error: downloadError
      });
    }

    logIngestionStep("extracting text", {
      documentId: document.id,
      fileName: document.file_name,
      mimeType: document.mime_type
    });

    const sections = await extractTextSectionsFromSource(Buffer.from(await file.arrayBuffer()), document.file_name, document.mime_type);
    const chunks = chunkExtractedText(sections);

    logIngestionStep("text extracted and chunked", {
      documentId: document.id,
      sectionCount: sections.length,
      chunkCount: chunks.length,
      totalCharacters: sections.reduce((sum, section) => sum + section.text.length, 0)
    });

    if (chunks.length === 0) {
      throw new ApiError(400, "No readable text was found in this document.", "empty_document_text");
    }

    logIngestionStep("deleting previous chunks", {
      documentId: document.id
    });

    const { error: deleteChunksError } = await supabase
      .from("document_chunks")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("bot_id", botId)
      .eq("document_id", document.id);

    if (deleteChunksError) {
      throw new ApiError(500, getSupabaseErrorMessage("Deleting previous document chunks", deleteChunksError), "document_chunks_delete_failed", {
        operation: "document_chunks.delete",
        error: deleteChunksError
      });
    }

    const chunkRows = [];

    for (const chunk of chunks) {
      logIngestionStep("embedding chunk", {
        documentId: document.id,
        chunkIndex: chunk.chunkIndex,
        tokenCount: chunk.tokenCount,
        characterCount: chunk.content.length
      });
      const embedding = await generateGeminiEmbedding(chunk.content, "document", document.file_name);
      chunkRows.push({
        workspace_id: workspaceId,
        bot_id: botId,
        document_id: document.id,
        chunk_index: chunk.chunkIndex,
        content: chunk.content,
        token_count: chunk.tokenCount,
        page_number: chunk.pageNumber,
        embedding: toPgVector(embedding),
        embedding_model: GEMINI_EMBEDDING_MODEL,
        metadata: {
          sourceDocumentId: document.id,
          fileName: document.file_name,
          chunkIndex: chunk.chunkIndex,
          pageNumber: chunk.pageNumber
        }
      });
    }

    logIngestionStep("inserting chunks", {
      documentId: document.id,
      chunkCount: chunkRows.length,
      embeddingModel: GEMINI_EMBEDDING_MODEL,
      embeddingDimensions: GEMINI_EMBEDDING_DIMENSIONS
    });

    const { error: insertChunksError } = await supabase.from("document_chunks").insert(chunkRows);

    if (insertChunksError) {
      throw new ApiError(500, getSupabaseErrorMessage("Inserting document chunks", insertChunksError), "document_chunks_insert_failed", {
        operation: "document_chunks.insert",
        chunkCount: chunkRows.length,
        error: insertChunksError
      });
    }

    const metadata = {
      ...asMetadata(document.metadata),
      chunkCount: chunks.length,
      embeddingModel: GEMINI_EMBEDDING_MODEL,
      embeddingDimensions: GEMINI_EMBEDDING_DIMENSIONS
    };
    const { data: updatedDocument, error: updateError } = await supabase
      .from("documents")
      .update({
        status: "ready",
        error_message: null,
        metadata,
        processed_at: new Date().toISOString()
      })
      .eq("workspace_id", workspaceId)
      .eq("bot_id", botId)
      .eq("id", document.id)
      .select(documentColumns)
      .single();

    if (updateError) {
      throw new ApiError(500, getSupabaseErrorMessage("Marking document as ready", updateError), "document_status_update_failed", {
        operation: "documents.update.ready",
        error: updateError
      });
    }

    const { error: usageError } = await supabase.from("usage_events").insert([
      {
        workspace_id: workspaceId,
        bot_id: botId,
        event_type: "embedding_generated",
        quantity: chunks.length,
        metadata: {
          documentId: document.id,
          embeddingModel: GEMINI_EMBEDDING_MODEL
        }
      },
      {
        workspace_id: workspaceId,
        bot_id: botId,
        event_type: "document_ingested",
        quantity: 1,
        metadata: {
          documentId: document.id,
          chunkCount: chunks.length
        }
      }
    ]);

    if (usageError) {
      throw new ApiError(500, getSupabaseErrorMessage("Recording ingestion usage events", usageError), "usage_events_insert_failed", {
        operation: "usage_events.insert",
        error: usageError
      });
    }

    logIngestionStep("completed", {
      documentId: document.id,
      chunkCount: chunks.length
    });

    return updatedDocument;
  } catch (error) {
    console.error("Document ingestion failed.", error);
    await failDocument(workspaceId, botId, document.id, error);
    throw error;
  }
}

export async function searchBotKnowledge(workspaceId: string, botId: string, query: string, matchCount = 5) {
  await getBotForWorkspace(workspaceId, botId);

  if (!query.trim()) {
    throw new ApiError(400, "Enter a search query.", "missing_search_query");
  }

  const supabase = getSupabaseServiceClient();
  const embedding = await generateGeminiEmbedding(query, "query");
  const { data, error } = await supabase.rpc("match_document_chunks", {
    target_workspace_id: workspaceId,
    target_bot_id: botId,
    query_embedding: toPgVector(embedding),
    match_count: Math.min(Math.max(matchCount, 1), 10),
    similarity_threshold: 0
  });

  if (error) {
    throw error;
  }

  const documentIds = [...new Set(data.map((match) => match.document_id))];
  const fileNames = new Map<string, string>();

  if (documentIds.length > 0) {
    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select("id, file_name")
      .eq("workspace_id", workspaceId)
      .eq("bot_id", botId)
      .in("id", documentIds);

    if (documentsError) {
      throw documentsError;
    }

    documents.forEach((document) => fileNames.set(document.id, document.file_name));
  }

  return data.map((match): KnowledgeSearchMatch => ({
    ...match,
    file_name: fileNames.get(match.document_id) ?? null
  }));
}
