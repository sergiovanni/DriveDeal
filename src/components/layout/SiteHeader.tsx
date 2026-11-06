import Link from "next/link";
import { BoutonLien } from "@/components/ui/Button";
import { Conteneur } from "@/components/ui/Conteneur";
import { Logo } from "@/components/ui/Logo";
import { BarreProgression } from "@/components/animation/BarreProgression";
import { NavLiens } from "./NavLiens";

/**
 * En-tête collant en haut de page : logo, navigation et bouton vers le catalogue.
 * C'est un composant serveur ; les parties interactives sont isolées dans
 * NavLiens (page active, menu mobile) et BarreProgression (progression de lecture).
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-marine-950/95 backdrop-blur">
      <Conteneur className="flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="DriveDeal — accueil">
          <Logo />
        </Link>
        <div className="flex items-center gap-4">
          <NavLiens />
          <div className="hidden lg:block">
            <BoutonLien href="/vehicules">Voir le catalogue</BoutonLien>
          </div>
        </div>
      </Conteneur>
      <BarreProgression />
    </header>
  );
}
