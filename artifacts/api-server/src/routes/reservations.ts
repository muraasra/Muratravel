import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, reservationsTable, tripsTable, destinationsTable } from "@workspace/db";
import {
  CreateReservationBody,
  UpdateReservationBody,
  GetReservationParams,
  UpdateReservationParams,
  DeleteReservationParams,
  ListReservationsQueryParams,
  BoardPassengerParams,
  ListReservationsResponse,
  GetReservationResponse,
  UpdateReservationResponse,
  BoardPassengerResponse,
} from "@workspace/api-zod";
import { randomBytes } from "crypto";

const router = Router();

async function enrichReservation(r: typeof reservationsTable.$inferSelect) {
  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, r.tripId));
  let originCity: string | null = null;
  let destinationCity: string | null = null;
  let departureDate: string | null = null;
  if (trip) {
    departureDate = trip.departureDate;
    const [dest] = await db.select().from(destinationsTable).where(eq(destinationsTable.id, trip.destinationId));
    originCity = dest?.originCity ?? null;
    destinationCity = dest?.destinationCity ?? null;
  }
  return {
    ...r,
    price: parseFloat(r.price),
    originCity,
    destinationCity,
    departureDate,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/reservations", async (req, res): Promise<void> => {
  const qp = ListReservationsQueryParams.safeParse(req.query);
  const conditions = [];
  if (qp.success) {
    if (qp.data.tripId != null) conditions.push(eq(reservationsTable.tripId, qp.data.tripId));
    if (qp.data.status != null) conditions.push(eq(reservationsTable.status, qp.data.status));
  }
  const rows = conditions.length
    ? await db.select().from(reservationsTable).where(and(...conditions)).orderBy(reservationsTable.createdAt)
    : await db.select().from(reservationsTable).orderBy(reservationsTable.createdAt);
  const enriched = await Promise.all(rows.map(enrichReservation));
  res.json(ListReservationsResponse.parse(enriched));
});

router.post("/reservations", async (req, res): Promise<void> => {
  const parsed = CreateReservationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const ticketCode = `TKT-${randomBytes(4).toString("hex").toUpperCase()}`;
  const [reservation] = await db.insert(reservationsTable).values({
    ...parsed.data,
    price: String(parsed.data.price),
    ticketCode,
  }).returning();
  // Decrement available seats
  const [currentTrip] = await db.select().from(tripsTable).where(eq(tripsTable.id, parsed.data.tripId));
  if (currentTrip && currentTrip.seatsAvailable > 0) {
    await db.update(tripsTable)
      .set({ seatsAvailable: currentTrip.seatsAvailable - 1 })
      .where(eq(tripsTable.id, parsed.data.tripId));
  }
  res.status(201).json(GetReservationResponse.parse(await enrichReservation(reservation)));
});

router.get("/reservations/:id", async (req, res): Promise<void> => {
  const params = GetReservationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [reservation] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, params.data.id));
  if (!reservation) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }
  res.json(GetReservationResponse.parse(await enrichReservation(reservation)));
});

router.patch("/reservations/:id", async (req, res): Promise<void> => {
  const params = UpdateReservationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateReservationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [reservation] = await db.update(reservationsTable).set(parsed.data).where(eq(reservationsTable.id, params.data.id)).returning();
  if (!reservation) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }
  res.json(UpdateReservationResponse.parse(await enrichReservation(reservation)));
});

router.delete("/reservations/:id", async (req, res): Promise<void> => {
  const params = DeleteReservationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [reservation] = await db.delete(reservationsTable).where(eq(reservationsTable.id, params.data.id)).returning();
  if (!reservation) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }
  res.sendStatus(204);
});

router.patch("/reservations/:id/board", async (req, res): Promise<void> => {
  const params = BoardPassengerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [reservation] = await db.update(reservationsTable).set({ status: "boarded" }).where(eq(reservationsTable.id, params.data.id)).returning();
  if (!reservation) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }
  res.json(BoardPassengerResponse.parse(await enrichReservation(reservation)));
});

export default router;
