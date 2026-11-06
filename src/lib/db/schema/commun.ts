import { timestamp } from "drizzle-orm/pg-core";

/**
 * Colonnes d'horodatage communes à la plupart des tables.
 * Les dates sont stockées en UTC (`timestamptz`) et formatées seulement à l'affichage.
 */
export const horodatage = {
  creeLe: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  modifieLe: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};
