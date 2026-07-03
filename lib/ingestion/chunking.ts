import type { ExtractedTextSection } from "@/lib/ingestion/text-extraction";

const TARGET_CHUNK_CHARACTERS = 1200;
const CHUNK_OVERLAP_CHARACTERS = 180;

export type KnowledgeChunkInput = {
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
  tokenCount: number;
};

function estimateTokenCount(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

function splitSectionText(text: string) {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function pushChunk(chunks: KnowledgeChunkInput[], content: string, pageNumber: number | null) {
  const trimmed = content.trim();

  if (!trimmed) {
    return;
  }

  chunks.push({
    content: trimmed,
    chunkIndex: chunks.length,
    pageNumber,
    tokenCount: estimateTokenCount(trimmed)
  });
}

export function chunkExtractedText(sections: ExtractedTextSection[]) {
  const chunks: KnowledgeChunkInput[] = [];

  for (const section of sections) {
    let current = "";

    for (const paragraph of splitSectionText(section.text)) {
      if (paragraph.length > TARGET_CHUNK_CHARACTERS) {
        if (current) {
          pushChunk(chunks, current, section.pageNumber);
          current = "";
        }

        for (let start = 0; start < paragraph.length; start += TARGET_CHUNK_CHARACTERS - CHUNK_OVERLAP_CHARACTERS) {
          pushChunk(chunks, paragraph.slice(start, start + TARGET_CHUNK_CHARACTERS), section.pageNumber);
        }

        continue;
      }

      const next = current ? `${current}\n\n${paragraph}` : paragraph;

      if (next.length > TARGET_CHUNK_CHARACTERS) {
        pushChunk(chunks, current, section.pageNumber);
        const overlap = current.slice(-CHUNK_OVERLAP_CHARACTERS).trim();
        current = overlap ? `${overlap}\n\n${paragraph}` : paragraph;
      } else {
        current = next;
      }
    }

    pushChunk(chunks, current, section.pageNumber);
  }

  return chunks;
}
