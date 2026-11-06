import Link from "next/link";
import { Conteneur } from "@/components/ui/Conteneur";
import { Logo } from "@/components/ui/Logo";

export function SiteFooter() {
  return (
    <footer className="bg-marine-950 text-white/70">
      <Conteneur className="flex flex-col gap-8 py-12 md:flex-row md:justify-between">
        <div className="max-w-sm space-y-3">
          <Logo />
          <p className="text-sm leading-6">
            Véhicules d’occasion vendus en ligne : fiches détaillées, achat sécurisé et
            documents disponibles dans votre espace client.
          </p>
        </div>
        <nav aria-label="Pied de page" className="text-sm">
          <h2 className="mb-3 font-semibold text-white">Navigation</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/" className="hover:text-white">
                Accueil
              </Link>
            </li>
            <li>
              <Link href="/vehicules" className="hover:text-white">
                Nos véhicules
              </Link>
            </li>
          </ul>
        </nav>
      </Conteneur>
      <div className="border-t border-white/10">
        <Conteneur className="py-5 text-xs text-white/50">
          © {new Date().getFullYear()} DriveDeal. Prototype en cours de conception : les
          pages légales (mentions, CGV, confidentialité) seront ajoutées une fois leurs
          textes fournis.
        </Conteneur>
      </div>
    </footer>
  );
}
