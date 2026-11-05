/**
 * Test d'intégration des PHOTOS des véhicules sur le stockage RÉEL de Supabase (développement).
 *
 * Usage :  CONFIRMER_TEST_PHOTOS=oui npm run db:verifier-photos
 *
 * Vérifie le flux complet (autorisation d'envoi, envoi direct, enregistrement, lecture publique,
 * ordre, suppression) PUIS joue des attaques : type de fichier interdit, fichier trop lourd, envoi
 * sans autorisation, suppression et lecture par un visiteur anonyme, lecture du bucket privé.
 *
 * Précautions : exige CONFIRMER_TEST_PHOTOS=oui ; refuse de tourner en production ; ne touche qu'à
 * ses propres données (un véhicule de test et ses fichiers), supprimées à la fin.
 */
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

loadEnvConfig(process.cwd());

let ok = 0;
let ko = 0;
function verifier(nom: string, condition: boolean, detail = "") {
  if (condition) ok++;
  else ko++;
  console.log(`  ${condition ? "✓" : "✗"} ${nom}${detail ? " — " + detail : ""}`);
}

/** Plus petit PNG valide possible (1 pixel). */
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

async function main() {
  if (process.env.CONFIRMER_TEST_PHOTOS !== "oui")
    throw new Error(
      "Ajoutez CONFIRMER_TEST_PHOTOS=oui pour confirmer le lancement du test.",
    );
  if (process.env.NODE_ENV === "production")
    throw new Error("Refus : jamais en production.");

  const { db } = await import("@/lib/db/client");
  const { journalAudit, vehicules, marques, modeles } = await import("@/lib/db/schema");
  const { validerFormulaire } = await import("@/lib/formulaire");
  const { schemaVehicule } = await import("@/modules/vehicles/admin/validation");
  const admin = await import("@/modules/vehicles/admin/depot-admin");
  const photos = await import("@/modules/vehicles/admin/depot-photos");
  const regles = await import("@/modules/vehicles/admin/photos-regles");
  const { creerClientSupabaseService, urlPublique } =
    await import("@/lib/supabase/service");

  const service = creerClientSupabaseService();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const clePublique = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  // Client « navigateur » : clé PUBLIQUE uniquement, exactement comme un visiteur.
  const visiteur = createClient(url, clePublique, { auth: { persistSession: false } });

  const ACTEUR = null as unknown as string;
  const cles: string[] = [];
  let id = "";

  const formulaire = new FormData();
  for (const [k, v] of Object.entries({
    marque: "TestPhotosIntegration",
    modele: "Modèle",
    version: "V",
    annee: "2022",
    kilometrage: "1",
    prixCentimes: "1000",
    motorisation: "1.0",
    carburant: "Essence",
    puissanceCh: "100",
    boite: "Manuelle",
    transmission: "Traction",
    carrosserie: "Citadine",
    portes: "5",
    places: "5",
    couleur: "Rouge",
  }))
    formulaire.set(k, v);

  /** Prépare puis envoie une photo comme le fait l'interface (autorisation serveur, envoi direct). */
  async function envoyer(contenu: Buffer | Uint8Array, type: string, cle?: string) {
    const chemin =
      cle ??
      regles.construireCleStockage(
        id,
        regles.extensionPourType(type) ?? "png",
        randomUUID(),
      );
    const { data, error } = await service.storage
      .from(regles.BUCKET_PHOTOS)
      .createSignedUploadUrl(chemin);
    if (error || !data) throw new Error("autorisation impossible : " + error?.message);
    cles.push(chemin);
    const r = await visiteur.storage
      .from(regles.BUCKET_PHOTOS)
      .uploadToSignedUrl(chemin, data.token, contenu, { contentType: type });
    return { chemin, erreur: r.error };
  }

  try {
    const v = validerFormulaire(schemaVehicule, formulaire);
    if (!v.ok) throw new Error("formulaire de test invalide");
    id = (await admin.creerVehicule(v.donnees, ACTEUR)).id;

    console.log("\n1. Envoi d'une photo valide");
    verifier(
      "ajout possible sur un brouillon",
      (await photos.verifierAjoutPossible(id)).ok,
    );
    const a = await envoyer(PNG_1PX, "image/png");
    verifier("envoi direct avec autorisation signée", !a.erreur, a.erreur?.message ?? "");
    const { data: existe } = await service.storage
      .from(regles.BUCKET_PHOTOS)
      .exists(a.chemin);
    verifier("le fichier existe dans le stockage", existe === true);
    verifier(
      "le chemin appartient bien au véhicule",
      regles.cleAppartientAuVehicule(a.chemin, id),
    );
    const ajout = await photos.ajouterPhoto(id, a.chemin, "Photo de test", ACTEUR);
    verifier("enregistrement en base", ajout.ok);

    console.log("\n2. Lecture publique (sans connexion)");
    const lecture = await fetch(urlPublique(regles.BUCKET_PHOTOS, a.chemin));
    verifier(
      "l'adresse publique renvoie l'image",
      lecture.status === 200 &&
        (lecture.headers.get("content-type") ?? "").startsWith("image/"),
      `HTTP ${lecture.status}`,
    );

    console.log("\n3. Ordre des photos");
    const b = await envoyer(PNG_1PX, "image/png");
    await photos.ajouterPhoto(id, b.chemin, "Seconde", ACTEUR);
    let fiche = await admin.lireVehiculePourAdmin(id);
    verifier(
      "deux photos, positions 0 et 1",
      fiche?.photos.map((p) => p.position).join(",") === "0,1",
    );
    const premiere = fiche!.photos[0];
    await photos.deplacerPhoto(fiche!.photos[1].id, "haut", ACTEUR);
    fiche = await admin.lireVehiculePourAdmin(id);
    verifier(
      "la seconde photo devient la principale",
      fiche?.photos[0].id !== premiere.id && fiche?.photos[1].id === premiere.id,
    );

    console.log("\n4. Attaques : ce que le stockage doit refuser");
    const html = await envoyer(Buffer.from("<script>alert(1)</script>"), "text/html");
    verifier(
      "fichier HTML refusé (type interdit)",
      !!html.erreur,
      html.erreur?.message?.slice(0, 60) ?? "ACCEPTÉ !",
    );
    const svg = await envoyer(
      Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>1</script></svg>"),
      "image/svg+xml",
    );
    verifier(
      "fichier SVG refusé (peut contenir du script)",
      !!svg.erreur,
      svg.erreur?.message?.slice(0, 60) ?? "ACCEPTÉ !",
    );
    const gros = await envoyer(
      Buffer.alloc(regles.TAILLE_MAX_PHOTO_OCTETS + 1024, 1),
      "image/png",
    );
    verifier(
      "photo de plus de 5 Mo refusée",
      !!gros.erreur,
      gros.erreur?.message?.slice(0, 60) ?? "ACCEPTÉE !",
    );
    const sansToken = await visiteur.storage
      .from(regles.BUCKET_PHOTOS)
      .upload(`vehicules/${id}/${randomUUID()}.png`, PNG_1PX, {
        contentType: "image/png",
      });
    verifier(
      "envoi SANS autorisation refusé (visiteur anonyme)",
      !!sansToken.error,
      sansToken.error?.message?.slice(0, 60) ?? "ACCEPTÉ !",
    );
    const suppr = await visiteur.storage.from(regles.BUCKET_PHOTOS).remove([a.chemin]);
    const encore = await fetch(urlPublique(regles.BUCKET_PHOTOS, a.chemin));
    verifier(
      "suppression par un visiteur sans effet",
      encore.status === 200,
      `HTTP ${encore.status}, ${suppr.error ? "refusé" : "aucune ligne supprimée"}`,
    );
    const prive = await fetch(
      `${url}/storage/v1/object/public/documents-prives/test.pdf`,
    );
    verifier(
      "bucket des documents privés non lisible publiquement",
      prive.status !== 200,
      `HTTP ${prive.status}`,
    );
    const liste = await visiteur.storage.from("documents-prives").list();
    verifier(
      "liste du bucket privé vide pour un visiteur",
      !liste.error ? (liste.data ?? []).length === 0 : true,
    );
    const hors = regles.cleAppartientAuVehicule(
      `vehicules/${randomUUID()}/${randomUUID()}.png`,
      id,
    );
    verifier("chemin d'un autre véhicule refusé à l'enregistrement", hors === false);

    console.log("\n5. Suppression d'une photo");
    const dernier = (await admin.lireVehiculePourAdmin(id))!.photos;
    const s = await photos.supprimerPhoto(dernier[0].id, ACTEUR);
    verifier("ligne supprimée", s.ok);
    if (s.ok) {
      await service.storage.from(regles.BUCKET_PHOTOS).remove([s.cle]);
      const apres = await fetch(urlPublique(regles.BUCKET_PHOTOS, s.cle));
      verifier(
        "fichier supprimé du stockage",
        apres.status !== 200,
        `HTTP ${apres.status}`,
      );
    }

    console.log("\n6. Règles de publication");
    await admin.changerStatutVehicule(id, "publie", ACTEUR);
    const derniereLigne = (await admin.lireVehiculePourAdmin(id))!.photos;
    const refus = await photos.supprimerPhoto(derniereLigne[0].id, ACTEUR);
    verifier(
      "la dernière photo d'un véhicule publié ne peut pas être retirée",
      !refus.ok,
      refus.ok ? "" : refus.erreur.slice(0, 70),
    );
    await admin.changerStatutVehicule(id, "brouillon", ACTEUR);
  } catch (e) {
    ko++;
    console.log(
      "  ✗ ERREUR INATTENDUE :",
      e instanceof Error ? e.message.slice(0, 400) : e,
    );
  } finally {
    // Nettoyage : fichiers de test, véhicule, traces d'audit, marque de test.
    if (cles.length > 0) await service.storage.from(regles.BUCKET_PHOTOS).remove(cles);
    if (id) {
      await db().delete(journalAudit).where(eq(journalAudit.idEntite, id));
      await db().delete(vehicules).where(eq(vehicules.id, id));
    }
    const [m] = await db()
      .select()
      .from(marques)
      .where(eq(marques.nom, "TestPhotosIntegration"));
    if (m) {
      await db().delete(modeles).where(eq(modeles.marqueId, m.id));
      await db().delete(marques).where(eq(marques.id, m.id));
    }
    console.log(
      `\nRésultat : ${ok} réussi(s), ${ko} échec(s). Données et fichiers de test supprimés.`,
    );
    process.exit(ko === 0 ? 0 : 1);
  }
}

main().catch((e) => {
  console.error("✗", e instanceof Error ? e.message : e);
  process.exit(1);
});
