import type { Metadata } from "next";
import Link from "next/link";
import { BadgeStatut, CarteIndicateur } from "@/components/admin/ElementsAdmin";
import { BoutonLien } from "@/components/ui/Button";
import { exigerAdministrateur } from "@/lib/auth/garde";
import { formaterPrix } from "@/lib/money";
import { compterParStatut, listerPourAdmin } from "@/modules/vehicles/admin/depot-admin";

export const metadata: Metadata = {
  title: "Tableau de bord",
  robots: { index: false },
};

/**
 * Tableau de bord de l'administration.
 * Tous les chiffres sont lus en base : aucun indicateur fictif. Les indicateurs financiers
 * (chiffre d'affaires, encaissements) viendront avec les commandes et les paiements.
 */
export default async function PageAdmin() {
  // Chaque page d'administration vérifie elle-même les droits (voir layout.tsx).
  await exigerAdministrateur("/admin");

  const [compteurs, recents] = await Promise.all([
    compterParStatut(),
    listerPourAdmin({ page: 1, parPage: 5 }),
  ]);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-bleu-600">
            Administration
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-marine-900">
            Tableau de bord
          </h1>
          <p className="mt-1 text-gris-500">
            Vue d’ensemble de votre stock de véhicules.
          </p>
        </div>
        <BoutonLien href="/admin/vehicules/nouveau" taille="lg">
          + Ajouter un véhicule
        </BoutonLien>
      </div>

      <section
        aria-label="Indicateurs"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <CarteIndicateur
          libelle="Véhicules au total"
          valeur={compteurs.total}
          detail="Tous statuts confondus"
        />
        <CarteIndicateur
          libelle="Publiés"
          valeur={compteurs.publie}
          detail="Visibles sur le site"
        />
        <CarteIndicateur
          libelle="Brouillons"
          valeur={compteurs.brouillon}
          detail="En cours de préparation"
        />
        <CarteIndicateur
          libelle="Réservés ou vendus"
          valeur={compteurs.reserve + compteurs.vendu}
          detail="Gérés par les commandes"
        />
      </section>

      <section
        aria-labelledby="titre-recents"
        className="mt-10 rounded-2xl border border-gris-200 bg-white shadow-sm"
      >
        <div className="flex items-center justify-between gap-4 border-b border-gris-200 px-5 py-4">
          <h2 id="titre-recents" className="font-bold text-gris-900">
            Dernières modifications
          </h2>
          <Link
            href="/admin/vehicules"
            className="text-sm font-semibold text-bleu-600 hover:underline"
          >
            Tout voir
          </Link>
        </div>

        {recents.lignes.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-semibold text-gris-900">Aucun véhicule pour l’instant.</p>
            <p className="mt-1 text-sm text-gris-500">
              Ajoutez votre premier véhicule : il restera invisible du public tant que
              vous ne l’aurez pas publié.
            </p>
            <BoutonLien href="/admin/vehicules/nouveau" className="mt-5">
              Ajouter un véhicule
            </BoutonLien>
          </div>
        ) : (
          <ul className="divide-y divide-gris-100">
            {recents.lignes.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/admin/vehicules/${v.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-gris-50"
                >
                  <span>
                    <span className="block text-xs font-semibold text-gris-500">
                      {v.reference}
                    </span>
                    <span className="block font-semibold text-gris-900">
                      {v.marque} {v.modele}
                    </span>
                    <span className="block text-sm text-gris-500">{v.version}</span>
                  </span>
                  <span className="flex items-center gap-4">
                    <span className="font-bold text-marine-900">
                      {formaterPrix(v.prixCentimes)}
                    </span>
                    <BadgeStatut statut={v.statut} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
