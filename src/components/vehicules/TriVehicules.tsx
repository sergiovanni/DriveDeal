"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Option = { valeur: string; libelle: string };

/** Liste de tri : change l'URL (en conservant les filtres) dès la sélection. */
export function TriVehicules({ options, actuel }: { options: Option[]; actuel: string }) {
  const router = useRouter();
  const chemin = usePathname();
  const params = useSearchParams();

  function changer(valeur: string) {
    const suivant = new URLSearchParams(params.toString());
    suivant.set("tri", valeur);
    suivant.delete("page");
    router.push(`${chemin}?${suivant.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="tri-liste" className="text-sm text-gris-500">
        Trier par
      </label>
      <select
        id="tri-liste"
        value={actuel}
        onChange={(e) => changer(e.target.value)}
        className="h-10 rounded-lg border border-gris-300 bg-white px-3 text-sm font-semibold text-gris-900"
      >
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
    </div>
  );
}
