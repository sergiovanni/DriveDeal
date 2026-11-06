import { describe, expect, it } from "vitest";
import { lireEnvServeur } from "./env";

const valide = {
  NEXT_PUBLIC_SUPABASE_URL: "https://exemple.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
  DATABASE_URL: "postgres://user:pass@host:6543/postgres",
} as unknown as NodeJS.ProcessEnv;

describe("lireEnvServeur", () => {
  it("accepte une configuration complète", () => {
    const env = lireEnvServeur(valide);
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });

  it("signale les variables manquantes", () => {
    expect(() => lireEnvServeur({} as NodeJS.ProcessEnv)).toThrow(/DATABASE_URL/);
  });
});
