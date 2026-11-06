import { describe, expect, it } from "vitest";
import { analyserVariablesEnv, roleDuJeton } from "./diagnostic-env";

/** Fabrique un faux jeton JWT (non signé) portant le rôle indiqué. */
function jeton(role: string): string {
  const encode = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${encode({ alg: "HS256" })}.${encode({ role })}.signature-factice`;
}

const valide = {
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "https://abcdefgh.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: jeton("anon"),
  SUPABASE_SERVICE_ROLE_KEY: jeton("service_role"),
  DATABASE_URL:
    "postgresql://postgres.abcdefgh:motdepasse@aws-0-eu-west-3.pooler.supabase.com:6543/postgres",
  DATABASE_DIRECT_URL:
    "postgresql://postgres:motdepasse@db.abcdefgh.supabase.co:5432/postgres",
};

const parNom = (env: Record<string, string | undefined>) =>
  Object.fromEntries(analyserVariablesEnv(env).map((r) => [r.nom, r]));

describe("roleDuJeton", () => {
  it("lit le rôle d'une clé de l'ancien format", () => {
    expect(roleDuJeton(jeton("anon"))).toBe("anon");
    expect(roleDuJeton(jeton("service_role"))).toBe("service_role");
  });

  it("renvoie undefined pour une clé qui n'est pas un jeton", () => {
    expect(roleDuJeton("sb_publishable_abc")).toBeUndefined();
    expect(roleDuJeton("a.b.c")).toBeUndefined();
  });
});

describe("analyserVariablesEnv", () => {
  it("accepte une configuration correcte", () => {
    const r = analyserVariablesEnv(valide);
    expect(r.every((x) => x.etat === "ok")).toBe(true);
  });

  it("signale les variables manquantes", () => {
    const r = parNom({});
    expect(r.NEXT_PUBLIC_SUPABASE_URL.etat).toBe("erreur");
    expect(r.DATABASE_URL.etat).toBe("erreur");
    expect(r.SUPABASE_SERVICE_ROLE_KEY.etat).toBe("erreur");
  });

  it("détecte la clé SECRÈTE placée dans la variable publique (cas dangereux)", () => {
    const r = parNom({ ...valide, NEXT_PUBLIC_SUPABASE_ANON_KEY: jeton("service_role") });
    expect(r.NEXT_PUBLIC_SUPABASE_ANON_KEY.etat).toBe("erreur");
    expect(r.NEXT_PUBLIC_SUPABASE_ANON_KEY.message).toMatch(/DANGER/);
  });

  it("détecte la nouvelle clé secrète placée dans la variable publique", () => {
    const r = parNom({
      ...valide,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_secret_abcdefghijklmnopqrstuvwxyz",
    });
    expect(r.NEXT_PUBLIC_SUPABASE_ANON_KEY.etat).toBe("erreur");
  });

  it("détecte les deux clés inversées ou identiques", () => {
    const inversees = parNom({
      ...valide,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: jeton("service_role"),
      SUPABASE_SERVICE_ROLE_KEY: jeton("anon"),
    });
    expect(inversees.NEXT_PUBLIC_SUPABASE_ANON_KEY.etat).toBe("erreur");
    expect(inversees.SUPABASE_SERVICE_ROLE_KEY.etat).toBe("erreur");

    const identiques = parNom({
      ...valide,
      SUPABASE_SERVICE_ROLE_KEY: valide.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
    expect(identiques.SUPABASE_SERVICE_ROLE_KEY.etat).toBe("erreur");
  });

  it("détecte le mot de passe non remplacé", () => {
    const r = parNom({
      ...valide,
      DATABASE_URL:
        "postgresql://postgres:[YOUR-PASSWORD]@db.abc.supabase.co:5432/postgres",
    });
    expect(r.DATABASE_URL.etat).toBe("erreur");
    expect(r.DATABASE_URL.message).toMatch(/YOUR-PASSWORD/);
  });

  it("explique le problème d'encodage quand l'adresse est illisible", () => {
    // Un port invalide rend l'adresse illisible (cas typique d'un mot de passe mal encodé).
    const r = parNom({
      ...valide,
      DATABASE_URL: "postgresql://postgres:secret@host.supabase.com:port/postgres",
    });
    expect(r.DATABASE_URL.etat).toBe("erreur");
    expect(r.DATABASE_URL.message).toMatch(/encod/);
  });

  it("recommande le pooler pour le site et refuse le port 6543 pour les migrations", () => {
    const direct = parNom({ ...valide, DATABASE_URL: valide.DATABASE_DIRECT_URL });
    expect(direct.DATABASE_URL.etat).toBe("avertissement");

    const migrationsPooler = parNom({
      ...valide,
      DATABASE_DIRECT_URL: valide.DATABASE_URL,
    });
    expect(migrationsPooler.DATABASE_DIRECT_URL.etat).toBe("erreur");
  });

  it("n'inclut jamais de clé ni de mot de passe dans les messages", () => {
    const messages = analyserVariablesEnv({
      ...valide,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: jeton("service_role"),
    })
      .map((r) => r.message)
      .join(" ");
    expect(messages).not.toContain("signature-factice");
    expect(messages).not.toContain("motdepasse");
  });
});
