import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { profils } from "@/lib/db/schema";

/** Coordonnées d'une personne, telles que l'espace client les affiche. */
export type Profil = { prenom: string; nom: string; telephone: string };

const PROFIL_VIDE: Profil = { prenom: "", nom: "", telephone: "" };

/**
 * Lit le profil d'un utilisateur.
 * Renvoie un profil vide si la base n'est pas configurée ou si aucune ligne n'existe encore.
 *
 * `userId` doit toujours provenir de la SESSION VÉRIFIÉE (src/lib/auth), jamais d'une saisie.
 */
export async function lireProfil(userId: string): Promise<Profil> {
  if (!process.env.DATABASE_URL) return PROFIL_VIDE;
  const [ligne] = await db()
    .select()
    .from(profils)
    .where(eq(profils.id, userId))
    .limit(1);
  return {
    prenom: ligne?.prenom ?? "",
    nom: ligne?.nom ?? "",
    telephone: ligne?.telephone ?? "",
  };
}
