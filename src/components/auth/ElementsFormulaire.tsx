import type { EtatCompte } from "@/modules/comptes/etat";

/**
 * Petits éléments partagés par les formulaires du compte.
 */

/** Message d'erreur ou de succès affiché en haut d'un formulaire (annoncé aux lecteurs d'écran). */
export function AlerteFormulaire({ etat }: { etat: EtatCompte }) {
  if (etat.statut === "initial" || !etat.message) return null;
  const erreur = etat.statut === "erreur";
  return (
    <p
      role={erreur ? "alert" : "status"}
      className={`rounded-lg px-4 py-3 text-sm font-medium ${
        erreur ? "bg-red-50 text-red-700" : "bg-emerald-50 text-succes"
      }`}
    >
      {etat.message}
    </p>
  );
}

/** Message affiché quand l'authentification n'est pas encore configurée (pas de Supabase). */
export function AvisIndisponible() {
  return (
    <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-alerte">
      Les comptes seront disponibles dès que la connexion à la base de données sera
      configurée.
    </p>
  );
}

/**
 * Champ piège anti-robots : masqué pour les humains (hors écran, non focalisable, ignoré des
 * lecteurs d'écran). Un robot qui remplit tous les champs le remplit aussi : on l'ignore alors.
 */
export function ChampPiege() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label htmlFor="site_web">Ne pas remplir</label>
      <input id="site_web" name="site_web" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
