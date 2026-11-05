import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeStatut, BandeauMessage } from "@/components/admin/ElementsAdmin";
import {
  FormulaireVehicule,
  type ValeursVehicule,
} from "@/components/admin/FormulaireVehicule";
import { GaleriePhotos } from "@/components/admin/GaleriePhotos";
import { PanneauStatut } from "@/components/admin/PanneauStatut";
import { exigerAdministrateur } from "@/lib/auth/garde";
import { formaterPrix } from "@/lib/money";
import { urlPublique } from "@/lib/supabase/service";
import { BUCKET_PHOTOS } from "@/modules/vehicles/admin/photos-regles";
import {
  lireVehiculePourAdmin,
  listerNomsMarques,
  type VehiculeAdmin,
} from "@/modules/vehicles/admin/depot-admin";
import {
  estVerrouille,
  peutEtreSupprime,
  transitionsPossibles,
} from "@/modules/vehicles/admin/regles";

export const metadata: Metadata = {
  title: "Modifier un véhicule — Administration",
  robots: { index: false },
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Convertit un prix en centimes en texte éditable : 1790000 -> « 17900 », 1790050 -> « 17900,50 ». */
function prixPourFormulaire(centimes: number): string {
  const euros = centimes / 100;
  return euros.toLocaleString("fr-FR", {
    useGrouping: false,
    minimumFractionDigits: centimes % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** Valeurs du formulaire d'édition : tout en TEXTE, comme l'envoie le navigateur. */
function valeursInitiales(v: VehiculeAdmin): ValeursVehicule {
  return {
    marque: v.marque,
    modele: v.modele,
    version: v.version,
    annee: String(v.annee),
    kilometrage: String(v.kilometrage),
    prixCentimes: prixPourFormulaire(v.prixCentimes),
    motorisation: v.motorisation,
    carburant: v.carburant,
    puissanceCh: String(v.puissanceCh),
    boite: v.boite,
    transmission: v.transmission,
    carrosserie: v.carrosserie,
    portes: String(v.portes),
    places: String(v.places),
    couleur: v.couleur,
    description: v.description,
    etatGeneral: v.etatGeneral,
    historique: v.historique,
    entretien: v.entretien,
    controleTechnique: v.controleTechnique,
    equipements: v.equipements.join("\n"),
  };
}

/** Fiche d'un véhicule dans l'administration : modification, publication, suppression d'un brouillon. */
export default async function PageVehiculeAdmin({ params, searchParams }: Props) {
  // Next.js 16 : params et searchParams sont des promesses.
  const { id } = await params;
  await exigerAdministrateur(`/admin/vehicules/${encodeURIComponent(id)}`);

  const [vehicule, marquesConnues, query] = await Promise.all([
    lireVehiculePourAdmin(id),
    listerNomsMarques(),
    searchParams,
  ]);
  if (!vehicule) notFound();

  return (
    <>
      <nav aria-label="Fil d’Ariane" className="mb-4 text-sm text-gris-500">
        <Link href="/admin/vehicules" className="hover:text-bleu-600">
          Véhicules
        </Link>{" "}
        / <span className="text-gris-900">{vehicule.reference}</span>
      </nav>

      {query.cree && (
        <BandeauMessage ton="succes">
          Brouillon créé. Ajoutez maintenant des photos, puis publiez le véhicule.
        </BandeauMessage>
      )}

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gris-500">
            {vehicule.reference}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-marine-900">
            {vehicule.marque} {vehicule.modele}
          </h1>
          <p className="text-gris-500">
            {vehicule.version} · {formaterPrix(vehicule.prixCentimes)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BadgeStatut statut={vehicule.statut} />
          {vehicule.statut === "publie" && (
            <Link
              href={`/vehicules/${vehicule.id}`}
              className="text-sm font-semibold text-bleu-600 hover:underline"
            >
              Voir sur le site →
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          <FormulaireVehicule
            mode="modification"
            id={vehicule.id}
            marquesConnues={marquesConnues}
            valeursInitiales={valeursInitiales(vehicule)}
            verrouille={estVerrouille(vehicule.statut)}
          />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <PanneauStatut
            id={vehicule.id}
            statut={vehicule.statut}
            transitions={transitionsPossibles(vehicule.statut)}
            peutSupprimer={peutEtreSupprime(vehicule.statut)}
            nombrePhotos={vehicule.nombrePhotos}
          />
          <GaleriePhotos
            vehiculeId={vehicule.id}
            desactive={estVerrouille(vehicule.statut)}
            photos={vehicule.photos.map((p) => ({
              id: p.id,
              url: urlPublique(BUCKET_PHOTOS, p.cleStockage),
              alt: p.texteAlternatif,
            }))}
          />
        </aside>
      </div>
    </>
  );
}
