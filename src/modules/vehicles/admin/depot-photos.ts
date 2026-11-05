import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { journalAudit, vehicules, vehiculesPhotos } from "@/lib/db/schema";
import type { StatutVehicule } from "../types";
import { NOMBRE_MAX_PHOTOS } from "./photos-regles";
import { estVerrouille } from "./regles";

/**
 * Accès à la base pour les PHOTOS des véhicules.
 *
 * ⚠️ Comme depot-admin.ts : contourne la sécurité par lignes et ne vérifie pas l'appelant.
 * À n'utiliser qu'APRÈS `exigerAdministrateur()`.
 * Ce fichier ne touche qu'aux LIGNES de la table ; les fichiers eux-mêmes sont gérés dans le
 * stockage par les actions (src/modules/vehicles/admin/photos-actions.ts).
 */

type Tx = Parameters<Parameters<ReturnType<typeof db>["transaction"]>[0]>[0];
const schemaUuid = z.uuid();

async function auditer(
  tx: Tx,
  acteurId: string,
  action: string,
  vehiculeId: string,
  details: Record<string, unknown>,
) {
  await tx
    .insert(journalAudit)
    .values({ acteurId, action, typeEntite: "vehicule", idEntite: vehiculeId, details });
}

export type ResultatPhoto = { ok: true } | { ok: false; erreur: string };

/**
 * Indique si l'on peut ajouter une photo à ce véhicule (existe, non verrouillé, pas trop de photos).
 * Appelée AVANT de délivrer une autorisation d'envoi : on évite d'envoyer un fichier pour rien.
 */
export async function verifierAjoutPossible(vehiculeId: string): Promise<ResultatPhoto> {
  if (!schemaUuid.safeParse(vehiculeId).success)
    return { ok: false, erreur: "Véhicule introuvable." };
  const [v] = await db()
    .select({ statut: vehicules.statut })
    .from(vehicules)
    .where(eq(vehicules.id, vehiculeId))
    .limit(1);
  if (!v) return { ok: false, erreur: "Véhicule introuvable." };
  if (estVerrouille(v.statut as StatutVehicule))
    return {
      ok: false,
      erreur:
        "Ce véhicule est réservé ou vendu : ses photos ne peuvent plus être modifiées.",
    };
  const [{ n }] = await db()
    .select({ n: sql<number>`count(*)::int` })
    .from(vehiculesPhotos)
    .where(eq(vehiculesPhotos.vehiculeId, vehiculeId));
  if (n >= NOMBRE_MAX_PHOTOS)
    return {
      ok: false,
      erreur: `Limite atteinte : ${NOMBRE_MAX_PHOTOS} photos par véhicule.`,
    };
  return { ok: true };
}

/** Enregistre une photo déjà présente dans le stockage, à la dernière position. */
export async function ajouterPhoto(
  vehiculeId: string,
  cle: string,
  texteAlternatif: string,
  acteurId: string,
): Promise<ResultatPhoto> {
  if (!schemaUuid.safeParse(vehiculeId).success)
    return { ok: false, erreur: "Véhicule introuvable." };

  return db().transaction(async (tx): Promise<ResultatPhoto> => {
    // Verrou sur le véhicule : deux ajouts simultanés ne reçoivent pas la même position.
    const [v] = await tx
      .select()
      .from(vehicules)
      .where(eq(vehicules.id, vehiculeId))
      .for("update")
      .limit(1);
    if (!v) return { ok: false, erreur: "Véhicule introuvable." };
    if (estVerrouille(v.statut as StatutVehicule))
      return {
        ok: false,
        erreur:
          "Ce véhicule est réservé ou vendu : ses photos ne peuvent plus être modifiées.",
      };

    const [{ n, derniere }] = await tx
      .select({
        n: sql<number>`count(*)::int`,
        derniere: sql<number>`coalesce(max(${vehiculesPhotos.position}), -1)::int`,
      })
      .from(vehiculesPhotos)
      .where(eq(vehiculesPhotos.vehiculeId, vehiculeId));
    if (n >= NOMBRE_MAX_PHOTOS)
      return {
        ok: false,
        erreur: `Limite atteinte : ${NOMBRE_MAX_PHOTOS} photos par véhicule.`,
      };

    await tx
      .insert(vehiculesPhotos)
      .values({ vehiculeId, cleStockage: cle, position: derniere + 1, texteAlternatif });
    await auditer(tx, acteurId, "vehicule.photo_ajoutee", vehiculeId, {
      reference: v.reference,
      position: derniere + 1,
    });
    return { ok: true };
  });
}

