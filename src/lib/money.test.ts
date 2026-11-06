import { describe, expect, it } from "vitest";
import { formaterKilometrage, formaterPrix } from "./money";

describe("formaterPrix", () => {
  it("formate des centimes en euros", () => {
    expect(formaterPrix(2_590_000)).toBe("25 900 €");
  });
});

describe("formaterKilometrage", () => {
  it("formate un kilométrage", () => {
    expect(formaterKilometrage(42_000)).toBe("42 000 km");
  });
});
