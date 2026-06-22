import { pgTable, serial, text, integer, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tripsTable = pgTable("trips", {
  id: serial("id").primaryKey(),
  departureDate: date("departure_date", { mode: "string" }).notNull(),
  departureTime: text("departure_time").notNull(),
  arrivalDate: date("arrival_date", { mode: "string" }),
  arrivalTime: text("arrival_time"),
  destinationId: integer("destination_id").notNull(),
  vehicleId: integer("vehicle_id").notNull(),
  driverId: integer("driver_id"),
  companyId: integer("company_id").notNull(),
  price: numeric("price").notNull().default("0"),
  status: text("status").notNull().default("scheduled"),
  seatsAvailable: integer("seats_available").notNull().default(0),
  seatsTotal: integer("seats_total").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTripSchema = createInsertSchema(tripsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof tripsTable.$inferSelect;
