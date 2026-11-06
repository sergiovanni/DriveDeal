import { describe, expect, it } from "vitest";
import { validerMessage } from "./validation";

function formulaire(champs: Record<string, string>): FormData {
  const f = new FormData();
  for (const [cle, valeur] of Object.entries(champs)) f.set(cle, valeur);
  return f;
}

const valide = {
  nom: "Awa Diallo",
  email: "awa@exemple.fr",
  sujet: "vehicule",
  message: "Bonjour, ce véhicule est-il toujours disponible ?",
  consentement: "on",
};

describe("validerMessage", () => {
  it("accepte un message valide", () => {
    const res = validerMessage(formulaire(valide));
    expect(res.ok).toBe(true);
  });

  it("n'enregistre pas le consentement dans les données", () => {
    const res = validerMessage(formulaire(valide));
    expect(res.ok && "consentement" in res.donnees).toBe(false);
  });

  it("refuse une adresse e-mail invalide", () => {
    const res = validerMessage(formulaire({ ...valide, email: "pas-un-email" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.erreurs.email).toBeDefined();
  });

  it("exige le consentement", () => {
    const { consentement: _c, ...sansConsentement } = valide;
    void _c;
    const res = validerMessage(formulaire(sansConsentement));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.erreurs.consentement).toBeDefined();
  });

  it("refuse un message trop court et un sujet inconnu", () => {
    const res = validerMessage(
      formulaire({ ...valide, message: "Salut", sujet: "piratage" }),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.erreurs.message).toBeDefined();
      expect(res.erreurs.sujet).toBeDefined();
    }
  });

  it("refuse un téléphone invalide mais accepte un champ vide", () => {
    expect(validerMessage(formulaire({ ...valide, telephone: "abc" })).ok).toBe(false);
    expect(validerMessage(formulaire({ ...valide, telephone: "" })).ok).toBe(true);
  });
});
