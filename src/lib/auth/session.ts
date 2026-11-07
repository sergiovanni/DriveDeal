import "server-only";

import { cache } from "react";
import { supabaseConfigure } from "@/lib/env";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";

/** L'utilisateur connecté, tel que les pages le voient. */
export type UtilisateurConnecte = {
  id: string;
  email: string | null;
  /** Vrai si l'adresse e-mail a été confirmée (lien reçu par e-mail). */
  emailVerifie: boolean;
};

/**
 * Identifie l'utilisateur de la requête en cours, ou `null` s'il n'est pas connecté.
 *
 * Utilise `getUser()` : Supabase vérifie le jeton AUPRÈS DU SERVEUR D'AUTHENTIFICATION. C'est
 * la méthode faisant autorité. On n'utilise JAMAIS `getSession()` côté serveur : elle lit le
 * cookie tel quel, or un cookie peut être falsifié.
 *
 * `cache` : plusieurs composants peuvent appeler cette fonction pendant la même requête ;
 * l'appel réseau n'est fait qu'une fois.
 */
export const obtenirUtilisateur = cache(async (): Promise<UtilisateurConnecte | null> => {
  if (!supabaseConfigure()) return null;

  const supabase = await creerClientSupabaseServeur();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    emailVerifie: Boolean(data.user.email_confirmed_at),
  };
});
