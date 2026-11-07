"use client";

import { useActionState } from "react";
import { Bouton } from "@/components/ui/Button";
import { ChampFormulaire } from "@/components/ui/ChampFormulaire";
import { inscrire } from "@/modules/comptes/actions";
import { etatCompteInitial } from "@/modules/comptes/etat";
import { LONGUEUR_MIN_MOT_DE_PASSE } from "@/modules/comptes/validation";
import { AlerteFormulaire, AvisIndisponible, ChampPiege } from "./ElementsFormulaire";

/**
 * Formulaire d'inscription. Après succès, le formulaire laisse place à un message : l'e-mail de
 * confirmation est envoyé et le compte reste inactif tant que le lien n'a pas été ouvert.
 */
export function FormulaireInscription({ actif }: { actif: boolean }) {
  const [etat, action, enCours] = useActionState(inscrire, etatCompteInitial);

  if (etat.statut === "succes") {
    return (
      <div
        role="status"
        className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"
      >
        <h2 className="font-bold text-succes">Vérifiez votre boîte e-mail</h2>
        <p className="mt-2 text-sm leading-6 text-gris-700">{etat.message}</p>
        <p className="mt-2 text-xs text-gris-500">
          Pensez à regarder dans les courriers indésirables.
        </p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="space-y-5">
      <AlerteFormulaire etat={etat} />

      <ChampFormulaire
        id="email"
        nom="email"
        type="email"
        libelle="Adresse e-mail"
        autoComplete="email"
        requis
        valeurParDefaut={etat.valeurs?.email}
        erreur={etat.erreurs?.email}
      />
      <ChampFormulaire
        id="motDePasse"
        nom="motDePasse"
        type="password"
        libelle="Mot de passe"
        autoComplete="new-password"
        requis
        aide={`${LONGUEUR_MIN_MOT_DE_PASSE} caractères minimum. Une phrase facile à retenir est idéale.`}
        erreur={etat.erreurs?.motDePasse}
      />
      <ChampFormulaire
        id="confirmation"
        nom="confirmation"
        type="password"
        libelle="Confirmer le mot de passe"
        autoComplete="new-password"
        requis
        erreur={etat.erreurs?.confirmation}
      />

      <ChampPiege />

      <div>
        <label className="flex items-start gap-3 text-sm text-gris-700">
          <input
            type="checkbox"
            name="consentement"
            required
            aria-invalid={Boolean(etat.erreurs?.consentement)}
            className="mt-0.5 h-4 w-4 rounded border-gris-300"
          />
          <span>
            J’accepte que mes données soient utilisées pour créer et gérer mon compte. *
          </span>
        </label>
        {etat.erreurs?.consentement && (
          <p className="mt-1 text-xs font-medium text-red-600">
            {etat.erreurs.consentement}
          </p>
        )}
      </div>

      {!actif && <AvisIndisponible />}
      <Bouton type="submit" taille="lg" className="w-full" disabled={!actif || enCours}>
        {enCours ? "Création du compte…" : "Créer mon compte"}
      </Bouton>
    </form>
  );
}
