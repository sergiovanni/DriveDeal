import { createBrowserClient } from "@supabase/ssr";

/** Client Supabase côté navigateur (clé anonyme uniquement). */
export function creerClientSupabaseNavigateur() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
