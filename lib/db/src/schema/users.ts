import { pgTable, serial, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  supabaseId: uuid("supabase_id").unique(), // Lié à auth.users de Supabase
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("client"),
  // Rôles: super_admin | company_admin | agency_manager | booking_agent | boarding_agent | controller | accountant | driver | client
  companyId: integer("company_id"),
  agencyId: integer("agency_id"),
  phone: text("phone"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
