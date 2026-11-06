/**
 * Remplit la base de DÉVELOPPEMENT avec les 12 véhicules de démonstration.
 *
 * Usage :  CONFIRMER_SEED=oui npm run db:seed-demo
 *
 * Précautions :
 *  - refuse de tourner sans la variable CONFIRMER_SEED=oui (évite un lancement par erreur) ;
 *  - refuse de tourner si NODE_ENV vaut « production » ;
 *  - peut être relancé sans danger : les véhicules déjà présents (même référence) sont ignorés.
 *
 * Ne JAMAIS l'utiliser sur la base de production : ces véhicules n'existent pas.
 * Les migrations (npm run db:migrate) doivent avoir été appliquées avant.
 */
import { loadEnvConfig } from "@next/env";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";
import { vehiculesPrototype } from "../src/modules/vehicles/donnees-prototype";

loadEnvConfig(process.cwd());

/** Transforme « Mercedes-Benz » en « mercedes-benz » : utilisable dans une adresse. */
function slugify(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  if (process.env.CONFIRMER_SEED !== "oui") {
    throw new Error(
      "Ajoutez CONFIRMER_SEED=oui pour confirmer le remplissage de la base.",
    );
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refus : ce script ne doit jamais tourner en production.");
  }
  // Connexion directe (pas le pooler) : plus adaptée à un script ponctuel.
  const url = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url)
    throw new Error("DATABASE_DIRECT_URL (ou DATABASE_URL) n'est pas renseignée.");

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });
  const {
    marques,
    modeles,
    equipements,
    vehicules,
    vehiculesEquipements,
    vehiculesDocuments,
  } = schema;

  let crees = 0;
  try {
    for (const v of vehiculesPrototype) {
      // 1. Marque et modèle : créés s'ils n'existent pas encore.
      await db
        .insert(marques)
        .values({ nom: v.marque, slug: slugify(v.marque) })
        .onConflictDoNothing();
      const [marque] = await db.select().from(marques).where(eq(marques.nom, v.marque));

      await db
        .insert(modeles)
        .values({ marqueId: marque.id, nom: v.modele, slug: slugify(v.modele) })
        .onConflictDoNothing();
      const [modele] = await db
        .select()
        .from(modeles)
        .where(and(eq(modeles.marqueId, marque.id), eq(modeles.slug, slugify(v.modele))));

      // 2. Véhicule : ignoré s'il existe déjà (la référence est unique).
      const insere = await db
        .insert(vehicules)
        .values({
          reference: v.reference,
          marqueId: marque.id,
          modeleId: modele.id,
          version: v.version,
          annee: v.annee,
          kilometrage: v.kilometrage,
          prixCentimes: v.prixCentimes,
          description: v.description,
          statut: v.statut,
          publieLe: new Date(v.publieLe),
          motorisation: v.motorisation,
          carburant: v.carburant,
          puissanceCh: v.puissanceCh,
          boite: v.boite,
          transmission: v.transmission,
          carrosserie: v.carrosserie,
          portes: v.portes,
          places: v.places,
          couleur: v.couleur,
          etatGeneral: v.etatGeneral,
          historique: v.historique,
          entretien: v.entretien,
          controleTechnique: v.controleTechnique,
        })
        .onConflictDoNothing()
        .returning({ id: vehicules.id });

      if (insere.length === 0) continue; // déjà présent
      crees++;
      const vehiculeId = insere[0].id;

      // 3. Équipements.
      for (const nom of v.equipements) {
        await db.insert(equipements).values({ nom }).onConflictDoNothing();
        const [equipement] = await db
          .select()
          .from(equipements)
          .where(eq(equipements.nom, nom));
        await db
          .insert(vehiculesEquipements)
          .values({ vehiculeId, equipementId: equipement.id })
          .onConflictDoNothing();
      }

      // 4. Documents : libellés seulement (pas de vrai fichier). Publics pour apparaître sur la fiche.
      for (const libelle of v.documents) {
        await db.insert(vehiculesDocuments).values({
          vehiculeId,
          libelle,
          cleStockage: `demo/${v.reference}/${slugify(libelle)}.pdf`,
          visibilite: "public",
        });
      }
    }
    console.log(
      `✓ ${crees} véhicule(s) ajouté(s), ${vehiculesPrototype.length - crees} déjà présent(s).`,
    );
  } finally {
    await client.end();
  }
}

main().catch((erreur) => {
  console.error("✗", erreur instanceof Error ? erreur.message : erreur);
  process.exit(1);
});
