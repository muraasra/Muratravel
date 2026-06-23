import { pgTable, serial, text, integer, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reservationsTable = pgTable("reservations", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  companyId: integer("company_id"),
  passengerName: text("passenger_name").notNull(),
  passengerPhone: text("passenger_phone").notNull(),
  passengerEmail: text("passenger_email"),
  passengerIdNumber: text("passenger_id_number"),
  seatNumber: text("seat_number"),
  price: numeric("price").notNull().default("0"),
  status: text("status").notNull().default("reserved"),
  ticketCode: text("ticket_code").notNull(),
  agencyId: integer("agency_id"),
  agentId: integer("agent_id"),
  notes: text("notes"),
  customData: jsonb("custom_data"), // réponses aux champs personnalisés du formulaire
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertReservationSchema = createInsertSchema(reservationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservationsTable.$inferSelect;
