import type { Metadata } from "next";
import Link from "next/link";
import { Conteneur } from "@/components/ui/Conteneur";
import { CarteVehicule } from "@/components/vehicules/CarteVehicule";
import { FiltresActifs } from "@/components/vehicules/FiltresActifs";
import { FiltresVehicules } from "@/components/vehicules/FiltresVehicules";
import { Pagination } from "@/components/vehicules/Pagination";
import { TriVehicules } from "@/components/vehicules/TriVehicules";
import {
  lireFiltres,
  listerVehicules,
  optionsTri,
  rechercher,
  valeursDistinctes,
} from "@/modules/vehicles";

export const metadata: Metadata = {
  title: "Nos véhicules d’occasion",
  description:
    "Parcourez le catalogue DriveDeal : filtrez par marque, prix, année, kilométrage et plus.",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const garanties = [
  {
    titre: "Fiches détaillées",
    texte:
      "Caractéristiques, équipements, état, entretien et documents pour chaque véhicule.",
  },
  {
    titre: "Paiement sécurisé",
    texte:
      "Règlement en ligne via un prestataire agréé, sans stockage de données bancaires.",
  },
  {
    titre: "Suivi de commande",
    texte: "Commandes, paiements et factures réunis dans votre espace client.",
  },
];

export default async function PageCatalogue({ searchParams }: Props) {
  const brut = await searchParams;
  const filtres = lireFiltres(brut);
  const tous = listerVehicules();
  const resultat = rechercher(tous, filtres);

  const couleurs = valeursDistinctes(tous, "couleur");
  const couleursHex: Record<string, string> = {};
  for (const v of tous) couleursHex[v.couleur] ??= v.teinte;

  const options = {
    marques: valeursDistinctes(tous, "marque"),
    carburants: valeursDistinctes(tous, "carburant"),
    transmissions: valeursDistinctes(tous, "transmission"),
    carrosseries: valeursDistinctes(tous, "carrosserie"),
    couleurs,
    couleursHex,
  };

  const params: Record<string, string | undefined> = {};
  for (const [cle, valeur] of Object.entries(brut)) {
    params[cle] = Array.isArray(valeur) ? valeur[0] : valeur;
  }

  const debut = (resultat.page - 1) * filtres.parPage + 1;
  const fin = debut + resultat.vehicules.length - 1;

  return (
    <>
      <section className="bg-linear-to-b from-marine-950 to-marine-900 py-10 text-white">
        <Conteneur>
          <nav aria-label="Fil d’Ariane" className="mb-4 text-sm text-white/60">
            <Link href="/" className="hover:text-white">
              Accueil
            </Link>{" "}
            / <span className="text-white">Nos véhicules</span>
          </nav>
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Trouvez le véhicule qui correspond à votre quotidien.
          </h1>
          <p className="mt-3 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-ciel-300">
            {tous.length} véhicules disponibles
          </p>
        </Conteneur>
      </section>

      <Conteneur className="grid gap-8 py-10 lg:grid-cols-[300px_1fr]">
        <aside>
          <FiltresVehicules filtres={filtres} options={options} />
        </aside>

        <section aria-labelledby="titre-resultats">
          <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-xs text-alerte">
            Prototype : les véhicules affichés sont des données de démonstration.
          </p>

          <FiltresActifs filtres={filtres} params={params} />

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 id="titre-resultats" className="text-sm font-semibold text-gris-700">
              {resultat.total === 0
                ? "Aucun véhicule"
                : `${debut}–${fin} sur ${resultat.total} véhicule${resultat.total > 1 ? "s" : ""}`}
            </h2>
            <TriVehicules options={optionsTri} actuel={filtres.tri} />
          </div>

          {resultat.total === 0 ? (
            <div className="rounded-xl border border-dashed border-gris-300 p-10 text-center">
              <p className="font-semibold text-gris-900">
                Aucun véhicule ne correspond à votre recherche.
              </p>
              <p className="mt-1 text-sm text-gris-500">
                Modifiez vos critères ou réinitialisez les filtres.
              </p>
              <Link
                href="/vehicules"
                className="mt-4 inline-flex h-10 items-center rounded-lg bg-bleu-600 px-4 text-sm font-semibold text-white hover:bg-bleu-500"
              >
                Réinitialiser les filtres
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {resultat.vehicules.map((v) => (
                <CarteVehicule key={v.id} vehicule={v} />
              ))}
            </div>
          )}

          <Pagination
            page={resultat.page}
            pages={resultat.pages}
            parPage={filtres.parPage}
            params={params}
          />
        </section>
      </Conteneur>

      <section className="border-t border-gris-200 bg-gris-50 py-10">
        <Conteneur className="grid gap-6 sm:grid-cols-3">
          {garanties.map((g) => (
            <div key={g.titre}>
              <div className="mb-3 h-1.5 w-10 rounded-full bg-bleu-600" />
              <h3 className="font-bold text-gris-900">{g.titre}</h3>
              <p className="mt-1 text-sm leading-6 text-gris-500">{g.texte}</p>
            </div>
          ))}
        </Conteneur>
      </section>
    </>
  );
}
