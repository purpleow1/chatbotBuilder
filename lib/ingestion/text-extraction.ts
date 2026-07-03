import "server-only";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { ApiError } from "@/lib/api/errors";
import { getFileExtension } from "@/lib/api/document-validation";

export type ExtractedTextSection = {
  text: string;
  pageNumber: number | null;
};

function normalizeText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdfSections(buffer: Buffer): Promise<ExtractedTextSection[]> {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const pages = result.pages
      .map((page) => ({
        text: normalizeText(page.text),
        pageNumber: page.num
      }))
      .filter((page) => page.text.length > 0);

    return pages.length > 0 ? pages : [{ text: normalizeText(result.text), pageNumber: null }];
  } finally {
    await parser.destroy();
  }
}

async function extractDocxSections(buffer: Buffer): Promise<ExtractedTextSection[]> {
  const result = await mammoth.extractRawText({ buffer });

  return [
    {
      text: normalizeText(result.value),
      pageNumber: null
    }
  ];
}

export async function extractTextSectionsFromSource(
  buffer: Buffer,
  fileName: string,
  mimeType: string | null
): Promise<ExtractedTextSection[]> {
  const extension = getFileExtension(fileName);

  if (extension === ".pdf" || mimeType === "application/pdf") {
    return extractPdfSections(buffer);
  }

  if (
    extension === ".docx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractDocxSections(buffer);
  }

  if (extension === ".txt" || extension === ".md" || extension === ".csv" || mimeType?.startsWith("text/")) {
    return [
      {
        text: normalizeText(buffer.toString("utf8")),
        pageNumber: null
      }
    ];
  }

  throw new ApiError(400, "This source file type is not supported for ingestion.", "unsupported_ingestion_type");
}
