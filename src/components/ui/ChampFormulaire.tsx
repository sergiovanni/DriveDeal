type ChampFormulaireProps = {
  /** Identifiant HTML (lie l'étiquette au champ). */
  id: string;
  /** Nom du champ envoyé au serveur. */
  nom: string;
  libelle: string;
  type?: "text" | "email" | "password" | "tel";
  /** Aide à la saisie du navigateur (ex. « email », « new-password », « current-password »). */
  autoComplete?: string;
  requis?: boolean;
  valeurParDefaut?: string;
  /** Message d'erreur du serveur pour ce champ. */
  erreur?: string;
  /** Petit texte d'aide sous le champ. */
  aide?: string;
};

/**
 * Champ de formulaire accessible : étiquette liée, erreur annoncée aux lecteurs d'écran
 * (aria-invalid + aria-describedby) et aide visible.
 */
export function ChampFormulaire({
  id,
  nom,
  libelle,
  type = "text",
  autoComplete,
  requis,
  valeurParDefaut,
  erreur,
  aide,
}: ChampFormulaireProps) {
  const idMessage = `${id}-message`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-gris-700">
        {libelle}
        {requis ? " *" : ""}
      </label>
      <input
        id={id}
        name={nom}
        type={type}
        autoComplete={autoComplete}
        required={requis}
        defaultValue={valeurParDefaut}
        aria-invalid={Boolean(erreur)}
        aria-describedby={erreur || aide ? idMessage : undefined}
        className="h-11 w-full rounded-lg border border-gris-300 bg-white px-3 text-sm text-gris-900 aria-[invalid=true]:border-red-500"
      />
      {(erreur || aide) && (
        <p
          id={idMessage}
          className={`mt-1 text-xs ${erreur ? "font-medium text-red-600" : "text-gris-500"}`}
        >
          {erreur ?? aide}
        </p>
      )}
    </div>
  );
}
