import { z } from "zod";

/**
 * Validation du formulaire « Faire une demande » (toujours côté serveur).
 *
 * Champs : prénom, nom, e-mail, téléphone (facultatif), code postal, consentement.
 * Le véhicule concerné est transmis par son identifiant, mais le serveur le RELIT en base :
 * on ne fait jamais confiance à ce que le navigateur envoie.
 */

const schema = z.object({
  vehiculeId: z.string().trim().min(1, "Véhicule introuvable.").max(64),
  prenom: z.string().trim().min(2, "Indiquez votre prénom.").max(80),
  nom: z.string().trim().min(2, "Indiquez votre nom.").max(80),
  email: z.email("Adresse e-mail invalide.").max(200),
  telephone: z
    .string()
    .trim()
    .max(20, "Numéro de téléphone trop long.")
    .regex(/^[+0-9 ().-]*$/, "Numéro de téléphone invalide.")
    .optional(),
  // Code postal français : 5 chiffres exactement (docs/08 : pas d'autre pays prévu).
  codePostal: z.string().trim().regex(/^\d{5}$/, "Code postal invalide (5 chiffres)."),
  consentement: z.literal("on", "Vous devez accepter le traitement de vos données."),
});

export type DonneesDemande = {
  vehiculeId: string;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  codePostal: string;
};

export type ResultatValidationDemande =
  | { ok: true; donnees: DonneesDemande }
  | { ok: false; erreurs: Record<string, string> };

const vide = (v: FormDataEntryValue | null) =>
  typeof v === "string" && v.trim() ? v : undefined;

/** Valide les champs du formulaire de demande. */
export function validerDemande(formData: FormData): ResultatValidationDemande {
  const resultat = schema.safeParse({
    vehiculeId: formData.get("vehiculeId") ?? "",
    prenom: formData.get("prenom") ?? "",
    nom: formData.get("nom") ?? "",
    email: formData.get("email") ?? "",
    telephone: vide(formData.get("telephone")),
    codePostal: formData.get("codePostal") ?? "",
    consentement: formData.get("consentement") ?? "",
  });

  if (resultat.success) {
    const { consentement: _consentement, ...donnees } = resultat.data;
    void _consentement;
    return { ok: true, donnees };
  }

  const erreurs: Record<string, string> = {};
  for (const issue of resultat.error.issues) {
    const cle = String(issue.path[0] ?? "formulaire");
    erreurs[cle] ??= issue.message;
  }
  return { ok: false, erreurs };
}
