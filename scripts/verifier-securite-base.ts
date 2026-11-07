/**
 * Test de sécurité de la base en conditions RÉELLES.
 *
 * Usage :  CONFIRMER_TEST_SECURITE=oui npm run db:verifier-securite
 * À relancer après chaque migration qui touche aux tables ou aux politiques de sécurité.
 *
 * Ce que fait le script :
 *  1. vérifie que TOUTES les tables du schéma public ont la sécurité par lignes (RLS) ;
 *  2. joue des attaques depuis l'extérieur, comme un visiteur anonyme muni de la clé publique
 *     (le site utilise exactement cette clé dans le navigateur) : lire des données privées,
 *     créer un faux rôle, un faux véhicule, un faux message, modifier un rôle ;
 *  3. contrôle dans la base qu'AUCUNE de ces écritures n'a réussi.
 *
 * Précautions :
 *  - exige CONFIRMER_TEST_SECURITE=oui (le script tente des écritures, même si elles doivent échouer) ;
 *  - refuse de tourner en production ;
 *  - si une attaque réussissait malgré tout, il SUPPRIME les lignes qu'il a créées et échoue ;
 *  - n'affiche jamais de clé ni de mot de passe.
 */
import { loadEnvConfig } from "@next/env";
import postgres from "postgres";

loadEnvConfig(process.cwd());

type Attaque = {
  libelle: string;
  methode: "GET" | "POST" | "PATCH";
  chemin: string;
  corps?: object;
  /** « lecture » : on s'attend à une liste vide ; « ecriture » : on s'attend à un refus. */
  type: "lecture" | "ecriture";
};

/** Marqueur reconnaissable dans les données d'attaque, pour pouvoir les retrouver et les nettoyer. */
const MARQUEUR = "pirate-test-securite";

const ATTAQUES: Attaque[] = [
  {
    libelle: "Lire les véhicules (aucun publié)",
    methode: "GET",
    chemin: "/rest/v1/vehicles?select=id",
    type: "lecture",
  },
  {
    libelle: "Lire les rôles",
    methode: "GET",
    chemin: "/rest/v1/roles?select=code",
    type: "lecture",
  },
  {
    libelle: "Lire les permissions",
    methode: "GET",
    chemin: "/rest/v1/permissions?select=code",
    type: "lecture",
  },
  {
    libelle: "Lire les liaisons utilisateur-rôle",
    methode: "GET",
    chemin: "/rest/v1/user_roles?select=user_id",
    type: "lecture",
  },
  {
    libelle: "Lire les profils",
    methode: "GET",
    chemin: "/rest/v1/profiles?select=id",
    type: "lecture",
  },
  {
    libelle: "Lire les favoris",
    methode: "GET",
    chemin: "/rest/v1/favorites?select=user_id",
    type: "lecture",
  },
  {
    libelle: "Lire les messages de contact",
    methode: "GET",
    chemin: "/rest/v1/contact_messages?select=id",
    type: "lecture",
  },
  {
    libelle: "Créer un faux rôle",
    methode: "POST",
    chemin: "/rest/v1/roles",
    corps: { code: MARQUEUR, label: "x" },
    type: "ecriture",
  },
  {
    libelle: "Créer une fausse permission",
    methode: "POST",
    chemin: "/rest/v1/permissions",
    corps: { code: MARQUEUR, label: "x" },
    type: "ecriture",
  },
  {
    libelle: "S'attribuer un rôle",
    methode: "POST",
    chemin: "/rest/v1/user_roles",
    corps: {
      user_id: "00000000-0000-0000-0000-000000000000",
      role_id: "00000000-0000-0000-0000-000000000000",
    },
    type: "ecriture",
  },
  {
    libelle: "Créer une fausse marque",
    methode: "POST",
    chemin: "/rest/v1/brands",
    corps: { name: MARQUEUR, slug: MARQUEUR },
    type: "ecriture",
  },
  {
    libelle: "Créer un faux véhicule",
    methode: "POST",
    chemin: "/rest/v1/vehicles",
    corps: { reference: MARQUEUR },
    type: "ecriture",
  },
  {
    libelle: "Écrire un message de contact en direct",
    methode: "POST",
    chemin: "/rest/v1/contact_messages",
    corps: {
      nom: MARQUEUR,
      email: "x@x.fr",
      sujet: "autre",
      message: MARQUEUR,
      consentement: true,
    },
    type: "ecriture",
  },
  {
    libelle: "Modifier le libellé d'un rôle",
    methode: "PATCH",
    chemin: "/rest/v1/roles?code=eq.client",
    corps: { label: MARQUEUR },
    type: "ecriture",
  },
];

let echecs = 0;
function resultat(ok: boolean, texte: string) {
  if (!ok) echecs++;
  console.log(`  ${ok ? "✓" : "✗"} ${texte}`);
}

