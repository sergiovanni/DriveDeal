"use server";

import { db } from "@/lib/db/client";
import { demandesVehicule } from "@/lib/db/schema";
import { trouverVehicule } from "@/modules/vehicles";
import type { EtatDemande } from "./etat";
import { validerDemande } from "./validation";

// Recopie les champs saisis pour les renvoyer au formulaire en cas d'erreur.
function valeursSaisies(formData: FormData): Record<string, string> {
  const valeurs: Record<string, string> = {};
  for (const cle of ["prenom", "nom", "email", "telephone", "codePostal"]) {
    const v = formData.get(cle);
    if (typeof v === "string") valeurs[cle] = v;
  }
  return valeurs;
}

const MESSAGE_SUCCES =
  "Merci, votre demande a bien été envoyée. Nous vous recontactons très vite pour en discuter.";

/**
 * Enregistre une demande d'intérêt pour un véhicule.
 *
 * Action publique (aucune connexion requise) : donc validation stricte côté serveur,
 * champ piège anti-robots, et le véhicule est relu en base (jamais cru sur parole).
 * Limite connue : pas encore de limitation de débit applicative (docs/08).
 */
export async function envoyerDemande(
  _precedent: EtatDemande,
  formData: FormData,
): Promise<EtatDemande> {
  // Champ piège : un robot le remplit. On répond « succès » sans rien enregistrer.
  if (typeof formData.get("site_web") === "string" && formData.get("site_web") !== "") {
    return { statut: "succes", message: MESSAGE_SUCCES };
  }

  const resultat = validerDemande(formData);
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
      message: "L’envoi de demandes n’est pas encore disponible. Merci de réessayer plus tard.",
      valeurs: valeursSaisies(formData),
    };
  }

  // Le véhicule doit exister ET être publié : on ne laisse pas viser un brouillon ou un
  // véhicule archivé, et la référence enregistrée vient de la base, pas du navigateur.
  const vehicule = await trouverVehicule(resultat.donnees.vehiculeId);
  if (!vehicule) {
    return {
      statut: "erreur",
      message: "Ce véhicule n’est plus disponible. Rechargez la page ou choisissez-en un autre.",
      valeurs: valeursSaisies(formData),
    };
  }

  const { prenom, nom, email, telephone, codePostal } = resultat.donnees;
  try {
    await db()
      .insert(demandesVehicule)
      .values({
        // En mode démonstration (sans base) l'identifiant n'est pas un UUID : on n'arrive
        // jamais ici dans ce cas (DATABASE_URL est exigée plus haut).
        vehiculeId: vehicule.id,
        vehiculeReference: vehicule.reference,
        prenom,
        nom,
        email,
        telephone: telephone ?? null,
        codePostal,
        consentement: true,
      });
  } catch (erreur) {
    // Jamais de détail technique renvoyé à l'utilisateur.
    console.error("Échec de l’enregistrement d’une demande de véhicule", erreur);
    return {
      statut: "erreur",
      message: "Votre demande n’a pas pu être enregistrée. Merci de réessayer dans un instant.",
      valeurs: valeursSaisies(formData),
    };
  }

  return { statut: "succes", message: MESSAGE_SUCCES };
}
