import { afterEach, describe, expect, it, vi } from "vitest";
import { baseConfiguree, listerVehicules, trouverVehicule } from "./depot";

/**
 * Tests du mode « sans base de données » : tant que DATABASE_URL est vide, le site doit
 * continuer à fonctionner avec les données de démonstration.
 * (Le mode « avec base » nécessite une vraie base : il n'est pas couvert ici.)
 */
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("depot sans base de données", () => {
  it("détecte l'absence de configuration", () => {
    vi.stubEnv("DATABASE_URL", "");
    expect(baseConfiguree()).toBe(false);
  });

  it("renvoie uniquement des véhicules publiés", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const liste = await listerVehicules();
    expect(liste.length).toBeGreaterThan(0);
    expect(liste.every((v) => v.statut === "publie")).toBe(true);
  });

  it("retrouve un véhicule par son identifiant", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const [premier] = await listerVehicules();
    expect(await trouverVehicule(premier.id)).toEqual(premier);
  });

  it("renvoie undefined pour un identifiant inconnu ou malformé", async () => {
    vi.stubEnv("DATABASE_URL", "");
    expect(await trouverVehicule("n-existe-pas")).toBeUndefined();
    expect(await trouverVehicule("' OR 1=1 --")).toBeUndefined();
  });
});