async function main() {
  if (process.env.CONFIRMER_TEST_SECURITE !== "oui") {
    throw new Error(
      "Ajoutez CONFIRMER_TEST_SECURITE=oui pour confirmer le lancement du test.",
    );
  }
  if (process.env.NODE_ENV === "production")
    throw new Error("Refus : jamais en production.");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const clePublique = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const adresseBase =
    process.env.DATABASE_DIRECT_URL?.trim() ?? process.env.DATABASE_URL?.trim();
  if (!url || !clePublique || !adresseBase)
    throw new Error("Variables manquantes : lancez d'abord npm run env:verifier.");

  const sql = postgres(adresseBase, { max: 1, prepare: false, onnotice: () => {} });
  try {
    // 1. Toutes les tables du schéma public doivent avoir la RLS.
    console.log("\n1. Sécurité par lignes (RLS) sur les tables du schéma public");
    const tables =
      await sql`select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1`;
    for (const t of tables)
      resultat(t.rowsecurity, `${t.tablename}${t.rowsecurity ? "" : "  ← SANS RLS !"}`);

    // 2. Attaques extérieures avec la clé PUBLIQUE (celle qui est visible dans le navigateur).
    console.log("\n2. Attaques depuis l'extérieur (visiteur anonyme, clé publique)");
    const entetes: Record<string, string> = {
      apikey: clePublique,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    };
    // Les anciennes clés (jetons JWT) se passent aussi en « Authorization » ; les nouvelles « sb_… » non.
    if (!clePublique.startsWith("sb_")) entetes.Authorization = `Bearer ${clePublique}`;

    for (const a of ATTAQUES) {
      const reponse = await fetch(url + a.chemin, {
        method: a.methode,
        headers: entetes,
        body: a.corps ? JSON.stringify(a.corps) : undefined,
        signal: AbortSignal.timeout(15_000),
      });
      const texte = await reponse.text();
      if (a.type === "lecture") {
        // Une lecture bloquée par la RLS renvoie une liste vide (200) ou un refus (401/403).
        const videOuRefuse =
          reponse.status === 401 ||
          reponse.status === 403 ||
          (reponse.status === 200 && texte.trim() === "[]");
        resultat(
          videOuRefuse,
          `${a.libelle} → ${videOuRefuse ? "rien d'exposé" : `DONNÉES EXPOSÉES (HTTP ${reponse.status})`}`,
        );
      } else if (a.methode === "PATCH") {
        // Une modification bloquée par la RLS « réussit » avec 0 ligne touchée : on le contrôle à l'étape 3.
        resultat(
          reponse.status < 500,
          `${a.libelle} → HTTP ${reponse.status} (effet contrôlé à l'étape 3)`,
        );
      } else {
        const refuse = reponse.status === 401 || reponse.status === 403;
        resultat(
          refuse,
          `${a.libelle} → ${refuse ? "refusé" : `ÉCRITURE ACCEPTÉE (HTTP ${reponse.status})`}`,
        );
      }
    }

    // 3. Contrôle direct dans la base : aucune trace d'attaque.
    console.log("\n3. Contrôle dans la base : aucune écriture n'a réussi");
    const traces = {
      roles:
        await sql`select count(*)::int n from public.roles where code = ${MARQUEUR} or label = ${MARQUEUR}`,
      permissions:
        await sql`select count(*)::int n from public.permissions where code = ${MARQUEUR}`,
      marques:
        await sql`select count(*)::int n from public.brands where name = ${MARQUEUR}`,
      vehicules:
        await sql`select count(*)::int n from public.vehicles where reference = ${MARQUEUR}`,
      messages:
        await sql`select count(*)::int n from public.contact_messages where nom = ${MARQUEUR}`,
    };
    let intrusion = false;
    for (const [nom, lignes] of Object.entries(traces)) {
      const n = lignes[0].n as number;
      if (n > 0) intrusion = true;
      resultat(n === 0, `${nom} : ${n} trace(s) d'attaque`);
    }
    if (intrusion) {
      // Nettoyage : on supprime ce que le test a créé malgré la protection, et on échoue.
      await sql`update public.roles set label = 'Client' where code = 'client' and label = ${MARQUEUR}`;
      await sql`delete from public.roles where code = ${MARQUEUR}`;
      await sql`delete from public.permissions where code = ${MARQUEUR}`;
      await sql`delete from public.brands where name = ${MARQUEUR}`;
      await sql`delete from public.vehicles where reference = ${MARQUEUR}`;
      await sql`delete from public.contact_messages where nom = ${MARQUEUR}`;
      console.log("  ⚠ Les lignes créées par le test ont été supprimées.");
    }
  } finally {
    await sql.end({ timeout: 2 });
  }

  console.log(
    `\nRésultat : ${echecs === 0 ? "✓ la sécurité tient" : `✗ ${echecs} problème(s) de sécurité`}.\n`,
  );
  process.exit(echecs === 0 ? 0 : 1);
}

main().catch((erreur) => {
  console.error("✗", erreur instanceof Error ? erreur.message : erreur);
  process.exit(1);
});
