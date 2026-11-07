"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerUtilisateur } from "@/lib/auth/garde";
import { adresseRedirectionSure } from "@/lib/auth/redirection";
import { db } from "@/lib/db/client";
import { profils } from "@/lib/db/schema";
import { lireUrlSite, supabaseConfigure } from "@/lib/env";
import { validerFormulaire } from "@/lib/formulaire";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import type { EtatCompte } from "./etat";
import {
  schemaConnexion,
  schemaDemandeReinitialisation,
  schemaInscription,
  schemaNouveauMotDePasse,
  schemaProfil,
} from "./validation";

/**
 * Actions serveur du compte : inscription, connexion, déconnexion, mot de passe, profil.
 *
 * Principes appliqués dans TOUTES les actions :
 *  1. les données du formulaire sont validées côté serveur (Zod) ;
 *  2. les messages d'erreur ne révèlent jamais si une adresse e-mail possède un compte
 *     (protection contre l'énumération de comptes) ;
 *  3. aucun mot de passe n'est renvoyé au formulaire ni écrit dans les journaux ;
 *  4. `redirect()` est appelé HORS des blocs try/catch (il fonctionne en levant une
 *     exception spéciale que Next.js intercepte).
 */

const MESSAGE_INDISPONIBLE =
  "La connexion aux comptes n'est pas encore disponible. Merci de réessayer plus tard.";
const MESSAGE_TROP_DE_TENTATIVES =
  "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
const MESSAGE_GENERIQUE = "Une erreur est survenue. Merci de réessayer dans un instant.";

/** Vrai si l'erreur Supabase signale une limite de débit (trop de demandes). */
function estLimiteDeDebit(erreur: { status?: number; code?: string }): boolean {
  return (
    erreur.status === 429 ||
    erreur.code === "over_email_send_rate_limit" ||
    erreur.code === "over_request_rate_limit"
  );
}

/** Champ piège anti-robots : invisible pour les humains, rempli par les robots. */
function estRobot(formData: FormData): boolean {
  const piege = formData.get("site_web");
  return typeof piege === "string" && piege !== "";
}

// ----------------------------------------------------------------------------------------
// Inscription
// ----------------------------------------------------------------------------------------

/**
 * Crée un compte. Un e-mail de confirmation est envoyé par Supabase.
 * La réponse est la MÊME que l'adresse soit nouvelle ou déjà utilisée (anti-énumération).
 */
export async function inscrire(
  _precedent: EtatCompte,
  formData: FormData,
): Promise<EtatCompte> {
  const messageSucces =
    "Si cette adresse peut recevoir un compte, un e-mail de confirmation vient de lui être envoyé. Cliquez sur le lien qu'il contient pour activer votre compte.";
  if (estRobot(formData)) return { statut: "succes", message: messageSucces };

  const resultat = validerFormulaire(schemaInscription, formData);
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!resultat.ok) {
    // On ne renvoie QUE l'adresse e-mail saisie ; jamais les mots de passe.
    return {
      statut: "erreur",
      message: "Veuillez corriger les champs signalés.",
      erreurs: resultat.erreurs,
      valeurs: { email },
    };
  }
  if (!supabaseConfigure())
    return { statut: "erreur", message: MESSAGE_INDISPONIBLE, valeurs: { email } };

  const supabase = await creerClientSupabaseServeur();
  const { data, error } = await supabase.auth.signUp({
    email: resultat.donnees.email,
    password: resultat.donnees.motDePasse,
    // Après clic sur le lien de l'e-mail, Supabase renvoie ici, puis vers le compte.
    options: { emailRedirectTo: `${lireUrlSite()}/auth/confirmation?suivant=/compte` },
  });

  if (error) {
    // On journalise le CODE de l'erreur (jamais l'adresse ni le mot de passe).
    console.error("[auth] inscription refusée", {
      code: error.code,
      status: error.status,
    });
    if (estLimiteDeDebit(error))
      return {
        statut: "erreur",
        message: MESSAGE_TROP_DE_TENTATIVES,
        valeurs: { email },
      };
    if (error.code === "weak_password") {
      return {
        statut: "erreur",
        message:
          "Ce mot de passe est trop faible ou trop courant. Choisissez-en un autre.",
        valeurs: { email },
      };
    }
    return { statut: "erreur", message: MESSAGE_GENERIQUE, valeurs: { email } };
  }

  // Si la confirmation d'e-mail est désactivée dans Supabase, une session est ouverte
  // immédiatement : on emmène la personne dans son espace.
  if (data.session) redirect("/compte");

  return { statut: "succes", message: messageSucces };
}

