"use client";

import { useActionState } from "react";
import { Bouton } from "@/components/ui/Button";
import {
  changerStatutAction,
  supprimerBrouillonAction,
} from "@/modules/vehicles/admin/actions";
import { etatAdminInitial } from "@/modules/vehicles/admin/etat";
import { LIBELLES_ACTION } from "@/modules/vehicles/admin/regles";
import type { StatutVehicule } from "@/modules/vehicles";
import { BadgeStatut } from "./ElementsAdmin";

type Props = {
  id: string;
  statut: StatutVehicule;
  /** Statuts atteignables depuis le statut actuel (calculés côté serveur par les règles). */
  transitions: readonly StatutVehicule[];
  peutSupprimer: boolean;
  nombrePhotos: number;
};

/**
 * Panneau « Publication » : statut actuel, boutons de changement de statut et suppression d'un
 * brouillon. Les boutons proposés viennent des règles du serveur ; le serveur les REVÉRIFIE à
 * chaque action (un bouton affiché n'est jamais une autorisation).
 */
export function PanneauStatut({
  id,
  statut,
  transitions,
  peutSupprimer,
  nombrePhotos,
}: Props) {
  const [etat, action, enCours] = useActionState(changerStatutAction, etatAdminInitial);
  const [etatSuppression, actionSuppression, suppressionEnCours] = useActionState(
    supprimerBrouillonAction,
    etatAdminInitial,
  );
  const message = etatSuppression.message ?? etat.message;
  const erreur = etatSuppression.statut === "erreur" || etat.statut === "erreur";

  return (
    <div className="rounded-2xl border border-gris-200 bg-white p-5">
      <h2 className="text-base font-bold text-gris-900">Publication</h2>
      <p className="mt-3 flex items-center gap-2 text-sm text-gris-700">
        Statut actuel <BadgeStatut statut={statut} />
      </p>

      {message && (
        <p
          role={erreur ? "alert" : "status"}
          className={`mt-4 rounded-lg px-3 py-2 text-sm font-medium ${erreur ? "bg-red-50 text-red-700" : "bg-emerald-50 text-succes"}`}
        >
          {message}
        </p>
      )}

      {transitions.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2">
          {transitions.map((vers) => (
            <form key={vers} action={action}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="vers" value={vers} />
              <Bouton
                type="submit"
                variante={vers === "publie" ? "primaire" : "contour"}
                className="w-full"
                disabled={enCours || (vers === "publie" && nombrePhotos < 1)}
              >
                {LIBELLES_ACTION[vers]}
              </Bouton>
            </form>
          ))}
          {statut === "brouillon" && nombrePhotos < 1 && (
            <p className="text-xs text-gris-500">
              Ajoutez au moins une photo pour pouvoir publier.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-gris-500">
          Ce statut est géré par les commandes : aucune action manuelle possible.
        </p>
      )}

      {peutSupprimer && (
        <form
          action={actionSuppression}
          className="mt-6 border-t border-gris-200 pt-4"
          onSubmit={(evenement) => {
            // Confirmation avant une action irréversible.
            if (
              !window.confirm(
                "Supprimer définitivement ce brouillon ? Cette action est irréversible.",
              )
            ) {
              evenement.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={id} />
          <Bouton
            type="submit"
            variante="contour"
            className="w-full border-red-300 text-red-700 hover:bg-red-50"
            disabled={suppressionEnCours}
          >
            Supprimer ce brouillon
          </Bouton>
          <p className="mt-2 text-xs text-gris-500">
            Seul un brouillon peut être supprimé. Les autres véhicules s’archivent.
          </p>
        </form>
      )}
    </div>
  );
}
