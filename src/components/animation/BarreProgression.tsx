"use client";

import { useEffect, useRef } from "react";

/** Fine barre qui se remplit pendant la lecture de la page (bas de l'en-tête). */
export function BarreProgression() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let attente = false;
    const maj = () => {
      attente = false;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
      el.style.transform = `scaleX(${p})`;
    };
    const auDefilement = () => {
      if (!attente) {
        attente = true;
        requestAnimationFrame(maj);
      }
    };

    maj();
    window.addEventListener("scroll", auDefilement, { passive: true });
    window.addEventListener("resize", auDefilement);
    return () => {
      window.removeEventListener("scroll", auDefilement);
      window.removeEventListener("resize", auDefilement);
    };
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5">
      <div
        ref={ref}
        className="progression h-full bg-linear-to-r from-bleu-600 to-ciel-300"
      />
    </div>
  );
}
