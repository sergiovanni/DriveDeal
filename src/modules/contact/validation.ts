import { z } from "zod";

export const SUJETS = [
  { valeur: "vehicule", libelle: "Question sur un véhicule" },
  { valeur: "commande", libelle: "Ma commande ou mon paiement" },
  { valeur: "autre", libelle: "Autre demande" },
] as const;

const schema = z.object({
  nom: z.string().trim().min(2, "Indiquez votre nom (2 caractères minimum).").max(100),
  email: z.email("Adresse e-mail invalide.").max(200),
  telephone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[+0-9 ().-]*$/, "Numéro de téléphone invalide.")
    .optional(),
  sujet: z.enum(["vehicule", "commande", "autre"], "Choisissez un sujet."),
  vehicule: z.string().trim().max(30).optional(),
  message: z
    .string()
    .trim()
    .min(10, "Votre message est trop court (10 caractères minimum).")
    .max(2000, "Votre message est trop long (2 000 caractères maximum)."),
  consentement: z.literal("on", "Vous devez accepter le traitement de vos données."),
});

export type MessageContact = {
  nom: string;
  email: string;
  telephone?: string;
  sujet: "vehicule" | "commande" | "autre";
  vehicule?: string;
  message: string;
};

export type ResultatValidation =
  { ok: true; donnees: MessageContact } | { ok: false; erreurs: Record<string, string> };

const vide = (v: FormDataEntryValue | null) =>
  typeof v === "string" && v.trim() ? v : undefined;

/** Valide les champs du formulaire de contact (toujours côté serveur). */
export function validerMessage(formData: FormData): ResultatValidation {
  const resultat = schema.safeParse({
    nom: formData.get("nom") ?? "",
    email: formData.get("email") ?? "",
    telephone: vide(formData.get("telephone")),
    sujet: formData.get("sujet") ?? "",
    vehicule: vide(formData.get("vehicule")),
    message: formData.get("message") ?? "",
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
