"use client";

import { FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const router = useRouter();
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setIsUploading(true);

    try {
      const response = await fetch(`/api/bots/${botId}/documents`, {
        method: "POST",
        body: formData
      });
      const payload = (await response.json().catch(() => null)) as UploadResponse | null;

      if (!response.ok) {
        throw new Error(getUploadError(payload, response.status));
      }

      formRef.current?.reset();
      showToast({
        tone: payload?.document?.status === "ready" ? "success" : "info",
        title: payload?.document?.status === "ready" ? "Document ready" : "Document uploaded",
        description:
          payload?.document?.status === "ready"
            ? `${payload.document.file_name} was ingested and is ready for retrieval.`
            : `${payload?.document?.file_name ?? "The source file"} was uploaded. Check its status in the list.`
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
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-3 rounded-md border bg-muted/35 p-4 md:grid-cols-[1fr_auto]">
      <div className="space-y-2">
        <Label htmlFor="source-file">Source file</Label>
        <Input id="source-file" name="file" type="file" accept={acceptedExtensions} required disabled={isUploading || isRefreshing} />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={isUploading || isRefreshing}>
          {isUploading || isRefreshing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {isUploading ? "Uploading..." : isRefreshing ? "Updating..." : "Upload"}
        </Button>
      </div>
    </form>
  );
}
