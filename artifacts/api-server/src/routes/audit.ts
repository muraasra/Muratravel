import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, auditLogsTable } from "@workspace/db";
import { z } from "zod";

const router = Router();

const CreateAuditLogBody = z.object({
  action: z.string().min(1),
  module: z.string().min(1),
  description: z.string().min(1),
  userId: z.string().optional(),
  userEmail: z.string().optional(),
  userName: z.string().optional(),
  companyId: z.number().int().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  statut: z.enum(["succes", "echec"]).default("succes"),
  metadata: z.record(z.unknown()).optional(),
});

router.get("/audit", async (req, res): Promise<void> => {
  const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
  const rows = companyId
    ? await db.select().from(auditLogsTable).where(eq(auditLogsTable.companyId, companyId)).orderBy(desc(auditLogsTable.createdAt)).limit(limit)
    : await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(limit);
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/audit", async (req, res): Promise<void> => {
  const parsed = CreateAuditLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const ipAddress = req.ip || req.headers["x-forwarded-for"] as string || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";
  const [log] = await db.insert(auditLogsTable).values({
    ...parsed.data,
    ipAddress: parsed.data.ipAddress ?? ipAddress,
    userAgent: parsed.data.userAgent ?? userAgent,
  }).returning();
  res.status(201).json({ ...log, createdAt: log.createdAt.toISOString() });
});

export default router;

