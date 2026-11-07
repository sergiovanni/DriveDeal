/**
 * État renvoyé par les actions du back-office aux formulaires.
 * Même principe que pour le compte : un message général, un message par champ, et les valeurs
 * saisies pour ne pas vider le formulaire après une erreur.
 */
export type EtatAdmin = {
  statut: "initial" | "succes" | "erreur";
  message?: string;
  erreurs?: Record<string, string>;
  valeurs?: Record<string, string>;
};

export const etatAdminInitial: EtatAdmin = { statut: "initial" };
