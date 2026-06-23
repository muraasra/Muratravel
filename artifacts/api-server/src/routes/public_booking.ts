import { Router } from "express";
import { eq, and, gte } from "drizzle-orm";
import { db, companiesTable, tripsTable, destinationsTable, reservationsTable } from "@workspace/db";
import { z } from "zod";
import { randomBytes } from "crypto";
import { BookingConfigSchema, DEFAULT_BOOKING_CONFIG, validateCustomData, type BookingConfig } from "../lib/booking";

const router = Router();

// Trips departing within this many minutes are closed to online booking.
const CUTOFF_MINUTES = 15;

async function companyBySlug(slug: string) {
  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.bookingSlug, slug));
  if (!company || !company.bookingEnabled) return null;
  return company;
}

function parseConfig(raw: unknown): BookingConfig {
  const r = BookingConfigSchema.safeParse(raw);
  return r.success ? r.data : DEFAULT_BOOKING_CONFIG;
}

/** Is a trip still bookable online? (not full, not within the cutoff window) */
function bookableState(departureDate: string, departureTime: string, seatsAvailable: number): { isFull: boolean; tooLate: boolean } {
  const isFull = seatsAvailable <= 0;
  let tooLate = false;
  const dep = new Date(`${departureDate}T${(departureTime || "00:00").slice(0, 5)}:00`);
  if (!Number.isNaN(dep.getTime())) {
    tooLate = dep.getTime() - Date.now() < CUTOFF_MINUTES * 60 * 1000;
  }
  return { isFull, tooLate };
}

// GET /api/public/company/:slug  — public company info + form configuration.
router.get("/public/company/:slug", async (req, res): Promise<void> => {
  const company = await companyBySlug(req.params.slug);
  if (!company) { res.status(404).json({ error: "Page de réservation introuvable." }); return; }
  res.json({
    name: company.name,
    country: company.country,
    currency: company.currency,
    phone: company.phone,
    email: company.email,
    bookingConfig: parseConfig(company.bookingConfig),
  });
});

// GET /api/public/company/:slug/routes  — available origin/destination options.
router.get("/public/company/:slug/routes", async (req, res): Promise<void> => {
  const company = await companyBySlug(req.params.slug);
  if (!company) { res.status(404).json({ error: "Introuvable." }); return; }
  const dests = await db.select().from(destinationsTable).where(eq(destinationsTable.companyId, company.id));
  const origins = [...new Set(dests.map(d => d.originCity))].sort();
  const destinations = [...new Set(dests.map(d => d.destinationCity))].sort();
  // pairs lets the UI restrict destinations to those reachable from a chosen origin
  const pairs = dests.map(d => ({ origin: d.originCity, destination: d.destinationCity }));
  res.json({ origins, destinations, pairs });
});

// GET /api/public/company/:slug/trips?origin=&destination=&date=  — bookable trips for a day.
router.get("/public/company/:slug/trips", async (req, res): Promise<void> => {
  const company = await companyBySlug(req.params.slug);
  if (!company) { res.status(404).json({ error: "Introuvable." }); return; }

  const origin = (req.query.origin as string | undefined)?.trim();
  const destination = (req.query.destination as string | undefined)?.trim();
  const date = (req.query.date as string | undefined)?.trim();
  const today = new Date().toISOString().split("T")[0];

  const conditions = [eq(tripsTable.companyId, company.id), eq(tripsTable.status, "scheduled")];
  if (date) conditions.push(eq(tripsTable.departureDate, date));
  else conditions.push(gte(tripsTable.departureDate, today));

  const trips = await db.select().from(tripsTable).where(and(...conditions)).orderBy(tripsTable.departureTime);
  const dests = await db.select().from(destinationsTable).where(eq(destinationsTable.companyId, company.id));
  const destMap = new Map(dests.map(d => [d.id, d]));

  const result = trips
    .map(t => {
      const d = destMap.get(t.destinationId);
      return { t, d };
    })
    .filter(({ d }) => {
      if (!d) return false;
      if (origin && d.originCity !== origin) return false;
      if (destination && d.destinationCity !== destination) return false;
      return true;
    })
    .map(({ t, d }) => {
      const { isFull, tooLate } = bookableState(t.departureDate, t.departureTime, t.seatsAvailable);
      return {
        id: t.id,
        departureDate: t.departureDate,
        departureTime: t.departureTime,
        originCity: d!.originCity,
        destinationCity: d!.destinationCity,
        price: parseFloat(t.price),
        offerType: t.offerType ?? null,
        seatsAvailable: t.seatsAvailable,
        seatsTotal: t.seatsTotal,
        isFull,
        bookable: !isFull && !tooLate,
        reason: isFull ? "complet" : tooLate ? "trop_tard" : null,
      };
    });

  res.json(result);
});

