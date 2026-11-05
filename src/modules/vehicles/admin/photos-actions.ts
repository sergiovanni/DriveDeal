"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { exigerAdministrateur } from "@/lib/auth/garde";
import { creerClientSupabaseService } from "@/lib/supabase/service";
import { invaliderCatalogue } from "./cache";
import {
  ajouterPhoto,
  deplacerPhoto,
  supprimerPhoto,
  verifierAjoutPossible,
} from "./depot-photos";
import { lireVehiculePourAdmin } from "./depot-admin";
import {
  BUCKET_PHOTOS,
  cleAppartientAuVehicule,
  construireCleStockage,
  erreurFichierPhoto,
  extensionPourType,
} from "./photos-regles";

/**
 * Actions serveur pour les photos des véhicules.
 *
 * FLUX D'ENVOI (le navigateur envoie la photo DIRECTEMENT à Supabase, car Vercel refuse les
 * requêtes de plus de 4,5 Mo) :
 *   1. `preparerEnvoiPhotoAction` : le serveur vérifie les droits et le fichier annoncé, puis
 *      délivre une autorisation d'envoi à usage unique pour UN chemin précis et aléatoire ;
 *   2. le navigateur envoie le fichier avec cette autorisation (Supabase applique ses propres
 *      limites de taille et de type) ;
 *   3. `enregistrerPhotoAction` : le serveur vérifie que le fichier existe vraiment et que le chemin
 *      appartient bien à ce véhicule, puis l'enregistre en base.
 *
 * Chaque action commence par `exigerAdministrateur()` (une Server Action est appelable
 * directement) et valide ses paramètres avec Zod (ils viennent du navigateur).
 */

export type ReponseEnvoi =
  { ok: true; cle: string; token: string } | { ok: false; erreur: string };
export type ReponseSimple = { ok: true } | { ok: false; erreur: string };

const schemaPreparation = z.object({
  vehiculeId: z.uuid(),
  type: z.string().max(100),
  taille: z.number().int().positive(),
});

/** Étape 1 : autorise l'envoi d'UNE photo (chemin aléatoire, usage unique). */
export async function preparerEnvoiPhotoAction(entree: {
  vehiculeId: string;
  type: string;
  taille: number;
}): Promise<ReponseEnvoi> {
  await exigerAdministrateur("/admin/vehicules");

  const lu = schemaPreparation.safeParse(entree);
  if (!lu.success) return { ok: false, erreur: "Demande invalide." };
  const { vehiculeId, type, taille } = lu.data;

  const erreurFichier = erreurFichierPhoto({ type, taille });
  if (erreurFichier) return { ok: false, erreur: erreurFichier };

  const possible = await verifierAjoutPossible(vehiculeId);
  if (!possible.ok) return possible;

  const extension = extensionPourType(type);
  if (!extension) return { ok: false, erreur: "Format non accepté." };
  const cle = construireCleStockage(vehiculeId.toLowerCase(), extension, randomUUID());

  const { data, error } = await creerClientSupabaseService()
    .storage.from(BUCKET_PHOTOS)
    .createSignedUploadUrl(cle);
  if (error || !data) {
    console.error("[admin] autorisation d'envoi impossible", error?.message);
    return {
      ok: false,
      erreur: "L'envoi n'a pas pu être préparé. Réessayez dans un instant.",
    };
  }
  return { ok: true, cle, token: data.token };
}

const schemaEnregistrement = z.object({ vehiculeId: z.uuid(), cle: z.string().max(300) });

/** Étape 3 : enregistre la photo envoyée, après avoir vérifié qu'elle existe et qu'elle est bien à ce véhicule. */
export async function enregistrerPhotoAction(entree: {
  vehiculeId: string;
  cle: string;
}): Promise<ReponseSimple> {
  const admin = await exigerAdministrateur("/admin/vehicules");

  const lu = schemaEnregistrement.safeParse(entree);
  if (!lu.success) return { ok: false, erreur: "Demande invalide." };
  const { vehiculeId, cle } = lu.data;

  // Le navigateur ne peut pas faire enregistrer un chemin arbitraire.
  if (!cleAppartientAuVehicule(cle, vehiculeId))
    return { ok: false, erreur: "Chemin de photo invalide." };

  const stockage = creerClientSupabaseService().storage.from(BUCKET_PHOTOS);
  const { data: existe } = await stockage.exists(cle);
  if (!existe)
    return { ok: false, erreur: "La photo n'a pas été reçue. Réessayez l'envoi." };

  const vehicule = await lireVehiculePourAdmin(vehiculeId);
  if (!vehicule) {
    await stockage.remove([cle]);
    return { ok: false, erreur: "Véhicule introuvable." };
  }

  const texteAlternatif =
    `${vehicule.marque} ${vehicule.modele} ${vehicule.version}`.slice(0, 200);
  const resultat = await ajouterPhoto(vehiculeId, cle, texteAlternatif, admin.id);
  if (!resultat.ok) {
    // Aucune ligne créée : on supprime le fichier pour ne pas laisser d'orphelin dans le stockage.
    await stockage.remove([cle]);
    return resultat;
  }

  invaliderCatalogue();
  return { ok: true };
}

/** Supprime une photo (ligne en base, puis fichier dans le stockage). */
export async function supprimerPhotoAction(photoId: string): Promise<ReponseSimple> {
  const admin = await exigerAdministrateur("/admin/vehicules");

  const lu = z.uuid().safeParse(photoId);
  if (!lu.success) return { ok: false, erreur: "Demande invalide." };

  const resultat = await supprimerPhoto(lu.data, admin.id);
  if (!resultat.ok) return resultat;

  // La ligne est supprimée : si la suppression du fichier échoue, il ne reste qu'un orphelin
  // invisible (aucun impact sur le site). On le journalise pour un nettoyage ultérieur.
  const { error } = await creerClientSupabaseService()
    .storage.from(BUCKET_PHOTOS)
    .remove([resultat.cle]);
  if (error)
    console.error(
      "[admin] fichier de photo non supprimé du stockage",
      resultat.cle,
      error.message,
    );

  invaliderCatalogue();
  return { ok: true };
}

/** Déplace une photo vers le début ou la fin de la galerie (la première est la photo principale). */
export async function deplacerPhotoAction(
  photoId: string,
  sens: "haut" | "bas",
): Promise<ReponseSimple> {
  const admin = await exigerAdministrateur("/admin/vehicules");

  const lu = z
    .object({ id: z.uuid(), sens: z.enum(["haut", "bas"]) })
    .safeParse({ id: photoId, sens });
  if (!lu.success) return { ok: false, erreur: "Demande invalide." };

  const resultat = await deplacerPhoto(lu.data.id, lu.data.sens, admin.id);
  if (!resultat.ok) return resultat;

  invaliderCatalogue();
  return { ok: true };
}
