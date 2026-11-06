import type { Metadata } from "next";
import Link from "next/link";
import { Apparition } from "@/components/animation/Apparition";
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

/**
 * Catalogue des véhicules.
 * Les filtres, le tri et la pagination vivent dans l'adresse (?marque=…&tri=…&page=…) :
 * la page est donc partageable, fonctionne sans JavaScript et se met en cache proprement.
 * Étapes : lire les paramètres (non fiables) -> les convertir en filtres valides ->
 * rechercher -> afficher.
 */
// Métadonnées de la page (titre et description pour les moteurs de recherche).
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
  // Next.js 16 : searchParams est une promesse, il faut l'attendre.
  const brut = await searchParams;
  // Les paramètres d'adresse peuvent contenir n'importe quoi : lireFiltres ne garde que des valeurs valides.
  const filtres = lireFiltres(brut);
  const tous = await listerVehicules();
  const resultat = rechercher(tous, filtres);

  const couleurs = valeursDistinctes(tous, "couleur");
  // Couleur d'illustration de chaque couleur de carrosserie (pastilles du filtre).
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

  // Paramètres bruts conservés tels quels pour reconstruire les liens (pagination, pastilles).
  const params: Record<string, string | undefined> = {};
  for (const [cle, valeur] of Object.entries(brut)) {
    params[cle] = Array.isArray(valeur) ? valeur[0] : valeur;
  }

  // Numéros du premier et du dernier résultat de la page, pour « 1–6 sur 12 véhicules ».
  const debut = (resultat.page - 1) * filtres.parPage + 1;
  const fin = debut + resultat.vehicules.length - 1;

  return (
    <>
      {/* Bandeau de titre avec fil d'Ariane et compteur de véhicules. */}
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
        {/* Colonne de gauche : formulaire de filtres (GET, sans JavaScript). */}
        <aside>
          <FiltresVehicules filtres={filtres} options={options} />
        </aside>

        {/* Colonne de droite : pastilles de filtres, tri, résultats et pagination. */}
        <section aria-labelledby="titre-resultats" className="min-w-0">
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
              {resultat.vehicules.map((v, i) => (
                <Apparition key={v.id} delai={(i % 3) * 100} className="h-full">
                  <CarteVehicule vehicule={v} />
                </Apparition>
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

      {/* Bandeau de réassurance. */}
      <section className="border-t border-gris-200 bg-gris-50 py-10">
        <Conteneur className="grid gap-6 sm:grid-cols-3">
          {garanties.map((g, i) => (
            <Apparition key={g.titre} delai={i * 100}>
              <div className="mb-3 h-1.5 w-10 rounded-full bg-bleu-600" />
              <h3 className="font-bold text-gris-900">{g.titre}</h3>
              <p className="mt-1 text-sm leading-6 text-gris-500">{g.texte}</p>
            </Apparition>
          ))}
        </Conteneur>
      </section>
    </>
  );
}
