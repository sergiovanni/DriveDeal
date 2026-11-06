"use client";

import { Bouton } from "@/components/ui/Button";
import { Conteneur } from "@/components/ui/Conteneur";

export default function ErreurPage({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <Conteneur className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Une erreur est survenue</h1>
      <p className="max-w-md text-gris-500">
        Le chargement de cette page a échoué. Vous pouvez réessayer.
      </p>
      <Bouton onClick={() => unstable_retry()}>Réessayer</Bouton>
    </Conteneur>
  );
}
