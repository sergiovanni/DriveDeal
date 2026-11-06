import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Connexion directe (pas le pooler) pour les migrations.
    url: process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
