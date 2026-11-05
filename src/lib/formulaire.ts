import type { z } from "zod";

/**
 * Lecture et validation d'un formulaire, côté serveur.
 *
 * Toute donnée reçue d'un formulaire est NON FIABLE (le navigateur peut être contourné) :
 * elle est toujours validée ici avant usage.
 */

export type ResultatFormulaire<T> =
  { ok: true; donnees: T } | { ok: false; erreurs: Record<string, string> };

/**
 * Convertit un `FormData` en objet simple puis le valide avec un schéma Zod.
 * - Les champs vides deviennent `undefined` (pratique pour les champs facultatifs).
 * - En cas d'erreur, renvoie UN message par champ (le premier).
 * - Les mots de passe ne sont ni recopiés ni renvoyés dans les erreurs.
 */
export function validerFormulaire<S extends z.ZodType>(
  schema: S,
  formData: FormData,
): ResultatFormulaire<z.output<S>> {
  const brut: Record<string, unknown> = {};
  for (const [cle, valeur] of formData.entries()) {
    // Les champs techniques ajoutés par React (« $ACTION_… ») ne nous concernent pas.
    if (cle.startsWith("$ACTION")) continue;
    brut[cle] = typeof valeur === "string" && valeur === "" ? undefined : valeur;
  }

  const resultat = schema.safeParse(brut);
  if (resultat.success) return { ok: true, donnees: resultat.data };

  const erreurs: Record<string, string> = {};
  for (const issue of resultat.error.issues) {
    const cle = String(issue.path[0] ?? "formulaire");
    erreurs[cle] ??= issue.message;
  }
  return { ok: false, erreurs };
}
