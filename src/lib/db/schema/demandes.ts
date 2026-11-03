import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { vehicules } from "./catalogue";

/**
 * Demandes d'intérêt pour un véhicule (« Faire une demande » sur la fiche).
 *
 * DriveDeal ne vend pas en ligne : le visiteur laisse ses coordonnées et l'entreprise le
 * recontacte pour discuter. Cette table remplace, pour l'instant, le parcours de commande.
 *
 * Sécurité :
 *  - RLS activée SANS politique : l'API publique ne peut ni lire ni écrire ces lignes
 *    (données personnelles). Seul le serveur y accède : écriture après validation du
 *    formulaire public, lecture réservée aux administrateurs.
 *  - Le véhicule est relié par son identifiant (`ON DELETE SET NULL`) ET sa référence est
 *    copiée : la demande reste lisible même si le véhicule est supprimé plus tard.
 */
export const demandesVehicule = pgTable(
  "vehicle_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehiculeId: uuid("vehicle_id").references(() => vehicules.id, { onDelete: "set null" }),
    /** Copie de la référence au moment de la demande (ex. « DD-0004 »). */
    vehiculeReference: text("vehicle_reference").notNull(),
    prenom: text("first_name").notNull(),
    nom: text("last_name").notNull(),
    email: text("email").notNull(),
    telephone: text("phone"),
    codePostal: text("postal_code").notNull(),
    consentement: boolean("consent").notNull(),
    /** « nouvelle » à la réception ; l'équipe fera évoluer le suivi plus tard. */
    statut: text("status").notNull().default("nouvelle"),
    creeLe: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("demandes_date_idx").on(t.creeLe), index("demandes_vehicule_idx").on(t.vehiculeId)],
).enableRLS();
