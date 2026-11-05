import type { Metadata } from "next";
import Link from "next/link";
import { BadgeStatut, BandeauMessage } from "@/components/admin/ElementsAdmin";
import { BoutonLien } from "@/components/ui/Button";
import { exigerAdministrateur } from "@/lib/auth/garde";
import { formaterKilometrage, formaterPrix } from "@/lib/money";
import { STATUTS_VEHICULE } from "@/lib/db/schema/constantes";
import {
  compterParStatut,
  estStatutValide,
  listerPourAdmin,
} from "@/modules/vehicles/admin/depot-admin";
import { LIBELLES_STATUT } from "@/modules/vehicles/admin/regles";
import type { StatutVehicule } from "@/modules/vehicles";

export const metadata: Metadata = {
  title: "Véhicules — Administration",
  robots: { index: false },
};

const PAR_PAGE = 10;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Premier élément d'un paramètre d'adresse, nettoyé (les paramètres sont non fiables). */
function lire(valeur: string | string[] | undefined): string | undefined {
  const v = (Array.isArray(valeur) ? valeur[0] : valeur)?.trim();
  return v ? v : undefined;
}

/** Construit une adresse de la liste en conservant les filtres utiles. */
function adresse(params: { q?: string; statut?: string; page?: number }): string {
  const q = new URLSearchParams();
  if (params.q) q.set("q", params.q);
  if (params.statut) q.set("statut", params.statut);
  if (params.page && params.page > 1) q.set("page", String(params.page));
  const s = q.toString();
  return s ? `/admin/vehicules?${s}` : "/admin/vehicules";
}

/**
 * Liste des véhicules (tous statuts) : recherche, filtre par statut, pagination.
 * Filtres et page vivent dans l'adresse : partageables, et la page marche sans JavaScript.
 */
export default async function PageListeVehicules({ searchParams }: Props) {
  await exigerAdministrateur("/admin/vehicules");

  // Next.js 16 : searchParams est une promesse, il faut l'attendre.
  const params = await searchParams;
  const q = lire(params.q)?.slice(0, 80);
  const statutBrut = lire(params.statut);
  const statut: StatutVehicule | undefined = estStatutValide(statutBrut)
    ? statutBrut
    : undefined;
  const page = Math.max(1, Math.floor(Number(lire(params.page)) || 1));

  const [compteurs, { lignes, total }] = await Promise.all([
    compterParStatut(),
    listerPourAdmin({ q, statut, page, parPage: PAR_PAGE }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAR_PAGE));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-bleu-600">
            Administration
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-marine-900">
            Véhicules
          </h1>
          <p className="mt-1 text-gris-500">Créez, publiez et suivez votre stock.</p>
        </div>
        <BoutonLien href="/admin/vehicules/nouveau" taille="lg">
          + Ajouter un véhicule
        </BoutonLien>
      </div>

      {lire(params.supprime) && (
        <BandeauMessage ton="succes">Le brouillon a été supprimé.</BandeauMessage>
      )}

      <div className="rounded-2xl border border-gris-200 bg-white shadow-sm">
        {/* Recherche et filtres */}
        <div className="space-y-4 border-b border-gris-200 p-4 sm:p-5">
          <form method="get" action="/admin/vehicules" className="flex flex-wrap gap-3">
            {statut && <input type="hidden" name="statut" value={statut} />}
            <label htmlFor="recherche-admin" className="sr-only">
              Rechercher un véhicule
            </label>
            <input
              id="recherche-admin"
              name="q"
              type="search"
              defaultValue={q ?? ""}
              placeholder="Rechercher par référence, marque, modèle, version…"
              className="h-11 min-w-0 flex-1 rounded-lg border border-gris-300 bg-white px-3 text-sm"
            />
            <button
              type="submit"
              className="h-11 rounded-lg bg-marine-900 px-5 text-sm font-semibold text-white hover:bg-marine-800"
            >
              Rechercher
            </button>
          </form>

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filtrer par statut"
          >
            <Link
              href={adresse({ q })}
              aria-current={!statut ? "true" : undefined}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!statut ? "bg-marine-900 text-white" : "bg-gris-100 text-gris-700 hover:bg-gris-200"}`}
            >
              Tous ({compteurs.total})
            </Link>
            {STATUTS_VEHICULE.map((s) => (
              <Link
                key={s}
                href={adresse({ q, statut: s })}
                aria-current={statut === s ? "true" : undefined}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statut === s ? "bg-marine-900 text-white" : "bg-gris-100 text-gris-700 hover:bg-gris-200"}`}
              >
                {LIBELLES_STATUT[s]} ({compteurs[s]})
              </Link>
            ))}
          </div>
        </div>

        {/* Tableau */}
        {lignes.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="font-semibold text-gris-900">
              {compteurs.total === 0
                ? "Aucun véhicule pour l’instant."
                : "Aucun véhicule ne correspond à votre recherche."}
            </p>
            <p className="mt-1 text-sm text-gris-500">
              {compteurs.total === 0
                ? "Ajoutez votre premier véhicule."
                : "Modifiez la recherche ou le filtre."}
            </p>
            {compteurs.total === 0 && (
              <BoutonLien href="/admin/vehicules/nouveau" className="mt-5">
                Ajouter un véhicule
              </BoutonLien>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">Liste des véhicules</caption>
              <thead className="bg-gris-50 text-xs uppercase tracking-wide text-gris-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Véhicule
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Caractéristiques
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Prix
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Statut
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gris-100">
                {lignes.map((v) => (
                  <tr key={v.id} className="hover:bg-gris-50">
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-gris-500">{v.reference}</p>
                      <p className="font-bold text-gris-900">
                        {v.marque} {v.modele}
                      </p>
                      <p className="text-gris-500">{v.version}</p>
                    </td>
                    <td className="px-3 py-4 text-gris-700">
                      <p>
                        {v.motorisation} · {v.puissanceCh} ch
                      </p>
                      <p className="text-gris-500">
                        {v.annee} · {formaterKilometrage(v.kilometrage)} · {v.boite}
                      </p>
                      <p className="text-gris-500">{v.couleur}</p>
                    </td>
                    <td className="px-3 py-4 font-bold text-marine-900">
                      {formaterPrix(v.prixCentimes)}
                    </td>
                    <td className="px-3 py-4">
                      <BadgeStatut statut={v.statut} />
                      <p className="mt-1 text-xs text-gris-500">
                        {v.nombrePhotos} photo{v.nombrePhotos > 1 ? "s" : ""}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/vehicules/${v.id}`}
                        className="font-semibold text-bleu-600 hover:underline"
                      >
                        Modifier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gris-200 px-5 py-4 text-sm text-gris-500">
            <p>
              {(page - 1) * PAR_PAGE + 1}–{(page - 1) * PAR_PAGE + lignes.length} sur{" "}
              {total} véhicule{total > 1 ? "s" : ""}
            </p>
            {pages > 1 && (
              <nav aria-label="Pagination" className="flex items-center gap-2">
                {page > 1 && (
                  <Link
                    href={adresse({ q, statut, page: page - 1 })}
                    className="rounded-lg border border-gris-300 px-3 py-1.5 font-semibold hover:bg-gris-50"
                  >
                    Précédent
                  </Link>
                )}
                <span className="px-2">
                  Page {page} / {pages}
                </span>
                {page < pages && (
                  <Link
                    href={adresse({ q, statut, page: page + 1 })}
                    className="rounded-lg border border-gris-300 px-3 py-1.5 font-semibold hover:bg-gris-50"
                  >
                    Suivant
                  </Link>
                )}
              </nav>
            )}
          </div>
        )}
      </div>
    </>
  );
}
