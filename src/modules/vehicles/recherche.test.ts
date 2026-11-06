import { describe, expect, it } from "vitest";
import { vehiculesPrototype } from "./donnees-prototype";
import {
  TAILLE_PAGE,
  filtrerVehicules,
  filtresActifs,
  lireFiltres,
  urlCatalogue,
  rechercher,
  trierVehicules,
  vehiculesSimilaires,
} from "./recherche";

describe("lireFiltres", () => {
  it("ignore les valeurs invalides", () => {
    const f = lireFiltres({ prixMax: "abc", page: "-3", tri: "n-importe-quoi" });
    expect(f.prixMax).toBeUndefined();
    expect(f.page).toBe(1);
    expect(f.tri).toBe("recents");
  });

  it("lit les filtres valides", () => {
    const f = lireFiltres({ marque: "BMW", prixMax: "30000", page: "2" });
    expect(f.marque).toBe("BMW");
    expect(f.prixMax).toBe(30000);
    expect(f.page).toBe(2);
  });
});

describe("filtrerVehicules", () => {
  it("filtre par prix maximum en euros", () => {
    const f = lireFiltres({ prixMax: "15000" });
    const res = filtrerVehicules(vehiculesPrototype, f);
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((v) => v.prixCentimes <= 1_500_000)).toBe(true);
  });

  it("recherche sans tenir compte des accents ni de la casse", () => {
    const res = filtrerVehicules(vehiculesPrototype, lireFiltres({ q: "citroen" }));
    expect(res.map((v) => v.marque)).toEqual(["Citroën"]);
  });

  it("exclut les véhicules non publiés", () => {
    const brouillon = { ...vehiculesPrototype[0], statut: "brouillon" as const };
    expect(filtrerVehicules([brouillon], lireFiltres({}))).toHaveLength(0);
  });
});

describe("trierVehicules", () => {
  it("trie par prix croissant", () => {
    const prix = trierVehicules(vehiculesPrototype, "prix-asc").map(
      (v) => v.prixCentimes,
    );
    expect(prix).toEqual([...prix].sort((a, b) => a - b));
  });
});

describe("rechercher", () => {
  it("pagine les résultats", () => {
    const p1 = rechercher(vehiculesPrototype, lireFiltres({}));
    expect(p1.vehicules).toHaveLength(TAILLE_PAGE);
    expect(p1.pages).toBe(Math.ceil(vehiculesPrototype.length / TAILLE_PAGE));
  });

  it("ramène la page demandée dans les limites", () => {
    const res = rechercher(vehiculesPrototype, lireFiltres({ page: "99" }));
    expect(res.page).toBe(res.pages);
  });
});

describe("pastilles et URL", () => {
  it("liste les filtres actifs", () => {
    const f = lireFiltres({ marque: "BMW", prixMax: "30000" });
    expect(filtresActifs(f).map((a) => a.cle)).toEqual(["marque", "prixMax"]);
  });

  it("construit une URL sans valeurs vides", () => {
    expect(urlCatalogue({ marque: "BMW", q: undefined, tri: "" })).toBe(
      "/vehicules?marque=BMW",
    );
    expect(urlCatalogue({})).toBe("/vehicules");
  });

  it("applique le nombre de résultats par page", () => {
    const res = rechercher(vehiculesPrototype, lireFiltres({ parPage: "12" }));
    expect(res.vehicules).toHaveLength(12);
    expect(lireFiltres({ parPage: "7" }).parPage).toBe(TAILLE_PAGE);
  });
});

describe("vehiculesSimilaires", () => {
  it("n'inclut pas le véhicule courant", () => {
    const courant = vehiculesPrototype[0];
    const sim = vehiculesSimilaires(vehiculesPrototype, courant);
    expect(sim.some((v) => v.id === courant.id)).toBe(false);
    expect(sim.length).toBeLessThanOrEqual(3);
  });
});
