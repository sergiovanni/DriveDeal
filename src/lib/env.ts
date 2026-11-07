import { z } from "zod";

/**
 * Validation des variables d'environnement, PAR GROUPE.
 *
 * Pourquoi par groupe : chaque partie du site n'exige que ce dont elle a besoin. Par exemple,
 * lire la base ne demande pas les clés Supabase ; l'authentification ne demande pas
 * DATABASE_URL. Ainsi une configuration partielle donne une erreur claire et ciblée, au lieu
 * d'une erreur sur des variables sans rapport.
 *
 * Les valeurs sont lues à la demande (jamais à l'import) pour que le site public
 * fonctionne même si Supabase n'est pas encore configuré.
 */

type Source = Record<string, string | undefined>;

/** Convertit une erreur de validation en message lisible (noms de variables uniquement, jamais de valeurs). */
function erreurClaire(groupe: string, erreur: z.ZodError): Error {
  const variables = [...new Set(erreur.issues.map((i) => i.path.join(".")))].join(", ");
  return new Error(
    `Configuration « ${groupe} » invalide ou incomplète : ${variables}. ` +
      `Voir .env.example, puis lancez « npm run env:verifier ».`,
  );
}

// --- Base de données ----------------------------------------------------------------
const schemaBase = z.object({
  DATABASE_URL: z.string().min(1),
  DATABASE_DIRECT_URL: z.string().min(1).optional(),
});

/** Variables nécessaires pour lire et écrire dans la base (serveur uniquement). */
export function lireEnvBase(source: Source = process.env): z.infer<typeof schemaBase> {
  const resultat = schemaBase.safeParse(source);
  if (!resultat.success) throw erreurClaire("base de données", resultat.error);
  return resultat.data;
}

// --- Supabase : clés publiques (authentification) -----------------------------------
const schemaSupabasePublic = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

/**
 * Lit l'adresse et la clé PUBLIQUE de Supabase.
 *
 * IMPORTANT : dans le navigateur, Next.js ne remplace les variables NEXT_PUBLIC_* que si elles
 * sont écrites en toutes lettres (`process.env.NEXT_PUBLIC_…`). C'est pourquoi la valeur par
 * défaut ci-dessous les cite une par une, au lieu de passer `process.env` en bloc.
 */
export function lireEnvSupabasePublic(
  source: Source = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
): z.infer<typeof schemaSupabasePublic> {
  const resultat = schemaSupabasePublic.safeParse(source);
  if (!resultat.success) throw erreurClaire("Supabase (clés publiques)", resultat.error);
  return resultat.data;
}

/** Vrai si l'authentification Supabase est configurée (sans lever d'erreur). */
export function supabaseConfigure(source?: Source): boolean {
  try {
    lireEnvSupabasePublic(source);
    return true;
  } catch {
    return false;
  }
}

// --- Supabase : clé SECRÈTE (serveur uniquement) --------------------------------------
const schemaSupabaseService = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

/** Clé secrète Supabase. Ne JAMAIS l'importer dans un composant client. */
export function lireEnvSupabaseService(
  source: Source = process.env,
): z.infer<typeof schemaSupabaseService> {
  const resultat = schemaSupabaseService.safeParse(source);
  if (!resultat.success) throw erreurClaire("Supabase (clé secrète)", resultat.error);
  return resultat.data;
}

// --- Adresse du site -------------------------------------------------------------------
/** Adresse publique du site (sans « / » final). Sert aux liens envoyés par e-mail. */
export function lireUrlSite(
  source: Source = { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL },
): string {
  const brute = source.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return brute.replace(/\/+$/, "");
}
