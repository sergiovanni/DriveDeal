"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { urlComparateur, type ElementComparaison } from "@/modules/comparateur/regles";
import { useComparateur } from "./useComparateur";

/**
 * Petits composants client de la page de comparaison.
 *
 * Principe : l'ADRESSE (?ids=a,b,c) décide de ce qu'affiche la page (rendue côté serveur
 * avec les vraies données). La sélection du navigateur sert seulement à retrouver les
 * véhicules quand on arrive sans adresse, et à rester alignée avec ce qu'on voit.
 */

/** Aligne la sélection mémorisée sur les véhicules réellement affichés (lien partagé, retrait…). */
export function SynchroSelection({ elements }: { elements: ElementComparaison[] }) {
  const { remplacer } = useComparateur();
  // La clé évite de relancer l'effet à chaque rendu : seule la liste d'identifiants compte.
  const cle = elements.map((e) => e.id).join(",");
  useEffect(() => {
    remplacer(elements);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle, remplacer]);
  return null;
}

/** Page ouverte sans adresse précise : on reprend la sélection mémorisée, s'il y en a une. */
export function RedirectionDepuisSelection() {
  const { ids } = useComparateur();
  const routeur = useRouter();
  const cle = ids.join(",");
  useEffect(() => {
    if (ids.length > 0) routeur.replace(urlComparateur(ids));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle, routeur]);
  return null;
}

/**
 * Retire un véhicule. C'est un vrai lien (fonctionne sans JavaScript) vers la même page
 * sans ce véhicule ; le clic met aussi à jour la sélection mémorisée tout de suite.
 */
export function LienRetirer({
  id,
  titre,
  idsApres,
  seulementDifferences,
}: {
  id: string;
  titre: string;
  idsApres: string[];
  seulementDifferences: boolean;
}) {
  const { retirer } = useComparateur();
  return (
    <Link
      href={urlComparateur(idsApres, seulementDifferences)}
      replace
      scroll={false}
      onClick={() => retirer(id)}
      aria-label={`Retirer ${titre} du comparateur`}
      className="inline-flex h-9 items-center justify-center rounded-lg border border-gris-300 px-3 text-xs font-semibold text-gris-700 transition-colors hover:bg-gris-50"
    >
      Retirer
    </Link>
  );
}

/** « Tout effacer » / « Recommencer » : vide la sélection puis revient à la page vide. */
export function LienToutEffacer({ children }: { children: React.ReactNode }) {
  const { vider } = useComparateur();
  return (
    <Link
      href="/comparateur"
      onClick={() => vider()}
      className="text-sm font-semibold text-gris-700 underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}
