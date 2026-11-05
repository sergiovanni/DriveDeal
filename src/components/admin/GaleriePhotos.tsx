"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import {
  deplacerPhotoAction,
  enregistrerPhotoAction,
  preparerEnvoiPhotoAction,
  supprimerPhotoAction,
} from "@/modules/vehicles/admin/photos-actions";
import {
  BUCKET_PHOTOS,
  NOMBRE_MAX_PHOTOS,
  TYPES_PHOTO_ACCEPTES,
  erreurFichierPhoto,
} from "@/modules/vehicles/admin/photos-regles";

export type PhotoAffichee = { id: string; url: string; alt: string };

type Props = {
  vehiculeId: string;
  photos: PhotoAffichee[];
  /** Vrai si le véhicule est réservé ou vendu : plus de modification possible. */
  desactive: boolean;
};

type Reponse = { ok: true } | { ok: false; erreur: string };

/**
 * Galerie photo de l'administration : envoi, ordre et suppression.
 *
 * Envoi en 3 temps (voir photos-actions.ts) : le serveur autorise, le navigateur envoie la photo
 * DIRECTEMENT à Supabase, le serveur enregistre. Les contrôles faits ici (type, taille) ne sont
 * qu'un confort : le serveur et Supabase les REFONT, car le navigateur peut être contourné.
 */
export function GaleriePhotos({ vehiculeId, photos, desactive }: Props) {
  const router = useRouter();
  const champFichier = useRef<HTMLInputElement>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [actionEnCours, lancerAction] = useTransition();

  async function envoyer(fichiers: File[]) {
    setEnvoiEnCours(true);
    setMessages([]);
    const erreurs: string[] = [];
    const supabase = creerClientSupabaseNavigateur();

    // Les photos partent l'une après l'autre : plus simple et plus fiable sur une connexion lente.
    for (const fichier of fichiers) {
      const probleme = erreurFichierPhoto({ type: fichier.type, taille: fichier.size });
      if (probleme) {
        erreurs.push(`${fichier.name} : ${probleme}`);
        continue;
      }
      const preparation = await preparerEnvoiPhotoAction({
        vehiculeId,
        type: fichier.type,
        taille: fichier.size,
      });
      if (!preparation.ok) {
        erreurs.push(`${fichier.name} : ${preparation.erreur}`);
        continue;
      }
      const { error } = await supabase.storage
        .from(BUCKET_PHOTOS)
        .uploadToSignedUrl(preparation.cle, preparation.token, fichier, {
          contentType: fichier.type,
        });
      if (error) {
        erreurs.push(`${fichier.name} : envoi refusé par le stockage.`);
        continue;
      }
      const enregistrement = await enregistrerPhotoAction({
        vehiculeId,
        cle: preparation.cle,
      });
      if (!enregistrement.ok) erreurs.push(`${fichier.name} : ${enregistrement.erreur}`);
    }

    setMessages(erreurs);
    setEnvoiEnCours(false);
    if (champFichier.current) champFichier.current.value = "";
    router.refresh();
  }

  function executer(action: () => Promise<Reponse>) {
    setMessages([]);
    lancerAction(async () => {
      const reponse = await action();
      if (!reponse.ok) setMessages([reponse.erreur]);
      router.refresh();
    });
  }

  const complet = photos.length >= NOMBRE_MAX_PHOTOS;

  return (
    <div className="rounded-2xl border border-gris-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold text-gris-900">Photos</h2>
        <p className="text-xs text-gris-500">
          {photos.length} / {NOMBRE_MAX_PHOTOS}
        </p>
      </div>
      <p className="mt-1 text-xs text-gris-500">
        La première photo est la photo principale. JPEG, PNG ou WebP, 5 Mo maximum.
      </p>

      {messages.length > 0 && (
        <ul
          role="alert"
          className="mt-3 space-y-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
        >
          {messages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}

      {photos.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {photos.map((p, i) => (
            <li key={p.id} className="overflow-hidden rounded-lg border border-gris-200">
              {/* Aperçu : image publique du stockage (inutile de l'optimiser dans l'administration). */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.alt}
                loading="lazy"
                className="aspect-4/3 w-full bg-gris-100 object-cover"
              />
              <div className="flex items-center justify-between gap-1 bg-gris-50 px-2 py-1.5 text-xs">
                <span className="font-semibold text-gris-700">
                  {i === 0 ? "Principale" : `Photo ${i + 1}`}
                </span>
                {!desactive && (
                  <span className="flex gap-1">
                    <button
                      type="button"
                      aria-label="Monter la photo"
                      disabled={i === 0 || actionEnCours}
                      onClick={() => executer(() => deplacerPhotoAction(p.id, "haut"))}
                      className="rounded px-1.5 py-0.5 font-bold hover:bg-gris-200 disabled:opacity-30"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      aria-label="Descendre la photo"
                      disabled={i === photos.length - 1 || actionEnCours}
                      onClick={() => executer(() => deplacerPhotoAction(p.id, "bas"))}
                      className="rounded px-1.5 py-0.5 font-bold hover:bg-gris-200 disabled:opacity-30"
                    >
                      →
                    </button>
                    <button
                      type="button"
                      aria-label="Supprimer la photo"
                      disabled={actionEnCours}
                      onClick={() => {
                        if (window.confirm("Supprimer cette photo ?")) {
                          executer(() => supprimerPhotoAction(p.id));
                        }
                      }}
                      className="rounded px-1.5 py-0.5 font-bold text-red-600 hover:bg-red-50 disabled:opacity-30"
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!desactive && (
        <div className="mt-4">
          <label
            htmlFor="champ-photos"
            className={`flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gris-300 px-4 py-6 text-center text-sm font-semibold text-bleu-600 hover:bg-bleu-50 ${
              envoiEnCours || complet ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {envoiEnCours ? "Envoi en cours…" : "+ Ajouter des photos"}
          </label>
          <input
            ref={champFichier}
            id="champ-photos"
            type="file"
            multiple
            accept={TYPES_PHOTO_ACCEPTES.join(",")}
            disabled={envoiEnCours || complet}
            onChange={(e) => {
              const fichiers = Array.from(e.target.files ?? []);
              if (fichiers.length > 0) void envoyer(fichiers);
            }}
            className="sr-only"
          />
        </div>
      )}
    </div>
  );
}
