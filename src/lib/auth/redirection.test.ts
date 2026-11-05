import { describe, expect, it } from "vitest";
import { DESTINATION_PAR_DEFAUT, adresseRedirectionSure } from "./redirection";

describe("adresseRedirectionSure", () => {
  it("accepte les chemins internes", () => {
    expect(adresseRedirectionSure("/compte")).toBe("/compte");
    expect(adresseRedirectionSure("/vehicules/dd-0004?x=1#documents")).toBe(
      "/vehicules/dd-0004?x=1#documents",
    );
  });

  it("refuse les adresses externes (redirection ouverte)", () => {
    for (const piege of [
      "https://site-pirate.com",
      "http://site-pirate.com/compte",
      "//site-pirate.com",
      "///site-pirate.com",
      "/\\site-pirate.com",
      "javascript:alert(1)",
      "site-pirate.com",
    ]) {
      expect(adresseRedirectionSure(piege)).toBe(DESTINATION_PAR_DEFAUT);
    }
  });

  it("refuse les caractères de contrôle (détournement d'en-têtes)", () => {
    expect(adresseRedirectionSure("/compte\r\nSet-Cookie: a=b")).toBe(
      DESTINATION_PAR_DEFAUT,
    );
    expect(adresseRedirectionSure("/compte\tx")).toBe(DESTINATION_PAR_DEFAUT);
  });

  it("évite la boucle vers les pages de connexion", () => {
    expect(adresseRedirectionSure("/connexion")).toBe(DESTINATION_PAR_DEFAUT);
    expect(adresseRedirectionSure("/inscription?x=1")).toBe(DESTINATION_PAR_DEFAUT);
  });

  it("gère les valeurs absentes ou multiples", () => {
    expect(adresseRedirectionSure(undefined)).toBe(DESTINATION_PAR_DEFAUT);
    expect(adresseRedirectionSure(null)).toBe(DESTINATION_PAR_DEFAUT);
    expect(adresseRedirectionSure(["/admin", "https://x.com"])).toBe("/admin");
    expect(adresseRedirectionSure("")).toBe(DESTINATION_PAR_DEFAUT);
  });

  it("accepte une destination de repli personnalisée", () => {
    expect(adresseRedirectionSure("https://x.com", "/")).toBe("/");
  });
});
