import Link from "next/link";
import { Apparition } from "@/components/animation/Apparition";
import { CompteurAnime } from "@/components/animation/CompteurAnime";
import { BoutonLien } from "@/components/ui/Button";
import { Conteneur } from "@/components/ui/Conteneur";
import { CarteVehicule } from "@/components/vehicules/CarteVehicule";
import { VisuelVehicule } from "@/components/vehicules/VisuelVehicule";
import { formaterKilometrage, formaterPrix } from "@/lib/money";
import {
  lireFiltres,
  listerVehicules,
  rechercher,
  valeursDistinctes,
} from "@/modules/vehicles";

const atouts = [
  {
    titre: "Fiches détaillées",
    texte:
      "Caractéristiques, équipements, état général, entretien et documents : tout ce qu’il faut savoir avant d’acheter.",
  },
  {
    titre: "Paiement sécurisé",
    texte:
      "Réglez en ligne auprès d’un prestataire de paiement. Nous ne stockons aucune donnée bancaire.",
  },
  {
    titre: "Documents dans votre espace",
    texte: "Retrouvez vos commandes, vos paiements et vos factures au même endroit.",
  },
  {
    titre: "Un véhicule, un acheteur",
    texte:
      "Chaque véhicule est unique : une fois votre achat engagé, il est réservé pour vous.",
  },
];

const etapes = [
  {
    titre: "Choisissez votre véhicule",
    texte:
      "Recherchez avec les filtres et consultez la fiche complète : caractéristiques, état, entretien.",
  },
  {
    titre: "Créez votre compte et commandez",
    texte:
      "Vérifiez vos informations, relisez le récapitulatif et acceptez les conditions de vente.",
  },
  {
    titre: "Payez en ligne",
    texte:
      "Le paiement est confirmé par le prestataire avant que la commande soit considérée comme payée.",
  },
  {
    titre: "Suivez et récupérez vos documents",
    texte:
      "Suivi de commande, facture et documents du véhicule disponibles dans votre espace.",
  },
];

const champ =
  "h-11 w-full rounded-lg border border-white/15 bg-white/95 px-3 text-sm text-gris-900";

/**
 * Page d'accueil.
 * Enchaîne : héros animé + recherche rapide, bandeau de chiffres réels, véhicules à la une,
 * avantages, parcours d'achat en 4 étapes, appel à l'action.
 * Les chiffres sont calculés à partir du catalogue : rien n'est écrit en dur.
 */
// La page est régénérée au plus toutes les 60 s : un nouveau véhicule publié apparaît
// donc rapidement sans reconstruire le site.
export const revalidate = 60;

