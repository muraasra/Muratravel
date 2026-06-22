import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(), // connexion | creation | modification | suppression | export | consultation
  module: text("module").notNull(),
  description: text("description").notNull(),
  userId: text("user_id"), // UUID from Supabase auth
  userEmail: text("user_email"),
  userName: text("user_name"),
  companyId: integer("company_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  statut: text("statut").notNull().default("succes"), // succes | echec
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogsTable).omit({ id: true, createdAt: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogsTable.$inferSelect;
