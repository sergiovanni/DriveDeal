/**
 * Règles du comparateur de véhicules — logique PURE (aucun accès navigateur ni base),
 * donc facile à tester.
 *
 * RÈGLE MÉTIER STRICTE : au maximum TROIS véhicules comparés. Jamais de quatrième, jamais
 * de remplacement silencieux d'un véhicule déjà choisi, jamais deux fois le même véhicule.
 */

/** Nombre maximum de véhicules comparables en même temps. */
export const MAX_COMPARAISON = 3;

/** Message affiché partout où la limite est atteinte. */
export const MESSAGE_LIMITE = "Vous avez atteint la limite de 3 véhicules.";

/** Explication complémentaire : il faut retirer un véhicule avant d'en ajouter un autre. */
export const MESSAGE_LIMITE_AIDE =
  "Retirez un véhicule de votre sélection avant d'en ajouter un autre.";

/**
 * Ce que le comparateur mémorise d'un véhicule pour l'afficher dans la barre flottante.
 * Seulement de quoi dessiner une vignette : la page de comparaison, elle, relit toujours
 * les vraies données (prix et disponibilité à jour).
 */
export type ElementComparaison = {
  id: string;
  /** « Marque Modèle ». */
  titre: string;
  prixCentimes: number;
  photoUrl?: string;
  photoAlt?: string;
  /** Couleur du visuel de démonstration quand il n'y a pas de photo. */
  teinte: string;
};

export type ResultatAjout = "ajoute" | "deja_present" | "limite_atteinte";

/** Vrai s'il reste de la place ET que le véhicule n'est pas déjà sélectionné. */
export function peutAjouter(ids: readonly string[], id: string): boolean {
  return !ids.includes(id) && ids.length < MAX_COMPARAISON;
}

/**
 * Ajoute un véhicule à la sélection.
 * Ne modifie pas la liste reçue. Le résultat dit ce qui s'est passé, pour que l'interface
 * puisse l'expliquer (jamais d'échec silencieux).
 */
export function ajouter<T extends { id: string }>(
  selection: readonly T[],
  element: T,
): { selection: T[]; resultat: ResultatAjout } {
  if (selection.some((e) => e.id === element.id)) {
    return { selection: [...selection], resultat: "deja_present" };
  }
  if (selection.length >= MAX_COMPARAISON) {
    return { selection: [...selection], resultat: "limite_atteinte" };
  }
  return { selection: [...selection, element], resultat: "ajoute" };
}

/** Retire un véhicule de la sélection (sans effet s'il n'y est pas). */
export function retirer<T extends { id: string }>(
  selection: readonly T[],
  id: string,
): T[] {
  return selection.filter((e) => e.id !== id);
}

/** Identifiant plausible : lettres, chiffres et tirets (UUID, « dd-0001 »…), 64 caractères max. */
const FORMAT_ID = /^[A-Za-z0-9-]{1,64}$/;

/**
 * Lit la liste d'identifiants dans l'URL (`?ids=a,b,c`).
 * L'URL est une entrée non fiable : on ignore les valeurs invalides et les doublons, et
 * on coupe à trois, quoi qu'elle contienne.
 */
export function lireIdsUrl(valeur: string | string[] | undefined): string[] {
  const brut = Array.isArray(valeur) ? valeur.join(",") : (valeur ?? "");
  const ids: string[] = [];
  for (const morceau of brut.split(",")) {
    const id = morceau.trim();
    if (FORMAT_ID.test(id) && !ids.includes(id)) ids.push(id);
    if (ids.length === MAX_COMPARAISON) break;
  }
  return ids;
}

/** Adresse de la page de comparaison pour ces véhicules. */
export function urlComparateur(ids: readonly string[], seulementDifferences = false): string {
  const params = new URLSearchParams();
  if (ids.length > 0) params.set("ids", ids.slice(0, MAX_COMPARAISON).join(","));
  if (seulementDifferences) params.set("diff", "1");
  const requete = params.toString();
  return requete ? `/comparateur?${requete}` : "/comparateur";
}

/**
 * Vérifie une sélection relue depuis le stockage du navigateur (donnée non fiable :
 * l'utilisateur peut la modifier). Renvoie uniquement des éléments bien formés, sans
 * doublon, et au plus trois.
 */
export function nettoyerSelection(brut: unknown): ElementComparaison[] {
  if (!Array.isArray(brut)) return [];
  const resultat: ElementComparaison[] = [];
  for (const e of brut) {
    if (typeof e !== "object" || e === null) continue;
    const o = e as Record<string, unknown>;
    if (
      typeof o.id !== "string" ||
      !FORMAT_ID.test(o.id) ||
      typeof o.titre !== "string" ||
      typeof o.prixCentimes !== "number" ||
      !Number.isFinite(o.prixCentimes) ||
      typeof o.teinte !== "string"
    )
      continue;
    if (resultat.some((r) => r.id === o.id)) continue;
    resultat.push({
      id: o.id,
      titre: o.titre.slice(0, 120),
      prixCentimes: o.prixCentimes,
      // L'adresse de photo doit rester une adresse http(s) : jamais de « javascript: ».
      photoUrl:
        typeof o.photoUrl === "string" && /^https?:\/\//.test(o.photoUrl)
          ? o.photoUrl
          : undefined,
      photoAlt: typeof o.photoAlt === "string" ? o.photoAlt.slice(0, 200) : undefined,
      teinte: /^#[0-9a-fA-F]{3,8}$/.test(o.teinte) ? o.teinte : "#6b7a99",
    });
    if (resultat.length === MAX_COMPARAISON) break;
  }
  return resultat;
}
