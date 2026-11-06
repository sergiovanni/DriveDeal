export type EtatContact = {
  statut: "initial" | "succes" | "erreur";
  message?: string;
  erreurs?: Record<string, string>;
  /** Valeurs saisies, renvoyées pour ne pas vider le formulaire en cas d'erreur. */
  valeurs?: Record<string, string>;
};

export const etatInitial: EtatContact = { statut: "initial" };
