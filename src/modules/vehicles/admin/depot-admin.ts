import "server-only";

import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import {
  equipements,
  journalAudit,
  marques,
  modeles,
  vehicules,
  vehiculesDocuments,
  vehiculesEquipements,
  vehiculesPhotos,
} from "@/lib/db/schema";
import { STATUTS_VEHICULE } from "@/lib/db/schema/constantes";
import { echapperRechercheLike, slugify } from "@/lib/texte";
import type { StatutVehicule } from "../types";
import {
  estVerrouille,
  peutEtreSupprime,
  problemesPourPublier,
  transitionAutorisee,
} from "./regles";
import type { DonneesVehicule } from "./validation";

/**
 * Accès à la base pour le BACK-OFFICE des véhicules.
 *
 * ⚠️ SÉCURITÉ : ces fonctions passent par la connexion directe du serveur, qui CONTOURNE la
 * sécurité par lignes. Elles ne vérifient donc PAS qui appelle : c'est le rôle de
 * `exigerAdministrateur()`, à appeler dans CHAQUE action serveur AVANT d'utiliser ce fichier.
 * Ne jamais appeler ces fonctions depuis du code accessible sans contrôle.
 *
 * Toute écriture se fait dans une TRANSACTION (tout ou rien) et laisse une trace dans le
 * journal d'audit, avec l'identifiant de l'administrateur (`acteurId`).
 */

/** Une transaction Drizzle (type déduit de `db().transaction`). */
type Tx = Parameters<Parameters<ReturnType<typeof db>["transaction"]>[0]>[0];

const schemaUuid = z.uuid();

// ---------------------------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------------------------

export type CompteursStatut = Record<StatutVehicule, number> & { total: number };

/** Nombre de véhicules par statut (pour les cartes du tableau de bord et les filtres). */
export async function compterParStatut(): Promise<CompteursStatut> {
  const lignes = await db()
    .select({ statut: vehicules.statut, n: sql<number>`count(*)::int` })
    .from(vehicules)
    .groupBy(vehicules.statut);

  const compteurs = Object.fromEntries(STATUTS_VEHICULE.map((s) => [s, 0])) as Record<
    StatutVehicule,
    number
  >;
  for (const l of lignes) {
    if ((STATUTS_VEHICULE as readonly string[]).includes(l.statut))
      compteurs[l.statut as StatutVehicule] = l.n;
  }
  return { ...compteurs, total: Object.values(compteurs).reduce((a, b) => a + b, 0) };
}

export type LigneAdmin = {
  id: string;
  reference: string;
  marque: string;
  modele: string;
  version: string;
  annee: number;
  kilometrage: number;
  prixCentimes: number;
  statut: StatutVehicule;
  couleur: string;
  carburant: string;
  boite: string;
  puissanceCh: number;
  motorisation: string;
  modifieLe: Date;
  nombrePhotos: number;
};

export type FiltresAdmin = {
  /** Texte cherché dans la référence, la marque, le modèle et la version. */
  q?: string;
  statut?: StatutVehicule;
  page: number;
  parPage: number;
};

