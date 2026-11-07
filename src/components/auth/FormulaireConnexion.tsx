"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Bouton } from "@/components/ui/Button";
import { ChampFormulaire } from "@/components/ui/ChampFormulaire";
import { connecter } from "@/modules/comptes/actions";
import { etatCompteInitial } from "@/modules/comptes/etat";
import { AlerteFormulaire, AvisIndisponible } from "./ElementsFormulaire";

/**
 * Formulaire de connexion (composant client : affiche les erreurs renvoyées par l'action serveur).
 * `redirection` = page à rejoindre après connexion ; elle est revalidée côté serveur.
 */
export function FormulaireConnexion({
  actif,
  redirection,
}: {
  actif: boolean;
  redirection?: string;
}) {
  const [etat, action, enCours] = useActionState(connecter, etatCompteInitial);

  return (
    <form action={action} noValidate className="space-y-5">
      <AlerteFormulaire etat={etat} />
      {redirection && <input type="hidden" name="redirection" value={redirection} />}

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
        autoComplete="current-password"
        requis
        erreur={etat.erreurs?.motDePasse}
      />

      <p className="text-right text-sm">
        <Link
          href="/mot-de-passe-oublie"
          className="font-semibold text-bleu-600 hover:underline"
        >
          Mot de passe oublié ?
        </Link>
      </p>

      {!actif && <AvisIndisponible />}
      <Bouton type="submit" taille="lg" className="w-full" disabled={!actif || enCours}>
        {enCours ? "Connexion…" : "Se connecter"}
      </Bouton>
    </form>
  );
}
