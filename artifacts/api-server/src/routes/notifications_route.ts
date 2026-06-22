import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, notificationsTable, notificationConfigTable } from "@workspace/db";
import { z } from "zod/v4";

const router = Router();

const CreateNotificationBody = z.object({
  canal: z.enum(["sms", "email", "whatsapp"]),
  declencheur: z.string(),
  destinataire: z.string().min(1),
  message: z.string().min(1),
  companyId: z.number().int(),
  reservationId: z.number().int().optional(),
  tripId: z.number().int().optional(),
});

router.get("/notifications", async (req, res): Promise<void> => {
  const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
  const rows = companyId
    ? await db.select().from(notificationsTable).where(eq(notificationsTable.companyId, companyId)).orderBy(notificationsTable.createdAt)
    : await db.select().from(notificationsTable).orderBy(notificationsTable.createdAt);
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/notifications", async (req, res): Promise<void> => {
  const parsed = CreateNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [notif] = await db.insert(notificationsTable).values({ ...parsed.data, statut: "en_attente" }).returning();
  res.status(201).json({ ...notif, createdAt: notif.createdAt.toISOString() });
});

router.get("/notifications/config/:companyId", async (req, res): Promise<void> => {
  const companyId = parseInt(req.params.companyId);
  const [config] = await db.select().from(notificationConfigTable).where(eq(notificationConfigTable.companyId, companyId));
  if (!config) {
    res.json({ companyId, confirmationSms: true, confirmationEmail: true, confirmationWhatsapp: false, modificationSms: true, modificationEmail: true, annulationSms: true, annulationEmail: true, rappelSms: true, rappelWhatsapp: true });
    return;
  }
  res.json(config);
});

router.put("/notifications/config/:companyId", async (req, res): Promise<void> => {
  const companyId = parseInt(req.params.companyId);
  const [existing] = await db.select().from(notificationConfigTable).where(eq(notificationConfigTable.companyId, companyId));
  if (existing) {
    const [updated] = await db.update(notificationConfigTable).set(req.body).where(eq(notificationConfigTable.companyId, companyId)).returning();
    res.json(updated);
  } else {
    const [created] = await db.insert(notificationConfigTable).values({ companyId, ...req.body }).returning();
    res.status(201).json(created);
  }
});

export default router;
