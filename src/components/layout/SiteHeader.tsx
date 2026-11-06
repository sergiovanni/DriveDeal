import Link from "next/link";
import { BoutonLien } from "@/components/ui/Button";
import { Conteneur } from "@/components/ui/Conteneur";
import { Logo } from "@/components/ui/Logo";
import { NavLiens } from "./NavLiens";

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
    </header>
  );
}
