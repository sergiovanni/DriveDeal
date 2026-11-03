import type { Metadata } from "next";
import { FormulaireReinitialisation } from "@/components/auth/FormulaireReinitialisation";
import { PanneauAuth } from "@/components/auth/PanneauAuth";
import { redirigerSiConnecte } from "@/lib/auth/garde";
import { supabaseConfigure } from "@/lib/env";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  robots: { index: false },
};

export default async function PageMotDePasseOublie() {
  // Déjà connecté : direction l'espace client (voir `redirigerSiConnecte`).
  await redirigerSiConnecte();
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
