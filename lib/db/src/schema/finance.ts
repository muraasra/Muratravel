import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // encaissement | depense | remboursement
  montant: numeric("montant").notNull(),
  description: text("description").notNull(),
  methode: text("methode").notNull().default("cash"), // cash | card | mobile_money | bank_transfer
  reference: text("reference").notNull(),
  companyId: integer("company_id").notNull(),
  agencyId: integer("agency_id"),
  reservationId: integer("reservation_id"),
  tripId: integer("trip_id"),
  userId: text("user_id"), // agent qui a effectué la transaction
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
