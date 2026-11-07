import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { lireEnvBase } from "@/lib/env";
import * as schema from "./schema";

let instance: ReturnType<typeof creer> | undefined;

// Ouvre la connexion Postgres puis la relie à Drizzle avec le schéma typé.
function creer() {
  const { DATABASE_URL } = lireEnvBase();
  // `prepare: false` : requis avec le pooler Supabase en mode transaction (Vercel).
  const client = postgres(DATABASE_URL, { prepare: false });
  return drizzle(client, { schema });
}

/**
 * Accès à la base, créé à la première utilisation puis réutilisé (une connexion par
 * instance serverless). Réservé au serveur : ne jamais l'importer dans un composant client.
 */
export function db() {
  instance ??= creer();
  return instance;
}
