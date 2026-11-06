/**
 * API publique du module « véhicules ».
 * En prototype, la source est un jeu de données de démonstration ; elle sera
 * remplacée par la base Supabase sans changer les pages.
 */
import { vehiculesPrototype } from "./donnees-prototype";
import type { Vehicule } from "./types";

export * from "./recherche";
export type * from "./types";

export function listerVehicules(): Vehicule[] {
  return vehiculesPrototype;
}

export function trouverVehicule(id: string): Vehicule | undefined {
  return vehiculesPrototype.find((v) => v.id === id && v.statut === "publie");
}
