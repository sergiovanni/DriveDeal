"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BoutonsCompte } from "./BoutonsCompte";

const liens = [
  { href: "/", libelle: "Accueil" },
  { href: "/vehicules", libelle: "Nos véhicules" },
  { href: "/a-propos", libelle: "À propos" },
  { href: "/contact", libelle: "Contact" },
];

/**
 * Navigation principale : barre horizontale (≥ 768 px) ou menu déroulant (mobile).
 * Composant client car il lit l'adresse courante (pour surligner la page active)
 * et gère l'ouverture du menu mobile.
 */
export function NavLiens() {
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);

  const estActif = (href: string) =>
    href === "/" ? chemin === "/" : chemin.startsWith(href);

  return (
    <>
      {/* Navigation bureau */}
      <nav
        aria-label="Navigation principale"
        className="hidden items-center gap-1 md:flex"
      >
        {liens.map(({ href, libelle }) => (
          <Link
            key={href}
            href={href}
            aria-current={estActif(href) ? "page" : undefined}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              estActif(href) ? "bg-white/10 text-white" : "text-white/70 hover:text-white"
            }`}
          >
            {libelle}
          </Link>
        ))}
      </nav>

      {/* Menu mobile */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          aria-expanded={ouvert}
          aria-controls="menu-mobile"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/20 px-3 text-sm font-semibold text-white"
        >
          Menu
          <span aria-hidden="true">{ouvert ? "✕" : "☰"}</span>
        </button>
        {ouvert && (
          <nav
            id="menu-mobile"
            aria-label="Navigation principale"
            className="absolute inset-x-0 top-16 border-b border-white/10 bg-marine-950 px-4 py-3 shadow-xl"
          >
            <ul className="space-y-1">
              {liens.map(({ href, libelle }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOuvert(false)}
                    aria-current={estActif(href) ? "page" : undefined}
                    className={`block rounded-md px-3 py-3 text-base font-medium ${
                      estActif(href) ? "bg-white/10 text-white" : "text-white/75"
                    }`}
                  >
                    {libelle}
                  </Link>
                </li>
              ))}
              <li onClick={() => setOuvert(false)}>
                <BoutonsCompte variante="liste" />
              </li>
            </ul>
          </nav>
        )}
      </div>
    </>
  );
}
