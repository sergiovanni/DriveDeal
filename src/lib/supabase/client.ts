import { createBrowserClient } from "@supabase/ssr";
import { lireEnvSupabasePublic } from "@/lib/env";

/**
 * Client Supabase côté navigateur (clé PUBLIQUE uniquement).
 * Sert à l'affichage (« suis-je connecté ? ») ; la sécurité ne repose jamais dessus :
 * les vraies vérifications se font côté serveur (src/lib/auth).
 */
export function creerClientSupabaseNavigateur() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } =
    lireEnvSupabasePublic();
  return createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
