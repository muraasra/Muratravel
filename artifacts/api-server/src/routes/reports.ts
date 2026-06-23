import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, tripsTable, reservationsTable, vehiclesTable, paymentsTable, destinationsTable } from "@workspace/db";
import {
  GetRevenueReportQueryParams,
  GetTopDestinationsQueryParams,
  GetRecentActivityQueryParams,
} from "@workspace/api-zod";
import { tenantCompanyId } from "../middlewares/auth";

const router = Router();

router.get("/reports/dashboard", async (req, res): Promise<void> => {
  const companyId = tenantCompanyId(req);
  const today = new Date().toISOString().split("T")[0];

  const allTrips = await db.select().from(tripsTable).where(eq(tripsTable.companyId, companyId));
  const allReservations = await db.select().from(reservationsTable).where(eq(reservationsTable.companyId, companyId));
  const allPayments = await db.select().from(paymentsTable).where(eq(paymentsTable.companyId, companyId));
  const allVehicles = await db.select().from(vehiclesTable).where(eq(vehiclesTable.companyId, companyId));

  const totalRevenue = allPayments.filter(p => p.status === "completed").reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const todayPayments = allPayments.filter(p => p.createdAt.toISOString().startsWith(today));
  const revenueToday = todayPayments.filter(p => p.status === "completed").reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const todayReservations = allReservations.filter(r => r.createdAt.toISOString().startsWith(today));
  const todayTrips = allTrips.filter(t => t.departureDate === today);
  const upcomingTrips = allTrips.filter(t => t.departureDate >= today && t.status === "scheduled").length;
  const activeVehicles = allVehicles.filter(v => v.status === "in_service" || v.status === "available").length;

  const bookedSeats = allReservations.filter(r => r.status !== "cancelled").length;
  const totalSeats = allTrips.reduce((sum, t) => sum + t.seatsTotal, 0);
  const occupancyRate = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

  res.json({
    totalRevenue,
    totalTrips: allTrips.length,
    totalReservations: allReservations.length,
    totalPassengers: allReservations.filter(r => r.status !== "cancelled").length,
    activeVehicles,
    upcomingTrips,
    occupancyRate,
    revenueToday,
    reservationsToday: todayReservations.length,
    tripsToday: todayTrips.length,
  });
});

