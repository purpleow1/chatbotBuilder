"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fetchInternalApi, type ApiFetchResult } from "@/lib/api/server-fetch";
import type { BotRecord } from "@/lib/db/bots";
import type { SourceDocumentRecord } from "@/lib/db/documents";

type BotResponse = {
  bot: BotRecord;
};

type DocumentResponse = {
  document: SourceDocumentRecord;
};

function logInternalApiFailure(action: string, result: Extract<ApiFetchResult<unknown>, { ok: false }>) {
  console.error(`${action} failed.`, {
    status: result.status,
    error: result.error
  });
}

function getText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getWidgetSettingsPayload(formData: FormData) {
  const widgetSettings = {
    primaryColor: getText(formData, "widgetPrimaryColor"),
    launcherPosition: getText(formData, "widgetLauncherPosition"),
    welcomeMessage: getText(formData, "widgetWelcomeMessage"),
    botDisplayName: getText(formData, "widgetBotDisplayName"),
    botAvatarInitials: getText(formData, "widgetBotAvatarInitials")
  };
  const hasWidgetSettings = Object.values(widgetSettings).some((value) => value.length > 0);

  return hasWidgetSettings ? widgetSettings : undefined;
}

function getBotPayload(formData: FormData) {
  return {
    name: getText(formData, "name"),
    description: getText(formData, "description"),
    supportTone: getText(formData, "supportTone"),
    fallbackMessage: getText(formData, "fallbackMessage"),
    publicWidgetEnabled: formData.get("publicWidgetEnabled") === "on",
    widgetSettings: getWidgetSettingsPayload(formData)
  };
}

function errorParam(message: string) {
  return encodeURIComponent(message);
}

export async function createBot(formData: FormData) {
  const result = await fetchInternalApi<BotResponse>("/api/bots", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(getBotPayload(formData))
  });

  if (!result.ok) {
    logInternalApiFailure("Create bot", result);
    redirect(`/app/bots/new?error=${errorParam(result.error.message)}`);
  }

  revalidatePath("/app/bots");
  redirect(`/app/bots/${result.data.bot.id}?created=1`);
}

export async function updateBot(formData: FormData) {
  const botId = getText(formData, "botId");

  if (!botId) {
    redirect("/app/bots?error=Missing%20bot%20id.");
  }

  const result = await fetchInternalApi<BotResponse>(`/api/bots/${botId}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(getBotPayload(formData))
  });

  if (!result.ok) {
    logInternalApiFailure("Update bot", result);
    redirect(`/app/bots/${botId}?error=${errorParam(result.error.message)}`);
  }

  revalidatePath("/app/bots");
  revalidatePath(`/app/bots/${botId}`);
  redirect(`/app/bots/${botId}?saved=1`);
}

export async function deleteBot(formData: FormData) {
  const botId = getText(formData, "botId");

  if (!botId) {
    redirect("/app/bots?error=Missing%20bot%20id.");
  }

  const result = await fetchInternalApi<never>(`/api/bots/${botId}`, {
    method: "DELETE"
  });

  if (!result.ok) {
    logInternalApiFailure("Delete bot", result);
    redirect(`/app/bots/${botId}?error=${errorParam(result.error.message)}`);
  }

  revalidatePath("/app/bots");
  redirect("/app/bots?deleted=1");
}

export async function uploadDocument(formData: FormData) {
  const botId = getText(formData, "botId");

  if (!botId) {
    redirect("/app/bots?error=Missing%20bot%20id.");
  }

  const payload = new FormData();
  const file = formData.get("file");

  if (file) {
    payload.set("file", file);
  }

  const result = await fetchInternalApi<DocumentResponse>(`/api/bots/${botId}/documents`, {
    method: "POST",
    body: payload
  });

  if (!result.ok) {
    logInternalApiFailure("Upload document", result);
    redirect(`/app/bots/${botId}?error=${errorParam(result.error.message)}`);
  }

  revalidatePath("/app/bots");
  revalidatePath(`/app/bots/${botId}`);
  const uploadNotice = result.data.document.status === "ready" ? "documentIngested=1" : "documentUploaded=1";

  redirect(`/app/bots/${botId}?${uploadNotice}`);
}

export async function deleteDocument(formData: FormData) {
  const botId = getText(formData, "botId");
  const documentId = getText(formData, "documentId");

  if (!botId) {
    redirect("/app/bots?error=Missing%20bot%20id.");
  }

  if (!documentId) {
    redirect(`/app/bots/${botId}?error=Missing%20document%20id.`);
  }

  const result = await fetchInternalApi<never>(`/api/bots/${botId}/documents/${documentId}`, {
    method: "DELETE"
  });

  if (!result.ok) {
    logInternalApiFailure("Delete document", result);
    redirect(`/app/bots/${botId}?error=${errorParam(result.error.message)}`);
  }

  revalidatePath("/app/bots");
  revalidatePath(`/app/bots/${botId}`);
  redirect(`/app/bots/${botId}?documentDeleted=1`);
}

export async function retryDocumentIngestion(formData: FormData) {
  const botId = getText(formData, "botId");
  const documentId = getText(formData, "documentId");

  if (!botId) {
    redirect("/app/bots?error=Missing%20bot%20id.");
  }

  if (!documentId) {
    redirect(`/app/bots/${botId}?error=Missing%20document%20id.`);
  }

  const result = await fetchInternalApi<unknown>(`/api/bots/${botId}/documents/${documentId}/ingest`, {
    method: "POST"
  });

  if (!result.ok) {
    logInternalApiFailure("Retry document ingestion", result);
    redirect(`/app/bots/${botId}?error=${errorParam(result.error.message)}`);
  }

  revalidatePath("/app/bots");
  revalidatePath(`/app/bots/${botId}`);
  redirect(`/app/bots/${botId}?documentIngested=1`);
}
