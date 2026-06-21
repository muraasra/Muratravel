import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, agenciesTable, usersTable } from "@workspace/db";
import {
  CreateAgencyBody,
  UpdateAgencyBody,
  GetAgencyParams,
  UpdateAgencyParams,
  DeleteAgencyParams,
  ListAgenciesQueryParams,
  ListAgenciesResponse,
  GetAgencyResponse,
  UpdateAgencyResponse,
} from "@workspace/api-zod";

const router = Router();

async function enrichAgency(a: typeof agenciesTable.$inferSelect) {
  let managerName: string | null = null;
  if (a.managerId) {
    const [mgr] = await db.select().from(usersTable).where(eq(usersTable.id, a.managerId));
    managerName = mgr?.name ?? null;
  }
  return { ...a, managerName, createdAt: a.createdAt.toISOString() };
}

router.get("/agencies", async (req, res): Promise<void> => {
  const qp = ListAgenciesQueryParams.safeParse(req.query);
  const agencies = qp.success && qp.data.companyId != null
    ? await db.select().from(agenciesTable).where(eq(agenciesTable.companyId, qp.data.companyId))
    : await db.select().from(agenciesTable);
  const enriched = await Promise.all(agencies.map(enrichAgency));
  res.json(ListAgenciesResponse.parse(enriched));
});

router.post("/agencies", async (req, res): Promise<void> => {
  const parsed = CreateAgencyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [agency] = await db.insert(agenciesTable).values(parsed.data).returning();
  res.status(201).json(GetAgencyResponse.parse(await enrichAgency(agency)));
});

router.get("/agencies/:id", async (req, res): Promise<void> => {
  const params = GetAgencyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [agency] = await db.select().from(agenciesTable).where(eq(agenciesTable.id, params.data.id));
  if (!agency) {
    res.status(404).json({ error: "Agency not found" });
    return;
  }
  res.json(GetAgencyResponse.parse(await enrichAgency(agency)));
});

router.patch("/agencies/:id", async (req, res): Promise<void> => {
  const params = UpdateAgencyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAgencyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [agency] = await db.update(agenciesTable).set(parsed.data).where(eq(agenciesTable.id, params.data.id)).returning();
  if (!agency) {
    res.status(404).json({ error: "Agency not found" });
    return;
  }
  res.json(UpdateAgencyResponse.parse(await enrichAgency(agency)));
});

router.delete("/agencies/:id", async (req, res): Promise<void> => {
  const params = DeleteAgencyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [agency] = await db.delete(agenciesTable).where(eq(agenciesTable.id, params.data.id)).returning();
  if (!agency) {
    res.status(404).json({ error: "Agency not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
