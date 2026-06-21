import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, baggageTable, reservationsTable, tripsTable } from "@workspace/db";
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

const router = Router();

function serializeBaggage(b: typeof baggageTable.$inferSelect) {
  return { ...b, weight: parseFloat(b.weight), price: parseFloat(b.price), createdAt: b.createdAt.toISOString() };
}

router.get("/baggage", async (req, res): Promise<void> => {
  const qp = ListBaggageQueryParams.safeParse(req.query);
  const conditions = [];
  if (qp.success) {
    if (qp.data.reservationId != null) conditions.push(eq(baggageTable.reservationId, qp.data.reservationId));
    if (qp.data.tripId != null) {
      // Get all reservation IDs for this trip
      const tripReservations = await db.select({ id: reservationsTable.id }).from(reservationsTable).where(eq(reservationsTable.tripId, qp.data.tripId));
      const ids = tripReservations.map(r => r.id);
      if (ids.length === 0) {
        res.json([]);
        return;
      }
    }
  }
  const rows = conditions.length
    ? await db.select().from(baggageTable).where(and(...conditions))
    : await db.select().from(baggageTable);
  res.json(ListBaggageResponse.parse(rows.map(serializeBaggage)));
});

router.post("/baggage", async (req, res): Promise<void> => {
  const parsed = CreateBaggageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const trackingCode = `BAG-${randomBytes(4).toString("hex").toUpperCase()}`;
  const [bag] = await db.insert(baggageTable).values({
    ...parsed.data,
    weight: String(parsed.data.weight),
    price: String(parsed.data.price),
    trackingCode,
  }).returning();
  res.status(201).json(GetBaggageResponse.parse(serializeBaggage(bag)));
});

router.get("/baggage/:id", async (req, res): Promise<void> => {
  const params = GetBaggageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [bag] = await db.select().from(baggageTable).where(eq(baggageTable.id, params.data.id));
  if (!bag) {
    res.status(404).json({ error: "Baggage not found" });
    return;
  }
  res.json(GetBaggageResponse.parse(serializeBaggage(bag)));
});

router.patch("/baggage/:id", async (req, res): Promise<void> => {
  const params = UpdateBaggageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBaggageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.weight != null) updateData.weight = String(parsed.data.weight);
  if (parsed.data.price != null) updateData.price = String(parsed.data.price);
  const [bag] = await db.update(baggageTable).set(updateData).where(eq(baggageTable.id, params.data.id)).returning();
  if (!bag) {
    res.status(404).json({ error: "Baggage not found" });
    return;
  }
  res.json(UpdateBaggageResponse.parse(serializeBaggage(bag)));
});

export default router;
