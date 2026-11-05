import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { lireEnvSupabasePublic } from "@/lib/env";

/**
 * Client Supabase côté serveur (Server Components, Server Actions, Route Handlers).
 *
 * Il utilise la clé PUBLIQUE et les cookies de la requête : il agit donc « au nom » de
 * l'utilisateur connecté, avec les droits limités par la sécurité par lignes (RLS).
 * Il sert à l'authentification (connexion, inscription, lecture de l'utilisateur).
 * Pour lire ou écrire des données métier, on passe par la couche d'accès (Drizzle).
 */
export async function creerClientSupabaseServeur() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } =
    lireEnvSupabasePublic();
  const cookieStore = await cookies();

  return createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Appelé depuis un Server Component : Next.js interdit d'y écrire des cookies.
          // Sans conséquence : le rafraîchissement de session est fait par proxy.ts.
        }
      },
    },
  });
}
