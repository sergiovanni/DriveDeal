/**
 * Diagnostic du fichier .env.local : repère les erreurs de configuration les plus courantes
 * SANS jamais afficher une valeur secrète.
 *
 * Fichier « pur » (aucune connexion réseau) : il est testé automatiquement et utilisé par la
 * commande `npm run env:verifier` (scripts/verifier-env.ts), qui ajoute les vrais tests de
 * connexion.
 *
 * Règle absolue : les messages ne contiennent JAMAIS de clé ni de mot de passe. Au plus, le
 * nom d'un serveur ou un numéro de port (informations non secrètes).
 */

export type EtatVariable = "ok" | "avertissement" | "erreur";

export type ResultatVariable = {
  nom: string;
  etat: EtatVariable;
  message: string;
};

type Env = Record<string, string | undefined>;

/**
 * Lit le champ « role » d'une clé Supabase de l'ancien format (un jeton JWT).
 * Renvoie « anon », « service_role »… ou `undefined` si la clé n'est pas un jeton lisible
 * (c'est le cas des nouvelles clés « sb_publishable_… » / « sb_secret_… »).
 * On ne vérifie PAS la signature : on veut seulement détecter une inversion de clés.
 */
export function roleDuJeton(cle: string): string | undefined {
  const morceaux = cle.split(".");
  if (morceaux.length !== 3) return undefined;
  try {
    const json = Buffer.from(morceaux[1], "base64url").toString("utf8");
    const charge = JSON.parse(json) as { role?: unknown };
    return typeof charge.role === "string" ? charge.role : undefined;
  } catch {
    return undefined;
  }
}

function lire(env: Env, nom: string): string | undefined {
  const v = env[nom]?.trim();
  return v ? v : undefined;
}

/** Contrôle une adresse de connexion PostgreSQL sans en révéler le contenu. */
function analyserAdresseBase(
  nom: string,
  valeur: string | undefined,
  role: "application" | "migrations",
): ResultatVariable {
  if (!valeur) {
    return {
      nom,
      etat: role === "application" ? "erreur" : "avertissement",
      message:
        role === "application"
          ? "Manquante : nécessaire pour que le site lise la base."
          : "Manquante : nécessaire pour appliquer les migrations (npm run db:migrate).",
    };
  }
  if (valeur.includes("[YOUR-PASSWORD]") || valeur.includes("YOUR-PASSWORD")) {
    return {
      nom,
      etat: "erreur",
      message:
        "Le texte [YOUR-PASSWORD] n'a pas été remplacé par le mot de passe de la base.",
    };
  }
  if (!/^postgres(ql)?:\/\//.test(valeur)) {
    return {
      nom,
      etat: "erreur",
      message: "Doit commencer par postgresql:// ou postgres://.",
    };
  }

  let adresse: URL;
  try {
    adresse = new URL(valeur);
  } catch {
    return {
      nom,
      etat: "erreur",
      message:
        "Adresse illisible. Si le mot de passe contient @ : / ? # % il doit être encodé (par exemple @ devient %40).",
    };
  }
  if (!adresse.password) {
    return { nom, etat: "erreur", message: "Aucun mot de passe dans l'adresse." };
  }

  const serveur = adresse.hostname;
  const port = adresse.port || "5432";
  const estConnexionDirecte =
    serveur.startsWith("db.") && serveur.endsWith(".supabase.co");
  const estPooler = serveur.includes("pooler.supabase.com");

  if (role === "application" && estConnexionDirecte) {
    return {
      nom,
      etat: "avertissement",
      message: `Connexion directe (${serveur}). Pour le site, préférez l'adresse « Transaction pooler » (port 6543), adaptée à Vercel.`,
    };
  }
  if (role === "application" && estPooler && port !== "6543") {
    return {
      nom,
      etat: "avertissement",
      message: `Pooler sur le port ${port}. Pour Vercel, utilisez le mode « Transaction » (port 6543).`,
    };
  }
  if (role === "migrations" && port === "6543") {
    return {
      nom,
      etat: "erreur",
      message:
        "Port 6543 (mode Transaction) : inadapté aux migrations. Utilisez la connexion directe ou le « Session pooler » (port 5432).",
    };
  }
  return {
    nom,
    etat: "ok",
    message: `Format correct (serveur ${serveur}, port ${port}).`,
  };
}

/**
 * Analyse l'ensemble des variables d'environnement attendues par le projet.
 * @param env les variables (par exemple `process.env`)
 */
