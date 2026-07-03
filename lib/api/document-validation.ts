import { z } from "zod";

export const SOURCE_DOCUMENTS_BUCKET = "source-documents";
export const MAX_SOURCE_DOCUMENT_BYTES = 10 * 1024 * 1024;

export const SUPPORTED_SOURCE_EXTENSIONS = [".txt", ".md", ".pdf", ".docx", ".csv"] as const;

export const SUPPORTED_SOURCE_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel"
] as const;

const extensionSet = new Set<string>(SUPPORTED_SOURCE_EXTENSIONS);
const mimeTypeSet = new Set<string>(SUPPORTED_SOURCE_MIME_TYPES);
const mimeTypeByExtension: Record<(typeof SUPPORTED_SOURCE_EXTENSIONS)[number], (typeof SUPPORTED_SOURCE_MIME_TYPES)[number]> = {
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".csv": "text/csv"
};

export const documentIdSchema = z.string().uuid("Document id is invalid.");

export function getFileExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const dotIndex = normalized.lastIndexOf(".");

  return dotIndex >= 0 ? normalized.slice(dotIndex) : "";
}

export function formatFileSize(bytes: number) {
  const megabytes = bytes / (1024 * 1024);

  return `${megabytes.toLocaleString("en", { maximumFractionDigits: 0 })} MB`;
}

export function getSourceMimeType(fileName: string, fallback = "application/octet-stream") {
  const extension = getFileExtension(fileName);

  if (extensionSet.has(extension as (typeof SUPPORTED_SOURCE_EXTENSIONS)[number])) {
    return mimeTypeByExtension[extension as (typeof SUPPORTED_SOURCE_EXTENSIONS)[number]];
  }

  return fallback;
}

export function validateSourceFile(file: File) {
  const extension = getFileExtension(file.name);
  const hasSupportedExtension = extensionSet.has(extension as (typeof SUPPORTED_SOURCE_EXTENSIONS)[number]);
  const hasSupportedMimeType =
    file.type.length === 0 ||
    file.type === "application/octet-stream" ||
    mimeTypeSet.has(file.type as (typeof SUPPORTED_SOURCE_MIME_TYPES)[number]);

  if (!file.name.trim()) {
    return "Choose a file before uploading.";
  }

  if (file.size <= 0) {
    return "The selected file is empty.";
  }

  if (file.size > MAX_SOURCE_DOCUMENT_BYTES) {
    return `Files must be ${formatFileSize(MAX_SOURCE_DOCUMENT_BYTES)} or smaller.`;
  }

  if (!hasSupportedExtension || !hasSupportedMimeType) {
    return `Upload ${SUPPORTED_SOURCE_EXTENSIONS.join(", ")} files only.`;
  }

  return null;
}
