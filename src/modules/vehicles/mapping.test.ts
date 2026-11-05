import { describe, expect, it } from "vitest";
import { teinteDepuisCouleur, versVehicule, type LigneVehicule } from "./mapping";

const ligne: LigneVehicule = {
  id: "5c1c1d0e-7a4f-4c7e-9e53-0a6f0d6f1b11",
  reference: "DD-0042",
  marque: "Peugeot",
  modele: "308",
  version: "GT",
  annee: 2021,
  kilometrage: 48200,
  prixCentimes: 1_790_000,
  description: "Compacte.",
  statut: "publie",
  publieLe: new Date("2026-10-28T10:00:00Z"),
  creeLe: new Date("2026-10-01T08:00:00Z"),
  motorisation: "1.2 PureTech",
  carburant: "Essence",
  puissanceCh: 130,
  boite: "Automatique",
  transmission: "Traction",
  carrosserie: "Berline",
  portes: 5,
  places: 5,
  couleur: "Gris",
  etatGeneral: "Très bon état.",
  historique: "",
  entretien: "",
  controleTechnique: "",
};

describe("teinteDepuisCouleur", () => {
  it("ignore la casse et les accents", () => {
    expect(teinteDepuisCouleur("  GRIS ")).toBe(teinteDepuisCouleur("gris"));
  });

  it("renvoie une teinte par défaut pour une couleur inconnue", () => {
    expect(teinteDepuisCouleur("Violet métallisé")).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("versVehicule", () => {
  it("recopie les champs et date la publication au format AAAA-MM-JJ", () => {
    const v = versVehicule(ligne, ["Caméra de recul"], ["Contrôle technique"]);
    expect(v.reference).toBe("DD-0042");
    expect(v.publieLe).toBe("2026-10-28");
    expect(v.equipements).toEqual(["Caméra de recul"]);
    expect(v.documents).toEqual(["Contrôle technique"]);
    expect(v.prixCentimes).toBe(1_790_000);
  });

  it("utilise la date de création si le véhicule n'a pas de date de publication", () => {
    const v = versVehicule({ ...ligne, publieLe: null });
    expect(v.publieLe).toBe("2026-10-01");
  });

  it("recopie les photos dans l'ordre fourni", () => {
    const photos = [
      { url: "https://exemple.supabase.co/a.webp", alt: "A" },
      { url: "https://exemple.supabase.co/b.webp", alt: "B" },
    ];
    const v = versVehicule(ligne, [], [], photos);
    expect(v.photos.map((p) => p.alt)).toEqual(["A", "B"]);
  });

  it("accepte des listes vides par défaut", () => {
    const v = versVehicule(ligne);
    expect(v.equipements).toEqual([]);
    expect(v.documents).toEqual([]);
    expect(v.photos).toEqual([]);
  });
});
