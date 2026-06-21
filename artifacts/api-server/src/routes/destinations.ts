import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, destinationsTable } from "@workspace/db";
import {
  CreateDestinationBody,
  UpdateDestinationBody,
  GetDestinationParams,
  UpdateDestinationParams,
  DeleteDestinationParams,
  ListDestinationsQueryParams,
  ListDestinationsResponse,
  GetDestinationResponse,
  UpdateDestinationResponse,
} from "@workspace/api-zod";

const router = Router();

function serializeDest(d: typeof destinationsTable.$inferSelect) {
  return {
    ...d,
    distanceKm: d.distanceKm != null ? parseFloat(d.distanceKm) : null,
    basePrice: parseFloat(d.basePrice),
    createdAt: d.createdAt.toISOString(),
  };
}

router.get("/destinations", async (req, res): Promise<void> => {
  const qp = ListDestinationsQueryParams.safeParse(req.query);
  const rows = qp.success && qp.data.companyId != null
    ? await db.select().from(destinationsTable).where(eq(destinationsTable.companyId, qp.data.companyId))
    : await db.select().from(destinationsTable);
  res.json(ListDestinationsResponse.parse(rows.map(serializeDest)));
});

router.post("/destinations", async (req, res): Promise<void> => {
  const parsed = CreateDestinationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [dest] = await db.insert(destinationsTable).values({
    ...parsed.data,
    distanceKm: parsed.data.distanceKm != null ? String(parsed.data.distanceKm) : null,
    basePrice: String(parsed.data.basePrice),
  }).returning();
  res.status(201).json(GetDestinationResponse.parse(serializeDest(dest)));
});

router.get("/destinations/:id", async (req, res): Promise<void> => {
  const params = GetDestinationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [dest] = await db.select().from(destinationsTable).where(eq(destinationsTable.id, params.data.id));
  if (!dest) {
    res.status(404).json({ error: "Destination not found" });
    return;
  }
  res.json(GetDestinationResponse.parse(serializeDest(dest)));
});

router.patch("/destinations/:id", async (req, res): Promise<void> => {
  const params = UpdateDestinationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDestinationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.basePrice != null) updateData.basePrice = String(parsed.data.basePrice);
  if (parsed.data.distanceKm != null) updateData.distanceKm = String(parsed.data.distanceKm);
  const [dest] = await db.update(destinationsTable).set(updateData).where(eq(destinationsTable.id, params.data.id)).returning();
  if (!dest) {
    res.status(404).json({ error: "Destination not found" });
    return;
  }
  res.json(UpdateDestinationResponse.parse(serializeDest(dest)));
});

router.delete("/destinations/:id", async (req, res): Promise<void> => {
  const params = DeleteDestinationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [dest] = await db.delete(destinationsTable).where(eq(destinationsTable.id, params.data.id)).returning();
  if (!dest) {
    res.status(404).json({ error: "Destination not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
