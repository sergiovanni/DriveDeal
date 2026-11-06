"use client";

import { useActionState } from "react";
import { Bouton } from "@/components/ui/Button";
import { envoyerMessage } from "@/modules/contact/actions";
import { etatInitial } from "@/modules/contact/etat";
import { SUJETS } from "@/modules/contact/validation";

const champ =
  "h-11 w-full rounded-lg border border-gris-300 bg-white px-3 text-sm text-gris-900 aria-[invalid=true]:border-red-500";
const etiquette = "mb-1 block text-sm font-semibold text-gris-700";

function Erreur({ id, texte }: { id: string; texte?: string }) {
  if (!texte) return null;
  return (
    <p id={id} className="mt-1 text-xs font-medium text-red-600">
      {texte}
    </p>
  );
}

type Props = {
  /** Faux si la base n'est pas configurée : le formulaire est alors désactivé. */
  actif: boolean;
  sujetInitial?: string;
  vehiculeInitial?: string;
};

export function FormulaireContact({ actif, sujetInitial, vehiculeInitial }: Props) {
  const [etat, action, enCours] = useActionState(envoyerMessage, etatInitial);

  if (etat.statut === "succes") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center"
      >
        <h2 className="text-xl font-bold text-succes">Message envoyé</h2>
        <p className="mt-2 text-gris-700">{etat.message}</p>
      </div>
    );
  }

  const v = etat.valeurs ?? {};
  const e = etat.erreurs ?? {};

  return (
    <form
      action={action}
      noValidate
      className="space-y-5"
      aria-describedby="retour-formulaire"
    >
      {etat.statut === "erreur" && etat.message && (
        <p
          id="retour-formulaire"
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {etat.message}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="nom" className={etiquette}>
            Nom complet *
          </label>
          <input
            id="nom"
            name="nom"
            autoComplete="name"
            required
            defaultValue={v.nom}
            aria-invalid={Boolean(e.nom)}
            aria-describedby={e.nom ? "err-nom" : undefined}
            className={champ}
          />
          <Erreur id="err-nom" texte={e.nom} />
        </div>
        <div>
          <label htmlFor="email" className={etiquette}>
            Adresse e-mail *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={v.email}
            aria-invalid={Boolean(e.email)}
            aria-describedby={e.email ? "err-email" : undefined}
            className={champ}
          />
          <Erreur id="err-email" texte={e.email} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="telephone" className={etiquette}>
            Téléphone (facultatif)
          </label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            autoComplete="tel"
            defaultValue={v.telephone}
            aria-invalid={Boolean(e.telephone)}
            aria-describedby={e.telephone ? "err-telephone" : undefined}
            className={champ}
          />
          <Erreur id="err-telephone" texte={e.telephone} />
        </div>
        <div>
          <label htmlFor="sujet" className={etiquette}>
            Sujet *
          </label>
          <select
            id="sujet"
            name="sujet"
            required
            defaultValue={v.sujet ?? sujetInitial ?? ""}
            aria-invalid={Boolean(e.sujet)}
            aria-describedby={e.sujet ? "err-sujet" : undefined}
            className={champ}
          >
            <option value="" disabled>
              Choisissez un sujet
            </option>
            {SUJETS.map((s) => (
              <option key={s.valeur} value={s.valeur}>
                {s.libelle}
              </option>
            ))}
          </select>
          <Erreur id="err-sujet" texte={e.sujet} />
        </div>
      </div>

      <div>
        <label htmlFor="vehicule" className={etiquette}>
          Référence du véhicule (facultatif)
        </label>
        <input
          id="vehicule"
          name="vehicule"
          placeholder="Ex. DD-0004"
          defaultValue={v.vehicule ?? vehiculeInitial}
          className={champ}
        />
      </div>

      <div>
        <label htmlFor="message" className={etiquette}>
          Votre message *
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          defaultValue={v.message}
          aria-invalid={Boolean(e.message)}
          aria-describedby={e.message ? "err-message" : undefined}
          className="w-full rounded-lg border border-gris-300 bg-white px-3 py-2 text-sm text-gris-900 aria-[invalid=true]:border-red-500"
        />
        <Erreur id="err-message" texte={e.message} />
      </div>

      {/* Champ piège anti-robots : masqué pour les humains. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="site_web">Ne pas remplir</label>
        <input id="site_web" name="site_web" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm text-gris-700">
          <input
            type="checkbox"
            name="consentement"
            required
            aria-invalid={Boolean(e.consentement)}
            className="mt-0.5 h-4 w-4 rounded border-gris-300"
          />
          <span>
            J’accepte que mes données soient utilisées pour répondre à ma demande. *
          </span>
        </label>
        <Erreur id="err-consentement" texte={e.consentement} />
      </div>

      {!actif && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-alerte">
          L’envoi de messages sera activé dès que la base de données sera connectée.
        </p>
      )}

      <Bouton type="submit" taille="lg" disabled={!actif || enCours}>
        {enCours ? "Envoi en cours…" : "Envoyer le message"}
      </Bouton>
    </form>
  );
}
