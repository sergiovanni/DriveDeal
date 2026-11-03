"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Rubrique = {
  href: string;
  libelle: string;
  /** Sans lien : rubrique annoncée mais pas encore développée. */ bientot?: boolean;
};

const RUBRIQUES: Rubrique[] = [
  { href: "/admin", libelle: "Tableau de bord" },
  { href: "/admin/vehicules", libelle: "Véhicules" },
  { href: "/admin/demandes", libelle: "Demandes" },
  { href: "/admin/commandes", libelle: "Commandes", bientot: true },
  { href: "/admin/clients", libelle: "Clients", bientot: true },
  { href: "/admin/journal", libelle: "Journal d'audit", bientot: true },
  { href: "/admin/parametres", libelle: "Paramètres", bientot: true },
];

/**
 * Menu de l'administration : colonne verticale sur grand écran, bande horizontale défilante sur
 * mobile. Les rubriques non développées s'affichent GRISÉES et sans lien (pas de faux bouton).
 * Composant client uniquement pour surligner la rubrique active.
 */
export function MenuAdmin() {
  const chemin = usePathname();
  const estActif = (href: string) =>
    href === "/admin" ? chemin === "/admin" : chemin.startsWith(href);

  return (
    <nav
      aria-label="Administration"
      className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
    >
      {RUBRIQUES.map((r) =>
        r.bientot ? (
          <span
            key={r.href}
            aria-disabled="true"
            className="flex cursor-not-allowed items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-gris-300"
          >
            {r.libelle}
            <span className="rounded-full bg-gris-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gris-500">
              Bientôt
            </span>
          </span>
        ) : (
          <Link
            key={r.href}
            href={r.href}
            aria-current={estActif(r.href) ? "page" : undefined}
            className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
              estActif(r.href)
                ? "bg-marine-900 text-white"
                : "text-gris-700 hover:bg-gris-100"
            }`}
          >
            {r.libelle}
          </Link>
        ),
      )}
    </nav>
  );
}
