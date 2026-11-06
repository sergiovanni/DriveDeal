import Link from "next/link";
import { Bouton } from "@/components/ui/Button";
import { optionsTri, type Filtres } from "@/modules/vehicles";

type Options = {
  marques: string[];
  carburants: string[];
  transmissions: string[];
  carrosseries: string[];
  couleurs: string[];
};

const champ =
  "h-10 w-full rounded-lg border border-gris-300 bg-white px-3 text-sm text-gris-900";
const etiquette = "mb-1 block text-xs font-semibold text-gris-700";

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
      className="space-y-4 rounded-xl border border-gris-200 bg-white p-5"
    >
      <h2 className="text-base font-bold text-gris-900">Affiner la recherche</h2>

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
      <Liste
        nom="carburant"
        libelle="Carburant"
        valeurs={options.carburants}
        actuelle={filtres.carburant}
      />
      <Liste
        nom="transmission"
        libelle="Transmission"
        valeurs={options.transmissions}
        actuelle={filtres.transmission}
      />
      <Liste
        nom="couleur"
        libelle="Couleur"
        valeurs={options.couleurs}
        actuelle={filtres.couleur}
      />

      <div className="grid grid-cols-2 gap-3">
        <Nombre nom="prixMin" libelle="Prix min (€)" actuelle={filtres.prixMin} />
        <Nombre nom="prixMax" libelle="Prix max (€)" actuelle={filtres.prixMax} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Nombre
          nom="anneeMin"
          libelle="Année min."
          actuelle={filtres.anneeMin}
          placeholder="2018"
        />
        <Nombre nom="kmMax" libelle="Km max." actuelle={filtres.kmMax} />
      </div>
      <Nombre
        nom="puissanceMin"
        libelle="Puissance min. (ch)"
        actuelle={filtres.puissanceMin}
      />

      <div>
        <label htmlFor="tri" className={etiquette}>
          Trier par
        </label>
        <select id="tri" name="tri" defaultValue={filtres.tri} className={champ}>
          {optionsTri.map((o) => (
            <option key={o.valeur} value={o.valeur}>
              {o.libelle}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <Bouton type="submit">Appliquer les filtres</Bouton>
        <Link
          href="/vehicules"
          className="inline-flex h-10 items-center justify-center rounded-lg text-sm font-semibold text-bleu-600 hover:bg-bleu-50"
        >
          Réinitialiser
        </Link>
      </div>
    </form>
  );
}
