import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const baggageTable = pgTable("baggage", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id").notNull(),
  trackingCode: text("tracking_code").notNull(),
  weight: numeric("weight").notNull().default("0"),
  type: text("type").notNull().default("standard"),
  price: numeric("price").notNull().default("0"),
  status: text("status").notNull().default("registered"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBaggageSchema = createInsertSchema(baggageTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBaggage = z.infer<typeof insertBaggageSchema>;
export type Baggage = typeof baggageTable.$inferSelect;
