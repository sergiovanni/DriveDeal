import { describe, expect, it } from "vitest";
import {
  ROLE_ADMINISTRATEUR,
  ROLE_CLIENT,
  lireRolesUtilisateur,
  possedeRole,
} from "./roles";

describe("possedeRole", () => {
  it("reconnaît un rôle présent", () => {
    expect(possedeRole([ROLE_CLIENT, ROLE_ADMINISTRATEUR], ROLE_ADMINISTRATEUR)).toBe(
      true,
    );
  });

  it("refuse un rôle absent : un client n'est pas administrateur", () => {
    expect(possedeRole([ROLE_CLIENT], ROLE_ADMINISTRATEUR)).toBe(false);
    expect(possedeRole([], ROLE_ADMINISTRATEUR)).toBe(false);
  });

  it("est sensible à la casse (pas de rôle « Administrateur » deviné)", () => {
    expect(possedeRole(["Administrateur"], ROLE_ADMINISTRATEUR)).toBe(false);
  });
});

describe("lireRolesUtilisateur", () => {
  it("n'accorde AUCUN rôle quand la base n'est pas configurée (échec fermé)", async () => {
    const ancienne = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      expect(await lireRolesUtilisateur("00000000-0000-0000-0000-000000000000")).toEqual(
        [],
      );
    } finally {
      if (ancienne !== undefined) process.env.DATABASE_URL = ancienne;
    }
  });
});
