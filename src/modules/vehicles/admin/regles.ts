import type { StatutVehicule } from "../types";

/**
 * Règles métier du back-office des véhicules (docs/04, section 1 — PROPOSITIONS à valider).
 *
 * Fichier « pur » (aucun accès base) : facile à tester et à relire. Les actions serveur
 * s'appuient dessus avant toute modification en base.
 */

/**
 * Transitions de statut qu'un administrateur peut faire à la main.
 *
 *   brouillon ⇄ publie        (publier / dépublier)
 *   brouillon  → archive      (ranger sans supprimer)
 *   publie     → archive
 *   archive    → brouillon    (ressortir pour le modifier)
 *
 * Les statuts « reserve » et « vendu » ne sont PAS modifiables ici : ils seront gérés par le
 * module des commandes (réservation pendant le paiement, vente confirmée). Un véhicule dans
 * l'un de ces statuts est donc verrouillé côté administration (docs/08, points I-04 et I-06).
 */
const TRANSITIONS: Record<StatutVehicule, readonly StatutVehicule[]> = {
  brouillon: ["publie", "archive"],
  publie: ["brouillon", "archive"],
  archive: ["brouillon"],
  reserve: [],
  vendu: [],
};

/** Vrai si l'administrateur peut faire passer un véhicule de `de` à `vers`. */
export function transitionAutorisee(de: StatutVehicule, vers: StatutVehicule): boolean {
  return TRANSITIONS[de]?.includes(vers) ?? false;
}

/** Statuts vers lesquels on peut aller depuis `de` (pour afficher les boutons proposés). */
export function transitionsPossibles(de: StatutVehicule): readonly StatutVehicule[] {
  return TRANSITIONS[de] ?? [];
}

/** Libellés français des statuts. */
export const LIBELLES_STATUT: Record<StatutVehicule, string> = {
  brouillon: "Brouillon",
  publie: "Publié",
  reserve: "Réservé",
  vendu: "Vendu",
  archive: "Archivé",
};

/** Libellé de l'action qui mène à un statut (texte du bouton). */
export const LIBELLES_ACTION: Record<StatutVehicule, string> = {
  brouillon: "Repasser en brouillon",
  publie: "Publier",
  reserve: "Réserver",
  vendu: "Marquer vendu",
  archive: "Archiver",
};

/** Vrai si le véhicule est verrouillé (géré par les commandes, pas par l'administration). */
export function estVerrouille(statut: StatutVehicule): boolean {
  return TRANSITIONS[statut].length === 0;
}

/** Seul un BROUILLON peut être supprimé définitivement (docs/04, RG-V04). Les autres s'archivent. */
export function peutEtreSupprime(statut: StatutVehicule): boolean {
  return statut === "brouillon";
}

/** Nombre minimal de photos pour publier un véhicule (docs/03, module M2). */
export const PHOTOS_MINIMUM_POUR_PUBLIER = 1;

export type ProblemePublication = { champ: string; message: string };

/**
 * Liste ce qui empêche de publier un véhicule. Liste vide = publication possible.
 * (Les champs techniques obligatoires sont déjà exigés dès la création du véhicule.)
 */
export function problemesPourPublier(v: {
  prixCentimes: number;
  nombrePhotos: number;
}): ProblemePublication[] {
  const problemes: ProblemePublication[] = [];
  if (v.prixCentimes <= 0) {
    problemes.push({ champ: "prix", message: "Indiquez un prix supérieur à 0 €." });
  }
  if (v.nombrePhotos < PHOTOS_MINIMUM_POUR_PUBLIER) {
    problemes.push({ champ: "photos", message: "Ajoutez au moins une photo." });
  }
  return problemes;
}
