"use client";

import { useActionState } from "react";
import { Bouton } from "@/components/ui/Button";
import { ChampFormulaire } from "@/components/ui/ChampFormulaire";
import { demanderReinitialisation } from "@/modules/comptes/actions";
import { etatCompteInitial } from "@/modules/comptes/etat";
import { AlerteFormulaire, AvisIndisponible, ChampPiege } from "./ElementsFormulaire";

/** Demande d'un lien de réinitialisation du mot de passe, envoyé par e-mail. */
export function FormulaireReinitialisation({ actif }: { actif: boolean }) {
  const [etat, action, enCours] = useActionState(
    demanderReinitialisation,
    etatCompteInitial,
  );

  if (etat.statut === "succes") {
    return (
      <div
        role="status"
        className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"
      >
        <h2 className="font-bold text-succes">Demande envoyée</h2>
        <p className="mt-2 text-sm leading-6 text-gris-700">{etat.message}</p>
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
      <ChampPiege />
      {!actif && <AvisIndisponible />}
      <Bouton type="submit" taille="lg" className="w-full" disabled={!actif || enCours}>
        {enCours ? "Envoi…" : "Recevoir le lien"}
      </Bouton>
    </form>
  );
}
