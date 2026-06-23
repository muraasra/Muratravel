import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, companiesTable, subscriptionsTable } from "@workspace/db";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middlewares/auth";
import { makeBookingSlug, DEFAULT_BOOKING_CONFIG } from "../lib/booking";

const router = Router();

// All routes here require a valid session but NOT a company.
router.use(requireAuth);

/** Current user profile + company context. */
router.get("/me", async (req, res): Promise<void> => {
  const auth = (req as AuthedRequest).auth!;
  let company = null;
  if (auth.companyId != null) {
    const [c] = await db.select().from(companiesTable).where(eq(companiesTable.id, auth.companyId));
    company = c ? { id: c.id, name: c.name, currency: c.currency, country: c.country } : null;
  }
  res.json({
    id: auth.appUserId,
    name: auth.name,
    email: auth.email,
    role: auth.role,
    companyId: auth.companyId,
    company,
    onboarded: auth.companyId != null,
  });
});

const OnboardingBody = z.object({
  companyName: z.string().min(2),
  country: z.string().min(2).default(""),
  currency: z.string().min(3).default("XOF"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

/**
 * First-run onboarding: the signed-up user creates THEIR company and becomes its
 * administrator. Idempotent-ish: refuses if the user already has a company.
 */
router.post("/onboarding", async (req, res): Promise<void> => {
  const auth = (req as AuthedRequest).auth!;
  if (auth.companyId != null) {
    res.status(409).json({ error: "already_onboarded", message: "Ce compte gère déjà une compagnie." });
    return;
  }
  const parsed = OnboardingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [company] = await db
    .insert(companiesTable)
    .values({
      name: parsed.data.companyName,
      country: parsed.data.country,
      currency: parsed.data.currency,
      phone: parsed.data.phone ?? null,
      email: parsed.data.email ?? null,
      bookingSlug: makeBookingSlug(parsed.data.companyName),
      bookingEnabled: true,
      bookingConfig: DEFAULT_BOOKING_CONFIG,
    })
    .returning();

  await db
    .update(usersTable)
    .set({ companyId: company.id, role: "company_admin" })
    .where(eq(usersTable.id, auth.appUserId));

  // Bootstrap a 14-day trial subscription for the new company.
  const today = new Date();
  const trialEnd = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  await db.insert(subscriptionsTable).values({
    companyId: company.id,
    plan: "starter",
    statut: "essai",
    dateDebut: today.toISOString().split("T")[0],
    dateFin: trialEnd.toISOString().split("T")[0],
    prixMensuel: "0",
  });

  res.status(201).json({
    id: auth.appUserId,
    role: "company_admin",
    companyId: company.id,
    company: { id: company.id, name: company.name, currency: company.currency, country: company.country },
    onboarded: true,
  });
});

export default router;
