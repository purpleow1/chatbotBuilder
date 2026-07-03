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

function asMetadata(value: Json): SourceDocumentMetadata {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Document ingestion failed.";
}

async function failDocument(workspaceId: string, botId: string, documentId: string, error: unknown) {
  const supabase = getSupabaseServiceClient();
  await supabase
    .from("documents")
    .update({
      status: "failed",
      error_message: getErrorMessage(error),
      processed_at: new Date().toISOString()
    })
    .eq("workspace_id", workspaceId)
    .eq("bot_id", botId)
    .eq("id", documentId);
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
    await supabase
      .from("documents")
      .update({ status: "processing", error_message: null })
      .eq("workspace_id", workspaceId)
      .eq("bot_id", botId)
      .eq("id", document.id);

    const { data: file, error: downloadError } = await supabase.storage
      .from(SOURCE_DOCUMENTS_BUCKET)
      .download(document.storage_path);

    if (downloadError) {
      throw new ApiError(500, `Could not download the source file: ${downloadError.message}`, "storage_download_failed");
    }

    const sections = await extractTextSectionsFromSource(Buffer.from(await file.arrayBuffer()), document.file_name, document.mime_type);
    const chunks = chunkExtractedText(sections);

    if (chunks.length === 0) {
      throw new ApiError(400, "No readable text was found in this document.", "empty_document_text");
    }

    const { error: deleteChunksError } = await supabase
      .from("document_chunks")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("bot_id", botId)
      .eq("document_id", document.id);

    if (deleteChunksError) {
      throw deleteChunksError;
    }

    const chunkRows = [];

    for (const chunk of chunks) {
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

    const { error: insertChunksError } = await supabase.from("document_chunks").insert(chunkRows);

    if (insertChunksError) {
      throw insertChunksError;
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
      throw updateError;
    }

    await supabase.from("usage_events").insert([
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
        metadata: {
          documentId: document.id,
          chunkCount: chunks.length
        }
      }
    ]);

    return updatedDocument;
  } catch (error) {
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
