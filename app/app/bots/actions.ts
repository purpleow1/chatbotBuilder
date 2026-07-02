"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fetchInternalApi } from "@/lib/api/server-fetch";
import type { BotRecord } from "@/lib/db/bots";

type BotResponse = {
  bot: BotRecord;
};

function getText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getBotPayload(formData: FormData) {
  return {
    name: getText(formData, "name"),
    description: getText(formData, "description"),
    supportTone: getText(formData, "supportTone"),
    fallbackMessage: getText(formData, "fallbackMessage"),
    publicWidgetEnabled: formData.get("publicWidgetEnabled") === "on"
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
    redirect(`/app/bots/${botId}?error=${errorParam(result.error.message)}`);
  }

  revalidatePath("/app/bots");
  redirect("/app/bots?deleted=1");
}

