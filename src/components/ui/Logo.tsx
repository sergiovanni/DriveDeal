type LogoProps = {
  /** "clair" : texte blanc (fond sombre) ; "sombre" : texte marine (fond clair). */
  variante?: "clair" | "sombre";
  className?: string;
};

/** Logo DriveDeal : pastille route + mot-symbole. */
export function Logo({ variante = "clair", className = "" }: LogoProps) {
  const texte = variante === "clair" ? "text-white" : "text-marine-900";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width="34"
        height="34"
        viewBox="0 0 34 34"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="34" height="34" rx="9" fill="#1f5bff" />
        <path
          d="M6 22.5c3.2-6.6 7.6-10 13-10 3.2 0 5.9 1 9 3.5"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path d="M7 24.5h20" stroke="#8fb4ff" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="13" cy="24.5" r="2.4" fill="#fff" />
        <circle cx="24" cy="24.5" r="2.4" fill="#fff" />
      </svg>
      <span className={`text-xl font-extrabold tracking-tight ${texte}`}>
        Drive<span className="text-ciel-300">Deal</span>
      </span>
      <span className="sr-only">DriveDeal, retour à l’accueil</span>
    </span>
  );
}