export type ResultatSuppressionPhoto =
  { ok: true; cle: string } | { ok: false; erreur: string };

/**
 * Supprime la LIGNE d'une photo et renvoie sa clé pour que l'appelant supprime le fichier.
 * Refuse de retirer la dernière photo d'un véhicule publié (il ne remplirait plus la condition
 * de publication) : il faut d'abord le dépublier.
 */
export async function supprimerPhoto(
  photoId: string,
  acteurId: string,
): Promise<ResultatSuppressionPhoto> {
  if (!schemaUuid.safeParse(photoId).success)
    return { ok: false, erreur: "Photo introuvable." };

  return db().transaction(async (tx): Promise<ResultatSuppressionPhoto> => {
    const [photo] = await tx
      .select()
      .from(vehiculesPhotos)
      .where(eq(vehiculesPhotos.id, photoId))
      .limit(1);
    if (!photo) return { ok: false, erreur: "Photo introuvable." };

    const [v] = await tx
      .select()
      .from(vehicules)
      .where(eq(vehicules.id, photo.vehiculeId))
      .for("update")
      .limit(1);
    if (!v) return { ok: false, erreur: "Véhicule introuvable." };
    if (estVerrouille(v.statut as StatutVehicule))
      return {
        ok: false,
        erreur:
          "Ce véhicule est réservé ou vendu : ses photos ne peuvent plus être modifiées.",
      };

    const [{ n }] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(vehiculesPhotos)
      .where(eq(vehiculesPhotos.vehiculeId, v.id));
    if (v.statut === "publie" && n <= 1) {
      return {
        ok: false,
        erreur:
          "Impossible de retirer la dernière photo d'un véhicule publié. Dépubliez-le d'abord.",
      };
    }

    await tx.delete(vehiculesPhotos).where(eq(vehiculesPhotos.id, photoId));
    await auditer(tx, acteurId, "vehicule.photo_supprimee", v.id, {
      reference: v.reference,
    });
    return { ok: true, cle: photo.cleStockage };
  });
}

/**
 * Déplace une photo d'un cran vers le début (« haut ») ou vers la fin (« bas »).
 * La contrainte d'unicité (véhicule, position) interdit d'échanger deux positions en une seule
 * instruction : on passe par une position temporaire négative.
 */
export async function deplacerPhoto(
  photoId: string,
  sens: "haut" | "bas",
  acteurId: string,
): Promise<ResultatPhoto> {
  if (!schemaUuid.safeParse(photoId).success)
    return { ok: false, erreur: "Photo introuvable." };

  return db().transaction(async (tx): Promise<ResultatPhoto> => {
    const [photo] = await tx
      .select()
      .from(vehiculesPhotos)
      .where(eq(vehiculesPhotos.id, photoId))
      .limit(1);
    if (!photo) return { ok: false, erreur: "Photo introuvable." };

    const [v] = await tx
      .select()
      .from(vehicules)
      .where(eq(vehicules.id, photo.vehiculeId))
      .for("update")
      .limit(1);
    if (!v) return { ok: false, erreur: "Véhicule introuvable." };
    if (estVerrouille(v.statut as StatutVehicule))
      return {
        ok: false,
        erreur:
          "Ce véhicule est réservé ou vendu : ses photos ne peuvent plus être modifiées.",
      };

    const toutes = await tx
      .select()
      .from(vehiculesPhotos)
      .where(eq(vehiculesPhotos.vehiculeId, v.id))
      .orderBy(asc(vehiculesPhotos.position));
    const index = toutes.findIndex((p) => p.id === photoId);
    const voisin = toutes[sens === "haut" ? index - 1 : index + 1];
    if (!voisin) return { ok: true }; // déjà en première ou en dernière position : rien à faire

    await tx
      .update(vehiculesPhotos)
      .set({ position: -1 })
      .where(eq(vehiculesPhotos.id, photo.id));
    await tx
      .update(vehiculesPhotos)
      .set({ position: photo.position })
      .where(eq(vehiculesPhotos.id, voisin.id));
    await tx
      .update(vehiculesPhotos)
      .set({ position: voisin.position })
      .where(and(eq(vehiculesPhotos.id, photo.id)));
    await auditer(tx, acteurId, "vehicule.photo_deplacee", v.id, {
      reference: v.reference,
      sens,
    });
    return { ok: true };
  });
}
