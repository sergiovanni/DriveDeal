import { describe, expect, it } from "vitest";
import { validerFormulaire } from "@/lib/formulaire";
import {
  LONGUEUR_MIN_MOT_DE_PASSE,
  schemaConnexion,
  schemaDemandeReinitialisation,
  schemaInscription,
  schemaNouveauMotDePasse,
  schemaProfil,
} from "./validation";

function formulaire(champs: Record<string, string>): FormData {
  const f = new FormData();
  for (const [cle, valeur] of Object.entries(champs)) f.set(cle, valeur);
  return f;
}

const MOT_DE_PASSE = "un-mot-de-passe-solide-42";
const inscriptionValide = {
  email: "Awa.Diallo@Exemple.FR ",
  motDePasse: MOT_DE_PASSE,
  confirmation: MOT_DE_PASSE,
  consentement: "on",
};

describe("schemaInscription", () => {
  it("accepte une inscription valide et normalise l'adresse e-mail", () => {
    const r = validerFormulaire(schemaInscription, formulaire(inscriptionValide));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.donnees.email).toBe("awa.diallo@exemple.fr");
  });

  it("refuse un mot de passe trop court", () => {
    const court = "a".repeat(LONGUEUR_MIN_MOT_DE_PASSE - 1);
    const r = validerFormulaire(
      schemaInscription,
      formulaire({ ...inscriptionValide, motDePasse: court, confirmation: court }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreurs.motDePasse).toMatch(/au moins/);
  });

  it("refuse un mot de passe trop long (limite de l'algorithme de hachage)", () => {
    const long = "a".repeat(73);
    const r = validerFormulaire(
      schemaInscription,
      formulaire({ ...inscriptionValide, motDePasse: long, confirmation: long }),
    );
    expect(r.ok).toBe(false);
  });

  it("refuse deux mots de passe différents", () => {
    const r = validerFormulaire(
      schemaInscription,
      formulaire({ ...inscriptionValide, confirmation: "autre-chose-completement" }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreurs.confirmation).toMatch(/différents/);
  });

  it("exige le consentement et une adresse e-mail valide", () => {
    const { consentement: _c, ...sans } = inscriptionValide;
    void _c;
    const r1 = validerFormulaire(schemaInscription, formulaire(sans));
    expect(r1.ok).toBe(false);
    if (!r1.ok) expect(r1.erreurs.consentement).toBeDefined();

    const r2 = validerFormulaire(
      schemaInscription,
      formulaire({ ...inscriptionValide, email: "pas-un-email" }),
    );
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.erreurs.email).toBeDefined();
  });

  it("ne renvoie jamais le mot de passe dans les erreurs", () => {
    const r = validerFormulaire(
      schemaInscription,
      formulaire({ ...inscriptionValide, motDePasse: "court", confirmation: "court" }),
    );
    expect(JSON.stringify(r)).not.toContain('court"');
  });
});

describe("schemaConnexion", () => {
  it("accepte n'importe quel mot de passe non vide (les règles de création ne s'appliquent pas)", () => {
    const r = validerFormulaire(
      schemaConnexion,
      formulaire({ email: "a@b.fr", motDePasse: "x" }),
    );
    expect(r.ok).toBe(true);
  });

  it("refuse les champs vides", () => {
    const r = validerFormulaire(
      schemaConnexion,
      formulaire({ email: "", motDePasse: "" }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erreurs.email).toBeDefined();
      expect(r.erreurs.motDePasse).toBeDefined();
    }
  });
});

describe("schemaDemandeReinitialisation", () => {
  it("n'exige que l'adresse e-mail", () => {
    expect(
      validerFormulaire(schemaDemandeReinitialisation, formulaire({ email: "a@b.fr" }))
        .ok,
    ).toBe(true);
    expect(
      validerFormulaire(schemaDemandeReinitialisation, formulaire({ email: "nope" })).ok,
    ).toBe(false);
  });
});

describe("schemaNouveauMotDePasse", () => {
  it("applique les mêmes règles que l'inscription", () => {
    expect(
      validerFormulaire(
        schemaNouveauMotDePasse,
        formulaire({ motDePasse: MOT_DE_PASSE, confirmation: MOT_DE_PASSE }),
      ).ok,
    ).toBe(true);
    expect(
      validerFormulaire(
        schemaNouveauMotDePasse,
        formulaire({ motDePasse: "court", confirmation: "court" }),
      ).ok,
    ).toBe(false);
  });
});

describe("schemaProfil", () => {
  it("accepte un profil partiel ou vide", () => {
    expect(validerFormulaire(schemaProfil, formulaire({})).ok).toBe(true);
    expect(
      validerFormulaire(
        schemaProfil,
        formulaire({ prenom: "Awa", telephone: "+33 6 12 34 56 78" }),
      ).ok,
    ).toBe(true);
  });

  it("refuse un téléphone invalide et des noms trop longs", () => {
    expect(validerFormulaire(schemaProfil, formulaire({ telephone: "abc" })).ok).toBe(
      false,
    );
    expect(validerFormulaire(schemaProfil, formulaire({ nom: "x".repeat(81) })).ok).toBe(
      false,
    );
  });

  it("ignore les champs inattendus (pas d'élévation de privilèges par le formulaire)", () => {
    const r = validerFormulaire(
      schemaProfil,
      formulaire({ prenom: "Awa", role: "administrateur" }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(Object.keys(r.donnees)).not.toContain("role");
  });
});
