import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, notificationsTable, notificationConfigTable } from "@workspace/db";
import { z } from "zod";
import { tenantCompanyId } from "../middlewares/auth";

const router = Router();

const CreateNotificationBody = z.object({
  canal: z.enum(["sms", "email", "whatsapp"]),
  declencheur: z.string(),
  destinataire: z.string().min(1),
  message: z.string().min(1),
  reservationId: z.number().int().optional(),
  tripId: z.number().int().optional(),
});

router.get("/notifications", async (req, res): Promise<void> => {
  const rows = await db.select().from(notificationsTable).where(eq(notificationsTable.companyId, tenantCompanyId(req))).orderBy(notificationsTable.createdAt);
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/notifications", async (req, res): Promise<void> => {
  const parsed = CreateNotificationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [notif] = await db.insert(notificationsTable).values({ ...parsed.data, companyId: tenantCompanyId(req), statut: "en_attente" }).returning();
  res.status(201).json({ ...notif, createdAt: notif.createdAt.toISOString() });
});

// Notification config is always scoped to the caller's company — the path no
// longer trusts a client-supplied company id.
router.get("/notifications/config", async (req, res): Promise<void> => {
  const companyId = tenantCompanyId(req);
  const [config] = await db.select().from(notificationConfigTable).where(eq(notificationConfigTable.companyId, companyId));
  if (!config) {
    res.json({ companyId, confirmationSms: true, confirmationEmail: true, confirmationWhatsapp: false, modificationSms: true, modificationEmail: true, annulationSms: true, annulationEmail: true, rappelSms: true, rappelWhatsapp: true });
    return;
  }
  res.json(config);
});

router.put("/notifications/config", async (req, res): Promise<void> => {
  const companyId = tenantCompanyId(req);
  const { companyId: _ignored, ...body } = req.body ?? {};
  void _ignored;
  const [existing] = await db.select().from(notificationConfigTable).where(eq(notificationConfigTable.companyId, companyId));
  if (existing) {
    const [updated] = await db.update(notificationConfigTable).set(body).where(eq(notificationConfigTable.companyId, companyId)).returning();
    res.json(updated);
  } else {
    const [created] = await db.insert(notificationConfigTable).values({ companyId, ...body }).returning();
    res.status(201).json(created);
  }
});

export default router;
