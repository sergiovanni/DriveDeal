import type { Metadata } from "next";
import Link from "next/link";
import {
  LienRetirer,
  LienToutEffacer,
  RedirectionDepuisSelection,
  SynchroSelection,
} from "@/components/comparateur/OutilsPageComparateur";
import { Badge } from "@/components/ui/Badge";
import { BoutonLien, classesBouton } from "@/components/ui/Button";
import { Conteneur } from "@/components/ui/Conteneur";
import { VisuelVehicule } from "@/components/vehicules/VisuelVehicule";
import { formaterKilometrage, formaterPrix } from "@/lib/money";
import { versElementComparaison } from "@/modules/comparateur/element";
import {
  MAX_COMPARAISON,
  MESSAGE_LIMITE,
  MESSAGE_LIMITE_AIDE,
  lireIdsUrl,
  urlComparateur,
} from "@/modules/comparateur/regles";
import {
  construireSections,
  seulementDifferences,
  type Cellule,
} from "@/modules/comparateur/sections";
import { trouverVehicule, type Vehicule } from "@/modules/vehicles";

export const metadata: Metadata = {
  title: "Comparateur de véhicules",
  description:
    "Comparez jusqu'à trois véhicules côte à côte : prix, kilométrage, motorisation, équipements et état.",
  // Chaque combinaison de véhicules a sa propre adresse : inutile de les indexer.
  robots: { index: false },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Contenu d'une case du tableau : texte, liste, et pastille « Meilleur » si pertinent. */
function CaseTableau({ cellule }: { cellule: Cellule }) {
  return (
    <div className="min-w-0 text-sm text-gris-900">
      {cellule.liste ? (
        <ul className="space-y-1">
          {cellule.liste.map((e) => (
            <li key={e} className="flex gap-2">
              <span aria-hidden="true" className="text-bleu-600">
                •
              </span>
              {e}
            </li>
          ))}
        </ul>
      ) : (
        <p className={cellule.texte === "Non renseigné" ? "italic text-gris-500" : "font-medium"}>
          {cellule.texte}
        </p>
      )}
      {cellule.meilleur && (
        <span className="mt-1 inline-flex items-center rounded-full bg-succes/10 px-2 py-0.5 text-[11px] font-bold text-succes">
          ✓ Meilleure valeur
        </span>
      )}
    </div>
  );
}

/** En-tête d'une colonne : photo, identité, prix et actions. */
function EnteteVehicule({
  v,
  idsApres,
  diff,
}: {
  v: Vehicule;
  idsApres: string[];
  diff: boolean;
}) {
  const titre = `${v.marque} ${v.modele}`;
  return (
    <div className="flex min-w-0 flex-col gap-2 p-3">
      <VisuelVehicule
        photo={v.photos[0]}
        teinte={v.teinte}
        libelle={titre}
        tailles="(min-width: 768px) 25vw, 60vw"
        className="h-24 rounded-lg sm:h-32"
      />
      <div className="min-w-0">
        <Badge ton="succes">Disponible</Badge>
        <h2 className="mt-1.5 truncate text-base font-bold text-gris-900">{titre}</h2>
        <p className="truncate text-xs text-gris-500">{v.version}</p>
        <p className="mt-1 text-xl font-extrabold text-marine-900">
          {formaterPrix(v.prixCentimes)}
        </p>
        <p className="text-xs text-gris-500">
          {v.annee} · {formaterKilometrage(v.kilometrage)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <BoutonLien href={`/vehicules/${v.id}`} variante="primaire" className="h-9 px-3 text-xs">
          Voir la fiche
        </BoutonLien>
        <LienRetirer
          id={v.id}
          titre={titre}
          idsApres={idsApres}
          seulementDifferences={diff}
        />
      </div>
      <Link
        href={`/contact?sujet=vehicule&vehicule=${v.reference}`}
        className="text-xs font-semibold text-bleu-600 hover:underline"
      >
        Contacter le concessionnaire
      </Link>
    </div>
  );
}

export default async function PageComparateur({ searchParams }: Props) {
  const params = await searchParams;
  // L'adresse est une entrée non fiable : on la nettoie (3 identifiants valides au plus).
  const idsDemandes = lireIdsUrl(params.ids);
  const diff = params.diff === "1";

  // Les vraies données, relues à chaque affichage : prix et disponibilité toujours à jour.
  const trouves = await Promise.all(idsDemandes.map((id) => trouverVehicule(id)));
  const vehicules = trouves.filter((v): v is Vehicule => v !== undefined);
  const indisponibles = idsDemandes.length - vehicules.length;
  const ids = vehicules.map((v) => v.id);

  const sections = construireSections(vehicules);
  const affichees = diff ? seulementDifferences(sections) : sections;
  const n = vehicules.length;

  return (
    <>
      {/* Aligne la sélection du navigateur sur ce qui est affiché. */}
      {idsDemandes.length === 0 ? (
        <RedirectionDepuisSelection />
      ) : (
        <SynchroSelection elements={vehicules.map(versElementComparaison)} />
      )}

      <section className="bg-linear-to-b from-marine-950 to-marine-900 text-white">
        <Conteneur className="py-10">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Comparez les véhicules
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
            Analysez les caractéristiques, comparez les prix et trouvez le véhicule qui
            correspond à vos besoins.
          </p>
        </Conteneur>
      </section>

      <Conteneur className="py-8">
        {indisponibles > 0 && (
          <p
            role="status"
            className="mb-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-alerte"
          >
            {indisponibles === 1
              ? "Un véhicule de votre sélection n'est plus disponible : il a été retiré de la comparaison."
              : `${indisponibles} véhicules de votre sélection ne sont plus disponibles : ils ont été retirés de la comparaison.`}
          </p>
        )}

        {/* ÉTAT 0 : comparateur vide. */}
        {n === 0 && (
          <div className="rounded-2xl border border-dashed border-gris-300 bg-white p-10 text-center">
            <p className="text-xl font-bold text-gris-900">Votre comparateur est vide.</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-gris-500">
              Choisissez de deux à trois véhicules avec le bouton « Comparer » pour les
              voir côte à côte.
            </p>
            <BoutonLien href="/vehicules" taille="lg" className="mt-6">
              Découvrir nos véhicules
            </BoutonLien>
          </div>
        )}

        {/* ÉTAT 1 : un seul véhicule, il en faut au moins un autre. */}
        {n === 1 && (
          <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
            <div className="rounded-2xl border border-gris-200 bg-white">
              <EnteteVehicule v={vehicules[0]} idsApres={[]} diff={false} />
            </div>
            <div className="flex flex-col justify-center rounded-2xl border border-dashed border-gris-300 bg-white p-8 text-center">
              <p className="text-lg font-bold text-gris-900">
                Ajoutez un autre véhicule pour comparer.
              </p>
              <p className="mt-1 text-sm text-gris-500">
                Il faut au moins deux véhicules différents (jusqu’à {MAX_COMPARAISON}).
              </p>
              <Link href="/vehicules" className={`${classesBouton("primaire", "md")} mx-auto mt-5`}>
                Choisir un véhicule
              </Link>
            </div>
          </div>
        )}

        {/* ÉTATS 2 et 3 : tableau comparatif. */}
        {n >= 2 && (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p aria-live="polite" className="text-sm text-gris-700">
                <strong>
                  {n}/{MAX_COMPARAISON}
                </strong>{" "}
                véhicules comparés.{" "}
                {n < MAX_COMPARAISON ? (
                  <Link href="/vehicules" className="font-semibold text-bleu-600 hover:underline">
                    Ajouter un véhicule
                  </Link>
                ) : (
                  <span className="text-gris-500">
                    {MESSAGE_LIMITE} {MESSAGE_LIMITE_AIDE}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href={urlComparateur(ids, !diff)}
                  replace
                  scroll={false}
                  className="inline-flex h-9 items-center rounded-full border border-gris-300 bg-white px-4 text-xs font-semibold text-gris-900 hover:bg-gris-50"
                >
                  {diff ? "Afficher toutes les lignes" : "Afficher seulement les différences"}
                </Link>
                <LienToutEffacer>Tout effacer</LienToutEffacer>
              </div>
            </div>

            {/*
              Tableau en grille CSS : une colonne d'intitulés + une colonne par véhicule.
              - Mobile : la grille défile horizontalement ; les intitulés restent collés à gauche.
              - Ordinateur : toutes les colonnes tiennent, et l'en-tête reste collé en haut
                pendant le défilement (sticky). Pas d'« overflow-hidden » ici : il casserait sticky.
            */}
            <div className="max-md:overflow-x-auto max-md:pb-2">
              <div
                style={{ "--n": n } as React.CSSProperties}
                role="table"
                aria-label="Comparaison des véhicules"
                className="grid grid-cols-[7.5rem_repeat(var(--n),minmax(11.5rem,1fr))] rounded-2xl border border-gris-200 bg-white max-md:min-w-[calc(7.5rem+var(--n)*11.5rem)] md:grid-cols-[11rem_repeat(var(--n),minmax(0,1fr))]"
              >
                {/* En-tête collé en haut (ordinateur). */}
                <div role="row" className="col-span-full grid grid-cols-subgrid rounded-t-2xl border-b border-gris-200 bg-white">
                  <div role="columnheader" className="sticky left-0 z-10 flex items-end bg-white p-3 text-xs font-bold uppercase tracking-wide text-gris-500">
                    Véhicule
                  </div>
                  {vehicules.map((v) => (
                    <div role="columnheader" key={v.id} className="min-w-0">
                      <EnteteVehicule
                        v={v}
                        idsApres={ids.filter((i) => i !== v.id)}
                        diff={diff}
                      />
                    </div>
                  ))}
                </div>

                {/*
                  Bandeau compact collé sous l'en-tête du site pendant le défilement (ordinateur) :
                  on garde le nom et le prix de chaque véhicule sous les yeux sans masquer l'écran.
                */}
                <div role="row" className="col-span-full grid grid-cols-subgrid border-b border-gris-200 bg-white/95 backdrop-blur md:sticky md:top-16 md:z-30">
                  <div role="columnheader" className="sticky left-0 z-10 bg-white p-3 text-xs font-bold uppercase tracking-wide text-gris-500">
                    Résumé
                  </div>
                  {vehicules.map((v) => (
                    <div role="columnheader" key={v.id} className="min-w-0 p-3">
                      <p className="truncate text-sm font-bold text-gris-900">
                        {v.marque} {v.modele}
                      </p>
                      <p className="text-xs font-semibold text-marine-900">
                        {formaterPrix(v.prixCentimes)}
                      </p>
                    </div>
                  ))}
                </div>

                {affichees.length === 0 && (
                  <p className="col-span-full p-8 text-center text-sm text-gris-500">
                    Ces véhicules ont exactement les mêmes caractéristiques.
                  </p>
                )}

                {affichees.map((section) => (
                  <div key={section.titre} role="rowgroup" className="col-span-full grid grid-cols-subgrid">
                    <h3 className="col-span-full border-y border-gris-200 bg-gris-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-gris-700">
                      <span className="sticky left-3">{section.titre}</span>
                    </h3>
                    {section.lignes.map((ligne) => (
                      <div
                        role="row"
                        key={ligne.libelle}
                        className={`col-span-full grid grid-cols-subgrid border-b border-gris-100 last:border-b-0 ${
                          ligne.different ? "bg-bleu-50" : "bg-white"
                        }`}
                      >
                        <div
                          role="rowheader"
                          className="sticky left-0 z-10 bg-inherit p-3 text-xs font-semibold text-gris-700"
                        >
                          {ligne.libelle}
                          {ligne.different && (
                            <span className="sr-only"> (valeurs différentes)</span>
                          )}
                        </div>
                        {ligne.cellules.map((c, i) => (
                          <div role="cell" key={vehicules[i].id} className="min-w-0 p-3">
                            <CaseTableau cellule={c} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-4 text-xs text-gris-500">
              Les lignes sur fond bleu clair sont celles où les véhicules diffèrent. Seules les
              informations enregistrées par DriveDeal sont affichées : une donnée absente est
              indiquée « Non renseigné ».
            </p>
          </>
        )}
      </Conteneur>
    </>
  );
}
