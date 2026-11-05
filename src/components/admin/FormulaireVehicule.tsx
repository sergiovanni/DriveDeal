"use client";

import { useActionState } from "react";
import { Bouton } from "@/components/ui/Button";
import { ChampFormulaire } from "@/components/ui/ChampFormulaire";
import {
  BOITES,
  CARBURANTS,
  CARROSSERIES,
  TRANSMISSIONS,
} from "@/lib/db/schema/constantes";
import {
  creerVehiculeAction,
  modifierVehiculeAction,
} from "@/modules/vehicles/admin/actions";
import { etatAdminInitial } from "@/modules/vehicles/admin/etat";

/** Valeurs du formulaire, toutes sous forme de TEXTE (c'est ce que le navigateur envoie). */
export type ValeursVehicule = Record<string, string>;

type Props =
  | {
      mode: "creation";
      marquesConnues: string[];
      valeursInitiales?: ValeursVehicule;
      id?: undefined;
      verrouille?: undefined;
    }
  | {
      mode: "modification";
      id: string;
      marquesConnues: string[];
      valeursInitiales: ValeursVehicule;
      verrouille: boolean;
    };

const classeChamp =
  "h-11 w-full rounded-lg border border-gris-300 bg-white px-3 text-sm text-gris-900 aria-[invalid=true]:border-red-500 disabled:bg-gris-100";

/** Liste déroulante accessible (étiquette liée, erreur annoncée). */
function ChampListe({
  nom,
  libelle,
  options,
  valeur,
  erreur,
  desactive,
}: {
  nom: string;
  libelle: string;
  options: readonly string[];
  valeur: string;
  erreur?: string;
  desactive?: boolean;
}) {
  return (
    <div>
      <label htmlFor={nom} className="mb-1 block text-sm font-semibold text-gris-700">
        {libelle} *
      </label>
      <select
        id={nom}
        name={nom}
        defaultValue={valeur}
        required
        disabled={desactive}
        aria-invalid={Boolean(erreur)}
        aria-describedby={erreur ? `${nom}-message` : undefined}
        className={classeChamp}
      >
        <option value="" disabled>
          Choisir…
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {erreur && (
        <p id={`${nom}-message`} className="mt-1 text-xs font-medium text-red-600">
          {erreur}
        </p>
      )}
    </div>
  );
}

/** Zone de texte accessible. */
function ChampZone({
  nom,
  libelle,
  valeur,
  erreur,
  aide,
  lignes = 4,
  desactive,
}: {
  nom: string;
  libelle: string;
  valeur: string;
  erreur?: string;
  aide?: string;
  lignes?: number;
  desactive?: boolean;
}) {
  return (
    <div>
      <label htmlFor={nom} className="mb-1 block text-sm font-semibold text-gris-700">
        {libelle}
      </label>
      <textarea
        id={nom}
        name={nom}
        rows={lignes}
        defaultValue={valeur}
        disabled={desactive}
        aria-invalid={Boolean(erreur)}
        aria-describedby={erreur || aide ? `${nom}-message` : undefined}
        className="w-full rounded-lg border border-gris-300 bg-white px-3 py-2 text-sm text-gris-900 aria-[invalid=true]:border-red-500 disabled:bg-gris-100"
      />
      {(erreur || aide) && (
        <p
          id={`${nom}-message`}
          className={`mt-1 text-xs ${erreur ? "font-medium text-red-600" : "text-gris-500"}`}
        >
          {erreur ?? aide}
        </p>
      )}
    </div>
  );
}

function Section({
  titre,
  aide,
  children,
}: {
  titre: string;
  aide?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-2xl border border-gris-200 bg-white p-5 sm:p-6">
      <legend className="px-2 text-base font-bold text-gris-900">{titre}</legend>
      {aide && <p className="-mt-1 mb-4 text-sm text-gris-500">{aide}</p>}
      <div className="space-y-5">{children}</div>
    </fieldset>
  );
}

/**
 * Formulaire de création / modification d'un véhicule.
 *
 * Il ne contient NI statut NI référence : le statut se change par des boutons dédiés (qui vérifient
 * les règles de publication) et la référence est attribuée par la base.
 * La validation réelle est faite côté serveur ; les erreurs reviennent champ par champ.
 */
