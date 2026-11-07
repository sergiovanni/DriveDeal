import type { Metadata } from "next";
import Link from "next/link";
import { CarteAuth } from "@/components/auth/CarteAuth";
import { FormulaireConnexion } from "@/components/auth/FormulaireConnexion";
import { adresseRedirectionSure } from "@/lib/auth/redirection";
import { supabaseConfigure } from "@/lib/env";

export const metadata: Metadata = {
  title: "Connexion",
  // Page de service : inutile dans les résultats des moteurs de recherche.
  robots: { index: false },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PageConnexion({ searchParams }: Props) {
  // Next.js 16 : searchParams est une promesse, il faut l'attendre.
  const params = await searchParams;
  // Valeur non fiable : on ne garde qu'un chemin interne (protection contre la redirection ouverte).
  const redirection = adresseRedirectionSure(params.redirection, "");
  const lienInvalide = params.erreur === "lien-invalide";

  return (
    <CarteAuth
      titre="Connexion"
      sousTitre="Accédez à votre espace client : favoris, commandes et factures."
      pied={
        <>
          Pas encore de compte ?{" "}
          <Link
            href="/inscription"
            className="font-semibold text-bleu-600 hover:underline"
          >
            Créer un compte
          </Link>
        </>
      }
    >
      {lienInvalide && (
        <p
          role="alert"
          className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          Ce lien n’est plus valide ou a expiré. Connectez-vous, ou demandez un nouveau
          lien.
        </p>
      )}
      <FormulaireConnexion
        actif={supabaseConfigure()}
        redirection={redirection || undefined}
      />
    </CarteAuth>
  );
}
