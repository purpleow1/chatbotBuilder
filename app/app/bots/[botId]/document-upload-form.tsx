"use client";

import { DragEvent, FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip, Send, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast-provider";

type DocumentUploadFormProps = {
  acceptedExtensions: string;
  botId: string;
};

type UploadResponse = {
  document?: {
    file_name: string;
    status: string;
  };
  error?: {
    message?: string;
  };
};

function getUploadError(payload: UploadResponse | null, status: number) {
  return payload?.error?.message ?? `Upload failed with HTTP ${status}.`;
}

export function DocumentUploadForm({ acceptedExtensions, botId }: DocumentUploadFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { showToast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const isBusy = isUploading || isRefreshing;

  function selectFile(fileList: FileList | null) {
    setSelectedFiles(fileList ? Array.from(fileList) : []);
  }

  function removeFile(fileToRemove: File) {
    setSelectedFiles((files) =>
      files.filter((file) => file.name !== fileToRemove.name || file.lastModified !== fileToRemove.lastModified)
    );
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();

    if (!isBusy) {
      setIsDragging(true);
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (!isBusy) {
      selectFile(event.dataTransfer.files);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedFiles.length === 0) {
      showToast({
        tone: "error",
        title: "Choose files",
        description: "Select one or more source files before submitting."
      });
      return;
    }

    setIsUploading(true);

    try {
      const uploadedDocuments: NonNullable<UploadResponse["document"]>[] = [];

      for (const file of selectedFiles) {
        const formData = new FormData();

        formData.set("file", file);

        const response = await fetch(`/api/bots/${botId}/documents`, {
          method: "POST",
          body: formData
        });
        const payload = (await response.json().catch(() => null)) as UploadResponse | null;

        if (!response.ok) {
          throw new Error(getUploadError(payload, response.status));
        }

        if (payload?.document) {
          uploadedDocuments.push(payload.document);
        }
      }

      formRef.current?.reset();
      setSelectedFiles([]);
      const readyDocuments = uploadedDocuments.filter((document) => document.status === "ready").length;
      showToast({
        tone: readyDocuments === uploadedDocuments.length ? "success" : "info",
        title: uploadedDocuments.length === 1 ? "Document uploaded" : "Documents uploaded",
        description:
          uploadedDocuments.length === 1
            ? `${uploadedDocuments[0]?.file_name ?? "The source file"} was uploaded. Check its status in the list.`
            : `${uploadedDocuments.length} source files were uploaded. ${readyDocuments} ready for retrieval.`
      });
      startRefresh(() => router.refresh());
    } catch (error) {
      showToast({
        tone: "error",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "The source file could not be uploaded."
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="rounded-md border bg-muted/35 p-4">
      <input
        ref={inputRef}
        id="source-file"
        type="file"
        accept={acceptedExtensions}
        multiple
        className="sr-only"
        disabled={isBusy}
        onChange={(event) => selectFile(event.target.files)}
      />
      <label
        htmlFor="source-file"
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-background px-4 py-8 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/45"
        } ${isBusy ? "pointer-events-none opacity-60" : ""}`}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UploadCloud className="size-5" />
        </span>
        <span className="text-sm font-medium">Drop source files</span>
        <span className="text-xs text-muted-foreground">{acceptedExtensions}</span>
      </label>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-h-9 min-w-0 flex-wrap items-center gap-2">
          {selectedFiles.length > 0 ? (
            selectedFiles.map((file) => (
              <span
                key={`${file.name}-${file.lastModified}`}
                className="inline-flex max-w-full items-center gap-2 rounded-full border bg-background py-1 pl-3 pr-1 text-sm text-foreground"
              >
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={isBusy}
                  onClick={() => removeFile(file)}
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No files selected</p>
          )}
        </div>
        <div className="flex gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Attach source file"
            title="Attach source file"
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
          >
            <Paperclip className="size-4" />
          </Button>
          <Button type="submit" disabled={isBusy || selectedFiles.length === 0}>
            {isBusy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {isUploading ? "Submitting..." : isRefreshing ? "Updating..." : "Submit"}
          </Button>
        </div>
      </div>
    </form>
  );
}
