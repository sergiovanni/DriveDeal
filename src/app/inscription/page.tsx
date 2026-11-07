import type { Metadata } from "next";
import Link from "next/link";
import { CarteAuth } from "@/components/auth/CarteAuth";
import { FormulaireInscription } from "@/components/auth/FormulaireInscription";
import { supabaseConfigure } from "@/lib/env";

export const metadata: Metadata = {
  title: "Créer un compte",
  robots: { index: false },
};

export default function PageInscription() {
  return (
    <CarteAuth
      titre="Créer un compte"
      sousTitre="Gratuit. Vous recevrez un e-mail pour confirmer votre adresse."
      pied={
        <>
          Déjà un compte ?{" "}
          <Link href="/connexion" className="font-semibold text-bleu-600 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <FormulaireInscription actif={supabaseConfigure()} />
    </CarteAuth>
  );
}
