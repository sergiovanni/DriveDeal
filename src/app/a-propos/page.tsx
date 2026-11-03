import type { Metadata } from "next";
import Link from "next/link";
import { Apparition } from "@/components/animation/Apparition";
import { BoutonLien } from "@/components/ui/Button";
import { Conteneur } from "@/components/ui/Conteneur";

/**
 * Page « À propos ».
 * Contenu volontairement limité à ce que prévoit le cahier des charges : l'histoire,
 * l'équipe, l'adresse et les garanties de l'entreprise seront ajoutées quand elles
 * auront été fournies (voir docs/08, points I-01, I-02 et I-10).
 */
// Métadonnées de la page (titre et description pour les moteurs de recherche).
export const metadata: Metadata = {
  title: "À propos",
  description:
    "DriveDeal présente son propre stock de véhicules d’occasion en ligne : fiches détaillées, comparateur et échange direct avec notre équipe.",
};

const engagements = [
  {
    titre: "Transparence",
    texte:
      "Chaque véhicule est présenté avec ses caractéristiques, ses équipements, son état général, son entretien et ses documents, pour vous décider en connaissance de cause.",
  },
  {
    titre: "Simplicité",
    texte:
      "Vous parcourez le catalogue, comparez jusqu’à trois véhicules, puis nous laissez une demande en quelques champs : nous vous recontactons.",
  },
  {
    titre: "Échange direct",
    texte:
      "Pas d’achat automatique : nous préférons discuter avec vous, répondre à vos questions et vous accompagner. Vous pouvez aussi nous appeler directement.",
  },
];

const etapes = [
  "Vous parcourez le catalogue et filtrez selon vos critères.",
  "Vous consultez la fiche détaillée du véhicule qui vous intéresse.",
  "Vous comparez jusqu’à trois véhicules côte à côte.",
  "Vous faites une demande : nous vous recontactons pour en discuter.",
];

export default function APropos() {
  return (
    <>
      <section className="bg-linear-to-b from-marine-950 via-marine-900 to-marine-800 py-16 text-white">
        <Conteneur>
          <nav aria-label="Fil d’Ariane" className="mb-4 text-sm text-white/60">
            <Link href="/" className="hover:text-white">
              Accueil
            </Link>{" "}
            / <span className="text-white">À propos</span>
          </nav>
          <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Trouvez votre véhicule d’occasion,{" "}
            <span className="text-ciel-300">simplement</span>.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
            DriveDeal propose son propre stock de véhicules d’occasion : vous choisissez,
            vous comparez, puis vous nous laissez une demande et nous vous recontactons
            pour en discuter.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <BoutonLien href="/vehicules" taille="lg">
              Voir les véhicules
            </BoutonLien>
            <BoutonLien href="/contact" variante="secondaire" taille="lg">
              Nous contacter
            </BoutonLien>
          </div>
        </Conteneur>
      </section>

      <section className="py-16">
        <Conteneur>
          <h2 className="mb-8 text-2xl font-extrabold tracking-tight text-marine-900 sm:text-3xl">
            Nos engagements
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {engagements.map((e, i) => (
              <Apparition key={e.titre} delai={i * 120} className="h-full">
                <div className="group h-full rounded-xl border border-gris-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-bleu-500/50 hover:shadow-xl">
                  <div className="mb-4 h-1.5 w-10 rounded-full bg-bleu-600 transition-all duration-300 group-hover:w-20" />
                  <h3 className="text-lg font-bold text-gris-900">{e.titre}</h3>
                  <p className="mt-2 text-sm leading-6 text-gris-500">{e.texte}</p>
                </div>
              </Apparition>
            ))}
          </div>
        </Conteneur>
      </section>

      <section className="bg-gris-50 py-16">
        <Conteneur className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-marine-900 sm:text-3xl">
              Comment ça se passe
            </h2>
            <ol className="mt-6 space-y-4">
              {etapes.map((texte, i) => (
                <li key={texte}>
                  <Apparition variante="gauche" delai={i * 110} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bleu-600 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="pt-1 text-gris-700">{texte}</p>
                  </Apparition>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-dashed border-gris-300 bg-white p-6">
            <h2 className="text-lg font-bold text-gris-900">L’entreprise</h2>
            <p className="mt-2 text-sm leading-6 text-gris-500">
              La présentation de l’entreprise (histoire, équipe, showroom, garanties) sera
              ajoutée ici dès que ces informations auront été fournies. Les mentions
              légales (raison sociale, adresse, numéro d’immatriculation) figureront sur
              leur propre page.
            </p>
          </div>
        </Conteneur>
      </section>

      <section className="bg-marine-900 py-12 text-white">
        <Conteneur className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Une question ?</h2>
            <p className="mt-1 text-white/70">
              Écrivez-nous, nous vous répondrons par e-mail.
            </p>
          </div>
          <BoutonLien href="/contact" taille="lg">
            Contacter DriveDeal
          </BoutonLien>
        </Conteneur>
      </section>
    </>
  );
}
