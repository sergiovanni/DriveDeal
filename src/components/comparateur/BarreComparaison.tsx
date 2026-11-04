"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formaterPrix } from "@/lib/money";
import {
  MAX_COMPARAISON,
  MESSAGE_LIMITE,
  MESSAGE_LIMITE_AIDE,
  urlComparateur,
  type ElementComparaison,
} from "@/modules/comparateur/regles";
import { useComparateur } from "./useComparateur";

/** Vignette d'un véhicule choisi : photo (ou couleur de démonstration), nom, prix, bouton retirer. */
function Emplacement({
  element,
  surRetrait,
}: {
  element: ElementComparaison;
  surRetrait: () => void;
}) {
  return (
    <li className="vignette-comparaison relative flex min-w-0 flex-col gap-1.5 rounded-xl border border-gris-200 bg-white p-1.5 shadow-sm sm:flex-row sm:items-center sm:gap-2 sm:pr-8">
      <div
        className="h-10 w-full shrink-0 overflow-hidden rounded-lg sm:h-12 sm:w-16"
        style={{ backgroundColor: element.teinte }}
      >
        {element.photoUrl && (
          // <img> volontaire : l'adresse vient du stockage du navigateur (modifiable), et
          // next/image refuse les hôtes non déclarés ; une balise simple ne peut pas planter.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={element.photoUrl}
            alt={element.photoAlt ?? ""}
            width={64}
            height={48}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-gris-900 sm:text-sm">{element.titre}</p>
        <p className="truncate text-[11px] text-gris-500 sm:text-xs">
          {formaterPrix(element.prixCentimes)}
        </p>
      </div>
      <button
        type="button"
        onClick={surRetrait}
        aria-label={`Retirer ${element.titre} du comparateur`}
        className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-gris-700 transition-colors hover:bg-white hover:text-gris-900 sm:bg-transparent sm:text-gris-500 sm:hover:bg-gris-100"
      >
        <span aria-hidden="true">✕</span>
      </button>
    </li>
  );
}

/** Emplacement libre : montre qu'on peut encore en ajouter (jusqu'à trois). */
function EmplacementLibre() {
  return (
    <li
      aria-hidden="true"
      className="flex h-[4.75rem] items-center justify-center rounded-xl border border-dashed border-gris-300 text-[11px] font-medium text-gris-500 sm:h-[4.25rem] sm:text-xs"
    >
      Emplacement libre
    </li>
  );
}

/**
 * Barre flottante du comparateur, collée en bas de l'écran dès qu'un véhicule est choisi.
 * Elle reste visible pendant la navigation dans le catalogue (elle est dans la mise en page
 * racine) et se cache sur la page de comparaison elle-même, où elle ferait doublon.
 *
 * Toujours 3 emplacements : pleins ou libres selon la sélection.
 * Le bouton « Comparer » n'est actif qu'à partir de 2 véhicules différents.
 */
export function BarreComparaison() {
  const { selection, plein, retirer, vider } = useComparateur();
  const chemin = usePathname();

  if (selection.length === 0 || chemin.startsWith("/comparateur")) return null;

  const pret = selection.length >= 2;
  const libres = MAX_COMPARAISON - selection.length;

  return (
    <>
      {/* Réserve de place : évite que la barre fixe masque le bas du pied de page. */}
      <div aria-hidden="true" className="h-52 sm:h-32" />

      <section
        aria-label="Comparateur de véhicules"
        className="barre-comparaison fixed inset-x-0 bottom-0 z-50 border-t border-gris-200 bg-gris-50/95 shadow-[0_-8px_30px_rgba(7,26,53,0.12)] backdrop-blur"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-6 lg:px-8">
          <ul className="grid min-w-0 flex-1 grid-cols-3 gap-2 sm:gap-3">
            {selection.map((e) => (
              <Emplacement key={e.id} element={e} surRetrait={() => retirer(e.id)} />
            ))}
            {Array.from({ length: libres }, (_, i) => (
              <EmplacementLibre key={`libre-${i}`} />
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 lg:justify-end">
            <div aria-live="polite" className="text-xs">
              <p className="font-bold text-gris-900">
                {selection.length}/{MAX_COMPARAISON} véhicules sélectionnés
              </p>
              {plein ? (
                <p className="text-alerte">
                  {MESSAGE_LIMITE} {MESSAGE_LIMITE_AIDE}
                </p>
              ) : (
                !pret && <p className="text-gris-500">Ajoutez-en un deuxième pour comparer.</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={vider}
                className="h-10 rounded-lg px-3 text-sm font-semibold text-gris-700 hover:bg-gris-100"
              >
                Tout effacer
              </button>
              {pret ? (
                <Link
                  href={urlComparateur(selection.map((e) => e.id))}
                  className="inline-flex h-10 items-center rounded-lg bg-bleu-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-bleu-500"
                >
                  Comparer les véhicules
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="inline-flex h-10 cursor-not-allowed items-center rounded-lg bg-bleu-600 px-4 text-sm font-semibold text-white opacity-50"
                >
                  Comparer les véhicules
                </span>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
