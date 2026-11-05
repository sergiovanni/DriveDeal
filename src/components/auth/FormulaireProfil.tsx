"use client";

import { useActionState } from "react";
import { Bouton } from "@/components/ui/Button";
import { ChampFormulaire } from "@/components/ui/ChampFormulaire";
import { mettreAJourProfil } from "@/modules/comptes/actions";
import { etatCompteInitial } from "@/modules/comptes/etat";
import { AlerteFormulaire } from "./ElementsFormulaire";

type Props = {
  /** Valeurs actuelles du profil (lues côté serveur). */
  valeursInitiales: { prenom: string; nom: string; telephone: string };
  /** Faux si la base n'est pas configurée : le formulaire est alors désactivé. */
  actif: boolean;
};

/** Modification des coordonnées de la personne connectée. */
export function FormulaireProfil({ valeursInitiales, actif }: Props) {
  const [etat, action, enCours] = useActionState(mettreAJourProfil, etatCompteInitial);
  // Après une modification, on réaffiche ce que le serveur a enregistré.
  const v = etat.valeurs ?? valeursInitiales;

  return (
    <form action={action} noValidate className="space-y-5">
      <AlerteFormulaire etat={etat} />
      <div className="grid gap-5 sm:grid-cols-2">
        <ChampFormulaire
          id="prenom"
          nom="prenom"
          libelle="Prénom"
          autoComplete="given-name"
          valeurParDefaut={v.prenom}
          erreur={etat.erreurs?.prenom}
        />
        <ChampFormulaire
          id="nom"
          nom="nom"
          libelle="Nom"
          autoComplete="family-name"
          valeurParDefaut={v.nom}
          erreur={etat.erreurs?.nom}
        />
      </div>
      <ChampFormulaire
        id="telephone"
        nom="telephone"
        type="tel"
        libelle="Téléphone"
        autoComplete="tel"
        valeurParDefaut={v.telephone}
        erreur={etat.erreurs?.telephone}
      />
      <Bouton type="submit" disabled={!actif || enCours}>
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </Bouton>
    </form>
  );
}
