import "server-only";

import { unstable_cache } from "next/cache";
import { vehiculesPrototype } from "./donnees-prototype";
import type { Vehicule } from "./types";

/**
 * Point d'accès unique aux véhicules pour les pages.
 *
 * Deux sources, choisies automatiquement :
 *  - base de données (Supabase) si `DATABASE_URL` est renseignée ;
 *  - données de démonstration sinon, pour que le site reste utilisable sans configuration.
 *
 * Les pages appellent `listerVehicules()` et `trouverVehicule()` sans savoir d'où viennent
 * les données.
 */

/** Étiquette de cache : permet d'invalider la liste quand le stock change (ex. après une publication). */
export const ETIQUETTE_VEHICULES = "vehicules";

/** Durée pendant laquelle la liste est réutilisée avant d'être relue en base (en secondes). */
const DUREE_CACHE_SECONDES = 60;

/** Vrai si la base de données est configurée. */
export function baseConfiguree(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Liste mise en cache : la base n'est interrogée qu'au plus une fois par minute, quel que
 * soit le nombre de visiteurs. L'import de la lecture SQL est différé pour ne charger la
 * connexion à la base que lorsqu'elle est réellement utilisée.
 *
 * NB : `unstable_cache` est l'ancien mécanisme de cache de Next.js ; la version 16 propose
 * `use cache` (voir docs/08, décision T-11).
 */
const listerDepuisBase = unstable_cache(
  async (): Promise<Vehicule[]> => {
    const { chargerVehiculesPublies } = await import("./depot-base");
    return chargerVehiculesPublies();
  },
  ["vehicules-publies"],
  { revalidate: DUREE_CACHE_SECONDES, tags: [ETIQUETTE_VEHICULES] },
);

/** Tous les véhicules publiés. */
export async function listerVehicules(): Promise<Vehicule[]> {
  if (!baseConfiguree()) return vehiculesPrototype.filter((v) => v.statut === "publie");
  return listerDepuisBase();
}

/** Un véhicule publié par son identifiant, ou `undefined` s'il n'existe pas ou n'est pas publié. */
export async function trouverVehicule(id: string): Promise<Vehicule | undefined> {
  const tous = await listerVehicules();
  return tous.find((v) => v.id === id);
}
