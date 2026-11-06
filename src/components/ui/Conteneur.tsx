/**
 * Conteneur centré à largeur maximale.
 * Toutes les sections l'utilisent pour partager les mêmes marges latérales :
 * 16 px sur mobile, 24 px sur tablette, 32 px sur grand écran.
 */
export function Conteneur({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
