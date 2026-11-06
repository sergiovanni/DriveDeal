import type { Metadata } from "next";
import { Conteneur } from "@/components/ui/Conteneur";
import { CarteVehicule } from "@/components/vehicules/CarteVehicule";
import { FiltresVehicules } from "@/components/vehicules/FiltresVehicules";
import { Pagination } from "@/components/vehicules/Pagination";
import {
  TAILLE_PAGE,
  lireFiltres,
  listerVehicules,
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

export default async function PageCatalogue({ searchParams }: Props) {
  const brut = await searchParams;
  const filtres = lireFiltres(brut);
  const tous = listerVehicules();
  const resultat = rechercher(tous, filtres);

  const options = {
    marques: valeursDistinctes(tous, "marque"),
    carburants: valeursDistinctes(tous, "carburant"),
    transmissions: valeursDistinctes(tous, "transmission"),
    carrosseries: valeursDistinctes(tous, "carrosserie"),
    couleurs: valeursDistinctes(tous, "couleur"),
  };

  const params: Record<string, string | undefined> = {};
  for (const [cle, valeur] of Object.entries(brut)) {
    params[cle] = Array.isArray(valeur) ? valeur[0] : valeur;
  }

  const debut = (resultat.page - 1) * TAILLE_PAGE + 1;
  const fin = debut + resultat.vehicules.length - 1;

  return (
    <>
      <section className="bg-marine-900 py-10 text-white">
        <Conteneur>
          <h1 className="text-3xl font-extrabold tracking-tight">Nos véhicules</h1>
          <p className="mt-2 max-w-2xl text-white/70">
            Trouvez le véhicule qui vous correspond grâce aux filtres.
          </p>
        </Conteneur>
      </section>

      <Conteneur className="grid gap-8 py-10 lg:grid-cols-[280px_1fr]">
        <aside>
          <FiltresVehicules filtres={filtres} options={options} />
        </aside>

        <section aria-labelledby="titre-resultats">
          <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-xs text-alerte">
            Prototype : les véhicules affichés sont des données de démonstration.
          </p>
          <h2 id="titre-resultats" className="mb-5 text-sm font-semibold text-gris-700">
            {resultat.total === 0
              ? "Aucun véhicule"
              : `${debut}–${fin} sur ${resultat.total} véhicule${resultat.total > 1 ? "s" : ""}`}
          </h2>

          {resultat.total === 0 ? (
            <div className="rounded-xl border border-dashed border-gris-300 p-10 text-center">
              <p className="font-semibold text-gris-900">
                Aucun véhicule ne correspond à votre recherche.
              </p>
              <p className="mt-1 text-sm text-gris-500">
                Modifiez vos critères ou réinitialisez les filtres.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {resultat.vehicules.map((v) => (
                <CarteVehicule key={v.id} vehicule={v} />
              ))}
            </div>
          )}

          <Pagination page={resultat.page} pages={resultat.pages} params={params} />
        </section>
      </Conteneur>
    </>
  );
}
