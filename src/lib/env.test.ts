import { describe, expect, it } from "vitest";
import {
  lireEnvBase,
  lireEnvSupabasePublic,
  lireEnvSupabaseService,
  lireUrlSite,
  supabaseConfigure,
} from "./env";

describe("lireEnvBase", () => {
  it("n'exige QUE les variables de la base (plus de dépendance aux clés Supabase)", () => {
    // Régression du défaut E1 : seule DATABASE_URL est renseignée.
    const env = lireEnvBase({ DATABASE_URL: "postgres://user:pass@host:6543/postgres" });
    expect(env.DATABASE_URL).toContain("postgres://");
  });

  it("signale clairement la variable manquante, sans afficher de valeur", () => {
    expect(() => lireEnvBase({})).toThrow(/DATABASE_URL/);
    expect(() => lireEnvBase({})).toThrow(/env:verifier/);
  });
});

describe("lireEnvSupabasePublic", () => {
  const valide = {
    NEXT_PUBLIC_SUPABASE_URL: "https://exemple.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "cle-publique",
  };

  it("accepte une configuration complète", () => {
    expect(lireEnvSupabasePublic(valide).NEXT_PUBLIC_SUPABASE_URL).toBe(
      "https://exemple.supabase.co",
    );
  });

  it("refuse une adresse invalide ou une clé absente", () => {
    expect(() =>
      lireEnvSupabasePublic({ ...valide, NEXT_PUBLIC_SUPABASE_URL: "pas-une-url" }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(() =>
      lireEnvSupabasePublic({
        NEXT_PUBLIC_SUPABASE_URL: valide.NEXT_PUBLIC_SUPABASE_URL,
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it("supabaseConfigure répond sans lever d'erreur", () => {
    expect(supabaseConfigure(valide)).toBe(true);
    expect(supabaseConfigure({})).toBe(false);
  });
});

describe("lireEnvSupabaseService", () => {
  it("exige la clé secrète", () => {
    expect(() => lireEnvSupabaseService({})).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(lireEnvSupabaseService({ SUPABASE_SERVICE_ROLE_KEY: "secrete" })).toEqual({
      SUPABASE_SERVICE_ROLE_KEY: "secrete",
    });
  });
});

describe("lireUrlSite", () => {
  it("renvoie l'adresse locale par défaut et retire le « / » final", () => {
    expect(lireUrlSite({})).toBe("http://localhost:3000");
    expect(lireUrlSite({ NEXT_PUBLIC_SITE_URL: "https://drivedeal.fr/" })).toBe(
      "https://drivedeal.fr",
    );
  });
});
