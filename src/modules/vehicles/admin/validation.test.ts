import { describe, expect, it } from "vitest";
import { validerFormulaire } from "@/lib/formulaire";
import { parserEquipements, parserPrixEnCentimes, schemaVehicule } from "./validation";

function formulaire(champs: Record<string, string>): FormData {
  const f = new FormData();
  for (const [cle, valeur] of Object.entries(champs)) f.set(cle, valeur);
  return f;
}

const valide = {
  marque: "  Peugeot ",
  modele: "308",
  version: "GT 1.2 PureTech 130",
  annee: "2021",
  kilometrage: "48200",
  prix: "",
  prixCentimes: "17 900",
  motorisation: "1.2 PureTech",
  carburant: "Essence",
  puissanceCh: "130",
  boite: "Automatique",
  transmission: "Traction",
  carrosserie: "Berline",
  portes: "5",
  places: "5",
  couleur: "Gris",
  equipements: "Climatisation\nCaméra de recul\nclimatisation\n\n",
};

describe("parserPrixEnCentimes", () => {
  it("convertit les saisies courantes en centimes", () => {
    expect(parserPrixEnCentimes("17900")).toBe(1_790_000);
    expect(parserPrixEnCentimes("17 900")).toBe(1_790_000);
    expect(parserPrixEnCentimes("17 900,50 €")).toBe(1_790_050);
    expect(parserPrixEnCentimes("19.99")).toBe(1999); // piège d'arrondi des nombres décimaux
  });

  it("refuse les saisies invalides", () => {
    for (const mauvais of ["", "abc", "-5", "12,345", "1e5", "12..5", "NaN"]) {
      expect(Number.isNaN(parserPrixEnCentimes(mauvais))).toBe(true);
    }
  });
});

describe("parserEquipements", () => {
  it("ignore les lignes vides et les doublons (sans tenir compte de la casse)", () => {
    expect(parserEquipements("A\n\n a \nB\r\nb")).toEqual(["A", "B"]);
    expect(parserEquipements(undefined)).toEqual([]);
  });
});

describe("schemaVehicule", () => {
  it("accepte un véhicule complet et normalise les valeurs", () => {
    const r = validerFormulaire(schemaVehicule, formulaire(valide));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.donnees.marque).toBe("Peugeot");
      expect(r.donnees.prixCentimes).toBe(1_790_000);
      expect(r.donnees.annee).toBe(2021);
      expect(r.donnees.equipements).toEqual(["Climatisation", "Caméra de recul"]);
      expect(r.donnees.description).toBe("");
    }
  });

  it("signale tous les champs obligatoires manquants, champ par champ", () => {
    const r = validerFormulaire(schemaVehicule, formulaire({}));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      for (const champ of [
        "marque",
        "modele",
        "version",
        "annee",
        "kilometrage",
        "prixCentimes",
        "carburant",
        "boite",
        "transmission",
        "carrosserie",
        "couleur",
      ]) {
        expect(r.erreurs[champ], champ).toBeDefined();
      }
    }
  });

  it("refuse une valeur hors liste (carburant inventé)", () => {
    const r = validerFormulaire(
      schemaVehicule,
      formulaire({ ...valide, carburant: "Eau" }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreurs.carburant).toBeDefined();
  });

  it("refuse une année ou un prix absurdes", () => {
    expect(
      validerFormulaire(schemaVehicule, formulaire({ ...valide, annee: "1800" })).ok,
    ).toBe(false);
    expect(
      validerFormulaire(schemaVehicule, formulaire({ ...valide, annee: "3000" })).ok,
    ).toBe(false);
    expect(
      validerFormulaire(schemaVehicule, formulaire({ ...valide, prixCentimes: "-10" }))
        .ok,
    ).toBe(false);
    expect(
      validerFormulaire(
        schemaVehicule,
        formulaire({ ...valide, prixCentimes: "999999999" }),
      ).ok,
    ).toBe(false);
  });

  it("IGNORE les champs sensibles glissés dans le formulaire (affectation de masse)", () => {
    const r = validerFormulaire(
      schemaVehicule,
      formulaire({
        ...valide,
        statut: "publie",
        reference: "PIRATE",
        id: "x",
        vendu: "oui",
      }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      const cles = Object.keys(r.donnees);
      for (const interdit of ["statut", "reference", "id", "vendu"]) {
        expect(cles).not.toContain(interdit);
      }
    }
  });

  it("limite la longueur des textes", () => {
    const r = validerFormulaire(
      schemaVehicule,
      formulaire({ ...valide, etatGeneral: "x".repeat(1001) }),
    );
    expect(r.ok).toBe(false);
  });
});
