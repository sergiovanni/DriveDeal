/**
 * Réglage d'affichage des photos : optimisation par Next.js, ou chargement direct.
 *
 * Par défaut, les photos passent par l'optimiseur d'images de Next.js (taille adaptée à l'écran,
 * format moderne). Sur certains réseaux locaux « IPv6 seul » (DNS64), l'adresse de Supabase est
 * traduite en IPv6 « 64:ff9b::… » que Next.js prend à tort pour une adresse privée : il refuse
 * alors d'optimiser les photos (« "url" parameter is not allowed ») et elles n'apparaissent pas.
 *
 * Dans ce cas, et SEULEMENT en local, on peut demander le chargement DIRECT des photos depuis le
 * stockage public de Supabase :   NEXT_PUBLIC_IMAGES_NON_OPTIMISEES=oui   dans .env.local.
 *
 * Ce réglage ne désactive aucune protection : le contrôle d'adresse de Next.js reste actif, et
 * les photos du bucket public sont de toute façon lisibles par tout le monde. Il ne doit pas être
 * utilisé en production (Vercel n'en a pas besoin et perdrait l'optimisation).
 *
 * La variable doit commencer par NEXT_PUBLIC_ et être écrite en toutes lettres : c'est ce qui
 * permet à Next.js de la transmettre aussi au code exécuté dans le navigateur.
 */
export const IMAGES_NON_OPTIMISEES =
  process.env.NEXT_PUBLIC_IMAGES_NON_OPTIMISEES === "oui";
