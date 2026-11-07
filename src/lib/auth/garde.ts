import "server-only";

import { notFound, redirect } from "next/navigation";
import { ROLE_ADMINISTRATEUR, lireRolesUtilisateur, possedeRole } from "./roles";
import { obtenirUtilisateur, type UtilisateurConnecte } from "./session";

/**
 * GARDES D'ACCÈS : la vraie barrière de sécurité du site (docs/11, section 5).
 *
 * À appeler au DÉBUT de chaque page protégée, de chaque Server Action et de chaque Route
 * Handler sensible. `proxy.ts` ne fait que filtrer rapidement ; il ne suffit jamais seul.
 * Masquer un bouton n'est pas une protection : une Server Action est appelable directement.
 */

/**
 * Exige un utilisateur connecté.
 * Sinon, renvoie vers la page de connexion, qui ramènera ici après succès.
 * @param destination page à rejoindre après connexion (chemin interne)
 */
export async function exigerUtilisateur(
  destination: string = "/compte",
): Promise<UtilisateurConnecte> {
  const utilisateur = await obtenirUtilisateur();
  if (!utilisateur) redirect(`/connexion?redirection=${encodeURIComponent(destination)}`);
  return utilisateur;
}

/**
 * Exige un utilisateur connecté POSSÉDANT un rôle.
 * Un utilisateur connecté sans le rôle reçoit une page « introuvable » (404) : on ne révèle
 * pas l'existence de l'espace d'administration.
 */
export async function exigerRole(
  role: string,
  destination: string = "/admin",
): Promise<UtilisateurConnecte & { roles: string[] }> {
  const utilisateur = await exigerUtilisateur(destination);
  const roles = await lireRolesUtilisateur(utilisateur.id);
  if (!possedeRole(roles, role)) notFound();
  return { ...utilisateur, roles };
}

/** Raccourci : exige le rôle administrateur. */
export function exigerAdministrateur(destination: string = "/admin") {
  return exigerRole(ROLE_ADMINISTRATEUR, destination);
}
