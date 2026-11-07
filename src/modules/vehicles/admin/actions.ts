"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { exigerAdministrateur } from "@/lib/auth/garde";
import { validerFormulaire } from "@/lib/formulaire";
import { invaliderCatalogue } from "./cache";
import {
  changerStatutVehicule,
  creerVehicule,
  estStatutValide,
  modifierVehicule,
  supprimerBrouillon,
} from "./depot-admin";
import type { EtatAdmin } from "./etat";
import { schemaVehicule } from "./validation";

/**
 * Actions serveur du back-office des véhicules.
 *
 * RÈGLES APPLIQUÉES DANS CHAQUE ACTION (ne jamais en omettre) :
 *  1. `exigerAdministrateur()` EN PREMIER : une Server Action est une adresse publique que
 *     n'importe qui peut appeler directement, même sans passer par la page d'administration.
 *     Protéger la page ne suffit donc pas.
 *  2. validation des données côté serveur (Zod) ;
 *  3. l'identifiant de l'auteur vient de la session vérifiée, jamais du formulaire ;
 *  4. après une écriture réussie : invalidation du cache du catalogue public ;
 *  5. `redirect()` est appelé hors des blocs try/catch.
 */

/** Recopie les champs saisis (texte seulement) pour réafficher le formulaire après une erreur. */
function valeursSaisies(formData: FormData): Record<string, string> {
  const valeurs: Record<string, string> = {};
  for (const [cle, valeur] of formData.entries()) {
    if (typeof valeur === "string" && !cle.startsWith("$ACTION")) valeurs[cle] = valeur;
  }
  return valeurs;
}

// ----------------------------------------------------------------------------------------
// Création
// ----------------------------------------------------------------------------------------

/** Crée un véhicule en brouillon puis ouvre sa fiche d'édition (où l'on ajoute les photos). */
export async function creerVehiculeAction(
  _precedent: EtatAdmin,
  formData: FormData,
): Promise<EtatAdmin> {
  const admin = await exigerAdministrateur("/admin/vehicules/nouveau");

  const resultat = validerFormulaire(schemaVehicule, formData);
  if (!resultat.ok) {
    return {
      statut: "erreur",
      message: "Veuillez corriger les champs signalés.",
      erreurs: resultat.erreurs,
      valeurs: valeursSaisies(formData),
    };
  }

  let id: string;
  try {
    ({ id } = await creerVehicule(resultat.donnees, admin.id));
  } catch (erreur) {
    console.error(
      "[admin] création de véhicule impossible",
      erreur instanceof Error ? erreur.message : "erreur inconnue",
    );
    return {
      statut: "erreur",
      message: "Le véhicule n'a pas pu être enregistré. Réessayez dans un instant.",
      valeurs: valeursSaisies(formData),
    };
  }

  invaliderCatalogue();
  redirect(`/admin/vehicules/${id}?cree=1`);
}

// ----------------------------------------------------------------------------------------
// Modification
// ----------------------------------------------------------------------------------------

/**
 * Modifie un véhicule. L'identifiant est lié à l'action par `.bind(null, id)` côté page.
 * Il est revalidé ici (c'est une valeur venue du navigateur).
 */
export async function modifierVehiculeAction(
  id: string,
  _precedent: EtatAdmin,
  formData: FormData,
): Promise<EtatAdmin> {
  const admin = await exigerAdministrateur(`/admin/vehicules/${encodeURIComponent(id)}`);

  const resultat = validerFormulaire(schemaVehicule, formData);
  if (!resultat.ok) {
    return {
      statut: "erreur",
      message: "Veuillez corriger les champs signalés.",
      erreurs: resultat.erreurs,
      valeurs: valeursSaisies(formData),
    };
  }

  let ecriture;
  try {
    ecriture = await modifierVehicule(id, resultat.donnees, admin.id);
  } catch (erreur) {
    console.error(
      "[admin] modification de véhicule impossible",
      erreur instanceof Error ? erreur.message : "erreur inconnue",
    );
    return {
      statut: "erreur",
      message:
        "Les modifications n'ont pas pu être enregistrées. Réessayez dans un instant.",
      valeurs: valeursSaisies(formData),
    };
  }
  if (!ecriture.ok)
    return {
      statut: "erreur",
      message: ecriture.erreur,
      valeurs: valeursSaisies(formData),
    };

  invaliderCatalogue();
  return {
    statut: "succes",
    message: "Modifications enregistrées.",
    valeurs: valeursSaisies(formData),
  };
}

// ----------------------------------------------------------------------------------------
// Statut et suppression
// ----------------------------------------------------------------------------------------

const schemaChangementStatut = z.object({ id: z.uuid(), vers: z.string() });

/** Publie, dépublie ou archive un véhicule (selon le champ caché `vers`). */
export async function changerStatutAction(
  _precedent: EtatAdmin,
  formData: FormData,
): Promise<EtatAdmin> {
  const admin = await exigerAdministrateur("/admin/vehicules");

  const lu = schemaChangementStatut.safeParse({
    id: formData.get("id"),
    vers: formData.get("vers"),
  });
  if (!lu.success || !estStatutValide(lu.data.vers))
    return { statut: "erreur", message: "Demande invalide." };

  let r;
  try {
    r = await changerStatutVehicule(lu.data.id, lu.data.vers, admin.id);
  } catch (erreur) {
    console.error(
      "[admin] changement de statut impossible",
      erreur instanceof Error ? erreur.message : "erreur inconnue",
    );
    return {
      statut: "erreur",
      message: "Le changement de statut a échoué. Réessayez dans un instant.",
    };
  }
  if (!r.ok) return { statut: "erreur", message: r.erreur };

  invaliderCatalogue();
  return { statut: "succes", message: "Statut mis à jour." };
}

/** Supprime définitivement un BROUILLON (les autres statuts s'archivent). */
export async function supprimerBrouillonAction(
  _precedent: EtatAdmin,
  formData: FormData,
): Promise<EtatAdmin> {
  const admin = await exigerAdministrateur("/admin/vehicules");

  const lu = z.uuid().safeParse(formData.get("id"));
  if (!lu.success) return { statut: "erreur", message: "Demande invalide." };

  let r;
  try {
    r = await supprimerBrouillon(lu.data, admin.id);
  } catch (erreur) {
    console.error(
      "[admin] suppression impossible",
      erreur instanceof Error ? erreur.message : "erreur inconnue",
    );
    return {
      statut: "erreur",
      message: "La suppression a échoué. Réessayez dans un instant.",
    };
  }
  if (!r.ok) return { statut: "erreur", message: r.erreur };

  // Les fichiers du stockage (photos, documents) seront supprimés avec le module photos.
  invaliderCatalogue();
  redirect("/admin/vehicules?supprime=1");
}
