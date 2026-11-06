import { sql } from "drizzle-orm";
import { pgPolicy, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { authUsers, authenticatedRole } from "drizzle-orm/supabase";
import { vehicules } from "./catalogue";

/**
 * Favoris d'un client (docs/03, module M6).
 *
 * Sécurité : un client connecté ne peut lire, ajouter et retirer QUE ses propres favoris.
 * La clé primaire (utilisateur, véhicule) empêche d'ajouter deux fois le même véhicule.
 */
export const favoris = pgTable(
  "favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    vehiculeId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicules.id, { onDelete: "cascade" }),
    creeLe: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.vehiculeId] }),
    pgPolicy("favoris_lecture_proprietaire", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = user_id`,
    }),
    pgPolicy("favoris_ajout_proprietaire", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = user_id`,
    }),
    pgPolicy("favoris_suppression_proprietaire", {
      for: "delete",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = user_id`,
    }),
  ],
).enableRLS();
