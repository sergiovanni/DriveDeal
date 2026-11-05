import Image from "next/image";
import { IMAGES_NON_OPTIMISEES } from "@/lib/images";
import type { PhotoVehicule } from "@/modules/vehicles";

type VisuelProps = {
  /** Photo réelle du véhicule. Sans photo, on affiche la silhouette de démonstration. */
  photo?: PhotoVehicule;
  /** Valeur de l'attribut « sizes » de l'image (aide le navigateur à choisir la bonne taille). */
  tailles?: string;
  teinte: string;
  libelle: string;
  className?: string;
  /** Flottement permanent (héros de l'accueil). */
  flottant?: boolean;
};

function Roue({ cx }: { cx: number }) {
  return (
    <g className="roue">
      <circle cx={cx} cy="110" r="19" fill="#0b0f1a" />
      <circle cx={cx} cy="110" r="11" fill="#9aa3b5" />
      {[0, 72, 144, 216, 288].map((angle) => (
        <line
          key={angle}
          x1={cx}
          y1="110"
          x2={cx}
          y2="100"
          stroke="#0b0f1a"
          strokeWidth="2.4"
          strokeLinecap="round"
          transform={`rotate(${angle} ${cx} 110)`}
        />
      ))}
      <circle cx={cx} cy="110" r="3.2" fill="#0b0f1a" />
    </g>
  );
}

/**
 * Visuel de démonstration (silhouette) en attendant les vraies photos du stock.
 * Remplacé par la galerie photo réelle (Supabase Storage) au module « Véhicules ».
 */
export function VisuelVehicule({
  teinte,
  libelle,
  className = "",
  flottant,
  photo,
  tailles = "(min-width: 1024px) 33vw, 100vw",
}: VisuelProps) {
  // Photo réelle : image optimisée par Next.js (taille adaptée à l'écran, format moderne).
  if (photo) {
    return (
      <div className={`relative overflow-hidden bg-gris-100 ${className}`}>
        <Image
          src={photo.url}
          alt={photo.alt}
          fill
          sizes={tailles}
          unoptimized={IMAGES_NON_OPTIMISEES}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Illustration de démonstration : ${libelle}`}
      className={`relative flex items-center justify-center overflow-hidden bg-linear-to-br from-marine-800 to-marine-950 ${className}`}
    >
      <svg
        viewBox="0 0 320 140"
        className={`w-4/5 ${flottant ? "flotter" : ""}`}
        aria-hidden="true"
      >
        <ellipse cx="160" cy="124" rx="130" ry="8" fill="#000" opacity="0.35" />
        <g className="voiture">
          <path
            d="M22 98c0-9 6-15 15-17l30-6c10-12 28-26 48-28 24-3 56-3 74 2 14 4 26 14 36 26l38 8c9 2 14 8 14 16v10c0 4-3 7-7 7h-18a26 26 0 0 0-52 0H114a26 26 0 0 0-52 0H29c-4 0-7-3-7-7z"
            fill={teinte}
          />
          <path
            d="M92 72c9-9 24-19 42-21 20-2 46-2 62 2 10 3 20 11 27 20z"
            fill="#0a1a44"
            opacity="0.55"
          />
          <Roue cx={88} />
          <Roue cx={232} />
        </g>
      </svg>
      <span className="absolute right-3 top-2 text-[10px] font-medium uppercase tracking-wide text-white/40">
        Visuel de démonstration
      </span>
    </div>
  );
}
