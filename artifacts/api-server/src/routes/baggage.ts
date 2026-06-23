import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, baggageTable, reservationsTable } from "@workspace/db";
import {
  CreateBaggageBody,
  UpdateBaggageBody,
  GetBaggageParams,
  UpdateBaggageParams,
  ListBaggageQueryParams,
  ListBaggageResponse,
  GetBaggageResponse,
  UpdateBaggageResponse,
} from "@workspace/api-zod";
import { randomBytes } from "crypto";
import { tenantCompanyId } from "../middlewares/auth";

const router = Router();

function serializeBaggage(b: typeof baggageTable.$inferSelect) {
  return { ...b, weight: parseFloat(b.weight), price: parseFloat(b.price), createdAt: b.createdAt.toISOString() };
}

router.get("/baggage", async (req, res): Promise<void> => {
  const qp = ListBaggageQueryParams.safeParse(req.query);
  const conditions = [eq(baggageTable.companyId, tenantCompanyId(req))];
  if (qp.success && qp.data.reservationId != null) conditions.push(eq(baggageTable.reservationId, qp.data.reservationId));
  const rows = await db.select().from(baggageTable).where(and(...conditions));
  res.json(ListBaggageResponse.parse(rows.map(serializeBaggage)));
});

router.post("/baggage", async (req, res): Promise<void> => {
  const parsed = CreateBaggageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const companyId = tenantCompanyId(req);
  // The reservation must belong to the caller's company.
  const [reservation] = await db.select().from(reservationsTable).where(and(eq(reservationsTable.id, parsed.data.reservationId), eq(reservationsTable.companyId, companyId)));
  if (!reservation) { res.status(404).json({ error: "Reservation not found" }); return; }
  const trackingCode = `BAG-${randomBytes(4).toString("hex").toUpperCase()}`;
  const [bag] = await db.insert(baggageTable).values({
    ...parsed.data,
    companyId,
    weight: String(parsed.data.weight),
    price: String(parsed.data.price),
    trackingCode,
  }).returning();
  res.status(201).json(GetBaggageResponse.parse(serializeBaggage(bag)));
});

router.get("/baggage/:id", async (req, res): Promise<void> => {
  const params = GetBaggageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [bag] = await db.select().from(baggageTable).where(and(eq(baggageTable.id, params.data.id), eq(baggageTable.companyId, tenantCompanyId(req))));
  if (!bag) { res.status(404).json({ error: "Baggage not found" }); return; }
  res.json(GetBaggageResponse.parse(serializeBaggage(bag)));
});

router.patch("/baggage/:id", async (req, res): Promise<void> => {
  const params = UpdateBaggageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateBaggageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.weight != null) updateData.weight = String(parsed.data.weight);
  if (parsed.data.price != null) updateData.price = String(parsed.data.price);
  const [bag] = await db.update(baggageTable).set(updateData)
    .where(and(eq(baggageTable.id, params.data.id), eq(baggageTable.companyId, tenantCompanyId(req)))).returning();
  if (!bag) { res.status(404).json({ error: "Baggage not found" }); return; }
  res.json(UpdateBaggageResponse.parse(serializeBaggage(bag)));
});

export default router;
