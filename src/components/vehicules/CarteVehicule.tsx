import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formaterKilometrage, formaterPrix } from "@/lib/money";
import type { Vehicule } from "@/modules/vehicles";
import { VisuelVehicule } from "./VisuelVehicule";

export function CarteVehicule({ vehicule: v }: { vehicule: Vehicule }) {
  const titre = `${v.marque} ${v.modele}`;
  return (
    <article className="group overflow-hidden rounded-xl border border-gris-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/vehicules/${v.id}`} className="block">
        <VisuelVehicule teinte={v.teinte} libelle={titre} className="h-44" />
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            <Badge ton="bleu">{v.annee}</Badge>
            <Badge>{v.carburant}</Badge>
            <Badge>{v.boite}</Badge>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gris-900 group-hover:text-bleu-600">
              {titre}
            </h3>
            <p className="text-sm text-gris-500">{v.version}</p>
          </div>
          <div className="flex items-end justify-between border-t border-gris-100 pt-3">
            <p className="text-sm text-gris-500">{formaterKilometrage(v.kilometrage)}</p>
            <p className="text-xl font-extrabold text-marine-900">
              {formaterPrix(v.prixCentimes)}
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
