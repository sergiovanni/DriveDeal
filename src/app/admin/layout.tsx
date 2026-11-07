import { MenuAdmin } from "@/components/admin/MenuAdmin";
import { Conteneur } from "@/components/ui/Conteneur";
import { exigerAdministrateur } from "@/lib/auth/garde";

/**
 * Cadre de l'espace d'administration : menu à gauche, contenu à droite.
 *
 * ⚠️ Cette garde protège le cadre, MAIS un layout n'est pas ré-exécuté à chaque navigation
 * entre deux pages d'administration : chaque page et chaque Server Action rappelle donc
 * `exigerAdministrateur()` elle-même (recommandation de Next.js).
 */
export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const admin = await exigerAdministrateur("/admin");

  return (
    <div className="bg-gris-50">
      <Conteneur className="grid gap-6 py-6 lg:grid-cols-[230px_1fr] lg:gap-8 lg:py-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4 hidden rounded-xl border border-gris-200 bg-white p-4 lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gris-500">
              Espace administration
            </p>
            <p className="mt-1 truncate text-sm font-bold text-marine-900">
              {admin.email}
            </p>
          </div>
          <MenuAdmin />
        </aside>
        <div className="min-w-0">{children}</div>
      </Conteneur>
    </div>
  );
}
