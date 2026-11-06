import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Métadonnées par défaut : le titre de chaque page est complété par « | DriveDeal ».
export const metadata: Metadata = {
  title: {
    default: "DriveDeal — Véhicules d'occasion en ligne",
    template: "%s | DriveDeal",
  },
  description:
    "Trouvez, réservez et achetez votre véhicule d'occasion en ligne : catalogue détaillé, paiement sécurisé et documents disponibles dans votre espace.",
};

/**
 * Mise en page racine, commune à toutes les pages :
 * police Inter, métadonnées par défaut (titre « … | DriveDeal »), en-tête et pied de page.
 * `lang="fr"` indique la langue aux navigateurs et aux lecteurs d'écran.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
