import type { Metadata } from "next";
import Link from "next/link";
import { BoutonDeconnexion } from "@/components/auth/BoutonDeconnexion";
import { FormulaireProfil } from "@/components/auth/FormulaireProfil";
import { Badge } from "@/components/ui/Badge";
import { Conteneur } from "@/components/ui/Conteneur";
import { exigerUtilisateur } from "@/lib/auth/garde";
import { lireProfil } from "@/modules/comptes/profil";

export const metadata: Metadata = {
  title: "Mon compte",
  robots: { index: false },
};

/**
 * Espace client (page PRIVÉE).
 * `exigerUtilisateur()` est la vraie protection : même si proxy.ts était contourné, une personne
 * non connectée est renvoyée vers la connexion avant que la moindre donnée ne soit lue.
 */
export default async function PageCompte() {
  const utilisateur = await exigerUtilisateur("/compte");
  const profil = await lireProfil(utilisateur.id);

  return (
    <>
      <section className="bg-linear-to-b from-marine-950 to-marine-900 py-10 text-white">
        <Conteneur>
          <h1 className="text-3xl font-extrabold tracking-tight">Mon compte</h1>
          <p className="mt-2 text-white/70">{utilisateur.email}</p>
        </Conteneur>
      </section>

      <Conteneur className="grid grid-cols-1 gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section
          aria-labelledby="titre-coordonnees"
          className="min-w-0 rounded-2xl border border-gris-200 bg-white p-6"
        >
          <h2 id="titre-coordonnees" className="mb-5 text-xl font-bold text-gris-900">
            Mes coordonnées
          </h2>
          <FormulaireProfil
            valeursInitiales={profil}
            actif={Boolean(process.env.DATABASE_URL)}
          />
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-gris-200 bg-white p-6">
            <h2 className="font-bold text-gris-900">Sécurité</h2>
            <p className="mt-3 flex items-center gap-2 text-sm text-gris-700">
              Adresse e-mail{" "}
              <Badge ton={utilisateur.emailVerifie ? "succes" : "alerte"}>
                {utilisateur.emailVerifie ? "confirmée" : "non confirmée"}
              </Badge>
            </p>
            <Link
              href="/compte/mot-de-passe"
              className="mt-4 inline-block text-sm font-semibold text-bleu-600 hover:underline"
            >
              Changer mon mot de passe
            </Link>
          </div>

          <div className="rounded-2xl border border-dashed border-gris-300 bg-gris-50 p-6">
            <h2 className="font-bold text-gris-900">Favoris et comparaisons enregistrées</h2>
            <p className="mt-2 text-sm leading-6 text-gris-500">
              Ces rubriques arriveront dans une prochaine étape.
            </p>
          </div>

          <BoutonDeconnexion />
        </aside>
      </Conteneur>
    </>
  );
}
