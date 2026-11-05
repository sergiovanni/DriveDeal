/**
 * État renvoyé par les actions serveur du compte aux formulaires.
 *
 * Règle de sécurité : on ne renvoie JAMAIS un mot de passe au formulaire, même pour
 * « réafficher » la saisie après une erreur. Seules des valeurs non sensibles (adresse e-mail,
 * nom…) peuvent être recopiées.
 */
export type EtatCompte = {
  statut: "initial" | "succes" | "erreur";
  /** Message général affiché en haut du formulaire. */
  message?: string;
  /** Un message par champ invalide (clé = nom du champ). */
  erreurs?: Record<string, string>;
  /** Valeurs non sensibles à réafficher. */
  valeurs?: Record<string, string>;
};

export const etatCompteInitial: EtatCompte = { statut: "initial" };
