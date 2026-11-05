"use client";

import Image from "next/image";
import { useState } from "react";
import { IMAGES_NON_OPTIMISEES } from "@/lib/images";
import type { PhotoVehicule } from "@/modules/vehicles";
import { VisuelVehicule } from "./VisuelVehicule";

type Props = {
  photos: PhotoVehicule[];
  /** Couleur et libellé du visuel de démonstration, utilisé tant qu'il n'y a aucune photo. */
  teinte: string;
  libelle: string;
};

/**
 * Galerie de la fiche véhicule : une grande photo et des miniatures cliquables.
 * Sans aucune photo, elle affiche le visuel de démonstration et le signale clairement.
 */
export function GalerieVehicule({ photos, teinte, libelle }: Props) {
  const [indexActif, setIndexActif] = useState(0);

  if (photos.length === 0) {
    return (
      <section aria-label="Photos">
        <VisuelVehicule
          teinte={teinte}
          libelle={libelle}
          className="h-72 rounded-2xl sm:h-96"
        />
        <p className="mt-3 rounded-lg border border-dashed border-gris-300 bg-gris-50 px-4 py-3 text-center text-xs text-gris-500">
          Les photos de ce véhicule seront ajoutées prochainement.
        </p>
      </section>
    );
  }

  const actuelle = photos[Math.min(indexActif, photos.length - 1)];

  return (
    <section aria-label="Photos">
      <div className="relative h-72 overflow-hidden rounded-2xl bg-gris-100 sm:h-96">
        <Image
          src={actuelle.url}
          alt={actuelle.alt}
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          unoptimized={IMAGES_NON_OPTIMISEES}
          className="object-cover"
        />
      </div>

      {photos.length > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {photos.map((p, i) => (
            <li key={p.url}>
              <button
                type="button"
                onClick={() => setIndexActif(i)}
                aria-label={`Afficher la photo ${i + 1} sur ${photos.length}`}
                aria-current={i === indexActif ? "true" : undefined}
                className={`relative block aspect-4/3 w-full overflow-hidden rounded-lg border-2 transition-colors ${
                  i === indexActif
                    ? "border-bleu-600"
                    : "border-transparent hover:border-gris-300"
                }`}
              >
                <Image
                  src={p.url}
                  alt=""
                  fill
                  sizes="120px"
                  unoptimized={IMAGES_NON_OPTIMISEES}
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