export function FormulaireVehicule(props: Props) {
  const { mode, marquesConnues, valeursInitiales = {} } = props;
  const action =
    mode === "creation"
      ? creerVehiculeAction
      : modifierVehiculeAction.bind(null, props.id);
  const [etat, formAction, enCours] = useActionState(action, etatAdminInitial);

  const v = (nom: string) => etat.valeurs?.[nom] ?? valeursInitiales[nom] ?? "";
  const e = etat.erreurs ?? {};
  const desactive = mode === "modification" && props.verrouille;

  return (
    <form action={formAction} noValidate className="space-y-6">
      {etat.statut !== "initial" && etat.message && (
        <p
          role={etat.statut === "erreur" ? "alert" : "status"}
          className={`rounded-lg px-4 py-3 text-sm font-medium ${etat.statut === "erreur" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-succes"}`}
        >
          {etat.message}
        </p>
      )}
      {desactive && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-alerte">
          Ce véhicule est réservé ou vendu : il est géré par les commandes et ne peut plus
          être modifié ici.
        </p>
      )}

      <Section titre="Identification">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <ChampFormulaire
              id="marque"
              nom="marque"
              libelle="Marque"
              liste="marques-connues"
              requis
              valeurParDefaut={v("marque")}
              erreur={e.marque}
              aide="Choisissez une marque existante ou saisissez-en une nouvelle."
            />
            {/* Suggestions des marques déjà enregistrées (évite « bmw » / « BMW »). */}
            <datalist id="marques-connues">
              {marquesConnues.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
          <ChampFormulaire
            id="modele"
            nom="modele"
            libelle="Modèle"
            requis
            valeurParDefaut={v("modele")}
            erreur={e.modele}
          />
        </div>
        <ChampFormulaire
          id="version"
          nom="version"
          libelle="Version"
          requis
          valeurParDefaut={v("version")}
          erreur={e.version}
          aide="Ex. GT 1.2 PureTech 130"
        />
      </Section>

      <Section titre="Caractéristiques" aide="Tous ces champs sont obligatoires.">
        <div className="grid gap-5 sm:grid-cols-3">
          <ChampFormulaire
            id="annee"
            nom="annee"
            type="text"
            libelle="Année de mise en circulation"
            requis
            valeurParDefaut={v("annee")}
            erreur={e.annee}
          />
          <ChampFormulaire
            id="kilometrage"
            nom="kilometrage"
            libelle="Kilométrage (km)"
            requis
            valeurParDefaut={v("kilometrage")}
            erreur={e.kilometrage}
          />
          <ChampFormulaire
            id="couleur"
            nom="couleur"
            libelle="Couleur"
            requis
            valeurParDefaut={v("couleur")}
            erreur={e.couleur}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <ChampFormulaire
            id="motorisation"
            nom="motorisation"
            libelle="Motorisation"
            requis
            valeurParDefaut={v("motorisation")}
            erreur={e.motorisation}
            aide="Ex. 1.2 PureTech"
          />
          <ChampListe
            nom="carburant"
            libelle="Carburant"
            options={CARBURANTS}
            valeur={v("carburant")}
            erreur={e.carburant}
            desactive={desactive}
          />
          <ChampFormulaire
            id="puissanceCh"
            nom="puissanceCh"
            libelle="Puissance (ch)"
            requis
            valeurParDefaut={v("puissanceCh")}
            erreur={e.puissanceCh}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <ChampListe
            nom="boite"
            libelle="Boîte de vitesses"
            options={BOITES}
            valeur={v("boite")}
            erreur={e.boite}
            desactive={desactive}
          />
          <ChampListe
            nom="transmission"
            libelle="Transmission"
            options={TRANSMISSIONS}
            valeur={v("transmission")}
            erreur={e.transmission}
            desactive={desactive}
          />
          <ChampListe
            nom="carrosserie"
            libelle="Carrosserie"
            options={CARROSSERIES}
            valeur={v("carrosserie")}
            erreur={e.carrosserie}
            desactive={desactive}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <ChampFormulaire
            id="portes"
            nom="portes"
            libelle="Nombre de portes"
            requis
            valeurParDefaut={v("portes")}
            erreur={e.portes}
          />
          <ChampFormulaire
            id="places"
            nom="places"
            libelle="Nombre de places"
            requis
            valeurParDefaut={v("places")}
            erreur={e.places}
          />
        </div>
      </Section>

      <Section titre="Prix">
        <div className="max-w-xs">
          <ChampFormulaire
            id="prixCentimes"
            nom="prixCentimes"
            libelle="Prix de vente (€)"
            requis
            valeurParDefaut={v("prixCentimes")}
            erreur={e.prixCentimes}
            aide="Ex. 17900 ou 17 900,50. Frais et TVA : règles à définir (docs/08)."
          />
        </div>
      </Section>

      <Section titre="Description et état" aide="Facultatif, mais utile aux acheteurs.">
        <ChampZone
          nom="description"
          libelle="Description"
          valeur={v("description")}
          erreur={e.description}
          lignes={5}
          desactive={desactive}
        />
        <ChampZone
          nom="etatGeneral"
          libelle="État général"
          valeur={v("etatGeneral")}
          erreur={e.etatGeneral}
          lignes={2}
          desactive={desactive}
        />
        <ChampZone
          nom="historique"
          libelle="Historique"
          valeur={v("historique")}
          erreur={e.historique}
          lignes={3}
          desactive={desactive}
        />
        <ChampZone
          nom="entretien"
          libelle="Entretien"
          valeur={v("entretien")}
          erreur={e.entretien}
          lignes={3}
          desactive={desactive}
        />
        <ChampZone
          nom="controleTechnique"
          libelle="Contrôle technique"
          valeur={v("controleTechnique")}
          erreur={e.controleTechnique}
          lignes={2}
          desactive={desactive}
        />
      </Section>

      <Section titre="Équipements">
        <ChampZone
          nom="equipements"
          libelle="Liste des équipements"
          valeur={v("equipements")}
          erreur={e.equipements}
          aide="Un équipement par ligne. Les doublons sont ignorés."
          lignes={6}
          desactive={desactive}
        />
      </Section>

      <div className="flex flex-wrap items-center gap-3">
        <Bouton type="submit" taille="lg" disabled={enCours || desactive}>
          {enCours
            ? "Enregistrement…"
            : mode === "creation"
              ? "Créer le brouillon"
              : "Enregistrer les modifications"}
        </Bouton>
        {mode === "creation" && (
          <p className="text-sm text-gris-500">
            Le véhicule sera créé en brouillon, invisible du public.
          </p>
        )}
      </div>
    </form>
  );
}
