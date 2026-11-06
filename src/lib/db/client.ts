import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { lireEnvServeur } from "@/lib/env";
import * as schema from "./schema";

let instance: ReturnType<typeof creer> | undefined;

function creer() {
  const { DATABASE_URL } = lireEnvServeur();
  // `prepare: false` : requis avec le pooler Supabase en mode transaction (Vercel).
  const client = postgres(DATABASE_URL, { prepare: false });
  return drizzle(client, { schema });
}

/** Accès à la base, créé à la première utilisation. Serveur uniquement. */
export function db() {
  instance ??= creer();
  return instance;
}