// POST /api/public/company/:slug/reservations  — create a public reservation.
const PublicReservationBody = z.object({
  tripId: z.number().int(),
  passengerName: z.string().min(2),
  passengerPhone: z.string().min(4),
  passengerEmail: z.string().email().optional().or(z.literal("")),
  passengerIdNumber: z.string().optional(),
  seatNumber: z.string().optional(),
  customData: z.record(z.unknown()).optional(),
});

router.post("/public/company/:slug/reservations", async (req, res): Promise<void> => {
  const company = await companyBySlug(req.params.slug);
  if (!company) { res.status(404).json({ error: "Page de réservation introuvable." }); return; }

  const parsed = PublicReservationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }); return; }
  const data = parsed.data;
  const config = parseConfig(company.bookingConfig);

  // Built-in field requirements.
  const missing: string[] = [];
  if (config.fields.email === "required" && !data.passengerEmail) missing.push("email");
  if (config.fields.idNumber === "required" && !data.passengerIdNumber) missing.push("pièce d'identité");
  if (config.fields.seat === "required" && !data.seatNumber) missing.push("siège");

  // Custom field validation.
  const custom = validateCustomData(config.customFields, data.customData);
  missing.push(...custom.errors);
  if (missing.length) { res.status(400).json({ error: `Champs requis manquants : ${missing.join(", ")}.` }); return; }

  // The trip must belong to this company and still be bookable.
  const today = new Date().toISOString().split("T")[0];
  const [trip] = await db.select().from(tripsTable).where(and(
    eq(tripsTable.id, data.tripId),
    eq(tripsTable.companyId, company.id),
    eq(tripsTable.status, "scheduled"),
    gte(tripsTable.departureDate, today),
  ));
  if (!trip) { res.status(404).json({ error: "Voyage indisponible." }); return; }
  const { isFull, tooLate } = bookableState(trip.departureDate, trip.departureTime, trip.seatsAvailable);
  if (isFull) { res.status(409).json({ error: "Complet : plus de place disponible." }); return; }
  if (tooLate) { res.status(409).json({ error: "Réservation en ligne fermée (départ imminent)." }); return; }

  const ticketCode = `TKT-${randomBytes(4).toString("hex").toUpperCase()}`;
  const [reservation] = await db.insert(reservationsTable).values({
    tripId: trip.id,
    companyId: company.id,
    passengerName: data.passengerName,
    passengerPhone: data.passengerPhone,
    passengerEmail: data.passengerEmail || null,
    passengerIdNumber: data.passengerIdNumber || null,
    seatNumber: data.seatNumber || null,
    price: trip.price,
    status: "reserved",
    ticketCode,
    notes: "Réservation en ligne",
    customData: Object.keys(custom.data).length ? custom.data : null,
  }).returning();

  await db.update(tripsTable).set({ seatsAvailable: trip.seatsAvailable - 1 }).where(eq(tripsTable.id, trip.id));

  const [dest] = await db.select().from(destinationsTable).where(eq(destinationsTable.id, trip.destinationId));
  res.status(201).json({
    ticketCode: reservation.ticketCode,
    passengerName: reservation.passengerName,
    seatNumber: reservation.seatNumber,
    price: parseFloat(reservation.price),
    currency: company.currency,
    originCity: dest?.originCity ?? "",
    destinationCity: dest?.destinationCity ?? "",
    departureDate: trip.departureDate,
    departureTime: trip.departureTime,
    offerType: trip.offerType ?? null,
    companyName: company.name,
  });
});

export default router;
