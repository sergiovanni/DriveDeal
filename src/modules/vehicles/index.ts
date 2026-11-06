/**
 * API publique du module « véhicules » : c'est le SEUL fichier que les pages importent.
 *
 * - `depot`     : où lire les véhicules (base Supabase ou données de démonstration)
 * - `recherche` : filtres, tri, pagination, véhicules similaires (logique pure, testée)
 * - `types`     : la forme d'un véhicule
 *
 * Les fichiers internes (`depot-base`, `mapping`, `donnees-prototype`) ne sont volontairement
 * pas exportés : le reste de l'application n'a pas à en dépendre.
 */
export * from "./depot";
export * from "./recherche";
export type * from "./types";
