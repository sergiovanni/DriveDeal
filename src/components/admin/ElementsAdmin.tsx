import { LIBELLES_STATUT } from "@/modules/vehicles/admin/regles";
import type { StatutVehicule } from "@/modules/vehicles";

/**
 * Petits éléments visuels partagés par les écrans d'administration.
 */

const COULEURS_STATUT: Record<StatutVehicule, string> = {
  brouillon: "bg-gris-100 text-gris-700",
  publie: "bg-emerald-50 text-succes",
  reserve: "bg-amber-50 text-alerte",
  vendu: "bg-bleu-100 text-bleu-600",
  archive: "bg-gris-200 text-gris-500",
};

/** Pastille de statut d'un véhicule (couleur + libellé : jamais la couleur seule). */
export function BadgeStatut({ statut }: { statut: StatutVehicule }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${COULEURS_STATUT[statut]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {LIBELLES_STATUT[statut]}
    </span>
  );
}

/** Carte d'indicateur du tableau de bord : un chiffre RÉEL lu en base, avec son explication. */
export function CarteIndicateur({
  libelle,
  valeur,
  detail,
}: {
  libelle: string;
  valeur: number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-gris-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gris-500">
        {libelle}
      </p>
      <p className="mt-2 text-4xl font-extrabold text-marine-900">{valeur}</p>
      <p className="mt-1 text-sm text-gris-500">{detail}</p>
    </div>
  );
}

/** Message affiché en haut d'une page d'administration (succès ou erreur de l'adresse). */
export function BandeauMessage({
  ton,
  children,
}: {
  ton: "succes" | "erreur" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    succes: "bg-emerald-50 text-succes",
    erreur: "bg-red-50 text-red-700",
    info: "bg-bleu-50 text-bleu-600",
  };
  return (
    <p
      role={ton === "erreur" ? "alert" : "status"}
      className={`mb-6 rounded-lg px-4 py-3 text-sm font-medium ${styles[ton]}`}
    >
      {children}
    </p>
  );
}
