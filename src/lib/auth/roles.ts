import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { roles, utilisateursRoles } from "@/lib/db/schema";

/**
 * Rôles des utilisateurs.
 *
 * RÈGLE DE SÉCURITÉ : les rôles sont lus UNIQUEMENT dans la table `user_roles` de la base,
 * jamais dans les données du jeton de connexion ni dans `user_metadata` (que l'utilisateur
 * peut modifier lui-même). Un rôle retiré en base est donc effectif immédiatement, même si
 * l'utilisateur détient encore un jeton valide.
 */

/** Code du rôle administrateur (créé par la migration 0002). */
export const ROLE_ADMINISTRATEUR = "administrateur";
/** Code du rôle client (attribué automatiquement à l'inscription). */
export const ROLE_CLIENT = "client";

/** Vrai si la liste de rôles contient le rôle demandé. Fonction pure (testée). */
export function possedeRole(
  rolesDeLUtilisateur: readonly string[],
  requis: string,
): boolean {
  return rolesDeLUtilisateur.includes(requis);
}

/**
 * Lit les codes de rôle d'un utilisateur en base.
 * « Échec fermé » : si la base n'est pas configurée, on renvoie une liste VIDE (aucun droit)
 * plutôt que de laisser passer.
 */
export async function lireRolesUtilisateur(userId: string): Promise<string[]> {
  if (!process.env.DATABASE_URL) return [];
  const lignes = await db()
    .select({ code: roles.code })
    .from(utilisateursRoles)
    .innerJoin(roles, eq(utilisateursRoles.roleId, roles.id))
    .where(eq(utilisateursRoles.userId, userId));
  return lignes.map((l) => l.code);
}
