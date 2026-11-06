type BadgeProps = {
  ton?: "neutre" | "bleu" | "succes" | "alerte";
  children: React.ReactNode;
};

const tons = {
  neutre: "bg-gris-100 text-gris-700",
  bleu: "bg-bleu-100 text-bleu-600",
  succes: "bg-emerald-50 text-succes",
  alerte: "bg-amber-50 text-alerte",
};

/**
 * Petite étiquette arrondie (année, carburant, statut…).
 * Le paramètre `ton` choisit la couleur : neutre, bleu, succès ou alerte.
 */
export function Badge({ ton = "neutre", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tons[ton]}`}
    >
      {children}
    </span>
  );
}
