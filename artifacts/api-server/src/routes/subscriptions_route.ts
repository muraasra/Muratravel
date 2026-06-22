import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, subscriptionsTable } from "@workspace/db";
import { z } from "zod/v4";

const router = Router();

const CreateSubscriptionBody = z.object({
  companyId: z.number().int(),
  plan: z.enum(["starter", "business", "enterprise"]).default("starter"),
  statut: z.enum(["essai", "actif", "expire", "suspendu"]).default("essai"),
  dateDebut: z.string(),
  dateFin: z.string(),
  prixMensuel: z.number().default(0),
  agencesMax: z.number().int().default(2),
  utilisateursMax: z.number().int().default(5),
  voyagesMax: z.number().int().optional(),
  stripeSubscriptionId: z.string().optional(),
  notes: z.string().optional(),
});

router.get("/subscriptions", async (_req, res): Promise<void> => {
  const rows = await db.select().from(subscriptionsTable).orderBy(subscriptionsTable.createdAt);
  res.json(rows.map(r => ({ ...r, prixMensuel: parseFloat(r.prixMensuel), createdAt: r.createdAt.toISOString() })));
});

router.get("/subscriptions/company/:companyId", async (req, res): Promise<void> => {
  const companyId = parseInt(req.params.companyId);
  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.companyId, companyId));
  if (!sub) { res.status(404).json({ error: "Subscription not found" }); return; }
  res.json({ ...sub, prixMensuel: parseFloat(sub.prixMensuel), createdAt: sub.createdAt.toISOString() });
});

router.post("/subscriptions", async (req, res): Promise<void> => {
  const parsed = CreateSubscriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [sub] = await db.insert(subscriptionsTable).values({ ...parsed.data, prixMensuel: String(parsed.data.prixMensuel) }).returning();
  res.status(201).json({ ...sub, prixMensuel: parseFloat(sub.prixMensuel), createdAt: sub.createdAt.toISOString() });
});

router.patch("/subscriptions/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [sub] = await db.update(subscriptionsTable).set(req.body).where(eq(subscriptionsTable.id, id)).returning();
  if (!sub) { res.status(404).json({ error: "Subscription not found" }); return; }
  res.json({ ...sub, prixMensuel: parseFloat(sub.prixMensuel), createdAt: sub.createdAt.toISOString() });
});

export default router;
