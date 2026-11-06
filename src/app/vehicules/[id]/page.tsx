import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Bouton } from "@/components/ui/Button";
import { Conteneur } from "@/components/ui/Conteneur";
import { CarteVehicule } from "@/components/vehicules/CarteVehicule";
import { VisuelVehicule } from "@/components/vehicules/VisuelVehicule";
import { formaterKilometrage, formaterPrix } from "@/lib/money";
import {
  listerVehicules,
  trouverVehicule,
  vehiculesSimilaires,
} from "@/modules/vehicles";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return listerVehicules().map((v) => ({ id: v.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const v = trouverVehicule(id);
  if (!v) return { title: "Véhicule introuvable" };
  return {
    title: `${v.marque} ${v.modele} ${v.version}`,
    description: `${v.marque} ${v.modele} ${v.annee}, ${formaterKilometrage(v.kilometrage)}, ${formaterPrix(v.prixCentimes)}.`,
  };
}

export default async function FicheVehicule({ params }: Props) {
  const { id } = await params;
  const v = trouverVehicule(id);
  if (!v) notFound();

  const titre = `${v.marque} ${v.modele}`;
  const similaires = vehiculesSimilaires(listerVehicules(), v);

  const caracteristiques: [string, string][] = [
    ["Année", String(v.annee)],
    ["Kilométrage", formaterKilometrage(v.kilometrage)],
    ["Motorisation", v.motorisation],
    ["Carburant", v.carburant],
    ["Puissance", `${v.puissanceCh} ch`],
    ["Boîte de vitesses", v.boite],
    ["Transmission", v.transmission],
    ["Carrosserie", v.carrosserie],
    ["Portes", String(v.portes)],
    ["Places", String(v.places)],
    ["Couleur", v.couleur],
    ["Référence", v.reference],
  ];

  const informations: [string, string][] = [
    ["État général", v.etatGeneral],
    ["Historique", v.historique],
    ["Entretien", v.entretien],
    ["Contrôle technique", v.controleTechnique],
  ];

  return (
    <Conteneur className="py-8">
      <nav aria-label="Fil d’Ariane" className="mb-6 text-sm text-gris-500">
        <Link href="/" className="hover:text-bleu-600">
          Accueil
        </Link>{" "}
        /{" "}
        <Link href="/vehicules" className="hover:text-bleu-600">
          Nos véhicules
        </Link>{" "}
        / <span className="text-gris-900">{titre}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section aria-label="Photos">
            <VisuelVehicule
              teinte={v.teinte}
              libelle={titre}
              className="h-72 rounded-2xl sm:h-96"
            />
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="flex h-20 items-center justify-center rounded-lg border border-dashed border-gris-300 bg-gris-50 text-xs text-gris-500"
                >
                  Photo {n} à venir
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gris-900">Description</h2>
            <p className="leading-7 text-gris-700">{v.description}</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gris-900">Caractéristiques</h2>
            <dl className="grid overflow-hidden rounded-xl border border-gris-200 sm:grid-cols-2">
              {caracteristiques.map(([cle, valeur]) => (
                <div
                  key={cle}
                  className="flex justify-between gap-4 border-b border-gris-200 px-4 py-3 text-sm even:bg-gris-50 sm:[&:nth-last-child(-n+2)]:border-b-0"
                >
                  <dt className="text-gris-500">{cle}</dt>
                  <dd className="font-semibold text-gris-900">{valeur}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gris-900">Équipements</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {v.equipements.map((e) => (
                <li key={e} className="flex items-center gap-2 text-sm text-gris-700">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-bleu-600"
                    aria-hidden="true"
                  />
                  {e}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gris-900">
              État, historique et entretien
            </h2>
            <dl className="space-y-3">
              {informations.map(([cle, valeur]) => (
                <div key={cle} className="rounded-lg bg-gris-50 p-4">
                  <dt className="text-sm font-semibold text-gris-900">{cle}</dt>
                  <dd className="mt-1 text-sm text-gris-700">{valeur}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-5 rounded-2xl border border-gris-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <Badge ton="succes">Disponible</Badge>
              <Badge>{v.reference}</Badge>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-marine-900">
                {titre}
              </h1>
              <p className="text-gris-500">{v.version}</p>
            </div>
            <p className="text-4xl font-extrabold text-marine-900">
              {formaterPrix(v.prixCentimes)}
            </p>
            <p className="text-xs text-gris-500">
              Frais complémentaires et TVA : à définir (en attente de validation métier).
            </p>
            <Bouton disabled taille="lg" className="w-full">
              Acheter
            </Bouton>
            <p className="text-xs text-gris-500">
              L’achat en ligne sera disponible une fois le parcours de commande et de
              paiement réalisé.
            </p>
          </div>
        </aside>
      </div>

      {similaires.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-2xl font-extrabold tracking-tight text-marine-900">
            Véhicules similaires
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similaires.map((s) => (
              <CarteVehicule key={s.id} vehicule={s} />
            ))}
          </div>
        </section>
      )}
    </Conteneur>
  );
}