// ----------------------------------------------------------------------------------------
// Connexion / déconnexion
// ----------------------------------------------------------------------------------------

/**
 * Connecte un utilisateur. Les échecs donnent TOUJOURS le même message, qu'il s'agisse d'une
 * adresse inconnue ou d'un mauvais mot de passe.
 */
export async function connecter(
  _precedent: EtatCompte,
  formData: FormData,
): Promise<EtatCompte> {
  const resultat = validerFormulaire(schemaConnexion, formData);
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!resultat.ok) {
    return {
      statut: "erreur",
      message: "Veuillez corriger les champs signalés.",
      erreurs: resultat.erreurs,
      valeurs: { email },
    };
  }
  if (!supabaseConfigure())
    return { statut: "erreur", message: MESSAGE_INDISPONIBLE, valeurs: { email } };

  const supabase = await creerClientSupabaseServeur();
  const { error } = await supabase.auth.signInWithPassword({
    email: resultat.donnees.email,
    password: resultat.donnees.motDePasse,
  });

  if (error) {
    console.error("[auth] connexion refusée", { code: error.code, status: error.status });
    if (estLimiteDeDebit(error))
      return {
        statut: "erreur",
        message: MESSAGE_TROP_DE_TENTATIVES,
        valeurs: { email },
      };
    // Seul cas détaillé : l'adresse n'est pas confirmée. Supabase ne le signale qu'APRÈS avoir
    // vérifié le mot de passe : cela ne permet donc pas de deviner si une adresse existe.
    if (error.code === "email_not_confirmed") {
      return {
        statut: "erreur",
        message:
          "Votre adresse e-mail n'est pas encore confirmée. Cliquez sur le lien reçu par e-mail.",
        valeurs: { email },
      };
    }
    return {
      statut: "erreur",
      message: "Adresse e-mail ou mot de passe incorrect.",
      valeurs: { email },
    };
  }

  // `redirection` vient du formulaire (donc non fiable) : on n'accepte qu'un chemin interne.
  redirect(adresseRedirectionSure(formData.get("redirection") as string | null));
}

/** Ferme la session puis renvoie vers l'accueil. Appelée par un formulaire (méthode POST). */
export async function deconnecter(): Promise<void> {
  if (supabaseConfigure()) {
    const supabase = await creerClientSupabaseServeur();
    await supabase.auth.signOut();
  }
  redirect("/");
}

// ----------------------------------------------------------------------------------------
// Mot de passe
// ----------------------------------------------------------------------------------------

/**
 * Envoie un e-mail de réinitialisation. La réponse est identique que l'adresse possède un
 * compte ou non.
 */
export async function demanderReinitialisation(
  _precedent: EtatCompte,
  formData: FormData,
): Promise<EtatCompte> {
  const messageSucces =
    "Si un compte existe pour cette adresse, un e-mail contenant un lien de réinitialisation vient d'être envoyé.";
  if (estRobot(formData)) return { statut: "succes", message: messageSucces };

  const resultat = validerFormulaire(schemaDemandeReinitialisation, formData);
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!resultat.ok)
    return {
      statut: "erreur",
      message: "Veuillez corriger le champ signalé.",
      erreurs: resultat.erreurs,
      valeurs: { email },
    };
  if (!supabaseConfigure())
    return { statut: "erreur", message: MESSAGE_INDISPONIBLE, valeurs: { email } };

  const supabase = await creerClientSupabaseServeur();
  const { error } = await supabase.auth.resetPasswordForEmail(resultat.donnees.email, {
    redirectTo: `${lireUrlSite()}/auth/confirmation?suivant=/compte/mot-de-passe`,
  });
  if (error) {
    console.error("[auth] réinitialisation refusée", {
      code: error.code,
      status: error.status,
    });
    if (estLimiteDeDebit(error))
      return {
        statut: "erreur",
        message: MESSAGE_TROP_DE_TENTATIVES,
        valeurs: { email },
      };
    // Autres erreurs : on garde volontairement le message de succès (anti-énumération).
  }
  return { statut: "succes", message: messageSucces };
}

