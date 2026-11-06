type VisuelProps = {
  teinte: string;
  libelle: string;
  className?: string;
};

/**
 * Visuel de démonstration (silhouette) en attendant les vraies photos du stock.
 * Remplacé par la galerie photo réelle (Supabase Storage) au module « Véhicules ».
 */
export function VisuelVehicule({ teinte, libelle, className = "" }: VisuelProps) {
  return (
    <div
      role="img"
      aria-label={`Illustration de démonstration : ${libelle}`}
      className={`relative flex items-center justify-center overflow-hidden bg-linear-to-br from-marine-800 to-marine-950 ${className}`}
    >
      <svg viewBox="0 0 320 140" className="w-4/5" aria-hidden="true">
        <ellipse cx="160" cy="124" rx="130" ry="8" fill="#000" opacity="0.35" />
        <path
          d="M22 98c0-9 6-15 15-17l30-6c10-12 28-26 48-28 24-3 56-3 74 2 14 4 26 14 36 26l38 8c9 2 14 8 14 16v10c0 4-3 7-7 7h-18a26 26 0 0 0-52 0H114a26 26 0 0 0-52 0H29c-4 0-7-3-7-7z"
          fill={teinte}
        />
        <path
          d="M92 72c9-9 24-19 42-21 20-2 46-2 62 2 10 3 20 11 27 20z"
          fill="#0a1a44"
          opacity="0.55"
        />
        <circle cx="88" cy="110" r="19" fill="#0b0f1a" />
        <circle cx="88" cy="110" r="9" fill="#9aa3b5" />
        <circle cx="232" cy="110" r="19" fill="#0b0f1a" />
        <circle cx="232" cy="110" r="9" fill="#9aa3b5" />
      </svg>
      <span className="absolute right-3 top-2 text-[10px] font-medium uppercase tracking-wide text-white/40">
        Visuel de démonstration
      </span>
    </div>
  );
}
