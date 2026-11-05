/**
 * Protection contre la « redirection ouverte » (open redirect).
 *
 * Après une connexion, on renvoie l'utilisateur vers la page qu'il voulait voir, indiquée dans
 * l'adresse (?redirection=/compte). Si on suivait n'importe quelle valeur, un pirate pourrait
 * envoyer un lien « drivedeal.fr/connexion?redirection=https://site-pirate.com » : la victime se
 * connecte sur le VRAI site puis atterrit sur un faux site qui lui redemande son mot de passe.
 *
 * Règle : on n'accepte que des chemins INTERNES (commençant par un seul « / »).
 */

/** Destination par défaut après connexion. */
export const DESTINATION_PAR_DEFAUT = "/compte";

/**
 * Renvoie `valeur` si c'est un chemin interne sûr, sinon `parDefaut`.
 * @param valeur   valeur reçue (non fiable) : paramètre d'adresse, champ de formulaire…
 * @param parDefaut destination de repli
 */
export function adresseRedirectionSure(
  valeur: string | string[] | null | undefined,
  parDefaut: string = DESTINATION_PAR_DEFAUT,
): string {
  const brute = Array.isArray(valeur) ? valeur[0] : valeur;
  if (typeof brute !== "string") return parDefaut;
  const chemin = brute.trim();

  // Doit commencer par « / » (chemin interne)…
  if (!chemin.startsWith("/")) return parDefaut;
  // …mais pas par « // » (adresse « sans protocole » : //site-pirate.com) ni par « /\ »
  // (certains navigateurs traitent « \ » comme « / »).
  if (chemin.startsWith("//") || chemin.startsWith("/\\")) return parDefaut;
  // Aucun caractère de contrôle (retours à la ligne, tabulations : détournement d'en-têtes).
  if (/[\u0000-\u001f\u007f]/.test(chemin)) return parDefaut;
  // Et ne doit pas renvoyer vers les pages de connexion elles-mêmes (boucle).
  if (/^\/(connexion|inscription)(\/|\?|$)/.test(chemin)) return parDefaut;

  return chemin;
}
