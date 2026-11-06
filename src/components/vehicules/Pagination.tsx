import Link from "next/link";

type Props = {
  page: number;
  pages: number;
  /** Paramètres d'URL à conserver (filtres, tri). */
  params: Record<string, string | undefined>;
};

function lien(params: Props["params"], page: number): string {
  const q = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(params)) {
    if (valeur && cle !== "page") q.set(cle, valeur);
  }
  if (page > 1) q.set("page", String(page));
  const s = q.toString();
  return s ? `/vehicules?${s}` : "/vehicules";
}

export function Pagination({ page, pages, params }: Props) {
  if (pages <= 1) return null;
  const numeros = Array.from({ length: pages }, (_, i) => i + 1);
  const base =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold";

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 && (
        <Link
          href={lien(params, page - 1)}
          className={`${base} border-gris-300 hover:bg-gris-50`}
        >
          Précédent
        </Link>
      )}
      {numeros.map((n) => (
        <Link
          key={n}
          href={lien(params, n)}
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
          href={lien(params, page + 1)}
          className={`${base} border-gris-300 hover:bg-gris-50`}
        >
          Suivant
        </Link>
      )}
    </nav>
  );
}
