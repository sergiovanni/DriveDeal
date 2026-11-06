import { z } from "zod";

/**
 * Validation des variables d'environnement.
 * Les valeurs sont lues à la demande (pas à l'import) pour que le site public
 * fonctionne même si Supabase n'est pas encore configuré.
 */
const serveurSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  DATABASE_DIRECT_URL: z.string().min(1).optional(),
});

export type EnvServeur = z.infer<typeof serveurSchema>;

export function lireEnvServeur(source: NodeJS.ProcessEnv = process.env): EnvServeur {
  const resultat = serveurSchema.safeParse(source);
  if (!resultat.success) {
    const manquantes = resultat.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(
      `Variables d'environnement invalides ou manquantes : ${manquantes}. Voir .env.example.`,
    );
  }
  return resultat.data;
}
