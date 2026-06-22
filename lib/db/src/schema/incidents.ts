import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const incidentsTable = pgTable("incidents", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // bagage_perdu | reclamation | retard | incident_vehicule
  titre: text("titre").notNull(),
  description: text("description").notNull(),
  statut: text("statut").notNull().default("ouvert"), // ouvert | en_cours | resolu | ferme
  priorite: text("priorite").notNull().default("normale"), // faible | normale | haute | critique
  rapportePar: text("rapporte_par").notNull(),
  companyId: integer("company_id").notNull(),
  tripId: integer("trip_id"),
  reservationId: integer("reservation_id"),
  vehicleId: integer("vehicle_id"),
  notes: text("notes"),
  dateResolution: timestamp("date_resolution", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertIncidentSchema = createInsertSchema(incidentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidentsTable.$inferSelect;
