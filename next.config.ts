import type { NextConfig } from "next";

/**
 * En-têtes de sécurité envoyés avec toutes les pages (docs/11, défaut E3).
 *
 * Volontairement ABSENT pour l'instant : la politique de contenu (Content-Security-Policy).
 * Avec Next.js elle demande des « nonces » par requête (ce qui rend toutes les pages
 * dynamiques) : sujet traité à part, voir docs/08 (décision T-12).
 */
const entetesSecurite = [
  // Empêche le navigateur de « deviner » le type d'un fichier (attaques par faux fichiers).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // N'envoie aux autres sites que le nom de domaine, jamais l'adresse complète.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Interdit d'afficher le site dans un cadre d'un autre site (détournement de clics).
  { key: "X-Frame-Options", value: "DENY" },
  // Désactive les capteurs et le paiement du navigateur, dont le site n'a pas besoin.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Force HTTPS pendant 2 ans (ignoré en http local).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Ne pas annoncer la technologie du serveur.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: entetesSecurite }];
  },
};

export default nextConfig;
