"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const liens = [
  { href: "/", libelle: "Accueil" },
  { href: "/vehicules", libelle: "Nos véhicules" },
];

export function NavLiens() {
  const chemin = usePathname();

  return (
    <nav aria-label="Navigation principale" className="flex items-center gap-1">
      {liens.map(({ href, libelle }) => {
        const actif = href === "/" ? chemin === "/" : chemin.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={actif ? "page" : undefined}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              actif ? "bg-white/10 text-white" : "text-white/70 hover:text-white"
            }`}
          >
            {libelle}
          </Link>
        );
      })}
    </nav>
  );
}
