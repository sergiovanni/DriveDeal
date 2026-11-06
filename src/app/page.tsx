import Link from "next/link";
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

export default function Accueil() {
  const tous = listerVehicules();
  const aLaUne = rechercher(tous, lireFiltres({})).vehicules.slice(0, 3);
  const vedette = aLaUne[0];
  const marques = valeursDistinctes(tous, "marque");
  const carrosseries = valeursDistinctes(tous, "carrosserie");
  const prixMini = Math.min(...tous.map((v) => v.prixCentimes));
  const chiffres: [string, string][] = [
    [String(tous.length), "véhicules disponibles"],
    [String(marques.length), "marques"],
    [String(carrosseries.length), "types de carrosserie"],
    [formaterPrix(prixMini), "prix de départ"],
  ];

  return (
    <>
      <section className="bg-linear-to-b from-marine-950 via-marine-900 to-marine-800 text-white">
        <Conteneur className="grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-ciel-300">
              Véhicules d’occasion en ligne
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Trouvez votre prochain
              <span className="text-ciel-300"> véhicule</span>.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-white/75">
              Parcourez notre stock, consultez chaque fiche en détail et achetez en ligne,
              de la réservation à la facture.
            </p>
            <div className="flex flex-wrap gap-3">
              <BoutonLien href="/vehicules" taille="lg">
                Explorer le catalogue
              </BoutonLien>
            </div>
          </div>

          {vedette && (
            <Link
              href={`/vehicules/${vedette.id}`}
              className="group relative block overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
            >
              <VisuelVehicule
                teinte={vedette.teinte}
                libelle={`${vedette.marque} ${vedette.modele}`}
                className="h-72"
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

      <section
        aria-label="Le catalogue en chiffres"
        className="bg-marine-950 py-8 text-white"
      >
        <Conteneur>
          <dl className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
            {chiffres.map(([valeur, libelle]) => (
              <div key={libelle}>
                <dd className="text-3xl font-extrabold text-white">{valeur}</dd>
                <dt className="mt-1 text-xs font-semibold uppercase tracking-wide text-ciel-300">
                  {libelle}
                </dt>
              </div>
            ))}
          </dl>
        </Conteneur>
      </section>

      <section className="bg-gris-50 py-16">
        <Conteneur>
          <div className="mb-8 flex items-end justify-between gap-4">
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
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {aLaUne.map((v) => (
              <CarteVehicule key={v.id} vehicule={v} />
            ))}
          </div>
        </Conteneur>
      </section>

      <section className="py-16">
        <Conteneur>
          <h2 className="mb-8 text-2xl font-extrabold tracking-tight text-marine-900 sm:text-3xl">
            Pourquoi acheter sur DriveDeal
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {atouts.map((a) => (
              <div
                key={a.titre}
                className="rounded-xl border border-gris-200 bg-white p-5"
              >
                <div className="mb-3 h-1.5 w-10 rounded-full bg-bleu-600" />
                <h3 className="font-bold text-gris-900">{a.titre}</h3>
                <p className="mt-2 text-sm leading-6 text-gris-500">{a.texte}</p>
              </div>
            ))}
          </div>
        </Conteneur>
      </section>

      <section className="bg-gris-50 py-16">
        <Conteneur className="grid items-center gap-10 lg:grid-cols-2">
          <div>
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
          </div>
          <ol className="space-y-4">
            {etapes.map((e, i) => (
              <li
                key={e.titre}
                className="flex gap-4 rounded-xl border border-gris-200 bg-white p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bleu-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-bold text-gris-900">{e.titre}</h3>
                  <p className="mt-1 text-sm leading-6 text-gris-500">{e.texte}</p>
                </div>
              </li>
            ))}
          </ol>
        </Conteneur>
      </section>

      <section className="bg-marine-900 py-14 text-white">
        <Conteneur className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Prêt à trouver votre prochain véhicule ?
            </h2>
            <p className="mt-1 text-white/70">
              Filtrez par marque, budget, kilométrage, carburant et bien plus.
            </p>
          </div>
          <BoutonLien href="/vehicules" taille="lg">
            Voir tous les véhicules
          </BoutonLien>
        </Conteneur>
      </section>
    </>
  );
}
