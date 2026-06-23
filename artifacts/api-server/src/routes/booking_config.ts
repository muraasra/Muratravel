import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, companiesTable } from "@workspace/db";
import { z } from "zod";
import { tenantCompanyId } from "../middlewares/auth";
import { BookingConfigSchema, DEFAULT_BOOKING_CONFIG, makeBookingSlug } from "../lib/booking";

const router = Router();

async function ownCompany(req: import("express").Request) {
  const [c] = await db.select().from(companiesTable).where(eq(companiesTable.id, tenantCompanyId(req)));
  return c;
}

function ensureSlug(name: string, current: string | null) {
  return current ?? makeBookingSlug(name);
}

router.get("/booking-config", async (req, res): Promise<void> => {
  const company = await ownCompany(req);
  if (!company) { res.status(404).json({ error: "Company not found" }); return; }
  // Lazily assign a slug if a legacy company doesn't have one yet.
  let slug = company.bookingSlug;
  if (!slug) {
    slug = makeBookingSlug(company.name);
    await db.update(companiesTable).set({ bookingSlug: slug }).where(eq(companiesTable.id, company.id));
  }
  const cfg = BookingConfigSchema.safeParse(company.bookingConfig);
  res.json({
    slug,
    enabled: company.bookingEnabled,
    config: cfg.success ? cfg.data : DEFAULT_BOOKING_CONFIG,
  });
});

const UpdateBody = z.object({
  enabled: z.boolean().optional(),
  config: BookingConfigSchema.optional(),
});

router.put("/booking-config", async (req, res): Promise<void> => {
  const company = await ownCompany(req);
  if (!company) { res.status(404).json({ error: "Company not found" }); return; }
  const parsed = UpdateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const update: Record<string, unknown> = {};
  if (parsed.data.enabled != null) update.enabled = parsed.data.enabled;
  const slug = ensureSlug(company.name, company.bookingSlug);
  const [updated] = await db.update(companiesTable).set({
    bookingEnabled: parsed.data.enabled ?? company.bookingEnabled,
    bookingConfig: parsed.data.config ?? company.bookingConfig ?? DEFAULT_BOOKING_CONFIG,
    bookingSlug: slug,
  }).where(eq(companiesTable.id, company.id)).returning();

  const cfg = BookingConfigSchema.safeParse(updated.bookingConfig);
  res.json({
    slug: updated.bookingSlug,
    enabled: updated.bookingEnabled,
    config: cfg.success ? cfg.data : DEFAULT_BOOKING_CONFIG,
  });
});

router.post("/booking-config/regenerate", async (req, res): Promise<void> => {
  const company = await ownCompany(req);
  if (!company) { res.status(404).json({ error: "Company not found" }); return; }
  const slug = makeBookingSlug(company.name);
  await db.update(companiesTable).set({ bookingSlug: slug }).where(eq(companiesTable.id, company.id));
  res.json({ slug });
});

export default router;
