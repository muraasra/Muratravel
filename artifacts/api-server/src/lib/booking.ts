import { z } from "zod";
import { randomBytes } from "crypto";

/** Field visibility/requirement for the built-in passenger fields. */
export const FieldMode = z.enum(["hidden", "optional", "required"]);

/** A company-defined custom field added to the public booking form. */
export const CustomFieldSchema = z.object({
  key: z.string().min(1).max(40),
  label: z.string().min(1).max(80),
  type: z.enum(["text", "textarea", "phone", "email", "number", "date", "select"]),
  required: z.boolean().default(false),
  placeholder: z.string().max(120).optional(),
  options: z.array(z.string().min(1)).optional(), // for type=select
});
export type CustomField = z.infer<typeof CustomFieldSchema>;

export const BookingConfigSchema = z.object({
  welcomeMessage: z.string().max(280).optional(),
  // passengerName & passengerPhone are always required and not configurable.
  fields: z.object({
    email: FieldMode.default("optional"),
    idNumber: FieldMode.default("hidden"),
    seat: FieldMode.default("hidden"),
  }).default({ email: "optional", idNumber: "hidden", seat: "hidden" }),
  customFields: z.array(CustomFieldSchema).max(20).default([]),
});

export type BookingConfig = z.infer<typeof BookingConfigSchema>;

export const DEFAULT_BOOKING_CONFIG: BookingConfig = {
  welcomeMessage: "Réservez votre billet en quelques clics.",
  fields: { email: "optional", idNumber: "hidden", seat: "hidden" },
  customFields: [],
};

/** Build a readable, reasonably-unique public slug from a company name. */
export function makeBookingSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "compagnie";
  return `${base}-${randomBytes(2).toString("hex")}`;
}

/**
 * Validate submitted custom-field answers against a config. Returns
 * { ok, errors, data } where data only keeps known keys.
 */
export function validateCustomData(
  fields: CustomField[],
  submitted: Record<string, unknown> | undefined,
): { ok: boolean; errors: string[]; data: Record<string, unknown> } {
  const errors: string[] = [];
  const data: Record<string, unknown> = {};
  const input = submitted ?? {};
  for (const f of fields) {
    const raw = input[f.key];
    const value = typeof raw === "string" ? raw.trim() : raw;
    if (value == null || value === "") {
      if (f.required) errors.push(f.label);
      continue;
    }
    if (f.type === "select" && f.options && !f.options.includes(String(value))) {
      errors.push(`${f.label} (valeur invalide)`);
      continue;
    }
    data[f.key] = value;
  }
  return { ok: errors.length === 0, errors, data };
}
