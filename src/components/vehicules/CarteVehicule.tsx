import Link from "next/link";
import { formaterPrix } from "@/lib/money";
import type { Vehicule } from "@/modules/vehicles";
import { VisuelVehicule } from "./VisuelVehicule";

function Donnee({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-gris-500">
        {libelle}
      </dt>
      <dd className="truncate text-sm font-bold text-gris-900">{valeur}</dd>
    </div>
  );
}

export function CarteVehicule({ vehicule: v }: { vehicule: Vehicule }) {
  const titre = `${v.marque} ${v.modele}`;
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-gris-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
      <Link
        href={`/vehicules/${v.id}`}
        className="flex flex-1 flex-col"
        aria-label={`Voir la fiche : ${titre} ${v.version}`}
      >
        <div className="relative">
          <VisuelVehicule teinte={v.teinte} libelle={titre} className="h-44" />
          <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-marine-900">
            {v.carrosserie}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gris-500">
              {v.marque} · {v.annee} · Réf. {v.reference}
            </p>
            <h3 className="mt-0.5 text-lg font-bold text-gris-900 group-hover:text-bleu-600">
              {titre}
            </h3>
            <p className="line-clamp-1 text-sm text-gris-500">{v.version}</p>
          </div>

          <dl className="grid grid-cols-4 gap-2 rounded-lg bg-gris-50 p-3">
            <Donnee
              libelle="Km"
              valeur={new Intl.NumberFormat("fr-FR").format(v.kilometrage)}
            />
            <Donnee
              libelle="Boîte"
              valeur={v.boite === "Automatique" ? "Auto" : "Manuelle"}
            />
            <Donnee libelle="Puiss." valeur={`${v.puissanceCh} ch`} />
            <Donnee libelle="Énergie" valeur={v.carburant} />
          </dl>

          <div className="mt-auto flex items-end justify-between gap-3 pt-1">
            <div>
              <p className="text-xs text-gris-500">Prix de vente</p>
              <p className="text-2xl font-extrabold text-marine-900">
                {formaterPrix(v.prixCentimes)}
              </p>
            </div>
            <span className="inline-flex h-10 items-center rounded-lg bg-bleu-600 px-4 text-sm font-semibold text-white group-hover:bg-bleu-500">
              Voir la fiche
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