/** Liste paginée des véhicules (tous statuts) pour l'administration. */
export async function listerPourAdmin(
  f: FiltresAdmin,
): Promise<{ lignes: LigneAdmin[]; total: number }> {
  const conditions: SQL[] = [];
  if (f.statut) conditions.push(eq(vehicules.statut, f.statut));
  if (f.q) {
    // `echapperRechercheLike` : un « % » saisi ne doit pas renvoyer tout le stock.
    const motif = `%${echapperRechercheLike(f.q)}%`;
    const recherche = or(
      ilike(vehicules.reference, motif),
      ilike(marques.nom, motif),
      ilike(modeles.nom, motif),
      ilike(vehicules.version, motif),
    );
    if (recherche) conditions.push(recherche);
  }
  const filtre = conditions.length ? and(...conditions) : undefined;

  const base = () =>
    db()
      .select({
        id: vehicules.id,
        reference: vehicules.reference,
        marque: marques.nom,
        modele: modeles.nom,
        version: vehicules.version,
        annee: vehicules.annee,
        kilometrage: vehicules.kilometrage,
        prixCentimes: vehicules.prixCentimes,
        statut: vehicules.statut,
        couleur: vehicules.couleur,
        carburant: vehicules.carburant,
        boite: vehicules.boite,
        puissanceCh: vehicules.puissanceCh,
        motorisation: vehicules.motorisation,
        modifieLe: vehicules.modifieLe,
        nombrePhotos: sql<number>`(select count(*)::int from "vehicle_photos" where "vehicle_photos"."vehicle_id" = "vehicles"."id")`,
      })
      .from(vehicules)
      .innerJoin(marques, eq(vehicules.marqueId, marques.id))
      .innerJoin(modeles, eq(vehicules.modeleId, modeles.id))
      .where(filtre);

  const [lignes, [{ total }]] = await Promise.all([
    base()
      .orderBy(desc(vehicules.modifieLe))
      .limit(f.parPage)
      .offset((f.page - 1) * f.parPage),
    db()
      .select({ total: sql<number>`count(*)::int` })
      .from(vehicules)
      .innerJoin(marques, eq(vehicules.marqueId, marques.id))
      .innerJoin(modeles, eq(vehicules.modeleId, modeles.id))
      .where(filtre),
  ]);

  return { lignes: lignes as LigneAdmin[], total };
}

export type VehiculeAdmin = LigneAdmin & {
  description: string;
  transmission: string;
  carrosserie: string;
  portes: number;
  places: number;
  etatGeneral: string;
  historique: string;
  entretien: string;
  controleTechnique: string;
  creeLe: Date;
  publieLe: Date | null;
  equipements: string[];
  photos: {
    id: string;
    cleStockage: string;
    position: number;
    texteAlternatif: string;
  }[];
  documents: { id: string; libelle: string; visibilite: string }[];
};

/** Lit un véhicule complet (tous statuts). Renvoie `undefined` si l'identifiant est invalide ou inconnu. */
export async function lireVehiculePourAdmin(
  id: string,
): Promise<VehiculeAdmin | undefined> {
  // Un identifiant mal formé ferait échouer PostgreSQL : on le rejette avant la requête.
  if (!schemaUuid.safeParse(id).success) return undefined;

  const [v] = await db()
    .select({
      id: vehicules.id,
      reference: vehicules.reference,
      marque: marques.nom,
      modele: modeles.nom,
      version: vehicules.version,
      annee: vehicules.annee,
      kilometrage: vehicules.kilometrage,
      prixCentimes: vehicules.prixCentimes,
      statut: vehicules.statut,
      couleur: vehicules.couleur,
      carburant: vehicules.carburant,
      boite: vehicules.boite,
      puissanceCh: vehicules.puissanceCh,
      motorisation: vehicules.motorisation,
      modifieLe: vehicules.modifieLe,
      description: vehicules.description,
      transmission: vehicules.transmission,
      carrosserie: vehicules.carrosserie,
      portes: vehicules.portes,
      places: vehicules.places,
      etatGeneral: vehicules.etatGeneral,
      historique: vehicules.historique,
      entretien: vehicules.entretien,
      controleTechnique: vehicules.controleTechnique,
      creeLe: vehicules.creeLe,
      publieLe: vehicules.publieLe,
    })
    .from(vehicules)
    .innerJoin(marques, eq(vehicules.marqueId, marques.id))
    .innerJoin(modeles, eq(vehicules.modeleId, modeles.id))
    .where(eq(vehicules.id, id))
    .limit(1);
  if (!v) return undefined;

  const [liensEquipements, photos, documents] = await Promise.all([
    db()
      .select({ nom: equipements.nom })
      .from(vehiculesEquipements)
      .innerJoin(equipements, eq(vehiculesEquipements.equipementId, equipements.id))
      .where(eq(vehiculesEquipements.vehiculeId, id))
      .orderBy(asc(equipements.nom)),
    db()
      .select({
        id: vehiculesPhotos.id,
        cleStockage: vehiculesPhotos.cleStockage,
        position: vehiculesPhotos.position,
        texteAlternatif: vehiculesPhotos.texteAlternatif,
      })
      .from(vehiculesPhotos)
      .where(eq(vehiculesPhotos.vehiculeId, id))
      .orderBy(asc(vehiculesPhotos.position)),
    db()
      .select({
        id: vehiculesDocuments.id,
        libelle: vehiculesDocuments.libelle,
        visibilite: vehiculesDocuments.visibilite,
      })
      .from(vehiculesDocuments)
      .where(eq(vehiculesDocuments.vehiculeId, id)),
  ]);

  return {
    ...v,
    statut: v.statut as StatutVehicule,
    nombrePhotos: photos.length,
    equipements: liensEquipements.map((e) => e.nom),
    photos,
    documents,
  };
}

