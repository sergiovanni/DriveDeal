"use client";

import { useEffect, useRef } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  variante?: "haut" | "gauche" | "droite" | "zoom" | "fondu";
  /** Délai en millisecondes (pour décaler les éléments d'une grille). */
  delai?: number;
};

/**
 * Fait apparaître son contenu quand il entre dans l'écran.
 * - Le contenu est visible par défaut (rendu serveur, JavaScript désactivé).
 * - Seuls les éléments situés sous la ligne de flottaison sont masqués puis révélés,
 *   donc il n'y a aucun « clignotement » au chargement.
 * - Rien ne bouge si l'utilisateur a demandé de réduire les animations.
 */
export function Apparition({
  children,
  className = "",
  variante = "haut",
  delai = 0,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }
    // Déjà visible au chargement : on ne l'anime pas.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    el.dataset.etat = "cache";
    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (entree.isIntersecting) {
          el.dataset.etat = "visible";
          observateur.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    observateur.observe(el);
    return () => observateur.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      data-variante={variante}
      style={{ "--delai": `${delai}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
