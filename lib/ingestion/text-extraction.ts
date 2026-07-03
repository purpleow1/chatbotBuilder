import "server-only";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import mammoth from "mammoth";
import { ApiError } from "@/lib/api/errors";
import { getFileExtension } from "@/lib/api/document-validation";

export type ExtractedTextSection = {
  text: string;
  pageNumber: number | null;
};

type PdfParseConstructor = new (options: { data: Buffer }) => {
  getText: () => Promise<{
    text: string;
    pages: Array<{
      text: string;
      num: number;
    }>;
  }>;
  destroy: () => Promise<void>;
};

type PdfWorkerModule = {
  WorkerMessageHandler: unknown;
};

type CanvasDomPolyfills = {
  DOMMatrix: typeof DOMMatrix;
  ImageData: typeof ImageData;
  Path2D: typeof Path2D;
};

const requirePdfParse = createRequire(import.meta.url);
let pdfWorkerConfigured = false;
let pdfDomPolyfillsConfigured = false;

function getPdfWorkerUrl() {
  const workerPath = path.join(process.cwd(), "node_modules", "pdf-parse", "dist", "worker", "pdf.worker.mjs");

  return pathToFileURL(workerPath).href;
}

function configurePdfDomPolyfills() {
  if (pdfDomPolyfillsConfigured) {
    return;
  }

  const canvas = requirePdfParse("@napi-rs/canvas") as CanvasDomPolyfills;
  const writableGlobal = globalThis as typeof globalThis & Partial<CanvasDomPolyfills>;

  writableGlobal.DOMMatrix ??= canvas.DOMMatrix;
  writableGlobal.ImageData ??= canvas.ImageData;
  writableGlobal.Path2D ??= canvas.Path2D;
  pdfDomPolyfillsConfigured = true;
}

async function configurePdfWorker() {
  if (pdfWorkerConfigured) {
    return;
  }

  const importWorker = new Function("specifier", "return import(specifier)") as (
    specifier: string
  ) => Promise<PdfWorkerModule>;
  const workerModule = await importWorker(getPdfWorkerUrl());

  (globalThis as typeof globalThis & { pdfjsWorker?: PdfWorkerModule }).pdfjsWorker = workerModule;
  pdfWorkerConfigured = true;
}

function normalizeText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdfSections(buffer: Buffer): Promise<ExtractedTextSection[]> {
  configurePdfDomPolyfills();
  await configurePdfWorker();

  const { PDFParse } = requirePdfParse("pdf-parse") as { PDFParse: PdfParseConstructor };

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
