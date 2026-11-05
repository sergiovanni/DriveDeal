import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  equipements,
  marques,
  modeles,
  vehicules,
  vehiculesDocuments,
  vehiculesEquipements,
  vehiculesPhotos,
} from "@/lib/db/schema";
import { urlPublique } from "@/lib/supabase/service";
import { BUCKET_PHOTOS } from "./admin/photos-regles";
import { versVehicule } from "./mapping";
import type { Vehicule } from "./types";

/**
 * Lecture des véhicules dans la base de données (Supabase / PostgreSQL).
 *
 * « server-only » : ce fichier ne peut JAMAIS être embarqué dans le code envoyé au
 * navigateur (la construction du site échouerait), ce qui protège les accès à la base.
 *
 * IMPORTANT — sécurité : ces requêtes passent par la connexion directe du serveur, qui
 * CONTOURNE la sécurité par lignes (RLS). Les filtres « statut = publie » et
 * « visibilité = public » ci-dessous sont donc la seule barrière : ne jamais les retirer.
 */

/** Tous les véhicules publiés, du plus récent au plus ancien, avec équipements et documents publics. */
export async function chargerVehiculesPublies(): Promise<Vehicule[]> {
  const lignes = await db()
    .select({
      id: vehicules.id,
      reference: vehicules.reference,
      marque: marques.nom,
      modele: modeles.nom,
      version: vehicules.version,
      annee: vehicules.annee,
      kilometrage: vehicules.kilometrage,
      prixCentimes: vehicules.prixCentimes,
      description: vehicules.description,
      statut: vehicules.statut,
      publieLe: vehicules.publieLe,
      creeLe: vehicules.creeLe,
      motorisation: vehicules.motorisation,
      carburant: vehicules.carburant,
      puissanceCh: vehicules.puissanceCh,
      boite: vehicules.boite,
      transmission: vehicules.transmission,
      carrosserie: vehicules.carrosserie,
      portes: vehicules.portes,
      places: vehicules.places,
      couleur: vehicules.couleur,
      etatGeneral: vehicules.etatGeneral,
      historique: vehicules.historique,
      entretien: vehicules.entretien,
      controleTechnique: vehicules.controleTechnique,
    })
    .from(vehicules)
    .innerJoin(marques, eq(vehicules.marqueId, marques.id))
    .innerJoin(modeles, eq(vehicules.modeleId, modeles.id))
    .where(eq(vehicules.statut, "publie"))
    .orderBy(desc(vehicules.publieLe));

  if (lignes.length === 0) return [];
  const ids = lignes.map((l) => l.id);

  // Requêtes groupées (au lieu d'une par véhicule) : évite le piège « N+1 ».
  const [lignesEquipements, lignesDocuments, lignesPhotos] = await Promise.all([
    db()
      .select({ vehiculeId: vehiculesEquipements.vehiculeId, nom: equipements.nom })
      .from(vehiculesEquipements)
      .innerJoin(equipements, eq(vehiculesEquipements.equipementId, equipements.id))
      .where(inArray(vehiculesEquipements.vehiculeId, ids)),
    db()
      .select({
        vehiculeId: vehiculesDocuments.vehiculeId,
        libelle: vehiculesDocuments.libelle,
      })
      .from(vehiculesDocuments)
      // Seuls les documents publics : les documents privés ne sortent jamais d'ici.
      .where(
        and(
          inArray(vehiculesDocuments.vehiculeId, ids),
          eq(vehiculesDocuments.visibilite, "public"),
        ),
      ),
    // Photos dans l'ordre d'affichage (la première est la photo principale).
    db()
      .select({
        vehiculeId: vehiculesPhotos.vehiculeId,
        cle: vehiculesPhotos.cleStockage,
        alt: vehiculesPhotos.texteAlternatif,
      })
      .from(vehiculesPhotos)
      .where(inArray(vehiculesPhotos.vehiculeId, ids))
      .orderBy(asc(vehiculesPhotos.vehiculeId), asc(vehiculesPhotos.position)),
  ]);

  // Photos par véhicule, avec leur adresse publique (aucun secret : c'est l'adresse que le
  // navigateur des visiteurs charge).
  const photosParVehicule = new Map<string, { url: string; alt: string }[]>();
  for (const p of lignesPhotos) {
    const liste = photosParVehicule.get(p.vehiculeId) ?? [];
    liste.push({ url: urlPublique(BUCKET_PHOTOS, p.cle), alt: p.alt });
    photosParVehicule.set(p.vehiculeId, liste);
  }

  const parVehicule = <T extends { vehiculeId: string }>(
    rows: T[],
    extraire: (r: T) => string,
  ) => {
    const carte = new Map<string, string[]>();
    for (const r of rows)
      carte.set(r.vehiculeId, [...(carte.get(r.vehiculeId) ?? []), extraire(r)]);
    return carte;
  };
  const equipementsParVehicule = parVehicule(lignesEquipements, (r) => r.nom);
  const documentsParVehicule = parVehicule(lignesDocuments, (r) => r.libelle);

  return lignes.map((l) =>
    versVehicule(
      l,
      equipementsParVehicule.get(l.id),
      documentsParVehicule.get(l.id),
      photosParVehicule.get(l.id),
    ),
  );
}
