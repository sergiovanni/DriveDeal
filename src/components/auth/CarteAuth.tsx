import { Conteneur } from "@/components/ui/Conteneur";

/**
 * Cadre commun des pages de connexion, d'inscription et de réinitialisation :
 * une carte centrée avec un titre, un sous-titre et le formulaire.
 */
export function CarteAuth({
  titre,
  sousTitre,
  children,
  pied,
}: {
  titre: string;
  sousTitre?: string;
  children: React.ReactNode;
  /** Liens sous la carte (ex. « Pas encore de compte ? »). */
  pied?: React.ReactNode;
}) {
  return (
    <Conteneur className="flex justify-center py-12 sm:py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gris-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-marine-900">
            {titre}
          </h1>
          {sousTitre && (
            <p className="mt-2 text-sm leading-6 text-gris-500">{sousTitre}</p>
          )}
          <div className="mt-6">{children}</div>
        </div>
        {pied && <div className="mt-5 text-center text-sm text-gris-500">{pied}</div>}
      </div>
    </Conteneur>
  );
}
