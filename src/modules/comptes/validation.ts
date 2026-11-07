import { z } from "zod";

/**
 * Règles de validation des formulaires du compte (inscription, connexion, profil…).
 * Appliquées TOUJOURS côté serveur ; les attributs HTML (required, type="email") ne sont
 * qu'un confort pour l'utilisateur et peuvent être contournés.
 */

/** Longueur minimale d'un nouveau mot de passe (docs/11 : 12 recommandé ; Supabase accepte 6 par défaut). */
export const LONGUEUR_MIN_MOT_DE_PASSE = 12;
/** Longueur maximale : au-delà de 72 caractères, l'algorithme de hachage (bcrypt) tronquerait le mot de passe. */
export const LONGUEUR_MAX_MOT_DE_PASSE = 72;

/** Adresse e-mail : espaces retirés, passée en minuscules, format vérifié. */
const email = z
  .string({ error: "Indiquez votre adresse e-mail." })
  .trim()
  .toLowerCase()
  .pipe(z.email("Adresse e-mail invalide.").max(254, "Adresse e-mail trop longue."));

/** Nouveau mot de passe (inscription, changement). */
const nouveauMotDePasse = z
  .string({ error: "Indiquez un mot de passe." })
  .min(
    LONGUEUR_MIN_MOT_DE_PASSE,
    `Le mot de passe doit contenir au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`,
  )
  .max(
    LONGUEUR_MAX_MOT_DE_PASSE,
    `Le mot de passe ne doit pas dépasser ${LONGUEUR_MAX_MOT_DE_PASSE} caractères.`,
  );

const confirmation = z.string({ error: "Confirmez votre mot de passe." });

/** Vérifie que le mot de passe et sa confirmation sont identiques. */
function memeMotDePasse(d: { motDePasse: string; confirmation: string }) {
  return d.motDePasse === d.confirmation;
}
const messageDifferents = {
  path: ["confirmation"],
  message: "Les deux mots de passe sont différents.",
};

export const schemaInscription = z
  .object({
    email,
    motDePasse: nouveauMotDePasse,
    confirmation,
    consentement: z.literal("on", {
      error: "Vous devez accepter l'utilisation de vos données pour créer votre compte.",
    }),
  })
  .refine(memeMotDePasse, messageDifferents);

/**
 * Connexion : on n'applique PAS les règles de longueur ici (un compte peut dater d'avant une
 * règle) et on ne détaille pas la raison d'un échec (voir actions.ts).
 */
export const schemaConnexion = z.object({
  email,
  motDePasse: z
    .string({ error: "Indiquez votre mot de passe." })
    .min(1, "Indiquez votre mot de passe.")
    .max(200),
});

export const schemaDemandeReinitialisation = z.object({ email });

export const schemaNouveauMotDePasse = z
  .object({ motDePasse: nouveauMotDePasse, confirmation })
  .refine(memeMotDePasse, messageDifferents);

/** Coordonnées modifiables depuis l'espace client. Tous les champs sont facultatifs. */
export const schemaProfil = z.object({
  prenom: z.string().trim().max(80, "80 caractères maximum.").optional(),
  nom: z.string().trim().max(80, "80 caractères maximum.").optional(),
  telephone: z
    .string()
    .trim()
    .max(20, "20 caractères maximum.")
    .regex(/^[+0-9 ().-]*$/, "Numéro de téléphone invalide.")
    .optional(),
});
