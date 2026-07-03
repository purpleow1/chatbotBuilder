import { z } from "zod";

export const widgetPositionSchema = z.enum(["bottom-right", "bottom-left"]);

export const widgetSettingsSchema = z.object({
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex color."),
  launcherPosition: widgetPositionSchema,
  welcomeMessage: z.string().trim().min(1).max(180),
  botDisplayName: z.string().trim().min(1).max(80),
  botAvatarInitials: z.string().trim().min(1).max(3)
});

export type WidgetSettings = z.infer<typeof widgetSettingsSchema>;

export const defaultWidgetSettings: WidgetSettings = {
  primaryColor: "#2563eb",
  launcherPosition: "bottom-right",
  welcomeMessage: "Hi. Ask me anything from our knowledge base.",
  botDisplayName: "Support assistant",
  botAvatarInitials: "AI"
};

export function normalizeWidgetSettings(value: unknown, botName?: string | null): WidgetSettings {
  const fallback = {
    ...defaultWidgetSettings,
    botDisplayName: botName?.trim() || defaultWidgetSettings.botDisplayName,
    botAvatarInitials: getInitials(botName)
  };
  const parsed = widgetSettingsSchema.partial().safeParse(value);

  if (!parsed.success) {
    return fallback;
  }

  return widgetSettingsSchema.parse({
    ...fallback,
    ...parsed.data
  });
}

export function getInitials(value?: string | null) {
  const words = value
    ?.trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!words || words.length === 0) {
    return defaultWidgetSettings.botAvatarInitials;
  }

  return words.map((word) => word[0]).join("").toUpperCase().slice(0, 3);
}
