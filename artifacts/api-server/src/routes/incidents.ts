import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, incidentsTable } from "@workspace/db";
import { z } from "zod";

const router = Router();

const CreateIncidentBody = z.object({
  type: z.enum(["bagage_perdu", "reclamation", "retard", "incident_vehicule"]),
  titre: z.string().min(1),
  description: z.string().min(1),
  priorite: z.enum(["faible", "normale", "haute", "critique"]).default("normale"),
  rapportePar: z.string().min(1),
  companyId: z.number().int(),
  tripId: z.number().int().optional(),
  reservationId: z.number().int().optional(),
  vehicleId: z.number().int().optional(),
  notes: z.string().optional(),
});

const UpdateIncidentBody = z.object({
  statut: z.enum(["ouvert", "en_cours", "resolu", "ferme"]).optional(),
  priorite: z.enum(["faible", "normale", "haute", "critique"]).optional(),
  notes: z.string().optional(),
  dateResolution: z.string().datetime().optional(),
});

router.get("/incidents", async (req, res): Promise<void> => {
  const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
  const rows = companyId
    ? await db.select().from(incidentsTable).where(eq(incidentsTable.companyId, companyId)).orderBy(incidentsTable.createdAt)
    : await db.select().from(incidentsTable).orderBy(incidentsTable.createdAt);
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/incidents", async (req, res): Promise<void> => {
  const parsed = CreateIncidentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [incident] = await db.insert(incidentsTable).values({ ...parsed.data, statut: "ouvert" }).returning();
  res.status(201).json({ ...incident, createdAt: incident.createdAt.toISOString() });
});

router.patch("/incidents/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const parsed = UpdateIncidentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.statut === "resolu" && !parsed.data.dateResolution) {
    updateData.dateResolution = new Date();
  }
  const [incident] = await db.update(incidentsTable).set(updateData).where(eq(incidentsTable.id, id)).returning();
  if (!incident) { res.status(404).json({ error: "Incident not found" }); return; }
  res.json({ ...incident, createdAt: incident.createdAt.toISOString() });
});

router.delete("/incidents/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [incident] = await db.delete(incidentsTable).where(eq(incidentsTable.id, id)).returning();
  if (!incident) { res.status(404).json({ error: "Incident not found" }); return; }
  res.sendStatus(204);
});

export default router;

