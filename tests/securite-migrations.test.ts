import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Tests de sécurité sur les migrations SQL.
 *
 * Règle du projet (docs/10, section 4) : TOUTE table a la sécurité par lignes (RLS)
 * activée. Supabase expose la base par une API directe : une table sans RLS serait lisible
 * et modifiable par n'importe qui connaissant l'adresse du projet.
 * Ce test échoue si une migration crée une table sans activer la RLS.
 */
const dossier = path.resolve(__dirname, "..", "drizzle");

const sql = readdirSync(dossier)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(path.join(dossier, f), "utf8"))
  .join("\n");

/** Liste les politiques d'écriture (INSERT, UPDATE, DELETE, ALL) accordées au rôle « anon ». */
function ecrituresPubliques(texteSql: string): string[] {
  const politiques = texteSql.match(/CREATE POLICY[^;]*;/g) ?? [];
  return politiques.filter(
    (p) => /FOR (INSERT|UPDATE|DELETE|ALL)/.test(p) && /TO[^;]*"anon"/.test(p),
  );
}

const tablesCreees = [...sql.matchAll(/CREATE TABLE "([^"]+)"/g)].map((m) => m[1]);

describe("migrations SQL", () => {
  it("créent au moins une table (le test ne doit pas passer à vide)", () => {
    expect(tablesCreees.length).toBeGreaterThan(5);
  });

  it.each(tablesCreees)("la table « %s » a la sécurité par lignes activée", (table) => {
    expect(sql).toContain(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
  });

  it("n'ouvrent aucune écriture publique sur le catalogue", () => {
    // Une politique d'écriture accordée à « anon » permettrait à n'importe qui de modifier le stock.
    expect(ecrituresPubliques(sql)).toEqual([]);
  });

  it("détecte bien une écriture publique (le contrôle ci-dessus n'est pas vide)", () => {
    const mauvais =
      'CREATE POLICY "x" ON "vehicles" AS PERMISSIVE FOR UPDATE TO "anon" USING (true);';
    expect(ecrituresPubliques(mauvais)).toHaveLength(1);
  });

  it("ne stockent jamais de mot de passe ou de donnée bancaire", () => {
    expect(sql.toLowerCase()).not.toMatch(/password|card_number|iban|cvv/);
  });
});
