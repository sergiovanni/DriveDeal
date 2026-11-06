import type {
  BOITES,
  CARBURANTS,
  CARROSSERIES,
  STATUTS_VEHICULE,
  TRANSMISSIONS,
} from "@/lib/db/schema/constantes";

// Les types sont déduits des listes de constantes partagées avec la base de données
// (src/lib/db/schema/constantes.ts) : une seule source de vérité.

/** Statut d'un véhicule (docs/04 RG-V02). Seul « publie » est visible au catalogue. */
export type StatutVehicule = (typeof STATUTS_VEHICULE)[number];
export type Carburant = (typeof CARBURANTS)[number];
export type Boite = (typeof BOITES)[number];
export type Transmission = (typeof TRANSMISSIONS)[number];
export type Carrosserie = (typeof CARROSSERIES)[number];

/** Un véhicule tel que les pages le manipulent (indépendant de la façon de le stocker). */
export type Vehicule = {
  id: string;
  reference: string;
  marque: string;
  modele: string;
  version: string;
  annee: number;
  kilometrage: number;
  /** Prix en centimes (RG-V07). */
  prixCentimes: number;
  description: string;
  statut: StatutVehicule;
  publieLe: string;
  motorisation: string;
  carburant: Carburant;
  puissanceCh: number;
  boite: Boite;
  transmission: Transmission;
  carrosserie: Carrosserie;
  portes: number;
  places: number;
  couleur: string;
  /** Couleur d'illustration du visuel de démonstration. */
  teinte: string;
  equipements: string[];
  etatGeneral: string;
  historique: string;
  entretien: string;
  controleTechnique: string;
  /** Libellés des documents associés (les fichiers réels viendront de Supabase Storage). */
  documents: string[];
};
