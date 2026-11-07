import type { Metadata } from "next";
import { FormulaireInscription } from "@/components/auth/FormulaireInscription";
import { PanneauAuth } from "@/components/auth/PanneauAuth";
import { supabaseConfigure } from "@/lib/env";

export const metadata: Metadata = {
  title: "Créer un compte",
  robots: { index: false },
};

export default function PageInscription() {
  return (
    <PanneauAuth
      onglet="inscription"
      titre="Créer votre compte"
      sousTitre="Gratuit et rapide. Vous recevrez un e-mail pour confirmer votre adresse."
    >
      <FormulaireInscription actif={supabaseConfigure()} />
    </PanneauAuth>
  );
}