router.get("/reports/revenue", async (req, res): Promise<void> => {
  const companyId = tenantCompanyId(req);
  const qp = GetRevenueReportQueryParams.safeParse(req.query);
  const period = qp.success ? qp.data.period ?? "monthly" : "monthly";

  const payments = await db.select().from(paymentsTable).where(and(eq(paymentsTable.companyId, companyId), eq(paymentsTable.status, "completed")));

  const grouped: Record<string, { revenue: number; reservations: number }> = {};
  for (const p of payments) {
    const date = p.createdAt;
    let key: string;
    if (period === "daily") {
      key = date.toISOString().split("T")[0];
    } else if (period === "weekly") {
      const d = new Date(date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      key = weekStart.toISOString().split("T")[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
    if (!grouped[key]) grouped[key] = { revenue: 0, reservations: 0 };
    grouped[key].revenue += parseFloat(p.amount);
    grouped[key].reservations += 1;
  }

  const result = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([period, data]) => ({ period, ...data }));
  res.json(result);
});

router.get("/reports/occupancy", async (req, res): Promise<void> => {
  const companyId = tenantCompanyId(req);
  const trips = await db.select().from(tripsTable).where(eq(tripsTable.companyId, companyId));
  const reservations = await db.select().from(reservationsTable).where(eq(reservationsTable.companyId, companyId));
  const destinations = await db.select().from(destinationsTable).where(eq(destinationsTable.companyId, companyId));
  const destMap = new Map(destinations.map(d => [d.id, d]));

  const routeData: Record<string, { totalSeats: number; bookedSeats: number }> = {};
  for (const trip of trips) {
    const dest = destMap.get(trip.destinationId);
    const route = dest ? `${dest.originCity} → ${dest.destinationCity}` : `Route #${trip.destinationId}`;
    if (!routeData[route]) routeData[route] = { totalSeats: 0, bookedSeats: 0 };
    routeData[route].totalSeats += trip.seatsTotal;
  }
  for (const r of reservations) {
    if (r.status === "cancelled") continue;
    const trip = trips.find(t => t.id === r.tripId);
    if (!trip) continue;
    const dest = destMap.get(trip.destinationId);
    const route = dest ? `${dest.originCity} → ${dest.destinationCity}` : `Route #${trip.destinationId}`;
    if (routeData[route]) routeData[route].bookedSeats += 1;
  }

  const result = Object.entries(routeData).map(([route, data]) => ({
    route,
    totalSeats: data.totalSeats,
    bookedSeats: data.bookedSeats,
    occupancyRate: data.totalSeats > 0 ? Math.round((data.bookedSeats / data.totalSeats) * 100) : 0,
  }));
  res.json(result);
});

router.get("/reports/top-destinations", async (req, res): Promise<void> => {
  const companyId = tenantCompanyId(req);
  const qp = GetTopDestinationsQueryParams.safeParse(req.query);
  const limit = (qp.success && qp.data.limit) ? qp.data.limit : 10;

  const trips = await db.select().from(tripsTable).where(eq(tripsTable.companyId, companyId));
  const reservations = await db.select().from(reservationsTable).where(eq(reservationsTable.companyId, companyId));
  const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.companyId, companyId));
  const destinations = await db.select().from(destinationsTable).where(eq(destinationsTable.companyId, companyId));

  const destMap = new Map(destinations.map(d => [d.id, d]));
  const paymentsByReservation = new Map(payments.filter(p => p.status === "completed").map(p => [p.reservationId, p]));
  const routeStats: Record<string, { tripCount: number; reservationCount: number; revenue: number }> = {};

  for (const trip of trips) {
    const dest = destMap.get(trip.destinationId);
    const route = dest ? `${dest.originCity} → ${dest.destinationCity}` : `Route #${trip.destinationId}`;
    if (!routeStats[route]) routeStats[route] = { tripCount: 0, reservationCount: 0, revenue: 0 };
    routeStats[route].tripCount += 1;
  }
  for (const r of reservations) {
    if (r.status === "cancelled") continue;
    const trip = trips.find(t => t.id === r.tripId);
    if (!trip) continue;
    const dest = destMap.get(trip.destinationId);
    const route = dest ? `${dest.originCity} → ${dest.destinationCity}` : `Route #${trip.destinationId}`;
    if (routeStats[route]) {
      routeStats[route].reservationCount += 1;
      const payment = paymentsByReservation.get(r.id);
      if (payment) routeStats[route].revenue += parseFloat(payment.amount);
    }
  }

  const result = Object.entries(routeStats)
    .map(([route, stats]) => ({ route, ...stats }))
    .sort((a, b) => b.reservationCount - a.reservationCount)
    .slice(0, limit);
  res.json(result);
});

router.get("/reports/recent-activity", async (req, res): Promise<void> => {
  const companyId = tenantCompanyId(req);
  const qp = GetRecentActivityQueryParams.safeParse(req.query);
  const limit = (qp.success && qp.data.limit) ? qp.data.limit : 20;

  const recentReservations = await db.select().from(reservationsTable).where(eq(reservationsTable.companyId, companyId)).orderBy(desc(reservationsTable.createdAt)).limit(Math.ceil(limit / 2));
  const recentPayments = await db.select().from(paymentsTable).where(eq(paymentsTable.companyId, companyId)).orderBy(desc(paymentsTable.createdAt)).limit(Math.ceil(limit / 2));

  const activities: Array<{ id: number; type: string; description: string; entityId: number; timestamp: string }> = [];
  for (const r of recentReservations) {
    activities.push({
      id: r.id,
      type: r.status === "boarded" ? "passenger_boarded" : "reservation_created",
      description: `Réservation de ${r.passengerName} — billet ${r.ticketCode}`,
      entityId: r.id,
      timestamp: r.createdAt.toISOString(),
    });
  }
  for (const p of recentPayments) {
    activities.push({
      id: p.id + 10000,
      type: "payment_received",
      description: `Paiement de ${parseFloat(p.amount).toFixed(0)} reçu via ${p.method}`,
      entityId: p.reservationId,
      timestamp: p.createdAt.toISOString(),
    });
  }
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(activities.slice(0, limit));
});

export default router;
