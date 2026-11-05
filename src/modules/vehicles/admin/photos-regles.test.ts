import { describe, expect, it } from "vitest";
import {
  TAILLE_MAX_PHOTO_OCTETS,
  cleAppartientAuVehicule,
  construireCleStockage,
  erreurFichierPhoto,
  extensionPourType,
} from "./photos-regles";

const VEHICULE = "5c1c1d0e-7a4f-4c7e-9e53-0a6f0d6f1b11";
const AUTRE = "9a9a9a9a-1111-4222-8333-444444444444";
const ALEA = "0b0b0b0b-2222-4333-8444-555555555555";

describe("erreurFichierPhoto", () => {
  it("accepte JPEG, PNG et WebP de taille raisonnable", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(erreurFichierPhoto({ type, taille: 1_000_000 })).toBeNull();
    }
  });

  it("refuse les autres formats (SVG, GIF, PDF, exécutables)", () => {
    for (const type of [
      "image/svg+xml",
      "image/gif",
      "application/pdf",
      "text/html",
      "application/x-msdownload",
      "",
    ]) {
      expect(erreurFichierPhoto({ type, taille: 1000 })).toMatch(/Format non accepté/);
    }
  });

  it("refuse un fichier vide ou trop lourd", () => {
    expect(erreurFichierPhoto({ type: "image/png", taille: 0 })).toMatch(/vide/);
    expect(erreurFichierPhoto({ type: "image/png", taille: Number.NaN })).toMatch(/vide/);
    expect(
      erreurFichierPhoto({ type: "image/png", taille: TAILLE_MAX_PHOTO_OCTETS + 1 }),
    ).toMatch(/trop lourde/);
    expect(
      erreurFichierPhoto({ type: "image/png", taille: TAILLE_MAX_PHOTO_OCTETS }),
    ).toBeNull();
  });
});

describe("extensionPourType", () => {
  it("associe l'extension de stockage au type", () => {
    expect(extensionPourType("image/jpeg")).toBe("jpg");
    expect(extensionPourType("image/webp")).toBe("webp");
    expect(extensionPourType("image/gif")).toBeUndefined();
  });
});

describe("cleAppartientAuVehicule", () => {
  it("accepte une clé générée par construireCleStockage", () => {
    const cle = construireCleStockage(VEHICULE, "webp", ALEA);
    expect(cle).toBe(`vehicules/${VEHICULE}/${ALEA}.webp`);
    expect(cleAppartientAuVehicule(cle, VEHICULE)).toBe(true);
  });

  it("refuse la photo d'un AUTRE véhicule", () => {
    expect(cleAppartientAuVehicule(`vehicules/${AUTRE}/${ALEA}.jpg`, VEHICULE)).toBe(
      false,
    );
  });

  it("refuse les chemins piégés (remontée de dossier, sous-dossier, extension exotique)", () => {
    const pieges = [
      `vehicules/${VEHICULE}/../${AUTRE}/${ALEA}.jpg`,
      `vehicules/${VEHICULE}/${ALEA}.jpg/../../x.jpg`,
      `vehicules/${VEHICULE}/sous/${ALEA}.jpg`,
      `vehicules/${VEHICULE}/${ALEA}.svg`,
      `vehicules/${VEHICULE}/${ALEA}.jpg.exe`,
      `vehicules/${VEHICULE}/nom-libre.jpg`,
      `/vehicules/${VEHICULE}/${ALEA}.jpg`,
      `documents/${VEHICULE}/${ALEA}.jpg`,
      "",
    ];
    for (const p of pieges) expect(cleAppartientAuVehicule(p, VEHICULE), p).toBe(false);
  });

  it("refuse un identifiant de véhicule mal formé", () => {
    expect(cleAppartientAuVehicule(`vehicules/x/${ALEA}.jpg`, "x")).toBe(false);
    expect(
      cleAppartientAuVehicule(`vehicules/${VEHICULE}/${ALEA}.jpg`, "' OR 1=1 --"),
    ).toBe(false);
  });
});
