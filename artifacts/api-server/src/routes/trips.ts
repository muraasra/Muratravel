import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, tripsTable, destinationsTable, vehiclesTable, usersTable, reservationsTable, baggageTable } from "@workspace/db";
import {
  CreateTripBody,
  UpdateTripBody,
  GetTripParams,
  UpdateTripParams,
  DeleteTripParams,
  ListTripsQueryParams,
  ListTripsResponse,
  GetTripResponse,
  UpdateTripResponse,
  CancelTripParams,
  CancelTripResponse,
  CloseTripParams,
  CloseTripResponse,
  GetTripManifestParams,
  GetTripManifestResponse,
} from "@workspace/api-zod";

const router = Router();

async function enrichTrip(t: typeof tripsTable.$inferSelect) {
  const [dest] = await db.select().from(destinationsTable).where(eq(destinationsTable.id, t.destinationId));
  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, t.vehicleId));
  let driverName: string | null = null;
  if (t.driverId) {
    const [driver] = await db.select().from(usersTable).where(eq(usersTable.id, t.driverId));
    driverName = driver?.name ?? null;
  }
  return {
    ...t,
    price: parseFloat(t.price),
    originCity: dest?.originCity ?? null,
    destinationCity: dest?.destinationCity ?? null,
    vehicleLicensePlate: vehicle?.licensePlate ?? null,
    driverName,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/trips", async (req, res): Promise<void> => {
  const qp = ListTripsQueryParams.safeParse(req.query);
  const conditions = [];
  if (qp.success) {
    if (qp.data.companyId != null) conditions.push(eq(tripsTable.companyId, qp.data.companyId));
    if (qp.data.status != null) conditions.push(eq(tripsTable.status, qp.data.status));
    if (qp.data.destinationId != null) conditions.push(eq(tripsTable.destinationId, qp.data.destinationId));
  }
  const rows = conditions.length
    ? await db.select().from(tripsTable).where(and(...conditions)).orderBy(tripsTable.departureDate)
    : await db.select().from(tripsTable).orderBy(tripsTable.departureDate);
  const enriched = await Promise.all(rows.map(enrichTrip));
  res.json(ListTripsResponse.parse(enriched));
});

router.post("/trips", async (req, res): Promise<void> => {
  const parsed = CreateTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const vehicle = parsed.data.vehicleId
    ? (await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, parsed.data.vehicleId)))[0]
    : null;
  const [trip] = await db.insert(tripsTable).values({
    ...parsed.data,
    price: String(parsed.data.price),
    seatsTotal: vehicle?.seatCount ?? 0,
    seatsAvailable: vehicle?.seatCount ?? 0,
  }).returning();
  res.status(201).json(GetTripResponse.parse(await enrichTrip(trip)));
});

router.get("/trips/:id", async (req, res): Promise<void> => {
  const params = GetTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, params.data.id));
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  res.json(GetTripResponse.parse(await enrichTrip(trip)));
});

router.patch("/trips/:id", async (req, res): Promise<void> => {
  const params = UpdateTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.price != null) updateData.price = String(parsed.data.price);
  const [trip] = await db.update(tripsTable).set(updateData).where(eq(tripsTable.id, params.data.id)).returning();
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  res.json(UpdateTripResponse.parse(await enrichTrip(trip)));
});

router.delete("/trips/:id", async (req, res): Promise<void> => {
  const params = DeleteTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [trip] = await db.delete(tripsTable).where(eq(tripsTable.id, params.data.id)).returning();
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  res.sendStatus(204);
});

router.patch("/trips/:id/cancel", async (req, res): Promise<void> => {
  const params = CancelTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [trip] = await db.update(tripsTable).set({ status: "cancelled" }).where(eq(tripsTable.id, params.data.id)).returning();
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  res.json(CancelTripResponse.parse(await enrichTrip(trip)));
});

router.patch("/trips/:id/close", async (req, res): Promise<void> => {
  const params = CloseTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [trip] = await db.update(tripsTable).set({ status: "arrived" }).where(eq(tripsTable.id, params.data.id)).returning();
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  res.json(CloseTripResponse.parse(await enrichTrip(trip)));
});

router.get("/trips/:id/manifest", async (req, res): Promise<void> => {
  const params = GetTripManifestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, params.data.id));
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  const [dest] = await db.select().from(destinationsTable).where(eq(destinationsTable.id, trip.destinationId));
  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, trip.vehicleId));
  let driverName: string | null = null;
  if (trip.driverId) {
    const [driver] = await db.select().from(usersTable).where(eq(usersTable.id, trip.driverId));
    driverName = driver?.name ?? null;
  }
  const reservations = await db.select().from(reservationsTable).where(eq(reservationsTable.tripId, params.data.id));
  const passengers = await Promise.all(reservations.map(async (r) => {
    const bags = await db.select().from(baggageTable).where(eq(baggageTable.reservationId, r.id));
    return {
      reservationId: r.id,
      passengerName: r.passengerName,
      seatNumber: r.seatNumber,
      status: r.status,
      baggageCount: bags.length,
    };
  }));
  const boardedCount = passengers.filter(p => p.status === "boarded").length;
  const manifest = {
    tripId: trip.id,
    departureDate: trip.departureDate,
    departureTime: trip.departureTime,
    originCity: dest?.originCity ?? "",
    destinationCity: dest?.destinationCity ?? "",
    vehicleLicensePlate: vehicle?.licensePlate ?? "",
    driverName,
    totalSeats: trip.seatsTotal,
    bookedSeats: reservations.length,
    boardedCount,
    passengers,
  };
  res.json(GetTripManifestResponse.parse(manifest));
});

export default router;
