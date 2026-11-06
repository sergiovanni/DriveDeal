/**
 * Listes de valeurs partagées entre la base de données et le code applicatif.
 *
 * Ce fichier ne dépend de rien (ni Drizzle, ni React) pour pouvoir être importé partout.
 * Les types TypeScript des modules en sont déduits : modifier une liste ici met à jour les
 * types, et la contrainte SQL du schéma qui s'en sert.
 */

/**
 * Statuts d'un véhicule (docs/04, RG-V02 — proposition à valider).
 * - brouillon : en cours de saisie, invisible du public
 * - publie    : visible au catalogue et achetable
 * - reserve   : réservé pendant un paiement (durée à définir, docs/08 I-06)
 * - vendu     : vendu, ne peut plus l'être
 * - archive   : retiré du catalogue sans être supprimé
 */
export const STATUTS_VEHICULE = [
  "brouillon",
  "publie",
  "reserve",
  "vendu",
  "archive",
] as const;

/**
 * Valeurs de référence des caractéristiques d'un véhicule.
 * En base, ces champs sont du texte libre (les catégories exactes restent à valider,
 * docs/08 section 4) ; ces listes servent aux filtres et à la saisie côté application.
 */
export const CARBURANTS = ["Essence", "Diesel", "Hybride", "Électrique"] as const;
export const BOITES = ["Manuelle", "Automatique"] as const;
export const TRANSMISSIONS = ["Traction", "Propulsion", "Intégrale"] as const;
export const CARROSSERIES = [
  "Berline",
  "SUV",
  "Break",
  "Coupé",
  "Citadine",
  "Cabriolet",
] as const;

/** Rôles de base de l'application (docs/02 BF-12 : d'autres rôles viendront plus tard). */
export const ROLES_DE_BASE = [
  { code: "client", libelle: "Client" },
  { code: "administrateur", libelle: "Administrateur" },
] as const;

/** Visibilité d'un document attaché à un véhicule. */
export const VISIBILITES_DOCUMENT = ["public", "prive"] as const;
