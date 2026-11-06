"use client";

import { useEffect, useRef } from "react";

type Props = {
  valeur: number;
  /** "entier" : 12 — "euro" : 10 900 € (valeur en centimes). */
  format?: "entier" | "euro";
  className?: string;
};

function formater(n: number, format: "entier" | "euro"): string {
  if (format === "euro") {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    })
      .format(n / 100)
      .replace(/ /g, " ");
  }
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

/**
 * Nombre qui « monte » jusqu'à sa valeur quand il devient visible.
 * Le rendu serveur affiche déjà la valeur finale (utile sans JavaScript).
 */
export function CompteurAnime({ valeur, format = "entier", className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    let image = 0;
    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (!entree.isIntersecting) return;
        observateur.disconnect();
        const duree = 1400;
        const debut = performance.now();
        const pas = (maintenant: number) => {
          const t = Math.min(1, (maintenant - debut) / duree);
          const ease = 1 - Math.pow(1 - t, 3);
          el.textContent = formater(valeur * ease, format);
          if (t < 1) image = requestAnimationFrame(pas);
        };
        image = requestAnimationFrame(pas);
      },
      { threshold: 0.6 },
    );
    observateur.observe(el);

    return () => {
      observateur.disconnect();
      cancelAnimationFrame(image);
    };
  }, [valeur, format]);

  return (
    <span ref={ref} className={className}>
      {formater(valeur, format)}
    </span>
  );
}
