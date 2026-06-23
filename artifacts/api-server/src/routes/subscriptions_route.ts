import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, subscriptionsTable } from "@workspace/db";
import { z } from "zod";
import { tenantCompanyId } from "../middlewares/auth";

const router = Router();

const UpdateSubscriptionBody = z.object({
  plan: z.enum(["starter", "business", "enterprise"]).optional(),
  statut: z.enum(["essai", "actif", "expire", "suspendu"]).optional(),
  dateFin: z.string().optional(),
  prixMensuel: z.number().optional(),
  agencesMax: z.number().int().optional(),
  utilisateursMax: z.number().int().optional(),
  voyagesMax: z.number().int().optional(),
  notes: z.string().optional(),
});

function serialize(s: typeof subscriptionsTable.$inferSelect) {
  return { ...s, prixMensuel: parseFloat(s.prixMensuel), createdAt: s.createdAt.toISOString() };
}

// A company only ever has one subscription (created during onboarding) and can
// only see / change its own.
router.get("/subscriptions", async (req, res): Promise<void> => {
  const rows = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.companyId, tenantCompanyId(req)));
  res.json(rows.map(serialize));
});

router.get("/subscriptions/current", async (req, res): Promise<void> => {
  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.companyId, tenantCompanyId(req)));
  if (!sub) { res.status(404).json({ error: "Subscription not found" }); return; }
  res.json(serialize(sub));
});

router.patch("/subscriptions/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const parsed = UpdateSubscriptionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.prixMensuel != null) updateData.prixMensuel = String(parsed.data.prixMensuel);
  const [sub] = await db.update(subscriptionsTable).set(updateData)
    .where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.companyId, tenantCompanyId(req)))).returning();
  if (!sub) { res.status(404).json({ error: "Subscription not found" }); return; }
  res.json(serialize(sub));
});

export default router;