export function analyserVariablesEnv(env: Env): ResultatVariable[] {
  const resultats: ResultatVariable[] = [];

  // --- Adresse publique du site -------------------------------------------------------
  const site = lire(env, "NEXT_PUBLIC_SITE_URL");
  if (!site) {
    resultats.push({
      nom: "NEXT_PUBLIC_SITE_URL",
      etat: "avertissement",
      message: "Absente : http://localhost:3000 sera utilisée.",
    });
  } else {
    try {
      new URL(site);
      resultats.push({
        nom: "NEXT_PUBLIC_SITE_URL",
        etat: "ok",
        message: "Adresse valide.",
      });
    } catch {
      resultats.push({
        nom: "NEXT_PUBLIC_SITE_URL",
        etat: "erreur",
        message: "Adresse invalide.",
      });
    }
  }

  // --- Adresse du projet Supabase -----------------------------------------------------
  const urlSupabase = lire(env, "NEXT_PUBLIC_SUPABASE_URL");
  if (!urlSupabase) {
    resultats.push({
      nom: "NEXT_PUBLIC_SUPABASE_URL",
      etat: "erreur",
      message: "Manquante (Réglages du projet → API → Project URL).",
    });
  } else {
    try {
      const adresse = new URL(urlSupabase);
      if (adresse.protocol !== "https:") {
        resultats.push({
          nom: "NEXT_PUBLIC_SUPABASE_URL",
          etat: "erreur",
          message: "Doit commencer par https://.",
        });
      } else if (!adresse.hostname.endsWith(".supabase.co")) {
        resultats.push({
          nom: "NEXT_PUBLIC_SUPABASE_URL",
          etat: "avertissement",
          message: `Domaine inhabituel (${adresse.hostname}) : attendu « …supabase.co ».`,
        });
      } else if (adresse.pathname !== "/" && adresse.pathname !== "") {
        resultats.push({
          nom: "NEXT_PUBLIC_SUPABASE_URL",
          etat: "avertissement",
          message:
            "Retirez tout ce qui suit le nom de domaine (pas de /rest/v1 ni de /).",
        });
      } else {
        resultats.push({
          nom: "NEXT_PUBLIC_SUPABASE_URL",
          etat: "ok",
          message: `Format correct (${adresse.hostname}).`,
        });
      }
    } catch {
      resultats.push({
        nom: "NEXT_PUBLIC_SUPABASE_URL",
        etat: "erreur",
        message: "Adresse invalide.",
      });
    }
  }

  // --- Clés Supabase : la vérification la plus importante -------------------------------
  const clePublique = lire(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const cleSecrete = lire(env, "SUPABASE_SERVICE_ROLE_KEY");

  if (!clePublique) {
    resultats.push({
      nom: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      etat: "erreur",
      message: "Manquante (clé « anon » ou « publishable »).",
    });
  } else if (
    clePublique.startsWith("sb_secret_") ||
    roleDuJeton(clePublique) === "service_role"
  ) {
    resultats.push({
      nom: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      etat: "erreur",
      message:
        "DANGER : c'est la clé SECRÈTE. Cette variable est visible de tous les visiteurs du site. Mettez-y la clé publique (« anon » / « publishable »).",
    });
  } else if (clePublique.length < 20) {
    resultats.push({
      nom: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      etat: "erreur",
      message: "Trop courte : copie incomplète ?",
    });
  } else {
    resultats.push({
      nom: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      etat: "ok",
      message: "Clé publique reconnue.",
    });
  }

  if (!cleSecrete) {
    resultats.push({
      nom: "SUPABASE_SERVICE_ROLE_KEY",
      etat: "erreur",
      message: "Manquante (clé « service_role » ou « secret »).",
    });
  } else if (cleSecrete === clePublique) {
    resultats.push({
      nom: "SUPABASE_SERVICE_ROLE_KEY",
      etat: "erreur",
      message:
        "Identique à la clé publique : les deux clés ont été copiées au même endroit.",
    });
  } else if (
    cleSecrete.startsWith("sb_publishable_") ||
    roleDuJeton(cleSecrete) === "anon"
  ) {
    resultats.push({
      nom: "SUPABASE_SERVICE_ROLE_KEY",
      etat: "erreur",
      message: "C'est la clé PUBLIQUE. Mettez ici la clé « service_role » / « secret ».",
    });
  } else if (cleSecrete.length < 20) {
    resultats.push({
      nom: "SUPABASE_SERVICE_ROLE_KEY",
      etat: "erreur",
      message: "Trop courte : copie incomplète ?",
    });
  } else {
    resultats.push({
      nom: "SUPABASE_SERVICE_ROLE_KEY",
      etat: "ok",
      message: "Clé secrète reconnue.",
    });
  }

  // --- Base de données ------------------------------------------------------------------
  resultats.push(
    analyserAdresseBase("DATABASE_URL", lire(env, "DATABASE_URL"), "application"),
  );
  resultats.push(
    analyserAdresseBase(
      "DATABASE_DIRECT_URL",
      lire(env, "DATABASE_DIRECT_URL"),
      "migrations",
    ),
  );

  return resultats;
}
