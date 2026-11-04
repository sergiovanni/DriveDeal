import type { Vehicule } from "@/modules/vehicles/types";
import type { ElementComparaison } from "./regles";

/** Ce qu'il faut retenir d'un véhicule pour le comparateur (vignette de la barre flottante). */
export function versElementComparaison(v: Vehicule): ElementComparaison {
  return {
    id: v.id,
    titre: `${v.marque} ${v.modele}`,
    prixCentimes: v.prixCentimes,
    photoUrl: v.photos[0]?.url,
    photoAlt: v.photos[0]?.alt,
    teinte: v.teinte,
  };
}
