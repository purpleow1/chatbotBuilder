import { z } from "zod";
import { widgetSettingsSchema } from "@/lib/widget/settings";

const optionalText = (max: number, field: string) =>
  z
    .string()
    .trim()
    .max(max, `${field} must be ${max} characters or fewer.`)
    .optional()
    .nullable()
    .transform((value) => {
      if (!value) {
        return null;
      }

      return value.length > 0 ? value : null;
    });

const botMutationShape = {
  name: z
    .string()
    .trim()
    .min(2, "Bot name must be at least 2 characters.")
    .max(80, "Bot name must be 80 characters or fewer."),
  description: optionalText(320, "Description"),
  supportTone: optionalText(120, "Support tone"),
  fallbackMessage: optionalText(240, "Fallback message"),
  sourceReferencesEnabled: z.boolean().default(false),
  publicWidgetEnabled: z.boolean().default(false),
  widgetSettings: widgetSettingsSchema.optional()
};

export const botMutationSchema = z.object(botMutationShape);

export const botUpdateSchema = z.object({
  ...botMutationShape,
  sourceReferencesEnabled: z.boolean().optional()
}).partial().refine((value) => Object.keys(value).length > 0, {
  message: "Provide at least one bot setting to update."
});

export type BotMutationInput = z.infer<typeof botMutationSchema>;
export type BotUpdateInput = z.infer<typeof botUpdateSchema>;
