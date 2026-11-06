import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

/**
 * Configuration des migrations de base de données (Drizzle Kit).
 *
 * - `generate` écrit les fichiers SQL dans ./drizzle à partir du schéma TypeScript
 *   (aucune connexion à la base n'est nécessaire).
 * - `migrate` applique ces fichiers à la base : il faut alors DATABASE_DIRECT_URL.
 *
 * Drizzle Kit ne lit pas .env.local tout seul : `loadEnvConfig` charge les mêmes
 * fichiers d'environnement que Next.js (.env.local, .env…).
 */
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Connexion directe (pas le pooler) : le pooler en mode transaction ne convient
    // pas aux migrations.
    url: process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
