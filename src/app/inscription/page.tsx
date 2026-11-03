import type { Metadata } from "next";
import { FormulaireInscription } from "@/components/auth/FormulaireInscription";
import { PanneauAuth } from "@/components/auth/PanneauAuth";
import { redirigerSiConnecte } from "@/lib/auth/garde";
import { supabaseConfigure } from "@/lib/env";

export const metadata: Metadata = {
  title: "Créer un compte",
  robots: { index: false },
};

export default async function PageInscription() {
  // Déjà connecté : direction l'espace client (voir `redirigerSiConnecte`).
  await redirigerSiConnecte();
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
