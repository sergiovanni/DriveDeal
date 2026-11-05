import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

/**
 * Journal d'audit : trace des opérations sensibles (docs/02 BNF-01, docs/06).
 *
 * Qui a fait quoi, sur quoi, et quand. Exemples d'actions : « vehicule.cree »,
 * « vehicule.publie », « vehicule.supprime ».
 *
 * Sécurité :
 *  - RLS activée SANS politique : l'API publique ne peut ni lire ni écrire ce journal.
 *    Seul le serveur (connexion directe) y écrit, après avoir vérifié les droits.
 *  - Le journal est en ajout seul : le code ne modifie ni ne supprime jamais une ligne.
 *  - On n'y met JAMAIS de mot de passe, de clé ni de donnée bancaire : seulement des
 *    identifiants et des valeurs métier utiles à la traçabilité.
 */
export const journalAudit = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /**
     * Auteur de l'action. Si son compte est supprimé, la trace est conservée
     * (`ON DELETE SET NULL`) : on garde l'historique sans conserver l'identité.
     */
    acteurId: uuid("actor_id").references(() => authUsers.id, { onDelete: "set null" }),
    /** Ce qui a été fait, au format « objet.verbe » (ex. « vehicule.publie »). */
    action: text("action").notNull(),
    /** Type d'objet concerné (ex. « vehicule »). */
    typeEntite: text("entity_type").notNull(),
    /** Identifiant de l'objet concerné (texte, pour rester général). */
    idEntite: text("entity_id"),
    /** Détails utiles (ancien et nouveau statut, champs modifiés…). */
    details: jsonb("details").$type<Record<string, unknown>>(),
    creeLe: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_entite_idx").on(t.typeEntite, t.idEntite),
    index("audit_date_idx").on(t.creeLe),
  ],
).enableRLS();