// ---------------------------------------------------------------------------------------
// Écriture (toujours dans une transaction + journal d'audit)
// ---------------------------------------------------------------------------------------

/** Ajoute une ligne au journal d'audit (dans la même transaction que l'opération tracée). */
async function ecrireAudit(
  tx: Tx,
  entree: {
    acteurId: string;
    action: string;
    idEntite: string;
    details?: Record<string, unknown>;
  },
) {
  await tx.insert(journalAudit).values({
    acteurId: entree.acteurId,
    action: entree.action,
    typeEntite: "vehicule",
    idEntite: entree.idEntite,
    details: entree.details ?? null,
  });
}

/** Retrouve une marque par son nom (sans tenir compte de la casse) ou la crée. */
async function trouverOuCreerMarque(tx: Tx, nom: string) {
  const [existante] = await tx
    .select()
    .from(marques)
    .where(sql`lower(${marques.nom}) = lower(${nom})`)
    .limit(1);
  if (existante) return existante;
  const [creee] = await tx
    .insert(marques)
    .values({ nom, slug: slugify(nom) })
    .onConflictDoNothing()
    .returning();
  if (creee) return creee;
  // Création simultanée ou slug identique (« Citroën » / « Citroen ») : on reprend l'existante.
  const [relue] = await tx
    .select()
    .from(marques)
    .where(eq(marques.slug, slugify(nom)))
    .limit(1);
  return relue;
}

async function trouverOuCreerModele(tx: Tx, marqueId: string, nom: string) {
  const slug = slugify(nom);
  const [existant] = await tx
    .select()
    .from(modeles)
    .where(and(eq(modeles.marqueId, marqueId), eq(modeles.slug, slug)))
    .limit(1);
  if (existant) return existant;
  const [cree] = await tx
    .insert(modeles)
    .values({ marqueId, nom, slug })
    .onConflictDoNothing()
    .returning();
  if (cree) return cree;
  const [relu] = await tx
    .select()
    .from(modeles)
    .where(and(eq(modeles.marqueId, marqueId), eq(modeles.slug, slug)))
    .limit(1);
  return relu;
}

/** Remplace la liste d'équipements d'un véhicule (création des équipements inconnus). */
async function remplacerEquipements(tx: Tx, vehiculeId: string, noms: string[]) {
  await tx
    .delete(vehiculesEquipements)
    .where(eq(vehiculesEquipements.vehiculeId, vehiculeId));
  for (const nom of noms) {
    const [existant] = await tx
      .select()
      .from(equipements)
      .where(sql`lower(${equipements.nom}) = lower(${nom})`)
      .limit(1);
    let equipement = existant;
    if (!equipement) {
      [equipement] = await tx
        .insert(equipements)
        .values({ nom })
        .onConflictDoNothing()
        .returning();
      equipement ??= (
        await tx.select().from(equipements).where(eq(equipements.nom, nom)).limit(1)
      )[0];
    }
    await tx
      .insert(vehiculesEquipements)
      .values({ vehiculeId, equipementId: equipement.id })
      .onConflictDoNothing();
  }
}

/** Colonnes du véhicule issues des données validées (hors marque, modèle, équipements). */
function colonnes(d: DonneesVehicule) {
  return {
    version: d.version,
    annee: d.annee,
    kilometrage: d.kilometrage,
    prixCentimes: d.prixCentimes,
    description: d.description,
    motorisation: d.motorisation,
    carburant: d.carburant,
    puissanceCh: d.puissanceCh,
    boite: d.boite,
    transmission: d.transmission,
    carrosserie: d.carrosserie,
    portes: d.portes,
    places: d.places,
    couleur: d.couleur,
    etatGeneral: d.etatGeneral,
    historique: d.historique,
    entretien: d.entretien,
    controleTechnique: d.controleTechnique,
  };
}

