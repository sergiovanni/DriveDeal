import type { Metadata } from "next";
import Link from "next/link";
import { BandeauMessage } from "@/components/admin/ElementsAdmin";
import { exigerAdministrateur } from "@/lib/auth/garde";
import { listerDemandes } from "@/modules/demandes/depot-admin";

export const metadata: Metadata = {
  title: "Demandes — Administration",
  robots: { index: false },
};

const LIMITE = 100;

const formatDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

/**
 * Demandes d'intérêt reçues via le formulaire « Faire une demande » des fiches véhicule.
 * Réservé aux administrateurs (la garde est rappelée ici : un layout ne suffit pas).
 */
export default async function PageDemandes() {
  await exigerAdministrateur("/admin/demandes");

  if (!process.env.DATABASE_URL) {
    return (
      <BandeauMessage ton="info">
        La base de données n’est pas configurée : aucune demande à afficher.
      </BandeauMessage>
    );
  }

  const { demandes, total } = await listerDemandes(LIMITE);

  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-bleu-600">
          Administration
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-marine-900">
          Demandes
        </h1>
        <p className="mt-1 text-gris-500">
          Visiteurs intéressés par un véhicule, à recontacter.{" "}
          <strong>{total}</strong> demande{total > 1 ? "s" : ""} au total.
        </p>
      </div>

      {demandes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gris-300 bg-white p-10 text-center">
          <p className="font-semibold text-gris-900">Aucune demande pour le moment.</p>
          <p className="mt-1 text-sm text-gris-500">
            Elles apparaîtront ici dès qu’un visiteur remplira le formulaire d’une fiche.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gris-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gris-50 text-xs uppercase tracking-wide text-gris-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Reçue le</th>
                  <th className="px-4 py-3 font-semibold">Véhicule</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Code postal</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gris-100">
                {demandes.map((d) => (
                  <tr key={d.id} className="align-top hover:bg-gris-50">
                    <td className="whitespace-nowrap px-4 py-3 text-gris-700">
                      {formatDate.format(d.creeLe)}
                    </td>
                    <td className="px-4 py-3">
                      {d.vehiculeId ? (
                        <Link
                          href={`/admin/vehicules/${d.vehiculeId}`}
                          className="font-semibold text-bleu-600 hover:underline"
                        >
                          {d.vehiculeReference}
                        </Link>
                      ) : (
                        <span className="text-gris-500" title="Véhicule supprimé depuis">
                          {d.vehiculeReference}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {/* Texte de visiteur : toujours affiché comme du texte (React l'échappe). */}
                      <p className="font-semibold text-gris-900">
                        {d.prenom} {d.nom}
                      </p>
                      <a
                        href={`mailto:${encodeURIComponent(d.email)}`}
                        className="text-bleu-600 hover:underline"
                      >
                        {d.email}
                      </a>
                      {d.telephone && (
                        <p>
                          <a
                            href={`tel:${d.telephone.replace(/[^+0-9]/g, "")}`}
                            className="text-bleu-600 hover:underline"
                          >
                            {d.telephone}
                          </a>
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gris-700">{d.codePostal}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-bleu-50 px-2.5 py-1 text-xs font-semibold text-bleu-600">
                        {d.statut === "nouvelle" ? "Nouvelle" : d.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > LIMITE && (
            <p className="border-t border-gris-100 px-4 py-3 text-xs text-gris-500">
              Les {LIMITE} demandes les plus récentes sont affichées.
            </p>
          )}
        </div>
      )}
    </>
  );
}