export default async function Accueil() {
  const tous = await listerVehicules();
  // Les 3 véhicules les plus récemment publiés (tri par défaut du catalogue).
  const aLaUne = rechercher(tous, lireFiltres({})).vehicules.slice(0, 3);
  const vedette = aLaUne[0];
  const marques = valeursDistinctes(tous, "marque");
  const carrosseries = valeursDistinctes(tous, "carrosserie");
  // Prix de départ affiché dans le bandeau de chiffres (valeur en centimes).
  const prixMini = Math.min(...tous.map((v) => v.prixCentimes));
  const chiffres: { valeur: number; format: "entier" | "euro"; libelle: string }[] = [
    { valeur: tous.length, format: "entier", libelle: "véhicules disponibles" },
    { valeur: marques.length, format: "entier", libelle: "marques" },
    { valeur: carrosseries.length, format: "entier", libelle: "types de carrosserie" },
    { valeur: prixMini, format: "euro", libelle: "prix de départ" },
  ];

  return (
    <>
      {/* Héros : accroche, véhicule vedette et recherche rapide. La classe « entree » joue l'animation d'arrivée au chargement (délai réglé par --delai). */}
      <section className="bg-linear-to-b from-marine-950 via-marine-900 to-marine-800 text-white">
        <Conteneur className="grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div className="space-y-6">
            <p className="entree text-sm font-semibold uppercase tracking-widest text-ciel-300">
              Véhicules d’occasion en ligne
            </p>
            <h1
              className="entree text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl"
              style={{ "--delai": "120ms" } as React.CSSProperties}
            >
              Trouvez votre prochain
              <span className="text-ciel-300"> véhicule</span>.
            </h1>
            <p
              className="entree max-w-xl text-lg leading-8 text-white/75"
              style={{ "--delai": "240ms" } as React.CSSProperties}
            >
              Parcourez notre stock, consultez chaque fiche en détail et achetez en ligne,
              de la réservation à la facture.
            </p>
            <div
              className="entree flex flex-wrap gap-3"
              style={{ "--delai": "360ms" } as React.CSSProperties}
            >
              <BoutonLien href="/vehicules" taille="lg">
                Explorer le catalogue
              </BoutonLien>
            </div>
          </div>

          {vedette && (
            <Link
              href={`/vehicules/${vedette.id}`}
              className="entree group relative block overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-transform duration-500 hover:-translate-y-1"
              style={{ "--delai": "300ms" } as React.CSSProperties}
            >
              <VisuelVehicule
                photo={vedette.photos[0]}
                tailles="(min-width: 1024px) 50vw, 100vw"
                teinte={vedette.teinte}
                libelle={`${vedette.marque} ${vedette.modele}`}
                className="h-72"
                flottant
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-linear-to-t from-marine-950/95 to-transparent p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ciel-300">
                    Dernière arrivée
                  </p>
                  <p className="text-lg font-bold">
                    {vedette.marque} {vedette.modele}
                  </p>
                  <p className="text-sm text-white/70">{vedette.version}</p>
                  <p className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
                    {[
                      `${vedette.puissanceCh} ch`,
                      vedette.motorisation,
                      formaterKilometrage(vedette.kilometrage),
                    ].map((c) => (
                      <span key={c} className="rounded-md bg-white/10 px-2 py-1">
                        {c}
                      </span>
                    ))}
                  </p>
                </div>
                <p className="text-xl font-extrabold">
                  {formaterPrix(vedette.prixCentimes)}
                </p>
              </div>
            </Link>
          )}
        </Conteneur>

        <Conteneur className="pb-12">
          {/* Recherche rapide : formulaire GET vers le catalogue, les critères passent dans l'adresse. */}
          <form
            method="get"
            action="/vehicules"
            className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:grid-cols-2 lg:grid-cols-5"
            aria-label="Recherche rapide"
          >
            <div>
              <label
                htmlFor="acc-marque"
                className="mb-1 block text-xs font-semibold text-white/70"
              >
                Marque
              </label>
              <select id="acc-marque" name="marque" className={champ} defaultValue="">
                <option value="">Toutes</option>
                {marques.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="acc-carrosserie"
                className="mb-1 block text-xs font-semibold text-white/70"
              >
                Carrosserie
              </label>
              <select
                id="acc-carrosserie"
                name="carrosserie"
                className={champ}
                defaultValue=""
              >
                <option value="">Toutes</option>
                {carrosseries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="acc-prix"
                className="mb-1 block text-xs font-semibold text-white/70"
              >
                Budget maximum (€)
              </label>
              <input
                id="acc-prix"
                name="prixMax"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Ex. 25000"
                className={champ}
              />
            </div>
            <div>
              <label
                htmlFor="acc-km"
                className="mb-1 block text-xs font-semibold text-white/70"
              >
                Kilométrage max.
              </label>
              <input
                id="acc-km"
                name="kmMax"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Ex. 80000"
                className={champ}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="h-11 w-full rounded-lg bg-bleu-600 text-sm font-semibold text-white transition-colors hover:bg-bleu-500"
              >
                Trouver mon véhicule
              </button>
            </div>
          </form>
        </Conteneur>
      </section>

      {/* Bandeau de chiffres : CompteurAnime fait « monter » chaque nombre quand il devient visible. */}
      <section
        aria-label="Le catalogue en chiffres"
        className="bg-marine-950 py-8 text-white"
      >
        <Conteneur>
          <dl className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
            {chiffres.map(({ valeur, format, libelle }, i) => (
              <Apparition key={libelle} delai={i * 100} variante="zoom">
                <dd className="text-3xl font-extrabold text-white">
                  <CompteurAnime valeur={valeur} format={format} />
                </dd>
                <dt className="mt-1 text-xs font-semibold uppercase tracking-wide text-ciel-300">
                  {libelle}
                </dt>
              </Apparition>
            ))}
          </dl>
        </Conteneur>
      </section>

      {/* Véhicules à la une : Apparition décale l'entrée de chaque carte (effet de cascade). */}
      <section className="bg-gris-50 py-16">
        <Conteneur>
          <Apparition className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-marine-900 sm:text-3xl">
                Véhicules à la une
              </h2>
              <p className="mt-1 text-gris-500">
                Les dernières arrivées dans notre catalogue.
              </p>
            </div>
            <BoutonLien
              href="/vehicules"
              variante="contour"
              className="hidden sm:inline-flex"
            >
              Tout voir
            </BoutonLien>
          </Apparition>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {aLaUne.map((v, i) => (
              <Apparition key={v.id} delai={i * 120} className="h-full">
                <CarteVehicule vehicule={v} />
              </Apparition>
            ))}
          </div>
        </Conteneur>
      </section>

      {/* Avantages du service (texte limité à ce qui est prévu au cahier des charges). */}
      <section className="py-16">
        <Conteneur>
          <Apparition>
            <h2 className="mb-8 text-2xl font-extrabold tracking-tight text-marine-900 sm:text-3xl">
              Pourquoi acheter sur DriveDeal
            </h2>
          </Apparition>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {atouts.map((a, i) => (
              <Apparition key={a.titre} delai={i * 100} className="h-full">
                <div className="group h-full rounded-xl border border-gris-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-bleu-500/50 hover:shadow-lg">
                  <div className="mb-3 h-1.5 w-10 rounded-full bg-bleu-600 transition-all duration-300 group-hover:w-20" />
                  <h3 className="font-bold text-gris-900">{a.titre}</h3>
                  <p className="mt-2 text-sm leading-6 text-gris-500">{a.texte}</p>
                </div>
              </Apparition>
            ))}
          </div>
        </Conteneur>
      </section>

      {/* Parcours d'achat en 4 étapes. */}
      <section className="bg-gris-50 py-16">
        <Conteneur className="grid items-center gap-10 lg:grid-cols-2">
          <Apparition variante="gauche">
            <p className="text-sm font-semibold uppercase tracking-widest text-bleu-600">
              Comment ça marche
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-marine-900 sm:text-3xl">
              Plus qu’un catalogue : un achat simple, de A à Z.
            </h2>
            <p className="mt-3 leading-7 text-gris-500">
              De la découverte du véhicule à la remise de votre facture, chaque étape se
              fait en ligne.
            </p>
          </Apparition>
          <ol className="space-y-4">
            {etapes.map((e, i) => (
              <li key={e.titre}>
                <Apparition variante="droite" delai={i * 110}>
                  <div className="group flex gap-4 rounded-xl border border-gris-200 bg-white p-4 transition-all duration-300 hover:translate-x-1 hover:border-bleu-500/50 hover:shadow-md">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bleu-600 text-sm font-bold text-white transition-transform duration-300 group-hover:scale-110">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-gris-900">{e.titre}</h3>
                      <p className="mt-1 text-sm leading-6 text-gris-500">{e.texte}</p>
                    </div>
                  </div>
                </Apparition>
              </li>
            ))}
          </ol>
        </Conteneur>
      </section>

      {/* Appel à l'action final vers le catalogue. */}
      <section className="bg-marine-900 py-14 text-white">
        <Conteneur className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Apparition variante="gauche">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Prêt à trouver votre prochain véhicule ?
            </h2>
            <p className="mt-1 text-white/70">
              Filtrez par marque, budget, kilométrage, carburant et bien plus.
            </p>
          </Apparition>
          <Apparition variante="droite" delai={150}>
            <BoutonLien href="/vehicules" taille="lg">
              Voir tous les véhicules
            </BoutonLien>
          </Apparition>
        </Conteneur>
      </section>
    </>
  );
}