/**
 * Crée un véhicule en BROUILLON. La référence (« DD-0100 »…) est attribuée par la base.
 * Le statut n'est jamais fourni par l'appelant : tout nouveau véhicule démarre invisible du public.
 */
export async function creerVehicule(
  donnees: DonneesVehicule,
  acteurId: string,
): Promise<{ id: string; reference: string }> {
  return db().transaction(async (tx) => {
    const marque = await trouverOuCreerMarque(tx, donnees.marque);
    const modele = await trouverOuCreerModele(tx, marque.id, donnees.modele);

    const [cree] = await tx
      .insert(vehicules)
      .values({
        ...colonnes(donnees),
        marqueId: marque.id,
        modeleId: modele.id,
        statut: "brouillon",
      })
      .returning({ id: vehicules.id, reference: vehicules.reference });

    await remplacerEquipements(tx, cree.id, donnees.equipements);
    await ecrireAudit(tx, {
      acteurId,
      action: "vehicule.cree",
      idEntite: cree.id,
      details: { reference: cree.reference, marque: marque.nom, modele: modele.nom },
    });
    return cree;
  });
}

export type ResultatEcriture = { ok: true } | { ok: false; erreur: string };

/** Modifie les informations d'un véhicule (jamais son statut ni sa référence). */
export async function modifierVehicule(
  id: string,
  donnees: DonneesVehicule,
  acteurId: string,
): Promise<ResultatEcriture> {
  if (!schemaUuid.safeParse(id).success)
    return { ok: false, erreur: "Véhicule introuvable." };

  return db().transaction(async (tx): Promise<ResultatEcriture> => {
    // `for("update")` verrouille la ligne : deux modifications simultanées s'enchaînent au lieu de s'écraser.
    const [actuel] = await tx
      .select()
      .from(vehicules)
      .where(eq(vehicules.id, id))
      .for("update")
      .limit(1);
    if (!actuel) return { ok: false, erreur: "Véhicule introuvable." };
    if (estVerrouille(actuel.statut as StatutVehicule)) {
      return {
        ok: false,
        erreur: "Ce véhicule est réservé ou vendu : il ne peut plus être modifié ici.",
      };
    }

    const marque = await trouverOuCreerMarque(tx, donnees.marque);
    const modele = await trouverOuCreerModele(tx, marque.id, donnees.modele);
    const nouvelles = { ...colonnes(donnees), marqueId: marque.id, modeleId: modele.id };

    // Pour l'audit : on note QUELS champs ont changé (pas leurs valeurs, parfois longues).
    const champsModifies = (Object.keys(nouvelles) as (keyof typeof nouvelles)[]).filter(
      (c) => actuel[c] !== nouvelles[c],
    );
    const ancienPrix =
      actuel.prixCentimes !== nouvelles.prixCentimes
        ? { de: actuel.prixCentimes, vers: nouvelles.prixCentimes }
        : undefined;

    await tx.update(vehicules).set(nouvelles).where(eq(vehicules.id, id));
    await remplacerEquipements(tx, id, donnees.equipements);
    await ecrireAudit(tx, {
      acteurId,
      action: "vehicule.modifie",
      idEntite: id,
      details: {
        reference: actuel.reference,
        champsModifies,
        ...(ancienPrix ? { prixCentimes: ancienPrix } : {}),
      },
    });
    return { ok: true };
  });
}

export type ResultatStatut = { ok: true } | { ok: false; erreur: string };

/**
 * Change le statut d'un véhicule après contrôle des règles (transitions autorisées, conditions
 * de publication). `WHERE statut = <ancien>` évite d'écraser un changement fait entre-temps.
 */
