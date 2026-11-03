import { describe, expect, it } from "vitest";
import { vehiculesPrototype } from "@/modules/vehicles/donnees-prototype";
import {
  MAX_COMPARAISON,
  ajouter,
  lireIdsUrl,
  nettoyerSelection,
  peutAjouter,
  retirer,
  urlComparateur,
} from "./regles";
import { NON_RENSEIGNE, construireSections, seulementDifferences } from "./sections";

const el = (id: string) => ({ id, titre: id, prixCentimes: 1000, teinte: "#112233" });

describe("limite de trois véhicules", () => {
  it("accepte jusqu'à trois véhicules", () => {
    let s = [] as ReturnType<typeof el>[];
    for (const id of ["a", "b", "c"]) {
      const r = ajouter(s, el(id));
      expect(r.resultat).toBe("ajoute");
      s = r.selection;
    }
    expect(s).toHaveLength(MAX_COMPARAISON);
  });

  it("refuse un quatrième sans remplacer personne", () => {
    const s = [el("a"), el("b"), el("c")];
    const r = ajouter(s, el("d"));
    expect(r.resultat).toBe("limite_atteinte");
    expect(r.selection.map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  it("refuse un doublon", () => {
    const r = ajouter([el("a")], el("a"));
    expect(r.resultat).toBe("deja_present");
    expect(r.selection).toHaveLength(1);
  });

  it("autorise de nouveau l'ajout après un retrait", () => {
    const s = retirer([el("a"), el("b"), el("c")], "b");
    expect(peutAjouter(s.map((e) => e.id), "d")).toBe(true);
  });

  it("ne modifie pas la liste d'origine", () => {
    const s = [el("a")];
    ajouter(s, el("b"));
    expect(s).toHaveLength(1);
  });
});

describe("lireIdsUrl", () => {
  it("coupe à trois et retire doublons et valeurs invalides", () => {
    expect(lireIdsUrl("a,a,b,<script>,c,d,e")).toEqual(["a", "b", "c"]);
  });
  it("accepte un tableau et l'absence de valeur", () => {
    expect(lireIdsUrl(["a", "b"])).toEqual(["a", "b"]);
    expect(lireIdsUrl(undefined)).toEqual([]);
  });
  it("refuse les identifiants trop longs ou avec des caractères spéciaux", () => {
    expect(lireIdsUrl(`${"x".repeat(65)},../etc,a b`)).toEqual([]);
  });
});

describe("urlComparateur", () => {
  it("construit l'adresse avec au plus trois identifiants", () => {
    expect(urlComparateur(["a", "b", "c", "d"])).toBe("/comparateur?ids=a%2Cb%2Cc");
    expect(urlComparateur([])).toBe("/comparateur");
    expect(urlComparateur(["a", "b"], true)).toContain("diff=1");
  });
});

describe("nettoyerSelection (stockage modifiable par l'utilisateur)", () => {
  it("ignore tout ce qui est mal formé", () => {
    expect(nettoyerSelection("n'importe quoi")).toEqual([]);
    expect(nettoyerSelection([null, 3, { id: 1 }, { id: "ok" }])).toEqual([]);
  });
  it("neutralise une adresse de photo dangereuse et coupe à trois", () => {
    const base = { titre: "t", prixCentimes: 1, teinte: "#fff" };
    const r = nettoyerSelection([
      { ...base, id: "a", photoUrl: "javascript:alert(1)" },
      { ...base, id: "b" },
      { ...base, id: "c" },
      { ...base, id: "d" },
    ]);
    expect(r).toHaveLength(3);
    expect(r[0].photoUrl).toBeUndefined();
  });
});

describe("construireSections", () => {
  const [v1, v2] = vehiculesPrototype;

  it("produit une cellule par véhicule dans chaque ligne", () => {
    for (const s of construireSections([v1, v2]))
      for (const l of s.lignes) expect(l.cellules).toHaveLength(2);
  });

  it("signale le meilleur prix et le plus faible kilométrage seulement s'ils diffèrent", () => {
    const prix = construireSections([v1, v2])
      .flatMap((s) => s.lignes)
      .find((l) => l.libelle === "Prix de vente")!;
    const moinsCher = v1.prixCentimes < v2.prixCentimes ? 0 : 1;
    expect(prix.cellules[moinsCher].meilleur).toBe(true);
    expect(prix.cellules[1 - moinsCher].meilleur).toBeUndefined();

    const seul = construireSections([v1])
      .flatMap((s) => s.lignes)
      .find((l) => l.libelle === "Prix de vente")!;
    expect(seul.cellules[0].meilleur).toBeUndefined();

    const memePrix = construireSections([v1, { ...v1, id: "autre" }])
      .flatMap((s) => s.lignes)
      .find((l) => l.libelle === "Prix de vente")!;
    expect(memePrix.cellules.some((c) => c.meilleur)).toBe(false);
  });

  it("affiche « Non renseigné » pour une donnée vide, sans rien inventer", () => {
    const lignes = construireSections([{ ...v1, couleur: "  ", equipements: [] }]).flatMap(
      (s) => s.lignes,
    );
    expect(lignes.find((l) => l.libelle === "Couleur")!.cellules[0].texte).toBe(NON_RENSEIGNE);
    expect(lignes.find((l) => l.libelle === "Équipements")!.cellules[0].texte).toBe(
      NON_RENSEIGNE,
    );
  });

  it("« seulement les différences » retire les lignes identiques", () => {
    const sections = seulementDifferences(construireSections([v1, { ...v1, id: "x" }]));
    // Deux fois le même véhicule : aucune différence.
    expect(sections).toEqual([]);
    const diff = seulementDifferences(construireSections([v1, v2]));
    expect(diff.flatMap((s) => s.lignes).every((l) => l.different)).toBe(true);
  });
});
