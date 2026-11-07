import type { Metadata } from "next";
import Link from "next/link";
import { CarteAuth } from "@/components/auth/CarteAuth";
import { FormulaireMotDePasse } from "@/components/auth/FormulaireMotDePasse";
import { exigerUtilisateur } from "@/lib/auth/garde";

export const metadata: Metadata = {
  title: "Changer mon mot de passe",
  robots: { index: false },
};

/**
 * Changement de mot de passe. Une personne qui arrive depuis un lien de réinitialisation est
 * déjà connectée par ce lien (voir src/app/auth/confirmation/route.ts) : elle peut donc choisir
 * un nouveau mot de passe ici sans connaître l'ancien.
 */
export default async function PageMotDePasse() {
  await exigerUtilisateur("/compte/mot-de-passe");

  return (
    <CarteAuth
      titre="Changer mon mot de passe"
      sousTitre="Choisissez un mot de passe que vous n'utilisez nulle part ailleurs."
      pied={
        <Link href="/compte" className="font-semibold text-bleu-600 hover:underline">
          Retour à mon compte
        </Link>
      }
    >
      <FormulaireMotDePasse />
    </CarteAuth>
  );
}
