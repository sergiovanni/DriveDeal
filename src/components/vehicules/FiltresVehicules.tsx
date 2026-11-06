import Link from "next/link";
import { Bouton } from "@/components/ui/Button";
import type { Filtres } from "@/modules/vehicles";

type Options = {
  marques: string[];
  carburants: string[];
  transmissions: string[];
  carrosseries: string[];
  couleurs: string[];
  couleursHex: Record<string, string>;
};

const champ =
  "h-10 w-full rounded-lg border border-gris-300 bg-white px-3 text-sm text-gris-900";
const etiquette = "mb-1 block text-xs font-semibold text-gris-700";
const titreGroupe = "mb-2 text-xs font-bold uppercase tracking-wide text-gris-700";

const KM_MAX = [10000, 30000, 60000, 100000];
const ANNEES_MIN = [2022, 2021, 2020, 2019];

/** Pastille cliquable (radio caché) : fonctionne sans JavaScript. */
function Pastille({
  nom,
  valeur,
  libelle,
  coche,
}: {
  nom: string;
  valeur: string;
  libelle: string;
  coche: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={nom}
        value={valeur}
        defaultChecked={coche}
        className="peer sr-only"
      />
      <span className="inline-flex h-8 items-center rounded-full border border-gris-300 bg-white px-3 text-xs font-semibold text-gris-700 transition-colors peer-checked:border-bleu-600 peer-checked:bg-bleu-600 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bleu-500 hover:border-bleu-500">
        {libelle}
      </span>
    </label>
  );
}

function Liste({
  nom,
  libelle,
  valeurs,
  actuelle,
}: {
  nom: string;
  libelle: string;
  valeurs: string[];
  actuelle?: string;
}) {
  return (
    <div>
      <label htmlFor={nom} className={etiquette}>
        {libelle}
      </label>
      <select id={nom} name={nom} defaultValue={actuelle ?? ""} className={champ}>
        <option value="">Toutes</option>
        {valeurs.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}

function Nombre({
  nom,
  libelle,
  actuelle,
  placeholder,
}: {
  nom: string;
  libelle: string;
  actuelle?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={nom} className={etiquette}>
        {libelle}
      </label>
      <input
        id={nom}
        name={nom}
        type="number"
        min={0}
        inputMode="numeric"
        defaultValue={actuelle ?? ""}
        placeholder={placeholder}
        className={champ}
      />
    </div>
  );
}

/** Formulaire GET : les filtres vivent dans l'URL (partageables, sans JavaScript). */
export function FiltresVehicules({
  filtres,
  options,
}: {
  filtres: Filtres;
  options: Options;
}) {
  return (
    <form
      method="get"
      action="/vehicules"
      className="space-y-6 rounded-xl border border-gris-200 bg-white p-5"
    >
      <input type="hidden" name="tri" value={filtres.tri} />
      <input type="hidden" name="parPage" value={filtres.parPage} />

      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gris-900">Affiner la recherche</h2>
        <Link
          href="/vehicules"
          className="text-xs font-semibold text-bleu-600 hover:underline"
        >
          Réinitialiser
        </Link>
      </div>

      <div>
        <label htmlFor="q" className={etiquette}>
          Marque, modèle ou version
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={filtres.q ?? ""}
          placeholder="Ex. Golf, BMW…"
          className={champ}
        />
      </div>

      <Liste
        nom="marque"
        libelle="Marque"
        valeurs={options.marques}
        actuelle={filtres.marque}
      />
      <Liste
        nom="carrosserie"
        libelle="Carrosserie"
        valeurs={options.carrosseries}
        actuelle={filtres.carrosserie}
      />

      <div className="grid grid-cols-2 gap-3">
        <Nombre
          nom="prixMin"
          libelle="Prix min (€)"
          actuelle={filtres.prixMin}
          placeholder="0"
        />
        <Nombre nom="prixMax" libelle="Prix max (€)" actuelle={filtres.prixMax} />
      </div>

      <fieldset>
        <legend className={titreGroupe}>Année à partir de</legend>
        <div className="flex flex-wrap gap-2">
          <Pastille
            nom="anneeMin"
            valeur=""
            libelle="Toutes"
            coche={filtres.anneeMin === undefined}
          />
          {ANNEES_MIN.map((a) => (
            <Pastille
              key={a}
              nom="anneeMin"
              valeur={String(a)}
              libelle={String(a)}
              coche={filtres.anneeMin === a}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={titreGroupe}>Kilométrage maximum</legend>
        <div className="flex flex-wrap gap-2">
          <Pastille
            nom="kmMax"
            valeur=""
            libelle="Tous"
            coche={filtres.kmMax === undefined}
          />
          {KM_MAX.map((k) => (
            <Pastille
              key={k}
              nom="kmMax"
              valeur={String(k)}
              libelle={`< ${new Intl.NumberFormat("fr-FR").format(k)} km`}
              coche={filtres.kmMax === k}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={titreGroupe}>Carburant</legend>
        <div className="flex flex-wrap gap-2">
          <Pastille nom="carburant" valeur="" libelle="Tous" coche={!filtres.carburant} />
          {options.carburants.map((c) => (
            <Pastille
              key={c}
              nom="carburant"
              valeur={c}
              libelle={c}
              coche={filtres.carburant === c}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={titreGroupe}>Transmission</legend>
        <div className="flex flex-wrap gap-2">
          <Pastille
            nom="transmission"
            valeur=""
            libelle="Toutes"
            coche={!filtres.transmission}
          />
          {options.transmissions.map((t) => (
            <Pastille
              key={t}
              nom="transmission"
              valeur={t}
              libelle={t}
              coche={filtres.transmission === t}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={titreGroupe}>Couleur</legend>
        <div className="flex flex-wrap gap-3">
          <label className="cursor-pointer">
            <input
              type="radio"
              name="couleur"
              value=""
              defaultChecked={!filtres.couleur}
              className="peer sr-only"
            />
            <span className="inline-flex h-8 items-center rounded-full border border-gris-300 px-3 text-xs font-semibold text-gris-700 peer-checked:border-bleu-600 peer-checked:bg-bleu-600 peer-checked:text-white">
              Toutes
            </span>
          </label>
          {options.couleurs.map((c) => (
            <label key={c} className="cursor-pointer" title={c}>
              <input
                type="radio"
                name="couleur"
                value={c}
                defaultChecked={filtres.couleur === c}
                className="peer sr-only"
              />
              <span
                className="block h-8 w-8 rounded-full border border-gris-300 ring-offset-2 peer-checked:ring-2 peer-checked:ring-bleu-600 peer-focus-visible:ring-2 peer-focus-visible:ring-bleu-500"
                style={{ backgroundColor: options.couleursHex[c] ?? "#d0d5dd" }}
              />
              <span className="sr-only">{c}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Nombre
        nom="puissanceMin"
        libelle="Puissance minimale (ch)"
        actuelle={filtres.puissanceMin}
        placeholder="Ex. 150"
      />

      <Bouton type="submit" className="w-full">
        Appliquer les filtres
      </Bouton>
    </form>
  );
}
