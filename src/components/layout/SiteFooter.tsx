import Link from "next/link";
import { Conteneur } from "@/components/ui/Conteneur";
import { Logo } from "@/components/ui/Logo";
import { listerVehicules, urlCatalogue, valeursDistinctes } from "@/modules/vehicles";

function Colonne({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <nav aria-label={titre} className="text-sm">
      <h2 className="mb-3 font-semibold text-white">{titre}</h2>
      <ul className="space-y-2">{children}</ul>
    </nav>
  );
}

export function SiteFooter() {
  const carrosseries = valeursDistinctes(listerVehicules(), "carrosserie");

  return (
    <footer className="bg-marine-950 text-white/70">
      <Conteneur className="grid gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="max-w-sm space-y-3">
          <Logo />
          <p className="text-sm leading-6">
            Véhicules d’occasion vendus en ligne : fiches détaillées, achat sécurisé et
            documents disponibles dans votre espace client.
          </p>
        </div>

        <Colonne titre="Navigation">
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
        </Colonne>

        <Colonne titre="Catalogue par carrosserie">
          {carrosseries.map((c) => (
            <li key={c}>
              <Link href={urlCatalogue({ carrosserie: c })} className="hover:text-white">
                {c}
              </Link>
            </li>
          ))}
        </Colonne>

        <div className="text-sm">
          <h2 className="mb-3 font-semibold text-white">Informations</h2>
          <p className="leading-6">
            Adresse, coordonnées et pages légales (mentions légales, CGV, confidentialité)
            seront publiées dès que l’entreprise aura fourni ses informations.
          </p>
        </div>
      </Conteneur>
      <div className="border-t border-white/10">
        <Conteneur className="py-5 text-xs text-white/50">
          © {new Date().getFullYear()} DriveDeal. Prototype en cours de conception.
        </Conteneur>
      </div>
    </footer>
  );
}
