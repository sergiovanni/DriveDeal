import type { Metadata } from "next";
import { FormulaireReinitialisation } from "@/components/auth/FormulaireReinitialisation";
import { PanneauAuth } from "@/components/auth/PanneauAuth";
import { supabaseConfigure } from "@/lib/env";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  robots: { index: false },
};

export default function PageMotDePasseOublie() {
  return (
    <PanneauAuth
      onglet="oubli"
      titre="Mot de passe oublié"
      sousTitre="Indiquez votre adresse e-mail : nous vous enverrons un lien pour choisir un nouveau mot de passe."
    >
      <FormulaireReinitialisation actif={supabaseConfigure()} />
    </PanneauAuth>
  );
}
