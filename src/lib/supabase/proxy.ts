import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { lireEnvSupabasePublic } from "@/lib/env";

/**
 * Outil du fichier proxy.ts : renouvelle la session de connexion.
 *
 * POURQUOI C'EST NÉCESSAIRE : le jeton de connexion expire (1 heure par défaut) et doit être
 * renouvelé. Or les Server Components n'ont pas le droit d'écrire des cookies : seul proxy.ts
 * (ou une Server Action / un Route Handler) peut le faire. Sans cet outil, l'utilisateur serait
 * déconnecté toutes les heures.
 *
 * Ce fichier ne décide PAS des droits d'accès : il n'établit que « quelqu'un est-il connecté ? ».
 */

export type ResultatSession = {
  /** Réponse à renvoyer (porte les cookies de session éventuellement renouvelés). */
  reponse: NextResponse;
  /** Vrai si le jeton de connexion est valide. */
  estConnecte: boolean;
};

export async function rafraichirSession(requete: NextRequest): Promise<ResultatSession> {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } =
    lireEnvSupabasePublic();

  let reponse = NextResponse.next({ request: requete });

  const supabase = createServerClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return requete.cookies.getAll();
        },
        setAll(cookiesAEcrire) {
          // 1. Les écrire dans la requête, pour que le reste du traitement voie la session à jour…
          cookiesAEcrire.forEach(({ name, value }) => requete.cookies.set(name, value));
          // 2. …et dans la réponse, pour que le navigateur les enregistre.
          reponse = NextResponse.next({ request: requete });
          cookiesAEcrire.forEach(({ name, value, options }) =>
            reponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // `getClaims()` vérifie la signature du jeton (en local avec les clés asymétriques, sans appel
  // réseau). Léger, donc adapté à proxy.ts qui s'exécute à chaque requête concernée.
  // Les vraies vérifications de droits se font plus loin, avec `getUser()` (src/lib/auth).
  const { data } = await supabase.auth.getClaims();

  return { reponse, estConnecte: Boolean(data?.claims?.sub) };
}

/**
 * Crée une redirection en conservant les cookies de session éventuellement renouvelés.
 * (Sans cela, un renouvellement de jeton serait perdu au moment de rediriger.)
 */
export function rediriger(destination: URL, source: NextResponse): NextResponse {
  const redirection = NextResponse.redirect(destination);
  source.cookies.getAll().forEach((cookie) => redirection.cookies.set(cookie));
  return redirection;
}
