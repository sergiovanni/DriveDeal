import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { adresseRedirectionSure } from "@/lib/auth/redirection";
import { supabaseConfigure } from "@/lib/env";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";

/**
 * Page d'arrivée des liens envoyés par e-mail (confirmation d'inscription, réinitialisation).
 *
 * Supabase renvoie ici avec UN des deux formats selon sa configuration :
 *  - `?code=…`                     (flux « PKCE » par défaut) : échangé contre une session ;
 *  - `?token_hash=…&type=…`        (modèle d'e-mail personnalisé, plus robuste : fonctionne même
 *                                   si le lien est ouvert dans un autre navigateur).
 * Les deux sont gérés. En cas d'échec, on renvoie vers la connexion avec un message.
 *
 * `suivant` (où aller ensuite) est une valeur non fiable : on n'accepte qu'un chemin interne.
 */

/** Types de lien acceptés. */
const TYPES_ACCEPTES: readonly EmailOtpType[] = [
  "signup",
  "recovery",
  "email",
  "invite",
  "magiclink",
  "email_change",
];

export async function GET(requete: NextRequest) {
  const { searchParams } = requete.nextUrl;
  const destination = adresseRedirectionSure(searchParams.get("suivant"), "/compte");
  const echec = NextResponse.redirect(
    new URL("/connexion?erreur=lien-invalide", requete.url),
  );

  if (!supabaseConfigure()) return echec;
  const supabase = await creerClientSupabaseServeur();

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destination, requete.url));
    console.error("[auth] échange du code refusé", {
      code: error.code,
      status: error.status,
    });
    return echec;
  }

  if (tokenHash && type && TYPES_ACCEPTES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(destination, requete.url));
    console.error("[auth] vérification du lien refusée", {
      code: error.code,
      status: error.status,
    });
  }

  return echec;
}
