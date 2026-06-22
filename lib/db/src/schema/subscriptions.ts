import { pgTable, serial, text, integer, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().unique(),
  plan: text("plan").notNull().default("starter"), // starter | business | enterprise
  statut: text("statut").notNull().default("essai"), // essai | actif | expire | suspendu
  dateDebut: date("date_debut", { mode: "string" }).notNull(),
  dateFin: date("date_fin", { mode: "string" }).notNull(),
  prixMensuel: numeric("prix_mensuel").notNull().default("0"),
  agencesMax: integer("agences_max").notNull().default(2),
  utilisateursMax: integer("utilisateurs_max").notNull().default(5),
  voyagesMax: integer("voyages_max"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;
