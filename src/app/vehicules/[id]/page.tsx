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

  const chiffresCles: [string, string][] = [
    ["Puissance", `${v.puissanceCh} ch`],
    ["Kilométrage", formaterKilometrage(v.kilometrage)],
    ["Année", String(v.annee)],
    ["Boîte", v.boite],
  ];

  const sections: [string, string][] = [
    ["caracteristiques", "Caractéristiques"],
    ["equipements", "Équipements"],
    ["etat", "État et entretien"],
    ["documents", "Documents"],
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

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {chiffresCles.map(([cle, valeur]) => (
              <div
                key={cle}
                className="rounded-xl border border-gris-200 bg-gris-50 px-4 py-3 text-center"
              >
                <dd className="text-lg font-extrabold text-marine-900">{valeur}</dd>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-gris-500">
                  {cle}
                </dt>
              </div>
            ))}
          </dl>

          <nav
            aria-label="Sections de la fiche"
            className="sticky top-16 z-30 -mx-4 flex gap-2 overflow-x-auto border-b border-gris-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0"
          >
            {sections.map(([ancre, libelle]) => (
              <a
                key={ancre}
                href={`#${ancre}`}
                className="whitespace-nowrap rounded-full border border-gris-300 px-3 py-1.5 text-xs font-semibold text-gris-700 hover:border-bleu-600 hover:text-bleu-600"
              >
                {libelle}
              </a>
            ))}
          </nav>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gris-900">Description</h2>
            <p className="leading-7 text-gris-700">{v.description}</p>
          </section>

          <section id="caracteristiques" className="scroll-mt-32">
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

          <section id="equipements" className="scroll-mt-32">
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

          <section id="etat" className="scroll-mt-32">
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

          <section id="documents" className="scroll-mt-32">
            <h2 className="mb-3 text-xl font-bold text-gris-900">Documents associés</h2>
            <ul className="divide-y divide-gris-200 overflow-hidden rounded-xl border border-gris-200">
              {v.documents.map((d) => (
                <li
                  key={d}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                >
                  <span className="font-semibold text-gris-900">{d}</span>
                  <Badge>Démonstration</Badge>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-gris-500">
              Les documents réels du véhicule seront ajoutés depuis le back-office.
            </p>
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
            <dl className="space-y-2 rounded-lg bg-gris-50 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gris-500">Prix du véhicule</dt>
                <dd className="font-semibold text-gris-900">
                  {formaterPrix(v.prixCentimes)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gris-500">Frais complémentaires</dt>
                <dd className="font-semibold text-gris-500">À définir</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gris-500">TVA</dt>
                <dd className="font-semibold text-gris-500">À définir</dd>
              </div>
            </dl>
            <p className="text-xs text-gris-500">
              Frais et TVA seront précisés une fois les règles de l’entreprise validées.
            </p>
            <Bouton disabled taille="lg" className="w-full">
              Acheter
            </Bouton>
            <Link
              href={`/contact?sujet=vehicule&vehicule=${v.reference}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-gris-300 text-sm font-semibold text-gris-900 hover:bg-gris-50"
            >
              Poser une question sur ce véhicule
            </Link>
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
