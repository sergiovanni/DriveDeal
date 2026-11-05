import type {
  Boite,
  Carburant,
  Carrosserie,
  StatutVehicule,
  Transmission,
  PhotoVehicule,
  Vehicule,
} from "./types";

/**
 * Conversion d'une ligne de la base de données en `Vehicule` utilisable par les pages.
 *
 * Ce fichier ne touche pas à la base : il est « pur » (mêmes entrées, mêmes sorties), donc
 * facile à tester. Les pages ne connaissent jamais la forme des tables.
 */

/** Ce que la requête SQL renvoie pour un véhicule (marque et modèle déjà joints). */
export type LigneVehicule = {
  id: string;
  reference: string;
  marque: string;
  modele: string;
  version: string;
  annee: number;
  kilometrage: number;
  prixCentimes: number;
  description: string;
  statut: string;
  publieLe: Date | null;
  creeLe: Date;
  motorisation: string;
  carburant: string;
  puissanceCh: number;
  boite: string;
  transmission: string;
  carrosserie: string;
  portes: number;
  places: number;
  couleur: string;
  etatGeneral: string;
  historique: string;
  entretien: string;
  controleTechnique: string;
};

/**
 * Couleur d'illustration selon la couleur de carrosserie, pour le visuel de démonstration.
 * Disparaîtra avec le visuel de démonstration quand les vraies photos seront branchées.
 */
const TEINTES: Record<string, string> = {
  blanc: "#dfe4ee",
  noir: "#1d2433",
  gris: "#7d8798",
  bleu: "#2f6bd8",
  rouge: "#c23b3b",
  vert: "#1f7a5c",
  jaune: "#d9a512",
  orange: "#d9742a",
  marron: "#6b4a35",
  beige: "#c9b79c",
  argent: "#aab2c0",
};

const TEINTE_PAR_DEFAUT = "#6b7a99";

/** Trouve la teinte d'une couleur (sans tenir compte de la casse ni des accents). */
export function teinteDepuisCouleur(couleur: string): string {
  const cle = couleur
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
  return TEINTES[cle] ?? TEINTE_PAR_DEFAUT;
}

/**
 * Transforme une ligne SQL en `Vehicule`.
 * @param ligne      la ligne issue de la requête (marque et modèle joints)
 * @param equipements noms des équipements du véhicule
 * @param documents   libellés des documents publics du véhicule
 * @param photos      photos du véhicule, déjà ordonnées, avec leur adresse publique
 */
export function versVehicule(
  ligne: LigneVehicule,
  equipements: string[] = [],
  documents: string[] = [],
  photos: PhotoVehicule[] = [],
): Vehicule {
  // Les colonnes de caractéristiques sont du texte libre en base : on les range dans les
  // types de l'application (les valeurs inattendues passent telles quelles, sans planter).
  return {
    id: ligne.id,
    reference: ligne.reference,
    marque: ligne.marque,
    modele: ligne.modele,
    version: ligne.version,
    annee: ligne.annee,
    kilometrage: ligne.kilometrage,
    prixCentimes: ligne.prixCentimes,
    description: ligne.description,
    statut: ligne.statut as StatutVehicule,
    // Date de publication au format AAAA-MM-JJ ; à défaut, la date de création.
    publieLe: (ligne.publieLe ?? ligne.creeLe).toISOString().slice(0, 10),
    motorisation: ligne.motorisation,
    carburant: ligne.carburant as Carburant,
    puissanceCh: ligne.puissanceCh,
    boite: ligne.boite as Boite,
    transmission: ligne.transmission as Transmission,
    carrosserie: ligne.carrosserie as Carrosserie,
    portes: ligne.portes,
    places: ligne.places,
    couleur: ligne.couleur,
    teinte: teinteDepuisCouleur(ligne.couleur),
    equipements,
    etatGeneral: ligne.etatGeneral,
    historique: ligne.historique,
    entretien: ligne.entretien,
    controleTechnique: ligne.controleTechnique,
    documents,
    photos,
  };
}
