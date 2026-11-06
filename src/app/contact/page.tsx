import type { Metadata } from "next";
import Link from "next/link";
import { FormulaireContact } from "@/components/contact/FormulaireContact";
import { Conteneur } from "@/components/ui/Conteneur";
import { SUJETS } from "@/modules/contact/validation";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Une question sur un véhicule, une commande ou un paiement ? Écrivez-nous via le formulaire de contact DriveDeal.",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function premier(v: string | string[] | undefined): string | undefined {
  const valeur = Array.isArray(v) ? v[0] : v;
  return valeur?.trim() || undefined;
}

const conseils = [
  {
    titre: "Une question sur un véhicule ?",
    texte:
      "Indiquez sa référence (visible sur la fiche, par exemple DD-0004) pour une réponse plus rapide.",
  },
  {
    titre: "Une question sur une commande ?",
    texte:
      "Précisez la référence du véhicule concerné et l’adresse e-mail utilisée pour la commande.",
  },
];

export default async function PageContact({ searchParams }: Props) {
  const params = await searchParams;
  const sujetBrut = premier(params.sujet);
  const sujet = SUJETS.some((s) => s.valeur === sujetBrut) ? sujetBrut : undefined;
  const vehicule = premier(params.vehicule)?.slice(0, 30);
  const actif = Boolean(process.env.DATABASE_URL);

  return (
    <>
      <section className="bg-linear-to-b from-marine-950 to-marine-900 py-12 text-white">
        <Conteneur>
          <nav aria-label="Fil d’Ariane" className="mb-4 text-sm text-white/60">
            <Link href="/" className="hover:text-white">
              Accueil
            </Link>{" "}
            / <span className="text-white">Contact</span>
          </nav>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Contactez-nous
          </h1>
          <p className="mt-3 max-w-2xl text-white/75">
            Une question sur un véhicule, une commande ou un paiement ? Écrivez-nous, nous
            vous répondrons par e-mail.
          </p>
        </Conteneur>
      </section>

      <Conteneur className="grid gap-10 py-12 lg:grid-cols-[1fr_340px]">
        <section aria-labelledby="titre-formulaire">
          <h2 id="titre-formulaire" className="mb-6 text-xl font-bold text-gris-900">
            Envoyer un message
          </h2>
          <FormulaireContact
            actif={actif}
            sujetInitial={sujet}
            vehiculeInitial={vehicule}
          />
        </section>

        <aside className="space-y-5">
          {conseils.map((c) => (
            <div key={c.titre} className="rounded-xl border border-gris-200 bg-white p-5">
              <div className="mb-3 h-1.5 w-10 rounded-full bg-bleu-600" />
              <h2 className="font-bold text-gris-900">{c.titre}</h2>
              <p className="mt-2 text-sm leading-6 text-gris-500">{c.texte}</p>
            </div>
          ))}
          <div className="rounded-xl border border-dashed border-gris-300 bg-gris-50 p-5">
            <h2 className="font-bold text-gris-900">Coordonnées de l’entreprise</h2>
            <p className="mt-2 text-sm leading-6 text-gris-500">
              Adresse, téléphone et horaires seront publiés dès que l’entreprise aura
              fourni ses informations.
            </p>
          </div>
        </aside>
      </Conteneur>
    </>
  );
}
