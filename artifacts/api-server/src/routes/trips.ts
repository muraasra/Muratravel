import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, tripsTable, destinationsTable, vehiclesTable, usersTable, reservationsTable, baggageTable } from "@workspace/db";
import {
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
import { z } from "zod";
import { tenantCompanyId } from "../middlewares/auth";

const router = Router();

// A trip needs neither a bus nor to be a one-off: a vehicle is optional, and a
// "recurring" trip materialises one departure per day over a period.
const CreateTripInput = z.object({
  destinationId: z.number().int(),
  vehicleId: z.number().int().nullish(),
  driverId: z.number().int().nullish(),
  departureDate: z.string(),
  departureTime: z.string(),
  arrivalDate: z.string().nullish(),
  arrivalTime: z.string().nullish(),
  price: z.number().default(0),
  offerType: z.string().nullish(),
  capacity: z.number().int().positive().nullish(), // used when no vehicle is assigned
  notes: z.string().nullish(),
  recurring: z.boolean().optional(),
  recurrenceEndDate: z.string().optional(), // inclusive last day of the period
});

function eachDate(start: string, end: string): string[] {
  const out: string[] = [];
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return [start];
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().split("T")[0]);
    if (out.length > 366) break; // safety cap (max ~1 year)
  }
  return out;
}

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

// Helper: fetch a trip only if it belongs to the caller's company.
async function ownedTrip(req: import("express").Request, id: number) {
  const [trip] = await db.select().from(tripsTable).where(and(eq(tripsTable.id, id), eq(tripsTable.companyId, tenantCompanyId(req))));
  return trip ?? null;
}

router.get("/trips", async (req, res): Promise<void> => {
  const qp = ListTripsQueryParams.safeParse(req.query);
  const conditions = [eq(tripsTable.companyId, tenantCompanyId(req))];
  if (qp.success) {
    if (qp.data.status != null) conditions.push(eq(tripsTable.status, qp.data.status));
    if (qp.data.destinationId != null) conditions.push(eq(tripsTable.destinationId, qp.data.destinationId));
  }
  const rows = await db.select().from(tripsTable).where(and(...conditions)).orderBy(tripsTable.departureDate);
  const enriched = await Promise.all(rows.map(enrichTrip));
  res.json(ListTripsResponse.parse(enriched));
});

router.post("/trips", async (req, res): Promise<void> => {
  const parsed = CreateTripInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }); return; }
  const companyId = tenantCompanyId(req);
  const d = parsed.data;

  // Vehicle is optional; when present it must belong to the company and sets capacity.
  const vehicle = d.vehicleId
    ? (await db.select().from(vehiclesTable).where(and(eq(vehiclesTable.id, d.vehicleId), eq(vehiclesTable.companyId, companyId))))[0]
    : null;
  const seats = vehicle?.seatCount ?? d.capacity ?? 0;

  const base = {
    destinationId: d.destinationId,
    vehicleId: vehicle?.id ?? null,
    driverId: d.driverId ?? null,
    departureTime: d.departureTime,
    arrivalDate: d.arrivalDate ?? null,
    arrivalTime: d.arrivalTime ?? null,
    companyId,
    price: String(d.price),
    offerType: d.offerType ?? null,
    notes: d.notes ?? null,
    seatsTotal: seats,
    seatsAvailable: seats,
  };

  // Recurring: one departure per day across the period.
  const dates = (d.recurring && d.recurrenceEndDate)
    ? eachDate(d.departureDate, d.recurrenceEndDate)
    : [d.departureDate];

  const rows = dates.map((date) => ({ ...base, departureDate: date }));
  const inserted = await db.insert(tripsTable).values(rows).returning();

  if (inserted.length > 1) {
    res.status(201).json({ created: inserted.length, from: dates[0], to: dates[dates.length - 1], firstTrip: await enrichTrip(inserted[0]) });
    return;
  }
  res.status(201).json(GetTripResponse.parse(await enrichTrip(inserted[0])));
});

router.get("/trips/:id", async (req, res): Promise<void> => {
  const params = GetTripParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const trip = await ownedTrip(req, params.data.id);
  if (!trip) { res.status(404).json({ error: "Trip not found" }); return; }
  res.json(GetTripResponse.parse(await enrichTrip(trip)));
});

router.patch("/trips/:id", async (req, res): Promise<void> => {
  const params = UpdateTripParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateTripBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.price != null) updateData.price = String(parsed.data.price);
  const [trip] = await db.update(tripsTable).set(updateData)
    .where(and(eq(tripsTable.id, params.data.id), eq(tripsTable.companyId, tenantCompanyId(req)))).returning();
  if (!trip) { res.status(404).json({ error: "Trip not found" }); return; }
  res.json(UpdateTripResponse.parse(await enrichTrip(trip)));
});

router.delete("/trips/:id", async (req, res): Promise<void> => {
  const params = DeleteTripParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [trip] = await db.delete(tripsTable)
    .where(and(eq(tripsTable.id, params.data.id), eq(tripsTable.companyId, tenantCompanyId(req)))).returning();
  if (!trip) { res.status(404).json({ error: "Trip not found" }); return; }
  res.sendStatus(204);
});

router.patch("/trips/:id/cancel", async (req, res): Promise<void> => {
  const params = CancelTripParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [trip] = await db.update(tripsTable).set({ status: "cancelled" })
    .where(and(eq(tripsTable.id, params.data.id), eq(tripsTable.companyId, tenantCompanyId(req)))).returning();
  if (!trip) { res.status(404).json({ error: "Trip not found" }); return; }
  res.json(CancelTripResponse.parse(await enrichTrip(trip)));
});

router.patch("/trips/:id/close", async (req, res): Promise<void> => {
  const params = CloseTripParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [trip] = await db.update(tripsTable).set({ status: "arrived" })
    .where(and(eq(tripsTable.id, params.data.id), eq(tripsTable.companyId, tenantCompanyId(req)))).returning();
  if (!trip) { res.status(404).json({ error: "Trip not found" }); return; }
  res.json(CloseTripResponse.parse(await enrichTrip(trip)));
});

router.get("/trips/:id/manifest", async (req, res): Promise<void> => {
  const params = GetTripManifestParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const trip = await ownedTrip(req, params.data.id);
  if (!trip) { res.status(404).json({ error: "Trip not found" }); return; }
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
