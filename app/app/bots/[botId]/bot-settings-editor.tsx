"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, Palette, Save, Settings } from "lucide-react";
import { CopyWidgetScriptButton } from "@/app/app/bots/[botId]/copy-widget-script-button";
import { WidgetChatClient } from "@/app/widget/[botId]/widget-chat-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BotRecord } from "@/lib/db/bots";
import type { PublicWidgetConfig } from "@/lib/db/widget";
import type { WidgetSettings } from "@/lib/widget/settings";

type BotSettingsEditorProps = {
  bot: BotRecord;
  widgetSettings: WidgetSettings;
  canCustomizeWidgetTheme: boolean;
  embedSnippet: string;
  showWidgetBranding: boolean;
};

type BotApiResponse = {
  bot: BotRecord;
};

function getText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getWidgetSettingsFromForm(formData: FormData): WidgetSettings {
  return {
    primaryColor: getText(formData, "widgetPrimaryColor"),
    launcherPosition: getText(formData, "widgetLauncherPosition") as WidgetSettings["launcherPosition"],
    welcomeMessage: getText(formData, "widgetWelcomeMessage"),
    botDisplayName: getText(formData, "widgetBotDisplayName"),
    botAvatarInitials: getText(formData, "widgetBotAvatarInitials")
  };
}

function getApiErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: { message?: unknown } }).error;

    if (typeof error?.message === "string") {
      return error.message;
    }
  }

  return fallback;
}

