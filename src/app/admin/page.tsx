import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Conteneur } from "@/components/ui/Conteneur";
import { exigerAdministrateur } from "@/lib/auth/garde";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false },
};

/**
 * Espace d'administration (page RÉSERVÉE au rôle « administrateur »).
 *
 * Pour l'instant : une page d'accueil qui prouve que la protection fonctionne. Les modules
 * (véhicules, commandes, clients…) viendront ici. Chaque Server Action d'administration devra
 * elle aussi appeler `exigerAdministrateur()` : protéger la page ne suffit pas.
 */
export default async function PageAdmin() {
  // Non connecté -> connexion. Connecté sans le rôle -> page 404 (l'existence de l'espace n'est pas révélée).
  const admin = await exigerAdministrateur("/admin");

  return (
    <Conteneur className="py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-marine-900">
        Administration
      </h1>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-gris-500">
        Connecté en tant que {admin.email}
        {admin.roles.map((r) => (
          <Badge key={r} ton="bleu">
            {r}
          </Badge>
        ))}
      </p>
      <div className="mt-8 rounded-2xl border border-dashed border-gris-300 bg-gris-50 p-8">
        <h2 className="font-bold text-gris-900">Modules à venir</h2>
        <p className="mt-2 text-sm leading-6 text-gris-500">
          Gestion des véhicules, des photos, des commandes et des clients. Chaque module
          sera ajouté avec ses propres contrôles d’accès et son journal d’audit.
        </p>
      </div>
    </Conteneur>
  );
}
