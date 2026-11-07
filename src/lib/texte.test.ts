import { describe, expect, it } from "vitest";
import { echapperRechercheLike, normaliserEspaces, slugify } from "./texte";

describe("slugify", () => {
  it("retire accents, majuscules et caractères spéciaux", () => {
    expect(slugify("Mercedes-Benz")).toBe("mercedes-benz");
    expect(slugify("Citroën C3 Aircross")).toBe("citroen-c3-aircross");
    expect(slugify("  Série 3 !! ")).toBe("serie-3");
  });
});

describe("echapperRechercheLike", () => {
  it("neutralise les jokers SQL pour qu'un « % » ne renvoie pas tout", () => {
    expect(echapperRechercheLike("100%")).toBe("100\\%");
    expect(echapperRechercheLike("a_b")).toBe("a\\_b");
    expect(echapperRechercheLike("a\\b")).toBe("a\\\\b");
  });

  it("ne modifie pas un texte ordinaire", () => {
    expect(echapperRechercheLike("Golf GTI")).toBe("Golf GTI");
  });
});

describe("normaliserEspaces", () => {
  it("supprime les espaces superflus", () => {
    expect(normaliserEspaces("  Série   3  ")).toBe("Série 3");
  });
});
