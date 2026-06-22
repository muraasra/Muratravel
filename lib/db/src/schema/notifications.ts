import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  canal: text("canal").notNull(), // sms | email | whatsapp
  declencheur: text("declencheur").notNull(), // confirmation_reservation | modification_voyage | annulation_voyage | rappel_depart | manuel
  destinataire: text("destinataire").notNull(),
  message: text("message").notNull(),
  statut: text("statut").notNull().default("en_attente"), // en_attente | envoyee | echec
  companyId: integer("company_id").notNull(),
  reservationId: integer("reservation_id"),
  tripId: integer("trip_id"),
  tentatives: integer("tentatives").notNull().default(0),
  erreur: text("erreur"),
  envoyeA: timestamp("envoye_a", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationConfigTable = pgTable("notification_config", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().unique(),
  confirmationSms: boolean("confirmation_sms").notNull().default(true),
  confirmationEmail: boolean("confirmation_email").notNull().default(true),
  confirmationWhatsapp: boolean("confirmation_whatsapp").notNull().default(false),
  modificationSms: boolean("modification_sms").notNull().default(true),
  modificationEmail: boolean("modification_email").notNull().default(true),
  annulationSms: boolean("annulation_sms").notNull().default(true),
  annulationEmail: boolean("annulation_email").notNull().default(true),
  rappelSms: boolean("rappel_sms").notNull().default(true),
  rappelWhatsapp: boolean("rappel_whatsapp").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
