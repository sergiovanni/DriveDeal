/**
 * Vérifie le fichier .env.local : format des variables, puis VRAIES connexions
 * (base de données, API Supabase, clé secrète).
 *
 * Usage :  npm run env:verifier
 *
 * Sécurité : ce script n'affiche JAMAIS une clé ni un mot de passe. Il n'écrit rien dans la
 * base (lecture seule) et peut être relancé autant de fois que nécessaire.
 * Vous pouvez donc copier son résultat dans une conversation sans risque.
 */
import { loadEnvConfig } from "@next/env";
import postgres from "postgres";
import {
  analyserVariablesEnv,
  type EtatVariable,
  type ResultatVariable,
} from "../src/lib/diagnostic-env";

loadEnvConfig(process.cwd());

const ICONES: Record<EtatVariable, string> = { ok: "✓", avertissement: "⚠", erreur: "✗" };
let nbErreurs = 0;
let nbAvertissements = 0;

function afficher(etat: EtatVariable, titre: string, message: string) {
  if (etat === "erreur") nbErreurs++;
  if (etat === "avertissement") nbAvertissements++;
  console.log(`  ${ICONES[etat]} ${titre.padEnd(32)} ${message}`);
}

/** Retire d'un message d'erreur tout ce qui pourrait ressembler à un secret. */
function nettoyer(message: string, adresse: string | undefined): string {
  let m = message;
  if (adresse) {
    try {
      const u = new URL(adresse);
      for (const secret of [u.password, decodeURIComponent(u.password), adresse]) {
        if (secret) m = m.split(secret).join("***");
      }
    } catch {
      m = m.split(adresse).join("***");
    }
  }
  return m;
}

/** Explique en français les erreurs de connexion les plus fréquentes. */
function conseil(message: string): string {
  if (/password authentication failed|authentication failed/i.test(message))
    return "Mot de passe refusé : vérifiez le mot de passe de la base (et son encodage).";
  if (/ENOTFOUND|EAI_AGAIN/i.test(message))
    return "Serveur introuvable : adresse incorrecte, ou réseau sans IPv6 (essayez le « Session pooler »).";
  if (/ETIMEDOUT|timeout|ECONNREFUSED|CONNECT_TIMEOUT/i.test(message))
    return "Le serveur ne répond pas : projet en pause, mauvais port, ou réseau sans IPv6 (essayez le « Session pooler »).";
  if (/Tenant or user not found/i.test(message))
    return "Utilisateur ou région incorrects dans l'adresse du pooler : recopiez-la depuis le bouton « Connect ».";
  return "Voir le message ci-dessus.";
}

async function testerBase(nom: string, adresse: string | undefined) {
  if (!adresse) return;
  const client = postgres(adresse, {
    max: 1,
    connect_timeout: 10,
    prepare: false,
    onnotice: () => {},
  });
  try {
    const [ligne] =
      await client`select current_database() as base, to_regclass('public.vehicles') as vehicules`;
    const migrations = ligne.vehicules
      ? "tables présentes"
      : "tables ABSENTES (lancez npm run db:migrate)";
    afficher(
      "ok",
      `${nom} (connexion)`,
      `Connecté à la base « ${ligne.base} » — ${migrations}.`,
    );
  } catch (erreur) {
    const brut = erreur instanceof Error ? erreur.message : String(erreur);
    const propre = nettoyer(brut, adresse);
    afficher("erreur", `${nom} (connexion)`, `Échec : ${propre.slice(0, 90)}`);
    console.log(`      → ${conseil(propre)}`);
  } finally {
    await client.end({ timeout: 2 }).catch(() => {});
  }
}

async function appeler(
  url: string,
  enTetes: Record<string, string>,
): Promise<number | string> {
  try {
    const reponse = await fetch(url, {
      headers: enTetes,
      signal: AbortSignal.timeout(10_000),
    });
    return reponse.status;
  } catch (erreur) {
    return erreur instanceof Error ? erreur.message : String(erreur);
  }
}

async function testerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const clePublique = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const cleSecrete = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url) return;

  if (clePublique) {
    // Point de santé du service d'authentification : répond 200 si l'adresse et la clé sont bonnes.
    const statut = await appeler(`${url}/auth/v1/health`, { apikey: clePublique });
    if (statut === 200)
      afficher(
        "ok",
        "API Supabase (clé publique)",
        "Le projet répond, la clé publique est acceptée.",
      );
    else if (statut === 401 || statut === 403)
      afficher("erreur", "API Supabase (clé publique)", "Clé publique refusée.");
    else
      afficher(
        "erreur",
        "API Supabase (clé publique)",
        `Projet injoignable (${String(statut).slice(0, 60)}).`,
      );
  }

  if (cleSecrete) {
    // Liste (lecture seule) d'un seul utilisateur : n'accepte que la clé secrète.
    // Les nouvelles clés « sb_… » se passent seulement dans l'en-tête apikey.
    const enTetes: Record<string, string> = { apikey: cleSecrete };
    if (!cleSecrete.startsWith("sb_")) enTetes.Authorization = `Bearer ${cleSecrete}`;
    const statut = await appeler(`${url}/auth/v1/admin/users?per_page=1`, enTetes);
    if (statut === 200)
      afficher("ok", "API Supabase (clé secrète)", "Clé secrète acceptée.");
    else if (statut === 401 || statut === 403)
      afficher("erreur", "API Supabase (clé secrète)", "Clé secrète refusée.");
    else
      afficher(
        "avertissement",
        "API Supabase (clé secrète)",
        `Test non concluant (${String(statut).slice(0, 60)}).`,
      );
  }
}

async function main() {
  console.log("\nVérification de .env.local (aucune valeur secrète n'est affichée)\n");

  console.log("1. Format des variables");
  const resultats: ResultatVariable[] = analyserVariablesEnv(process.env);
  for (const r of resultats) afficher(r.etat, r.nom, r.message);

  console.log("\n2. Connexions réelles");
  if (nbErreurs > 0) {
    console.log("  (ignorées : corrigez d'abord les erreurs de format ci-dessus)");
  } else {
    await testerBase("DATABASE_URL", process.env.DATABASE_URL?.trim());
    await testerBase("DATABASE_DIRECT_URL", process.env.DATABASE_DIRECT_URL?.trim());
    await testerSupabase();
  }

  console.log(
    `\nRésultat : ${nbErreurs === 0 ? "✓ configuration utilisable" : `✗ ${nbErreurs} erreur(s) à corriger`}` +
      (nbAvertissements ? `, ${nbAvertissements} avertissement(s)` : "") +
      ".\n",
  );
  process.exit(nbErreurs === 0 ? 0 : 1);
}

main().catch((erreur) => {
  console.error(
    "✗ Erreur inattendue :",
    erreur instanceof Error
      ? nettoyer(erreur.message, process.env.DATABASE_URL)
      : "inconnue",
  );
  process.exit(1);
});
