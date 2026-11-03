import { describe, expect, it } from "vitest";
import { validerDemande } from "./validation";

function formulaire(valeurs: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(valeurs)) f.set(k, v);
  return f;
}

const valide = {
  vehiculeId: "abc-123",
  prenom: "Awa",
  nom: "Diallo",
  email: "awa@example.com",
  codePostal: "75011",
  consentement: "on",
};

describe("validerDemande", () => {
  it("accepte une demande complète, téléphone facultatif", () => {
    const r = validerDemande(formulaire(valide));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.donnees.telephone).toBeUndefined();
  });

  it("accepte un téléphone bien formé", () => {
    const r = validerDemande(formulaire({ ...valide, telephone: "+33 7 46 29 50 85" }));
    expect(r.ok).toBe(true);
  });

  it("refuse les champs manquants ou invalides, champ par champ", () => {
    const r = validerDemande(
      formulaire({ ...valide, prenom: "", email: "pas-un-mail", codePostal: "7501" }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.erreurs).sort()).toEqual(["codePostal", "email", "prenom"]);
    }
  });

  it("refuse un code postal avec des lettres ou trop long", () => {
    for (const cp of ["75O11", "750110", "ABCDE", "75 011"]) {
      expect(validerDemande(formulaire({ ...valide, codePostal: cp })).ok).toBe(false);
    }
  });

  it("refuse un téléphone avec des caractères suspects", () => {
    const r = validerDemande(formulaire({ ...valide, telephone: "<script>" }));
    expect(r.ok).toBe(false);
  });

  it("exige le consentement", () => {
    const { consentement: _c, ...sans } = valide;
    void _c;
    const r = validerDemande(formulaire(sans));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreurs.consentement).toBeDefined();
  });

  it("ignore les champs inconnus (pas de statut imposé par le visiteur)", () => {
    const r = validerDemande(formulaire({ ...valide, statut: "traitee", id: "x" }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(Object.keys(r.donnees)).not.toContain("statut");
  });
});
