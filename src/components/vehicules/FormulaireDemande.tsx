"use client";

import { useActionState } from "react";
import { Bouton } from "@/components/ui/Button";
import { TELEPHONE_AFFICHE, TELEPHONE_LIEN } from "@/lib/entreprise";
import { envoyerDemande } from "@/modules/demandes/actions";
import { etatDemandeInitial } from "@/modules/demandes/etat";

const champ =
  "h-11 w-full rounded-lg border border-gris-300 bg-white px-3 text-sm text-gris-900 aria-[invalid=true]:border-red-500";
const etiquette = "mb-1 block text-xs font-semibold text-gris-700";

function Erreur({ id, texte }: { id: string; texte?: string }) {
  if (!texte) return null;
  return (
    <p id={id} className="mt-1 text-xs font-medium text-red-600">
      {texte}
    </p>
  );
}

type Props = {
  vehiculeId: string;
  /** Faux si la base n'est pas configurée : le formulaire est alors désactivé et expliqué. */
  actif: boolean;
};

/**
 * Formulaire « Faire une demande » de la fiche véhicule (remplace l'achat en ligne).
 * Le visiteur laisse ses coordonnées ; l'entreprise le recontacte pour discuter.
 *
 * - `useActionState` relie le formulaire à l'action serveur `envoyerDemande` ;
 * - la validation est faite côté serveur, les erreurs s'affichent sous chaque champ ;
 * - les valeurs saisies sont conservées en cas d'erreur ;
 * - champ piège invisible (`site_web`) contre les robots ;
 * - le numéro de téléphone de l'entreprise est affiché pour appeler directement.
 */
export function FormulaireDemande({ vehiculeId, actif }: Props) {
  const [etat, action, enCours] = useActionState(envoyerDemande, etatDemandeInitial);
  const v = etat.valeurs ?? {};
  const e = etat.erreurs ?? {};

  const blocTelephone = (
    <p className="text-sm text-gris-700">
      Vous préférez en parler ? Appelez-nous :{" "}
      <a
        href={TELEPHONE_LIEN}
        className="font-bold text-bleu-600 underline-offset-2 hover:underline"
      >
        {TELEPHONE_AFFICHE}
      </a>
    </p>
  );

  if (etat.statut === "succes") {
    return (
      <div
        role="status"
        className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center"
      >
        <h3 className="text-lg font-bold text-succes">Demande envoyée</h3>
        <p className="text-sm text-gris-700">{etat.message}</p>
        {blocTelephone}
      </div>
    );
  }

  return (
    <form action={action} noValidate className="space-y-4" aria-describedby="retour-demande">
      <div>
        <h3 className="text-lg font-bold text-gris-900">Ce véhicule vous intéresse ?</h3>
        <p className="mt-1 text-sm text-gris-500">
          Laissez-nous vos coordonnées : nous vous recontactons pour en discuter.
        </p>
      </div>

      {!actif && (
        <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-alerte">
          L’envoi de demandes n’est pas encore disponible sur cette version du site.
        </p>
      )}

      {etat.statut === "erreur" && etat.message && (
        <p
          id="retour-demande"
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
        >
          {etat.message}
        </p>
      )}

      <input type="hidden" name="vehiculeId" value={vehiculeId} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div>
          <label htmlFor="demande-prenom" className={etiquette}>
            Prénom *
          </label>
          <input
            id="demande-prenom"
            name="prenom"
            autoComplete="given-name"
            required
            defaultValue={v.prenom}
            aria-invalid={Boolean(e.prenom)}
            aria-describedby={e.prenom ? "err-demande-prenom" : undefined}
            className={champ}
          />
          <Erreur id="err-demande-prenom" texte={e.prenom} />
        </div>
        <div>
          <label htmlFor="demande-nom" className={etiquette}>
            Nom *
          </label>
          <input
            id="demande-nom"
            name="nom"
            autoComplete="family-name"
            required
            defaultValue={v.nom}
            aria-invalid={Boolean(e.nom)}
            aria-describedby={e.nom ? "err-demande-nom" : undefined}
            className={champ}
          />
          <Erreur id="err-demande-nom" texte={e.nom} />
        </div>
      </div>

      <div>
        <label htmlFor="demande-email" className={etiquette}>
          Adresse e-mail *
        </label>
        <input
          id="demande-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={v.email}
          aria-invalid={Boolean(e.email)}
          aria-describedby={e.email ? "err-demande-email" : undefined}
          className={champ}
        />
        <Erreur id="err-demande-email" texte={e.email} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div>
          <label htmlFor="demande-telephone" className={etiquette}>
            Téléphone (facultatif)
          </label>
          <input
            id="demande-telephone"
            name="telephone"
            type="tel"
            autoComplete="tel"
            defaultValue={v.telephone}
            aria-invalid={Boolean(e.telephone)}
            aria-describedby={e.telephone ? "err-demande-telephone" : undefined}
            className={champ}
          />
          <Erreur id="err-demande-telephone" texte={e.telephone} />
        </div>
        <div>
          <label htmlFor="demande-cp" className={etiquette}>
            Code postal *
          </label>
          <input
            id="demande-cp"
            name="codePostal"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            required
            defaultValue={v.codePostal}
            aria-invalid={Boolean(e.codePostal)}
            aria-describedby={e.codePostal ? "err-demande-cp" : undefined}
            className={champ}
          />
          <Erreur id="err-demande-cp" texte={e.codePostal} />
        </div>
      </div>

      {/* Champ piège anti-robots : masqué pour les humains. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="demande-site-web">Ne pas remplir</label>
        <input id="demande-site-web" name="site_web" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className="flex items-start gap-3 text-xs text-gris-700">
          <input
            type="checkbox"
            name="consentement"
            required
            aria-invalid={Boolean(e.consentement)}
            className="mt-0.5 h-4 w-4 rounded border-gris-300"
          />
          <span>
            J’accepte que mes données soient utilisées pour être recontacté à propos de ce
            véhicule. *
          </span>
        </label>
        <Erreur id="err-demande-consentement" texte={e.consentement} />
      </div>

      <Bouton type="submit" taille="lg" className="w-full" disabled={!actif || enCours}>
        {enCours ? "Envoi en cours…" : "Envoyer la demande"}
      </Bouton>

      {blocTelephone}
    </form>
  );
}
