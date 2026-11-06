import Link from "next/link";
import type { ComponentProps } from "react";

type Variante = "primaire" | "secondaire" | "contour" | "fantome";
type Taille = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variantes: Record<Variante, string> = {
  primaire: "bg-bleu-600 text-white hover:bg-bleu-500",
  secondaire: "bg-white/10 text-white hover:bg-white/20",
  contour: "border border-gris-300 bg-white text-gris-900 hover:bg-gris-50",
  fantome: "text-bleu-600 hover:bg-bleu-50",
};

const tailles: Record<Taille, string> = {
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function classesBouton(variante: Variante = "primaire", taille: Taille = "md") {
  return `${base} ${variantes[variante]} ${tailles[taille]}`;
}

type BoutonLienProps = ComponentProps<typeof Link> & {
  variante?: Variante;
  taille?: Taille;
};

/** Lien stylé comme un bouton (navigation réelle, pas de bouton factice). */
export function BoutonLien({
  variante,
  taille,
  className = "",
  ...props
}: BoutonLienProps) {
  return (
    <Link className={`${classesBouton(variante, taille)} ${className}`} {...props} />
  );
}

type BoutonProps = ComponentProps<"button"> & {
  variante?: Variante;
  taille?: Taille;
};

export function Bouton({ variante, taille, className = "", ...props }: BoutonProps) {
  return (
    <button className={`${classesBouton(variante, taille)} ${className}`} {...props} />
  );
}
