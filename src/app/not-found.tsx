import { BoutonLien } from "@/components/ui/Button";
import { Conteneur } from "@/components/ui/Conteneur";

/**
 * Page 404. Next.js l'affiche pour toute adresse inconnue et quand une page
 * appelle `notFound()` (ex. fiche d'un véhicule qui n'existe pas).
 */
export default function PageIntrouvable() {
  return (
    <Conteneur className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-sm font-semibold text-bleu-600">Erreur 404</p>
      <h1 className="text-3xl font-bold tracking-tight">Page introuvable</h1>
      <p className="max-w-md text-gris-500">
        La page que vous cherchez n’existe pas ou a été déplacée.
      </p>
      <BoutonLien href="/vehicules">Parcourir les véhicules</BoutonLien>
    </Conteneur>
  );
}
