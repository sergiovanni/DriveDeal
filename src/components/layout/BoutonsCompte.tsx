"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseConfigure } from "@/lib/env";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";

type Etat = "inconnu" | "connecte" | "deconnecte";

/**
 * Lien « Connexion » ou « Mon compte » de l'en-tête.
 *
 * POURQUOI CÔTÉ NAVIGATEUR : si l'en-tête lisait la session côté serveur, TOUTES les pages
 * deviendraient dynamiques (lecture des cookies) et perdraient leur mise en cache rapide.
 * Ici, les pages publiques restent statiques et ce petit bouton s'ajuste après le chargement.
 *
 * ATTENTION : cet affichage est du CONFORT, pas de la sécurité. L'accès aux pages privées est
 * contrôlé côté serveur (proxy.ts, src/lib/auth/garde.ts). Un visiteur qui falsifierait cet
 * état verrait juste un lien différent, sans obtenir aucun accès.
 */
export function BoutonsCompte({
  variante = "bouton",
}: {
  variante?: "bouton" | "liste";
}) {
  // Sans Supabase configuré, personne ne peut être connecté : pas besoin d'attendre.
  const [etat, setEtat] = useState<Etat>(() =>
    supabaseConfigure() ? "inconnu" : "deconnecte",
  );

  useEffect(() => {
    if (!supabaseConfigure()) return;
    const supabase = creerClientSupabaseNavigateur();
    let actif = true;

    // État initial (lu dans les cookies du navigateur), puis suivi des changements
    // (connexion, déconnexion, expiration) pendant la visite.
    supabase.auth.getSession().then(({ data }) => {
      if (actif) setEtat(data.session ? "connecte" : "deconnecte");
    });
    const { data: abonnement } = supabase.auth.onAuthStateChange(
      (_evenement, session) => {
        setEtat(session ? "connecte" : "deconnecte");
      },
    );

    return () => {
      actif = false;
      abonnement.subscription.unsubscribe();
    };
  }, []);

  const classes =
    variante === "liste"
      ? "block rounded-md px-3 py-3 text-base font-medium text-white/75"
      : "inline-flex h-10 items-center rounded-lg border border-white/20 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10";

  // Pendant la vérification : une place vide de la même taille (évite que la barre « saute »).
  if (etat === "inconnu") {
    return (
      <span
        aria-hidden="true"
        className={variante === "liste" ? "block h-12" : "inline-block h-10 w-28"}
      />
    );
  }

  return etat === "connecte" ? (
    <Link href="/compte" className={classes}>
      Mon compte
    </Link>
  ) : (
    <Link href="/connexion" className={classes}>
      Connexion
    </Link>
  );
}
