/**
 * Test d'intégration du back-office des véhicules, sur la base de DÉVELOPPEMENT.
 *
 * Usage :  CONFIRMER_TEST_ADMIN=oui npm run db:verifier-admin
 *
 * Rejoue tout le cycle de vie d'un véhicule : création, modification, publication refusée sans
 * photo puis acceptée, passage manuel à « vendu » refusé, archivage, suppression refusée hors
 * brouillon puis acceptée, identifiants invalides, journal d'audit.
 *
 * Précautions : exige CONFIRMER_TEST_ADMIN=oui ; refuse de tourner en production ; ne touche qu'à
 * ses propres données (une marque « TestMarqueIntegration » et un véhicule de test) qu'il supprime
 * à la fin ; ne supprime jamais les traces d'audit des autres véhicules.
 */
import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";

loadEnvConfig(process.cwd());

const ACTEUR = null as unknown as string; // aucun compte réel n'existe encore : l'audit accepte NULL
let ok = 0,
  ko = 0;
const verifier = (nom: string, cond: boolean, detail = "") => {
  if (cond) ok++;
  else ko++;
  console.log(`  ${cond ? "✓" : "✗"} ${nom}${detail ? " — " + detail : ""}`);
};
function form(o: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
}
const base = {
  marque: "TestMarqueIntegration",
  modele: "Modèle Test",
  version: "Version Test",
  annee: "2022",
  kilometrage: "10000",
  prixCentimes: "15 500,50",
  motorisation: "1.0",
  carburant: "Essence",
  puissanceCh: "100",
  boite: "Manuelle",
  transmission: "Traction",
  carrosserie: "Citadine",
  portes: "5",
  places: "5",
  couleur: "Rouge",
  equipements: "GPS\nCaméra\ngps",
};

