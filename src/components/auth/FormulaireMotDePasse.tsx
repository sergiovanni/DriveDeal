"use client";

import { useActionState } from "react";
import { Bouton } from "@/components/ui/Button";
import { ChampMotDePasse } from "@/components/ui/ChampMotDePasse";
import { changerMotDePasse } from "@/modules/comptes/actions";
import { etatCompteInitial } from "@/modules/comptes/etat";
import { LONGUEUR_MIN_MOT_DE_PASSE } from "@/modules/comptes/validation";
import { AlerteFormulaire } from "./ElementsFormulaire";

/** Changement de mot de passe (aussi utilisé après un lien de réinitialisation). */
export function FormulaireMotDePasse() {
  const [etat, action, enCours] = useActionState(changerMotDePasse, etatCompteInitial);

  return (
    <form action={action} noValidate className="space-y-5">
      <AlerteFormulaire etat={etat} />
      <ChampMotDePasse
        id="motDePasse"
        nom="motDePasse"
        libelle="Nouveau mot de passe"
        autoComplete="new-password"
        requis
        aide={`${LONGUEUR_MIN_MOT_DE_PASSE} caractères minimum.`}
        erreur={etat.erreurs?.motDePasse}
      />
      <ChampMotDePasse
        id="confirmation"
        nom="confirmation"
        libelle="Confirmer le nouveau mot de passe"
        autoComplete="new-password"
        requis
        erreur={etat.erreurs?.confirmation}
      />
      <Bouton type="submit" taille="lg" className="w-full" disabled={enCours}>
        {enCours ? "Enregistrement…" : "Changer le mot de passe"}
      </Bouton>
    </form>
  );
}
