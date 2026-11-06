import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";
import { horodatage } from "./commun";
import { STATUTS_VEHICULE } from "./constantes";

/**
 * Catalogue : marques, modèles, véhicules, photos, équipements, documents
 * (docs/06, section « Catalogue » ; docs/03, module M2).
 *
 * Sécurité (RLS) :
 * - Les données de référence (marques, modèles, équipements) sont lisibles par tous.
 * - Un véhicule n'est lisible par le public que s'il est « publié » ; ses photos, équipements
 *   et documents publics suivent ce même critère.
 * - AUCUNE politique d'écriture : créer ou modifier le catalogue passe par le serveur
 *   (connexion directe), après vérification des permissions de l'administrateur.
 *
 * Hypothèse à valider (docs/08 Q-04) : les véhicules réservés ou vendus ne sont plus visibles
 * publiquement.
 */

/**
 * Condition SQL réutilisée dans les politiques RLS : « le véhicule lié est publié ».
 * `colonne` est la colonne de la table courante qui désigne le véhicule (ex. "vehicle_id").
 * Texte SQL brut : les noms sont des constantes du code, jamais des saisies utilisateur.
 */
const conditionVehiculeLiePublie = (colonne: string): string =>
  `exists (select 1 from "vehicles" v where v."id" = ${colonne} and v."statut" = 'publie')`;

const lecturePublique = (nom: string) =>
  pgPolicy(nom, { for: "select", to: [anonRole, authenticatedRole], using: sql`true` });

export const marques = pgTable(
  "brands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nom: text("name").notNull().unique(),
    /** Version de `nom` utilisable dans une adresse (ex. « mercedes-benz »). */
    slug: text("slug").notNull().unique(),
  },
  () => [lecturePublique("marques_lecture_publique")],
).enableRLS();

export const modeles = pgTable(
  "models",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    marqueId: uuid("brand_id")
      .notNull()
      .references(() => marques.id, { onDelete: "restrict" }),
    nom: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (t) => [
    unique("modeles_marque_slug_unique").on(t.marqueId, t.slug),
    lecturePublique("modeles_lecture_publique"),
  ],
).enableRLS();

export const vehicules = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Référence lisible (ex. « DD-0004 »), affichée sur la fiche et utilisée au contact. */
    reference: text("reference").notNull().unique(),
    marqueId: uuid("brand_id")
      .notNull()
      .references(() => marques.id, { onDelete: "restrict" }),
    modeleId: uuid("model_id")
      .notNull()
      .references(() => modeles.id, { onDelete: "restrict" }),
    version: text("version").notNull(),
    /** Année de mise en circulation. */
    annee: integer("year").notNull(),
    kilometrage: integer("mileage_km").notNull(),
    /** Prix en CENTIMES (entier) : évite les erreurs d'arrondi (docs/04 RG-V07). */
    prixCentimes: integer("price_cents").notNull(),
    devise: text("currency").notNull().default("EUR"),
    description: text("description").notNull().default(""),
    /** Voir STATUTS_VEHICULE. Seul « publie » est visible au catalogue. */
    statut: text("statut").notNull().default("brouillon"),
    publieLe: timestamp("published_at", { withTimezone: true }),

    // Caractéristiques techniques
    motorisation: text("engine").notNull(),
    carburant: text("fuel").notNull(),
    puissanceCh: integer("power_hp").notNull(),
    boite: text("gearbox").notNull(),
    transmission: text("drivetrain").notNull(),
    carrosserie: text("body_type").notNull(),
    portes: integer("doors").notNull(),
    places: integer("seats").notNull(),
    couleur: text("color").notNull(),

    // Informations complémentaires
    etatGeneral: text("general_condition").notNull().default(""),
    historique: text("history_notes").notNull().default(""),
    entretien: text("maintenance_notes").notNull().default(""),
    controleTechnique: text("technical_inspection_notes").notNull().default(""),

    ...horodatage,
  },
  (t) => [
    // Garde-fous au niveau de la base : même si le code se trompe, ces valeurs sont refusées.
    check(
      "vehicules_statut_valide",
      sql.raw(`"statut" in (${STATUTS_VEHICULE.map((s) => `'${s}'`).join(", ")})`),
    ),
    check("vehicules_prix_positif", sql`${t.prixCentimes} >= 0`),
    check("vehicules_kilometrage_positif", sql`${t.kilometrage} >= 0`),
    // Index des colonnes les plus filtrées par le catalogue (docs/06, section 3).
    index("vehicules_catalogue_idx").on(t.statut, t.marqueId, t.prixCentimes),
    index("vehicules_publication_idx").on(t.statut, t.publieLe),
    pgPolicy("vehicules_lecture_publique", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`"statut" = 'publie'`,
    }),
  ],
).enableRLS();

export const equipements = pgTable(
  "equipments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nom: text("name").notNull().unique(),
  },
  () => [lecturePublique("equipements_lecture_publique")],
).enableRLS();

/** Liaison véhicule ↔ équipement. */
export const vehiculesEquipements = pgTable(
  "vehicle_equipments",
  {
    vehiculeId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicules.id, { onDelete: "cascade" }),
    equipementId: uuid("equipment_id")
      .notNull()
      .references(() => equipements.id, { onDelete: "restrict" }),
  },
  (t) => [
    primaryKey({ columns: [t.vehiculeId, t.equipementId] }),
    pgPolicy("vehicules_equipements_lecture_publique", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql.raw(conditionVehiculeLiePublie(`"vehicle_id"`)),
    }),
  ],
).enableRLS();

/** Photos d'un véhicule. Le fichier est dans Supabase Storage ; ici, seulement sa clé. */
export const vehiculesPhotos = pgTable(
  "vehicle_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehiculeId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicules.id, { onDelete: "cascade" }),
    /** Chemin du fichier dans le « bucket » de stockage. */
    cleStockage: text("storage_key").notNull(),
    /** Ordre d'affichage (0 = photo principale). */
    position: integer("position").notNull().default(0),
    /** Texte alternatif pour l'accessibilité. */
    texteAlternatif: text("alt_text").notNull().default(""),
    creeLe: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("photos_vehicule_position_unique").on(t.vehiculeId, t.position),
    pgPolicy("vehicules_photos_lecture_publique", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql.raw(conditionVehiculeLiePublie(`"vehicle_id"`)),
    }),
  ],
).enableRLS();

/**
 * Documents associés à un véhicule (rapport d'état, historique, contrôle technique…).
 * Un document « prive » n'est jamais lisible par le public (il sera servi par le serveur).
 */
export const vehiculesDocuments = pgTable(
  "vehicle_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehiculeId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicules.id, { onDelete: "cascade" }),
    libelle: text("label").notNull(),
    cleStockage: text("storage_key").notNull(),
    /** « public » ou « prive » (voir VISIBILITES_DOCUMENT). */
    visibilite: text("visibility").notNull().default("prive"),
    creeLe: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  () => [
    check("documents_visibilite_valide", sql.raw(`"visibility" in ('public', 'prive')`)),
    pgPolicy("vehicules_documents_lecture_publique", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql.raw(
        `"visibility" = 'public' and ${conditionVehiculeLiePublie(`"vehicle_id"`)}`,
      ),
    }),
  ],
).enableRLS();
