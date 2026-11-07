import type { Metadata } from "next";
import Link from "next/link";
import { FormulaireVehicule } from "@/components/admin/FormulaireVehicule";
import { exigerAdministrateur } from "@/lib/auth/garde";
import { listerNomsMarques } from "@/modules/vehicles/admin/depot-admin";

export const metadata: Metadata = {
  title: "Ajouter un véhicule — Administration",
  robots: { index: false },
};

/** Création d'un véhicule : il est enregistré en BROUILLON ; les photos s'ajoutent ensuite sur sa fiche. */
export default async function PageNouveauVehicule() {
  await exigerAdministrateur("/admin/vehicules/nouveau");
  const marquesConnues = await listerNomsMarques();

  return (
    <>
      <nav aria-label="Fil d’Ariane" className="mb-4 text-sm text-gris-500">
        <Link href="/admin/vehicules" className="hover:text-bleu-600">
          Véhicules
        </Link>{" "}
        / <span className="text-gris-900">Nouveau</span>
      </nav>
      <h1 className="text-3xl font-extrabold tracking-tight text-marine-900">
        Ajouter un véhicule
      </h1>
      <p className="mb-8 mt-1 text-gris-500">
        Renseignez les caractéristiques. Une fois créé, vous pourrez ajouter les photos
        puis le publier.
      </p>
      <FormulaireVehicule mode="creation" marquesConnues={marquesConnues} />
    </>
  );
}
