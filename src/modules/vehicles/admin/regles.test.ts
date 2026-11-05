import { describe, expect, it } from "vitest";
import { STATUTS_VEHICULE } from "@/lib/db/schema/constantes";
import {
  LIBELLES_ACTION,
  LIBELLES_STATUT,
  estVerrouille,
  peutEtreSupprime,
  problemesPourPublier,
  transitionAutorisee,
  transitionsPossibles,
} from "./regles";

describe("transitionAutorisee", () => {
  it("permet de publier, dépublier et archiver", () => {
    expect(transitionAutorisee("brouillon", "publie")).toBe(true);
    expect(transitionAutorisee("publie", "brouillon")).toBe(true);
    expect(transitionAutorisee("publie", "archive")).toBe(true);
    expect(transitionAutorisee("archive", "brouillon")).toBe(true);
  });

  it("interdit les passages non prévus", () => {
    expect(transitionAutorisee("archive", "publie")).toBe(false);
    expect(transitionAutorisee("brouillon", "vendu")).toBe(false);
    expect(transitionAutorisee("publie", "publie")).toBe(false);
  });

  it("n'autorise AUCUNE sortie depuis réservé ou vendu (gérés par les commandes)", () => {
    for (const verrouille of ["reserve", "vendu"] as const) {
      for (const cible of STATUTS_VEHICULE) {
        expect(transitionAutorisee(verrouille, cible)).toBe(false);
      }
      expect(estVerrouille(verrouille)).toBe(true);
    }
  });

  it("ne permet jamais à l'administration de poser « réservé » ou « vendu »", () => {
    for (const depart of STATUTS_VEHICULE) {
      expect(transitionAutorisee(depart, "reserve")).toBe(false);
      expect(transitionAutorisee(depart, "vendu")).toBe(false);
    }
  });

  it("liste les transitions possibles", () => {
    expect(transitionsPossibles("brouillon")).toEqual(["publie", "archive"]);
    expect(transitionsPossibles("vendu")).toEqual([]);
  });
});

describe("suppression", () => {
  it("n'autorise que la suppression d'un brouillon (RG-V04)", () => {
    expect(peutEtreSupprime("brouillon")).toBe(true);
    for (const autre of STATUTS_VEHICULE.filter((s) => s !== "brouillon")) {
      expect(peutEtreSupprime(autre)).toBe(false);
    }
  });
});

describe("problemesPourPublier", () => {
  it("accepte un véhicule avec un prix et une photo", () => {
    expect(problemesPourPublier({ prixCentimes: 1_500_000, nombrePhotos: 1 })).toEqual(
      [],
    );
  });

  it("exige au moins une photo", () => {
    const p = problemesPourPublier({ prixCentimes: 1_500_000, nombrePhotos: 0 });
    expect(p.map((x) => x.champ)).toEqual(["photos"]);
  });

  it("exige un prix supérieur à zéro", () => {
    const p = problemesPourPublier({ prixCentimes: 0, nombrePhotos: 3 });
    expect(p.map((x) => x.champ)).toEqual(["prix"]);
  });
});

describe("libellés", () => {
  it("couvrent tous les statuts", () => {
    for (const s of STATUTS_VEHICULE) {
      expect(LIBELLES_STATUT[s]).toBeTruthy();
      expect(LIBELLES_ACTION[s]).toBeTruthy();
    }
  });
});