/** Change le mot de passe de la personne connectée. */
export async function changerMotDePasse(
  _precedent: EtatCompte,
  formData: FormData,
): Promise<EtatCompte> {
  // Garde : sans session valide, renvoie vers la connexion (jamais d'accès anonyme).
  await exigerUtilisateur("/compte/mot-de-passe");

  const resultat = validerFormulaire(schemaNouveauMotDePasse, formData);
  if (!resultat.ok)
    return {
      statut: "erreur",
      message: "Veuillez corriger les champs signalés.",
      erreurs: resultat.erreurs,
    };

  const supabase = await creerClientSupabaseServeur();
  const { error } = await supabase.auth.updateUser({
    password: resultat.donnees.motDePasse,
  });
  if (error) {
    console.error("[auth] changement de mot de passe refusé", {
      code: error.code,
      status: error.status,
    });
    if (error.code === "same_password")
      return {
        statut: "erreur",
        message: "Le nouveau mot de passe doit être différent de l'ancien.",
      };
    if (error.code === "weak_password")
      return {
        statut: "erreur",
        message:
          "Ce mot de passe est trop faible ou trop courant. Choisissez-en un autre.",
      };
    if (error.code === "reauthentication_needed")
      return {
        statut: "erreur",
        message:
          "Pour votre sécurité, reconnectez-vous avant de changer de mot de passe.",
      };
    if (estLimiteDeDebit(error))
      return { statut: "erreur", message: MESSAGE_TROP_DE_TENTATIVES };
    return { statut: "erreur", message: MESSAGE_GENERIQUE };
  }
  return { statut: "succes", message: "Votre mot de passe a été modifié." };
}

// ----------------------------------------------------------------------------------------
// Profil
// ----------------------------------------------------------------------------------------

/**
 * Met à jour les coordonnées de la personne connectée.
 *
 * SÉCURITÉ : l'identifiant du profil modifié vient de la SESSION VÉRIFIÉE (`utilisateur.id`),
 * jamais du formulaire. Impossible donc de modifier le profil de quelqu'un d'autre, ni de
 * toucher à un rôle : le schéma de validation ne connaît que prénom, nom et téléphone.
 */
export async function mettreAJourProfil(
  _precedent: EtatCompte,
  formData: FormData,
): Promise<EtatCompte> {
  const utilisateur = await exigerUtilisateur("/compte");

  const resultat = validerFormulaire(schemaProfil, formData);
  const valeurs = {
    prenom: String(formData.get("prenom") ?? ""),
    nom: String(formData.get("nom") ?? ""),
    telephone: String(formData.get("telephone") ?? ""),
  };
  if (!resultat.ok)
    return {
      statut: "erreur",
      message: "Veuillez corriger les champs signalés.",
      erreurs: resultat.erreurs,
      valeurs,
    };
  if (!process.env.DATABASE_URL)
    return { statut: "erreur", message: MESSAGE_INDISPONIBLE, valeurs };

  const { prenom, nom, telephone } = resultat.donnees;
  try {
    // « Insérer ou mettre à jour » : le profil est normalement créé à l'inscription par la base,
    // mais on reste robuste pour un compte antérieur à cet automatisme.
    await db()
      .insert(profils)
      .values({
        id: utilisateur.id,
        prenom: prenom ?? null,
        nom: nom ?? null,
        telephone: telephone ?? null,
      })
      .onConflictDoUpdate({
        target: profils.id,
        set: { prenom: prenom ?? null, nom: nom ?? null, telephone: telephone ?? null },
      });
  } catch (erreur) {
    console.error(
      "[compte] mise à jour du profil impossible",
      erreur instanceof Error ? erreur.message : "erreur inconnue",
    );
    return { statut: "erreur", message: MESSAGE_GENERIQUE, valeurs };
  }

  revalidatePath("/compte");
  return { statut: "succes", message: "Vos coordonnées ont été enregistrées.", valeurs };
}
