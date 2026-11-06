import Link from "next/link";
import { TAILLES_PAGE, urlCatalogue } from "@/modules/vehicles";

type Params = Record<string, string | undefined>;

type Props = {
  page: number;
  pages: number;
  parPage: number;
  /** Paramètres d'URL à conserver (filtres, tri). */
  params: Params;
};

const base =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold";

export function Pagination({ page, pages, parPage, params }: Props) {
  const lien = (n: number) =>
    urlCatalogue({ ...params, page: n > 1 ? String(n) : undefined });
  const numeros = Array.from({ length: pages }, (_, i) => i + 1);

  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gris-200 pt-6 sm:flex-row">
      <div className="flex items-center gap-2 text-sm text-gris-500">
        <span>Par page</span>
        {TAILLES_PAGE.map((t) => (
          <Link
            key={t}
            href={urlCatalogue({ ...params, parPage: String(t), page: undefined })}
            aria-current={t === parPage ? "true" : undefined}
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 font-semibold ${
              t === parPage ? "bg-marine-900 text-white" : "hover:bg-gris-100"
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2">
          {page > 1 && (
            <Link
              href={lien(page - 1)}
              className={`${base} border-gris-300 hover:bg-gris-50`}
            >
              Précédent
            </Link>
          )}
          {numeros.map((n) => (
            <Link
              key={n}
              href={lien(n)}
              aria-current={n === page ? "page" : undefined}
              className={`${base} ${
                n === page
                  ? "border-bleu-600 bg-bleu-600 text-white"
                  : "border-gris-300 hover:bg-gris-50"
              }`}
            >
              {n}
            </Link>
          ))}
          {page < pages && (
            <Link
              href={lien(page + 1)}
              className={`${base} border-gris-300 hover:bg-gris-50`}
            >
              Suivant
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