async function main() {
  if (process.env.CONFIRMER_TEST_ADMIN !== "oui")
    throw new Error(
      "Ajoutez CONFIRMER_TEST_ADMIN=oui pour confirmer le lancement du test.",
    );
  if (process.env.NODE_ENV === "production")
    throw new Error("Refus : jamais en production.");
  const { db } = await import("@/lib/db/client");
  const schema = await import("@/lib/db/schema");
  const { journalAudit, vehicules, vehiculesPhotos, marques, modeles } = schema;
  const { validerFormulaire } = await import("@/lib/formulaire");
  const { schemaVehicule } = await import("@/modules/vehicles/admin/validation");
  const admin = await import("@/modules/vehicles/admin/depot-admin");
  const pub = await import("@/modules/vehicles/depot-base");
  let id = "";
  let idTest = ""; // conservé après suppression pour nettoyer SES traces d'audit uniquement
  try {
    const v = validerFormulaire(schemaVehicule, form(base));
    if (!v.ok) throw new Error("formulaire invalide");

    console.log("\n1. Création");
    const cree = await admin.creerVehicule(v.donnees, ACTEUR);
    id = cree.id;
    idTest = cree.id;
    verifier(
      "référence attribuée automatiquement",
      /^DD-\d{4}$/.test(cree.reference),
      cree.reference,
    );
    let l = await admin.lireVehiculePourAdmin(id);
    verifier("statut initial = brouillon", l?.statut === "brouillon");
    verifier("prix en centimes", l?.prixCentimes === 1_550_050, String(l?.prixCentimes));
    verifier(
      "équipements sans doublon (GPS, Caméra)",
      l?.equipements.length === 2,
      l?.equipements.join(","),
    );

    console.log("\n2. Un brouillon n'est PAS visible du public");
    verifier(
      "absent du catalogue public",
      !(await pub.chargerVehiculesPublies()).some((x) => x.id === id),
    );

    console.log("\n3. Liste, recherche, compteurs");
    const liste = await admin.listerPourAdmin({
      q: "TestMarqueIntegration",
      page: 1,
      parPage: 10,
    });
    verifier("recherche par marque", liste.total === 1 && liste.lignes[0].id === id);
    const jokers = await admin.listerPourAdmin({ q: "%", page: 1, parPage: 10 });
    verifier(
      "« % » ne renvoie pas tout le stock",
      jokers.total === 0,
      `total=${jokers.total}`,
    );
    const c = await admin.compterParStatut();
    verifier("compteurs cohérents", c.brouillon >= 1 && c.total >= 1);

    console.log("\n4. Modification");
    const maj = validerFormulaire(
      schemaVehicule,
      form({ ...base, prixCentimes: "16000", couleur: "Bleu" }),
    );
    if (!maj.ok) throw new Error("maj invalide");
    const r1 = await admin.modifierVehicule(id, maj.donnees, ACTEUR);
    verifier("modification acceptée", r1.ok);
    l = await admin.lireVehiculePourAdmin(id);
    verifier(
      "nouveau prix et couleur enregistrés",
      l?.prixCentimes === 1_600_000 && l?.couleur === "Bleu",
    );

    console.log("\n5. Publication");
    const p1 = await admin.changerStatutVehicule(id, "publie", ACTEUR);
    verifier("publication REFUSÉE sans photo", !p1.ok, p1.ok ? "" : p1.erreur);
    await db()
      .insert(vehiculesPhotos)
      .values({
        vehiculeId: id,
        cleStockage: `test/${id}/photo.webp`,
        position: 0,
        texteAlternatif: "test",
      });
    const p2 = await admin.changerStatutVehicule(id, "publie", ACTEUR);
    verifier("publication acceptée avec une photo", p2.ok);
    verifier(
      "visible au catalogue public",
      (await pub.chargerVehiculesPublies()).some((x) => x.id === id),
    );
    const p3 = await admin.changerStatutVehicule(id, "vendu", ACTEUR);
    verifier("passage manuel à « vendu » REFUSÉ", !p3.ok);

    console.log("\n6. Archivage et suppression");
    const a1 = await admin.changerStatutVehicule(id, "archive", ACTEUR);
    verifier("archivage accepté", a1.ok);
    verifier(
      "retiré du catalogue public",
      !(await pub.chargerVehiculesPublies()).some((x) => x.id === id),
    );
    const s1 = await admin.supprimerBrouillon(id, ACTEUR);
    verifier("suppression REFUSÉE (pas un brouillon)", !s1.ok, s1.ok ? "" : s1.erreur);
    const b1 = await admin.changerStatutVehicule(id, "brouillon", ACTEUR);
    verifier("retour en brouillon accepté", b1.ok);
    const s2 = await admin.supprimerBrouillon(id, ACTEUR);
    verifier("suppression d'un brouillon acceptée", s2.ok && s2.clesPhotos.length === 1);
    verifier("véhicule supprimé", (await admin.lireVehiculePourAdmin(id)) === undefined);
    id = "";

    console.log("\n7. Identifiants invalides (injection)");
    verifier(
      "lecture d'un faux identifiant",
      (await admin.lireVehiculePourAdmin("' OR 1=1 --")) === undefined,
    );
    const f = await admin.changerStatutVehicule("n-importe-quoi", "publie", ACTEUR);
    verifier("changement de statut avec faux identifiant", !f.ok);

    console.log("\n8. Journal d'audit");
    const traces = await db()
      .select()
      .from(journalAudit)
      .where(eq(journalAudit.idEntite, idTest));
    const actions = traces.map((t) => t.action);
    for (const a of [
      "vehicule.cree",
      "vehicule.modifie",
      "vehicule.statut",
      "vehicule.supprime",
    ])
      verifier(`trace « ${a} »`, actions.includes(a));
  } catch (e) {
    ko++;
    console.log(
      "  ✗ ERREUR INATTENDUE :",
      e instanceof Error ? e.message.slice(0, 400) : e,
    );
  } finally {
    if (id) await db().delete(vehicules).where(eq(vehicules.id, id));
    if (idTest) await db().delete(journalAudit).where(eq(journalAudit.idEntite, idTest));
    const [m] = await db()
      .select()
      .from(marques)
      .where(eq(marques.nom, "TestMarqueIntegration"));
    if (m) {
      await db().delete(modeles).where(eq(modeles.marqueId, m.id));
      await db().delete(marques).where(eq(marques.id, m.id));
    }
    console.log(
      `\nRésultat : ${ok} réussi(s), ${ko} échec(s). Données de test supprimées.`,
    );
    process.exit(ko === 0 ? 0 : 1);
  }
}
main().catch((e) => {
  console.error("✗", e instanceof Error ? e.message : e);
  process.exit(1);
});
