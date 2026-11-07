import type { Metadata } from "next";
import Link from "next/link";
import { CarteAuth } from "@/components/auth/CarteAuth";
import { FormulaireReinitialisation } from "@/components/auth/FormulaireReinitialisation";
import { supabaseConfigure } from "@/lib/env";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  robots: { index: false },
};

export default function PageMotDePasseOublie() {
  return (
    <CarteAuth
      titre="Mot de passe oublié"
      sousTitre="Indiquez votre adresse e-mail : nous vous enverrons un lien pour choisir un nouveau mot de passe."
      pied={
        <Link href="/connexion" className="font-semibold text-bleu-600 hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      <FormulaireReinitialisation actif={supabaseConfigure()} />
    </CarteAuth>
  );
}
