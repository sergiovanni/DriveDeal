import { formaterKilometrage, formaterPrix } from "@/lib/money";
import type { Vehicule } from "@/modules/vehicles/types";

/**
 * Construction du tableau de comparaison — logique PURE et testée.
 *
 * On ne montre QUE des informations que DriveDeal possède réellement. Une donnée vide
 * s'affiche « Non renseigné » : on n'invente jamais une valeur technique.
 */

export const NON_RENSEIGNE = "Non renseigné";

/** Une case du tableau : un texte, ou une liste (équipements, documents). */
export type Cellule = {
  texte?: string;
  liste?: string[];
  /** Meilleure valeur de la ligne, signalée seulement quand c'est objectivement pertinent. */
  meilleur?: boolean;
};

export type Ligne = {
  libelle: string;
  cellules: Cellule[];
  /** Vrai si au moins deux véhicules ont une valeur différente. */
  different: boolean;
};

export type Section = { titre: string; lignes: Ligne[] };

/** Texte nettoyé, ou « Non renseigné » s'il est vide. */
function texte(valeur: string | undefined | null): Cellule {
  const t = (valeur ?? "").trim();
  return { texte: t === "" ? NON_RENSEIGNE : t };
}

function liste(valeurs: string[]): Cellule {
  return valeurs.length === 0 ? { texte: NON_RENSEIGNE } : { liste: valeurs };
}

/** Clé de comparaison d'une case : deux cases sont « égales » si leurs clés le sont. */
function cle(c: Cellule): string {
  return c.liste ? [...c.liste].sort().join("|").toLowerCase() : (c.texte ?? "").toLowerCase();
}

function ligne(libelle: string, cellules: Cellule[]): Ligne {
  const cles = new Set(cellules.map(cle));
  return { libelle, cellules, different: cles.size > 1 };
}

/**
 * Ligne numérique avec « meilleure valeur ».
 * Signalée uniquement s'il y a au moins deux véhicules ET des valeurs différentes ;
 * `meilleurSi` dit quel sens est objectivement meilleur (prix bas, kilométrage bas…).
 */
function ligneNumerique(
  libelle: string,
  valeurs: number[],
  formater: (n: number) => string,
  meilleurSi?: "min" | "max",
): Ligne {
  const cellules: Cellule[] = valeurs.map((n) => ({ texte: formater(n) }));
  if (meilleurSi && valeurs.length >= 2 && new Set(valeurs).size > 1) {
    const cible = meilleurSi === "min" ? Math.min(...valeurs) : Math.max(...valeurs);
    valeurs.forEach((n, i) => {
      if (n === cible) cellules[i].meilleur = true;
    });
  }
  return ligne(libelle, cellules);
}

/** Sections du tableau pour 1 à 3 véhicules (l'ordre des colonnes est celui reçu). */
export function construireSections(vehicules: Vehicule[]): Section[] {
  const par = (f: (v: Vehicule) => Cellule) => vehicules.map(f);
  const nombres = (f: (v: Vehicule) => number) => vehicules.map(f);

  return [
    {
      titre: "Informations générales",
      lignes: [
        ligne("Marque", par((v) => texte(v.marque))),
        ligne("Modèle", par((v) => texte(v.modele))),
        ligne("Version", par((v) => texte(v.version))),
        ligneNumerique("Année", nombres((v) => v.annee), String, "max"),
        ligneNumerique("Kilométrage", nombres((v) => v.kilometrage), formaterKilometrage, "min"),
        ligne("Couleur", par((v) => texte(v.couleur))),
        ligne("État général", par((v) => texte(v.etatGeneral))),
        ligne("Référence", par((v) => texte(v.reference))),
      ],
    },
    {
      titre: "Prix",
      lignes: [
        ligneNumerique("Prix de vente", nombres((v) => v.prixCentimes), formaterPrix, "min"),
        // Même mention que sur la fiche : les frais ne sont pas encore définis (docs/08, I-xx).
        ligne("Frais complémentaires", par(() => ({ texte: "À définir" }))),
      ],
    },
    {
      titre: "Motorisation et performances",
      lignes: [
        ligne("Énergie", par((v) => texte(v.carburant))),
        ligne("Boîte de vitesses", par((v) => texte(v.boite))),
        ligne("Motorisation", par((v) => texte(v.motorisation))),
        // Pas de « meilleure » puissance : plus puissant n'est pas objectivement mieux.
        ligne("Puissance", par((v) => ({ texte: `${v.puissanceCh} ch` }))),
        ligne("Transmission", par((v) => texte(v.transmission))),
        ligne("Carrosserie", par((v) => texte(v.carrosserie))),
        ligne("Portes", par((v) => ({ texte: String(v.portes) }))),
        ligne("Places", par((v) => ({ texte: String(v.places) }))),
      ],
    },
    {
      titre: "Équipements",
      lignes: [ligne("Équipements", par((v) => liste(v.equipements)))],
    },
    {
      titre: "Historique et état",
      lignes: [
        ligne("Historique", par((v) => texte(v.historique))),
        ligne("Entretien", par((v) => texte(v.entretien))),
        ligne("Contrôle technique", par((v) => texte(v.controleTechnique))),
        ligne("Documents associés", par((v) => liste(v.documents))),
      ],
    },
  ];
}

/** Ne garde que les lignes qui diffèrent (option « Afficher seulement les différences »). */
export function seulementDifferences(sections: Section[]): Section[] {
  return sections
    .map((s) => ({ ...s, lignes: s.lignes.filter((l) => l.different) }))
    .filter((s) => s.lignes.length > 0);
}
