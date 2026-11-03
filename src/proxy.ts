import { type NextRequest, NextResponse } from "next/server";
import { supabaseConfigure } from "@/lib/env";
import { rafraichirSession, rediriger } from "@/lib/supabase/proxy";

/**
 * proxy.ts (nouveau nom de « middleware.ts » depuis Next.js 16).
 *
 * RÔLE : filtre RAPIDE exécuté avant les pages concernées.
 *  1. renouvelle la session de connexion (cookies) ;
 *  2. renvoie vers /connexion les visiteurs non connectés qui demandent une page privée ;
 *  3. (les pages /connexion, /inscription… renvoient elles-mêmes vers /compte les personnes
 *     déjà connectées, via `redirigerSiConnecte`, pour éviter les boucles de redirection).
 *
 * CE FILTRE NE SUFFIT JAMAIS À PROTÉGER UNE PAGE : Next.js l'exécute aussi sur les liens
 * « préchargés », et une page peut être atteinte autrement. La vraie vérification est refaite
 * dans chaque page, action et route sensible (src/lib/auth/garde.ts), puis par la base (RLS).
 *
 * Il ne s'exécute QUE sur les adresses listées dans `config.matcher` : les pages publiques
 * (catalogue, fiches…) restent statiques et rapides.
 */

/** Préfixes réservés aux personnes connectées. */
const PREFIXES_PRIVES = ["/compte", "/admin"];

const estPrive = (chemin: string) =>
  PREFIXES_PRIVES.some((p) => chemin === p || chemin.startsWith(`${p}/`));

export async function proxy(requete: NextRequest) {
  const { pathname, search } = requete.nextUrl;
  const privee = estPrive(pathname);

  // Authentification non configurée : personne ne peut être connecté.
  if (!supabaseConfigure()) {
    if (privee) return redirigerVersConnexion(requete, pathname + search);
    return NextResponse.next();
  }

  const { reponse, estConnecte } = await rafraichirSession(requete);

  if (privee && !estConnecte) {
    return rediriger(urlConnexion(requete, pathname + search), reponse);
  }
  // Pas de redirection « déjà connecté → /compte » ici : voir `redirigerSiConnecte` (garde.ts).
  // Un cookie périmé ferait boucler le proxy et la garde de la page privée.
  return reponse;
}

function urlConnexion(requete: NextRequest, destination: string): URL {
  const url = new URL("/connexion", requete.url);
  url.searchParams.set("redirection", destination);
  return url;
}

function redirigerVersConnexion(requete: NextRequest, destination: string) {
  return NextResponse.redirect(urlConnexion(requete, destination));
}

export const config = {
  matcher: [
    "/compte/:path*",
    "/admin/:path*",
    "/connexion",
    "/inscription",
    "/mot-de-passe-oublie",
  ],
};