export function BotSettingsEditor({
  bot,
  widgetSettings,
  canCustomizeWidgetTheme,
  embedSnippet,
  showWidgetBranding
}: BotSettingsEditorProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [previewWidget, setPreviewWidget] = useState<PublicWidgetConfig>(() => ({
    botId: bot.id,
    name: bot.name,
    description: bot.description,
    settings: widgetSettings,
    showBranding: showWidgetBranding
  }));
  const previewButtonLabel = isPreviewVisible ? "Update preview" : "Preview widget";
  const noticeClassName = error
    ? "border-destructive/30 bg-destructive/10 text-destructive"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";

  const previewKey = useMemo(
    () =>
      [
        previewWidget.name,
        previewWidget.description ?? "",
        previewWidget.settings.primaryColor,
        previewWidget.settings.botDisplayName,
        previewWidget.settings.botAvatarInitials,
        previewWidget.settings.welcomeMessage
      ].join(":"),
    [previewWidget]
  );

  function syncPreviewFromForm(formData: FormData) {
    setPreviewWidget({
      botId: bot.id,
      name: getText(formData, "name"),
      description: getText(formData, "description") || null,
      settings: getWidgetSettingsFromForm(formData),
      showBranding: showWidgetBranding
    });
    setIsPreviewVisible(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: getText(formData, "name"),
      description: getText(formData, "description"),
      supportTone: getText(formData, "supportTone"),
      fallbackMessage: getText(formData, "fallbackMessage"),
      sourceReferencesEnabled: formData.get("sourceReferencesEnabled") === "on",
      publicWidgetEnabled: formData.get("publicWidgetEnabled") === "on",
      widgetSettings: getWidgetSettingsFromForm(formData)
    };

    setIsSaving(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/bots/${bot.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const responsePayload = (await response.json().catch(() => null)) as BotApiResponse | unknown;

      if (!response.ok) {
        throw new Error(getApiErrorMessage(responsePayload, `Save failed with HTTP ${response.status}.`));
      }

      const nextBot = (responsePayload as BotApiResponse).bot;

      setPreviewWidget((current) => ({
        ...current,
        name: nextBot.name,
        description: nextBot.description,
        settings: payload.widgetSettings
      }));
      setNotice("Bot settings saved.");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Bot settings could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  function handlePreviewClick() {
    if (!formRef.current) {
      return;
    }

    syncPreviewFromForm(new FormData(formRef.current));
  }

  return (
    <div className="space-y-4">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="botId" value={bot.id} />
        {(notice || error) && <div className={`rounded-md border px-4 py-3 text-sm ${noticeClassName}`}>{error ?? notice}</div>}
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="size-5" />
                Profile
              </CardTitle>
              <CardDescription>These settings feed prompts and test chat behavior.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Bot name</Label>
                <Input id="name" name="name" defaultValue={bot.name} required minLength={2} maxLength={80} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description / purpose</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={bot.description ?? ""}
                  placeholder="Answer setup, billing, and product questions."
                  maxLength={320}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportTone">Support tone</Label>
                <Input
                  id="supportTone"
                  name="supportTone"
                  defaultValue={bot.support_tone ?? ""}
                  placeholder="Friendly and specific"
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fallbackMessage">Fallback message</Label>
                <Textarea
                  id="fallbackMessage"
                  name="fallbackMessage"
                  defaultValue={bot.fallback_message ?? ""}
                  placeholder="I do not know yet, but our team can help."
                  maxLength={240}
                />
              </div>
              <label className="flex flex-col gap-3 rounded-md border bg-muted/45 p-4 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <span className="block font-medium">Mention source files</span>
                  <span className="block text-sm text-muted-foreground">
                    Let the bot reference source filenames in answers when helpful.
                  </span>
                </span>
                <input
                  name="sourceReferencesEnabled"
                  type="checkbox"
                  className="size-5 accent-primary"
                  defaultChecked={bot.source_references_enabled}
                />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="size-5" />
                Widget
              </CardTitle>
              <CardDescription>Publish, style, preview, and embed this bot.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex flex-col gap-3 rounded-md border bg-muted/45 p-4 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <span className="block font-medium">Public widget</span>
                  <span className="block text-sm text-muted-foreground">Allow this bot to be embedded after setup.</span>
                </span>
                <input
                  name="publicWidgetEnabled"
                  type="checkbox"
                  className="size-5 accent-primary"
                  defaultChecked={bot.public_widget_enabled}
                />
              </label>

              <div className="grid gap-4 rounded-md border bg-muted/35 p-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="widgetBotDisplayName">Widget bot name</Label>
                  <Input
                    id="widgetBotDisplayName"
                    name="widgetBotDisplayName"
                    defaultValue={widgetSettings.botDisplayName}
                    maxLength={80}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="widgetBotAvatarInitials">Avatar initials</Label>
                  <Input
                    id="widgetBotAvatarInitials"
                    name="widgetBotAvatarInitials"
                    defaultValue={widgetSettings.botAvatarInitials}
                    maxLength={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="widgetPrimaryColor">Primary color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="widgetPrimaryColor"
                      name="widgetPrimaryColor"
                      type="color"
                      defaultValue={widgetSettings.primaryColor}
                      className="h-10 w-14 p-1"
                      aria-label="Widget primary color"
                      disabled={!canCustomizeWidgetTheme}
                    />
                    <Input
                      name={!canCustomizeWidgetTheme ? "widgetPrimaryColor" : undefined}
                      defaultValue={widgetSettings.primaryColor}
                      readOnly
                      aria-label="Selected widget primary color"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="widgetLauncherPosition">Launcher position</Label>
                  <select
                    id="widgetLauncherPosition"
                    name="widgetLauncherPosition"
                    defaultValue={widgetSettings.launcherPosition}
                    disabled={!canCustomizeWidgetTheme}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="bottom-right">Bottom right</option>
                    <option value="bottom-left">Bottom left</option>
                  </select>
                  {!canCustomizeWidgetTheme ? (
                    <input type="hidden" name="widgetLauncherPosition" value={widgetSettings.launcherPosition} />
                  ) : null}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="widgetWelcomeMessage">Welcome message</Label>
                  <Textarea
                    id="widgetWelcomeMessage"
                    name="widgetWelcomeMessage"
                    defaultValue={widgetSettings.welcomeMessage}
                    maxLength={180}
                  />
                </div>
              </div>

              {!canCustomizeWidgetTheme ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  Your plan uses the default widget color and launcher position. Upgrade to customize the theme.
                </div>
              ) : null}

              <div className="rounded-md border bg-muted p-3">
                <code className="break-all text-sm">{embedSnippet}</code>
              </div>
              <div className="flex flex-wrap gap-2">
                <CopyWidgetScriptButton script={embedSnippet} />
                <Button type="button" variant="outline" onClick={handlePreviewClick}>
                  <Eye className="size-4" />
                  {previewButtonLabel}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Save changes
            </>
          )}
        </Button>
      </form>

      {isPreviewVisible ? (
        <Card>
          <CardHeader>
            <CardTitle>Widget preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mx-auto max-w-md overflow-hidden rounded-md border bg-slate-100">
              <WidgetChatClient
                key={previewKey}
                widget={previewWidget}
                className="h-[620px] min-h-[520px] rounded-none shadow-none"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
