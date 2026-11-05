import { Bouton } from "@/components/ui/Button";
import { deconnecter } from "@/modules/comptes/actions";

/**
 * Bouton de déconnexion. C'est un FORMULAIRE (méthode POST), pas un simple lien : un lien de
 * déconnexion (GET) pourrait être déclenché à l'insu de l'utilisateur par une image ou un
 * lien piégé sur un autre site.
 */
export function BoutonDeconnexion({ className = "" }: { className?: string }) {
  return (
    <form action={deconnecter} className={className}>
      <Bouton type="submit" variante="contour">
        Se déconnecter
      </Bouton>
    </form>
  );
}
