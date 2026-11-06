"use server";

import { db } from "@/lib/db/client";
import { messagesContact } from "@/lib/db/schema";
import type { EtatContact } from "./etat";
import { validerMessage } from "./validation";

function valeursSaisies(formData: FormData): Record<string, string> {
  const valeurs: Record<string, string> = {};
  for (const cle of ["nom", "email", "telephone", "sujet", "vehicule", "message"]) {
    const v = formData.get(cle);
    if (typeof v === "string") valeurs[cle] = v;
  }
  return valeurs;
}

/** Enregistre un message de contact après validation côté serveur. */
export async function envoyerMessage(
  _precedent: EtatContact,
  formData: FormData,
): Promise<EtatContact> {
  // Champ piège (invisible pour les humains) : un robot le remplit.
  // On répond comme si tout allait bien, sans rien enregistrer.
  if (typeof formData.get("site_web") === "string" && formData.get("site_web") !== "") {
    return { statut: "succes", message: "Merci, votre message a bien été envoyé." };
  }

  const resultat = validerMessage(formData);
  if (!resultat.ok) {
    return {
      statut: "erreur",
      message: "Veuillez corriger les champs signalés.",
      erreurs: resultat.erreurs,
      valeurs: valeursSaisies(formData),
    };
  }

  if (!process.env.DATABASE_URL) {
    return {
      statut: "erreur",
      message:
        "L’envoi de messages n’est pas encore disponible. Merci de réessayer plus tard.",
      valeurs: valeursSaisies(formData),
    };
  }

  const { nom, email, telephone, sujet, vehicule, message } = resultat.donnees;
  try {
    await db()
      .insert(messagesContact)
      .values({
        nom,
        email,
        telephone: telephone ?? null,
        sujet,
        vehiculeReference: vehicule ?? null,
        message,
        consentement: true,
      });
  } catch (erreur) {
    // On ne renvoie jamais le détail technique à l'utilisateur.
    console.error("Échec de l’enregistrement d’un message de contact", erreur);
    return {
      statut: "erreur",
      message:
        "Votre message n’a pas pu être enregistré. Merci de réessayer dans un instant.",
      valeurs: valeursSaisies(formData),
    };
  }

  return {
    statut: "succes",
    message: "Merci, votre message a bien été envoyé. Nous vous répondrons rapidement.",
  };
}
