import { BoutonLien } from "@/components/ui/Button";
import { Conteneur } from "@/components/ui/Conteneur";

export default function Accueil() {
  return (
    <section className="bg-marine-900 py-24 text-white">
      <Conteneur className="space-y-6">
        <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          Trouvez votre prochain véhicule d’occasion.
        </h1>
        <p className="max-w-xl text-lg text-white/70">
          Le catalogue DriveDeal arrive bientôt.
        </p>
        <BoutonLien href="/vehicules" taille="lg">
          Voir les véhicules
        </BoutonLien>
      </Conteneur>
    </section>
  );
}
