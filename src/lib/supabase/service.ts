import "server-only";

import { createClient } from "@supabase/supabase-js";
import { lireEnvSupabasePublic, lireEnvSupabaseService } from "@/lib/env";

/**
 * Client Supabase avec la clé SECRÈTE (« service_role » / « secret »).
 *
 * ⚠️ CETTE CLÉ CONTOURNE TOUTES LES PROTECTIONS. Règles strictes :
 *  - « server-only » : ce fichier ne peut pas être inclus dans le code envoyé au navigateur ;
 *  - il n'est utilisé que pour le STOCKAGE de fichiers (signer des envois, vérifier l'existence
 *    d'un fichier, supprimer des fichiers) ;
 *  - il ne doit être appelé qu'APRÈS `exigerAdministrateur()` ; jamais depuis du code accessible
 *    à un visiteur ;
 *  - jamais pour lire ou écrire des données métier (cela passe par la couche d'accès Drizzle).
 */
export function creerClientSupabaseService() {
  const { NEXT_PUBLIC_SUPABASE_URL } = lireEnvSupabasePublic();
  const { SUPABASE_SERVICE_ROLE_KEY } = lireEnvSupabaseService();

  return createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    // Client « de passage » : aucune session n'est conservée ni renouvelée.
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Adresse publique d'une photo du bucket « vehicules-photos » (lisible sans connexion).
 * Ne contient aucun secret : c'est l'adresse que le navigateur des visiteurs charge.
 */
export function urlPublique(bucket: string, cle: string): string {
  const { NEXT_PUBLIC_SUPABASE_URL } = lireEnvSupabasePublic();
  const base = NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "");
  const chemin = cle.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${bucket}/${chemin}`;
}
