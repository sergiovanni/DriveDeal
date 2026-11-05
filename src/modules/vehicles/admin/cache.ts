import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { ETIQUETTE_VEHICULES } from "../depot";

/**
 * Invalide le cache du catalogue public après une modification faite dans l'administration.
 *
 * Sans cela, un véhicule publié pourrait mettre jusqu'à 60 secondes à apparaître (durée du
 * cache, voir depot.ts) ; avec, le changement est visible dès le prochain affichage.
 *
 * À appeler depuis une Server Action, APRÈS une écriture réussie en base.
 */
export function invaliderCatalogue(): void {
  // `{ expire: 0 }` : le cache est considéré comme périmé immédiatement (pas de « stale-while-revalidate »).
  revalidateTag(ETIQUETTE_VEHICULES, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/vehicules");
  revalidatePath("/vehicules/[id]", "page");
}
