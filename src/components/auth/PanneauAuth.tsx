import Link from "next/link";
import { listerVehicules } from "@/modules/vehicles";

/** Les trois « onglets » de l'espace d'accès. Ce sont de vrais liens vers trois pages. */
const ONGLETS = [
  { cle: "connexion", href: "/connexion", libelle: "Connexion" },
  { cle: "inscription", href: "/inscription", libelle: "Créer un compte" },
  { cle: "oubli", href: "/mot-de-passe-oublie", libelle: "Récupération" },
] as const;

export type OngletAuth = (typeof ONGLETS)[number]["cle"];

type Props = {
  /** Onglet actif. */
  onglet: OngletAuth;
  titre: string;
  sousTitre: string;
  children: React.ReactNode;
};

/**
 * Mise en page des pages d'accès (connexion, inscription, mot de passe oublié), inspirée de la
 * maquette Stitch : un panneau de présentation sombre à gauche, le formulaire à droite.
 *
 * Le panneau de gauche n'est affiché que sur grand écran. Son contenu se limite à ce que le site
 * fait réellement : aucun chiffre inventé (le nombre de véhicules est lu dans le catalogue).
 */
export async function PanneauAuth({ onglet, titre, sousTitre, children }: Props) {
  const nombreVehicules = (await listerVehicules()).length;

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Panneau de présentation (grand écran) */}
      <aside
        aria-label="Présentation de l'espace client"
        className="relative hidden overflow-hidden bg-linear-to-br from-marine-950 via-marine-900 to-marine-800 p-12 text-white lg:flex lg:flex-col lg:justify-between"
      >
        {/* Silhouette décorative */}
        <svg
          viewBox="0 0 320 140"
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-6 -right-16 w-[34rem] opacity-[0.07]"
        >
          <path
            d="M22 98c0-9 6-15 15-17l30-6c10-12 28-26 48-28 24-3 56-3 74 2 14 4 26 14 36 26l38 8c9 2 14 8 14 16v10c0 4-3 7-7 7h-18a26 26 0 0 0-52 0H114a26 26 0 0 0-52 0H29c-4 0-7-3-7-7z"
            fill="#fff"
          />
        </svg>

        <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-ciel-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
          Connexion sécurisée
        </p>

        <div className="relative max-w-lg">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
            Votre espace <span className="text-ciel-300">DriveDeal</span>.
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/75">
            Créez votre compte pour retrouver vos informations et, bientôt, vos favoris
            et vos comparaisons.
          </p>
        </div>

        <div className="relative flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          {nombreVehicules > 0 ? (
            <>
              <p className="text-4xl font-extrabold">{nombreVehicules}</p>
              <p className="text-sm leading-6 text-white/70">
                véhicule{nombreVehicules > 1 ? "s" : ""} actuellement disponible
                {nombreVehicules > 1 ? "s" : ""} au catalogue.
              </p>
            </>
          ) : (
            <p className="text-sm leading-6 text-white/70">
              Le catalogue est en cours de constitution : de nouveaux véhicules arrivent
              bientôt.
            </p>
          )}
        </div>
      </aside>

      {/* Formulaire */}
      <section className="flex items-center justify-center bg-gris-50 px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          {/* Onglets */}
          <nav
            aria-label="Accès au compte"
            className="mb-8 grid grid-cols-3 gap-1 rounded-xl bg-gris-200/70 p-1 text-center text-xs font-semibold sm:text-sm"
          >
            {ONGLETS.map((o) => (
              <Link
                key={o.cle}
                href={o.href}
                aria-current={o.cle === onglet ? "page" : undefined}
                className={`rounded-lg px-2 py-2.5 transition-colors ${
                  o.cle === onglet
                    ? "bg-white text-marine-900 shadow-sm"
                    : "text-gris-500 hover:text-gris-900"
                }`}
              >
                {o.libelle}
              </Link>
            ))}
          </nav>

          <h1 className="text-3xl font-extrabold tracking-tight text-marine-900">
            {titre}
          </h1>
          <p className="mt-2 text-sm leading-6 text-gris-500">{sousTitre}</p>
          <div className="mt-6">{children}</div>

          <p className="mt-8 text-center text-xs leading-5 text-gris-500">
            <Link href="/" className="font-semibold text-bleu-600 hover:underline">
              ← Retour au site
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
