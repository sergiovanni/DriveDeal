/**
 * Petits outils sur du texte, sans dépendance. Fonctions « pures » (testées).
 */

/** Transforme « Mercedes-Benz Classe C » en « mercedes-benz-classe-c » (utilisable dans une adresse). */
export function slugify(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Prépare une saisie pour une recherche SQL « contient » (ILIKE '%…%').
 * Sans cela, un utilisateur qui tape « % » ou « _ » obtiendrait tous les résultats : ces
 * caractères ont un sens spécial en SQL. On les neutralise avec une barre oblique inverse.
 */
export function echapperRechercheLike(saisie: string): string {
  return saisie.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Retire les espaces en trop (début, fin, doublons) d'une saisie. */
export function normaliserEspaces(texte: string): string {
  return texte.trim().replace(/\s+/g, " ");
}
