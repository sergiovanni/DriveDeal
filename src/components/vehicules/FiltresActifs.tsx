import Link from "next/link";
import { filtresActifs, urlCatalogue, type Filtres } from "@/modules/vehicles";

/** Pastilles des filtres appliqués, chacune retire son propre filtre (liens réels). */
export function FiltresActifs({
  filtres,
  params,
}: {
  filtres: Filtres;
  params: Record<string, string | undefined>;
}) {
  const actifs = filtresActifs(filtres);
  if (actifs.length === 0) return null;

  return (
    <div
      className="mb-5 flex flex-wrap items-center gap-2"
      aria-label="Filtres appliqués"
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-gris-500">
        Filtres appliqués
      </span>
      {actifs.map((a) => (
        <Link
          key={a.cle}
          href={urlCatalogue({ ...params, [a.cle]: undefined, page: undefined })}
          className="inline-flex items-center gap-1.5 rounded-full bg-bleu-100 px-3 py-1 text-xs font-semibold text-bleu-600 hover:bg-bleu-50"
          aria-label={`Retirer le filtre : ${a.libelle}`}
        >
          {a.libelle}
          <span aria-hidden="true">×</span>
        </Link>
      ))}
      <Link
        href={urlCatalogue({ tri: params.tri, parPage: params.parPage })}
        className="text-xs font-semibold text-gris-500 underline hover:text-gris-900"
      >
        Tout effacer
      </Link>
    </div>
  );
}
