"use client";

import { useState } from "react";

type ChampMotDePasseProps = {
  id: string;
  nom: string;
  libelle: string;
  /** « current-password » (connexion) ou « new-password » (création / changement). */
  autoComplete: "current-password" | "new-password";
  requis?: boolean;
  /** Message d'erreur du serveur pour ce champ. */
  erreur?: string;
  /** Petit texte d'aide sous le champ. */
  aide?: string;
  /** Contenu affiché à droite de l'étiquette (ex. lien « Mot de passe oublié ? »). */
  droite?: React.ReactNode;
};

/**
 * Champ de mot de passe avec un bouton « afficher / masquer » (utile sur téléphone, où l'on
 * se trompe facilement de lettre).
 *
 * Sécurité : le bouton ne change que le type du champ dans le navigateur. Le mot de passe n'est
 * jamais envoyé ailleurs que dans le formulaire, ni stocké (pas de valeur par défaut).
 */
export function ChampMotDePasse({
  id,
  nom,
  libelle,
  autoComplete,
  requis,
  erreur,
  aide,
  droite,
}: ChampMotDePasseProps) {
  const [visible, setVisible] = useState(false);
  const idMessage = `${id}-message`;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-semibold text-gris-700">
          {libelle}
          {requis ? " *" : ""}
        </label>
        {droite}
      </div>
      <div className="relative">
        <input
          id={id}
          name={nom}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={requis}
          aria-invalid={Boolean(erreur)}
          aria-describedby={erreur || aide ? idMessage : undefined}
          // Évite la correction automatique et les majuscules automatiques sur téléphone.
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="h-11 w-full rounded-lg border border-gris-300 bg-white pl-3 pr-24 text-sm text-gris-900 aria-[invalid=true]:border-red-500"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          className="absolute right-1 top-1 h-9 rounded-md px-3 text-xs font-semibold text-bleu-600 hover:bg-bleu-50"
        >
          {visible ? "Masquer" : "Afficher"}
        </button>
      </div>
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
