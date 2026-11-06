/** Statuts d'un véhicule (docs/04 RG-V02). Seul « publie » est visible au catalogue. */
export type StatutVehicule = "brouillon" | "publie" | "reserve" | "vendu" | "archive";

export type Carburant = "Essence" | "Diesel" | "Hybride" | "Électrique";
export type Boite = "Manuelle" | "Automatique";
export type Transmission = "Traction" | "Propulsion" | "Intégrale";
export type Carrosserie =
  "Berline" | "SUV" | "Break" | "Coupé" | "Citadine" | "Cabriolet";

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
};