export async function changerStatutVehicule(
  id: string,
  vers: StatutVehicule,
  acteurId: string,
): Promise<ResultatStatut> {
  if (!schemaUuid.safeParse(id).success)
    return { ok: false, erreur: "Véhicule introuvable." };

  return db().transaction(async (tx): Promise<ResultatStatut> => {
    const [v] = await tx
      .select()
      .from(vehicules)
      .where(eq(vehicules.id, id))
      .for("update")
      .limit(1);
    if (!v) return { ok: false, erreur: "Véhicule introuvable." };
    const de = v.statut as StatutVehicule;

    if (!transitionAutorisee(de, vers)) {
      return { ok: false, erreur: `Passage de « ${de} » à « ${vers} » non autorisé.` };
    }
    if (vers === "publie") {
      const [{ n }] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(vehiculesPhotos)
        .where(eq(vehiculesPhotos.vehiculeId, id));
      const problemes = problemesPourPublier({
        prixCentimes: v.prixCentimes,
        nombrePhotos: n,
      });
      if (problemes.length > 0) {
        return {
          ok: false,
          erreur: `Publication impossible : ${problemes.map((p) => p.message).join(" ")}`,
        };
      }
    }

    const mis = await tx
      .update(vehicules)
      .set({ statut: vers, ...(vers === "publie" ? { publieLe: new Date() } : {}) })
      .where(and(eq(vehicules.id, id), eq(vehicules.statut, de)))
      .returning({ id: vehicules.id });
    if (mis.length === 0)
      return {
        ok: false,
        erreur: "Le véhicule a changé entre-temps. Rechargez la page.",
      };

    await ecrireAudit(tx, {
      acteurId,
      action: "vehicule.statut",
      idEntite: id,
      details: { reference: v.reference, de, vers },
    });
    return { ok: true };
  });
}

export type ResultatSuppression =
  { ok: true; clesPhotos: string[] } | { ok: false; erreur: string };

/**
 * Supprime DÉFINITIVEMENT un brouillon (RG-V04). Tout autre statut doit être archivé.
 * Renvoie les clés des photos pour que l'appelant supprime aussi les fichiers du stockage.
 */
export async function supprimerBrouillon(
  id: string,
  acteurId: string,
): Promise<ResultatSuppression> {
  if (!schemaUuid.safeParse(id).success)
    return { ok: false, erreur: "Véhicule introuvable." };

  return db().transaction(async (tx): Promise<ResultatSuppression> => {
    const [v] = await tx
      .select()
      .from(vehicules)
      .where(eq(vehicules.id, id))
      .for("update")
      .limit(1);
    if (!v) return { ok: false, erreur: "Véhicule introuvable." };
    if (!peutEtreSupprime(v.statut as StatutVehicule)) {
      return {
        ok: false,
        erreur: "Seul un brouillon peut être supprimé. Archivez ce véhicule à la place.",
      };
    }

    const photos = await tx
      .select({ cle: vehiculesPhotos.cleStockage })
      .from(vehiculesPhotos)
      .where(eq(vehiculesPhotos.vehiculeId, id));
    const documents = await tx
      .select({ cle: vehiculesDocuments.cleStockage })
      .from(vehiculesDocuments)
      .where(eq(vehiculesDocuments.vehiculeId, id));

    // `AND statut = 'brouillon'` : filet de sécurité si le statut a changé entre la lecture et la suppression.
    const supprimes = await tx
      .delete(vehicules)
      .where(and(eq(vehicules.id, id), eq(vehicules.statut, "brouillon")))
      .returning({ id: vehicules.id });
    if (supprimes.length === 0)
      return {
        ok: false,
        erreur: "Le véhicule a changé entre-temps. Rechargez la page.",
      };

    await ecrireAudit(tx, {
      acteurId,
      action: "vehicule.supprime",
      idEntite: id,
      details: { reference: v.reference },
    });
    return {
      ok: true,
      clesPhotos: [...photos.map((p) => p.cle), ...documents.map((d) => d.cle)],
    };
  });
}

/** Utilitaire pour les actions : vérifie qu'une valeur est un statut connu. */
export function estStatutValide(valeur: unknown): valeur is StatutVehicule {
  return (
    typeof valeur === "string" && (STATUTS_VEHICULE as readonly string[]).includes(valeur)
  );
}

/** Noms des marques déjà enregistrées (suggestions du formulaire, pour éviter les doublons de saisie). */
export async function listerNomsMarques(): Promise<string[]> {
  const lignes = await db()
    .select({ nom: marques.nom })
    .from(marques)
    .orderBy(asc(marques.nom));
  return lignes.map((l) => l.nom);
}
