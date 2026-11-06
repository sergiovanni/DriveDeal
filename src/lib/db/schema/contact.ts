import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Messages reçus via le formulaire de contact (docs/06 : contact_messages).
 * RLS activée sans politique : seul le serveur (connexion directe) y accède.
 */
export const messagesContact = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  nom: text("nom").notNull(),
  email: text("email").notNull(),
  telephone: text("telephone"),
  sujet: text("sujet").notNull(),
  vehiculeReference: text("vehicule_reference"),
  message: text("message").notNull(),
  consentement: boolean("consentement").notNull(),
  statut: text("statut").notNull().default("nouveau"),
  creeLe: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
