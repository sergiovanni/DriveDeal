import "server-only";

import { desc, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { demandesVehicule } from "@/lib/db/schema";

/**
 * Lecture des demandes d'intérêt pour le BACK-OFFICE.
 *
 * ⚠️ SÉCURITÉ : ces données sont personnelles (nom, e-mail, téléphone, code postal) et la
 * connexion directe CONTOURNE la sécurité par lignes. Cette fonction ne vérifie pas qui
 * appelle : la page doit appeler `exigerAdministrateur()` AVANT de l'utiliser.
 */

export type DemandeAdmin = {
  id: string;
  creeLe: Date;
  vehiculeReference: string;
  vehiculeId: string | null;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  codePostal: string;
  statut: string;
};

/** Les demandes les plus récentes d'abord, avec le total (la liste est limitée à `limite`). */
export async function listerDemandes(limite = 100): Promise<{
  demandes: DemandeAdmin[];
  total: number;
}> {
  const [demandes, [{ n }]] = await Promise.all([
    db()
      .select({
        id: demandesVehicule.id,
        creeLe: demandesVehicule.creeLe,
        vehiculeReference: demandesVehicule.vehiculeReference,
        vehiculeId: demandesVehicule.vehiculeId,
        prenom: demandesVehicule.prenom,
        nom: demandesVehicule.nom,
        email: demandesVehicule.email,
        telephone: demandesVehicule.telephone,
        codePostal: demandesVehicule.codePostal,
        statut: demandesVehicule.statut,
      })
      .from(demandesVehicule)
      .orderBy(desc(demandesVehicule.creeLe))
      .limit(limite),
    db()
      .select({ n: sql<number>`count(*)::int` })
      .from(demandesVehicule),
  ]);
  return { demandes, total: n };
}
