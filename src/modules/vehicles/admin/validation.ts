import { z } from "zod";
import {
  BOITES,
  CARBURANTS,
  CARROSSERIES,
  TRANSMISSIONS,
} from "@/lib/db/schema/constantes";
import { normaliserEspaces } from "@/lib/texte";

/**
 * Validation du formulaire de création / modification d'un véhicule (toujours côté serveur).
 *
 * SÉCURITÉ — « affectation de masse » : le schéma ne déclare QUE les champs listés ci-dessous ;
 * tout autre champ envoyé (statut, référence, identifiant…) est IGNORÉ. Un administrateur
 * malveillant ou un navigateur trafiqué ne peut donc pas publier un véhicule en glissant
 * `statut=publie` dans le formulaire : le statut ne change que par l'action dédiée, qui vérifie
 * les règles (docs/04, RG-V02).
 */

const ANNEE_MIN = 1950;

/**
 * Convertit une saisie de prix en CENTIMES (entier), ou `NaN` si elle est invalide.
 * Accepte « 12500 », « 12 500 », « 12500,50 », « 12 500.5 € ». Refuse les valeurs négatives,
 * les lettres et plus de deux décimales.
 */
export function parserPrixEnCentimes(saisie: string): number {
  const propre = saisie.replace(/[\s  €]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(propre)) return Number.NaN;
  // Math.round : 19.99 × 100 donne 1998.9999999999998 en JavaScript.
  return Math.round(Number(propre) * 100);
}

/** Transforme une zone de texte « un équipement par ligne » en liste sans doublons. */
export function parserEquipements(saisie: string | undefined): string[] {
  if (!saisie) return [];
  const vus = new Set<string>();
  const liste: string[] = [];
  for (const ligne of saisie.split(/\r?\n/)) {
    const nom = normaliserEspaces(ligne);
    const cle = nom.toLowerCase();
    if (nom && !vus.has(cle)) {
      vus.add(cle);
      liste.push(nom);
    }
  }
  return liste;
}

// --- Briques de validation ----------------------------------------------------------

const texteObligatoire = (libelle: string, max = 100) =>
  z
    .string({ error: `Indiquez ${libelle}.` })
    .transform(normaliserEspaces)
    .pipe(
      z
        .string()
        .min(1, `Indiquez ${libelle}.`)
        .max(max, `${libelle} : ${max} caractères maximum.`),
    );

const entier = (libelle: string, min: number, max: number) =>
  z
    .string({ error: `Indiquez ${libelle}.` })
    .trim()
    .regex(/^\d+$/, `${libelle} : nombre entier attendu.`)
    .transform(Number)
    .pipe(
      z
        .number()
        .min(min, `${libelle} : ${min} au minimum.`)
        .max(max, `${libelle} : ${max} au maximum.`),
    );

/** Zone de texte facultative, ramenée à une chaîne (vide si absente). */
const texteLong = (max = 5000) =>
  z
    .string()
    .optional()
    .transform((v) => (v ?? "").trim())
    .pipe(z.string().max(max, `${max} caractères maximum.`));

export const schemaVehicule = z.object({
  marque: texteObligatoire("la marque", 60),
  modele: texteObligatoire("le modèle", 60),
  version: texteObligatoire("la version", 120),
  annee: entier("L'année", ANNEE_MIN, new Date().getFullYear() + 1),
  kilometrage: entier("Le kilométrage", 0, 2_000_000),
  prixCentimes: z
    .string({ error: "Indiquez le prix." })
    .transform(parserPrixEnCentimes)
    .pipe(
      z
        .number({ error: "Prix invalide (exemple : 12500 ou 12 500,50)." })
        .int()
        .min(0, "Le prix ne peut pas être négatif.")
        .max(1_000_000_000, "Le prix dépasse 10 000 000 €."),
    ),

  motorisation: texteObligatoire("la motorisation", 80),
  carburant: z.enum(CARBURANTS, { error: "Choisissez un carburant." }),
  puissanceCh: entier("La puissance", 1, 3000),
  boite: z.enum(BOITES, { error: "Choisissez une boîte de vitesses." }),
  transmission: z.enum(TRANSMISSIONS, { error: "Choisissez une transmission." }),
  carrosserie: z.enum(CARROSSERIES, { error: "Choisissez une carrosserie." }),
  portes: entier("Le nombre de portes", 1, 9),
  places: entier("Le nombre de places", 1, 12),
  couleur: texteObligatoire("la couleur", 40),

  description: texteLong(),
  etatGeneral: texteLong(1000),
  historique: texteLong(),
  entretien: texteLong(),
  controleTechnique: texteLong(1000),

  equipements: z
    .string()
    .optional()
    .transform(parserEquipements)
    .pipe(
      z
        .array(z.string().max(80, "Un équipement : 80 caractères maximum."))
        .max(60, "60 équipements au maximum."),
    ),
});

/** Données validées d'un véhicule (prix déjà converti en centimes). */
export type DonneesVehicule = z.output<typeof schemaVehicule>;
