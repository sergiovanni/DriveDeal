"use client";

import {
  MESSAGE_LIMITE,
  MESSAGE_LIMITE_AIDE,
  type ElementComparaison,
} from "@/modules/comparateur/regles";
import { useComparateur } from "./useComparateur";

type Props = {
  element: ElementComparaison;
  /** « carte » : petite pastille posée sur la photo ; « fiche » : bouton large avec explication. */
  variante?: "carte" | "fiche";
  className?: string;
};

/**
 * Bouton « Comparer » d'un véhicule.
 *
 * Trois états, toujours explicites (jamais de remplacement silencieux) :
 *  - pas encore choisi        → « Comparer » (ajoute) ;
 *  - déjà dans la sélection   → « Dans le comparateur » (un clic le retire) ;
 *  - 3 véhicules déjà choisis → bouton désactivé qui explique la limite.
 *
 * Le bouton est un vrai <button> avec `aria-pressed` : lisible par les lecteurs d'écran.
 */
export function BoutonComparer({ element, variante = "carte", className = "" }: Props) {
  const { ids, plein, ajouter, retirer } = useComparateur();
  const choisi = ids.includes(element.id);
  const bloque = plein && !choisi;
  const explication = `${MESSAGE_LIMITE} ${MESSAGE_LIMITE_AIDE}`;

  const surClic = () => (choisi ? retirer(element.id) : ajouter(element));

  if (variante === "fiche") {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={surClic}
          disabled={bloque}
          aria-pressed={choisi}
          aria-describedby={bloque ? `limite-${element.id}` : undefined}
          className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
            choisi
              ? "border-bleu-600 bg-bleu-50 text-bleu-600"
              : "border-gris-300 bg-white text-gris-900 hover:bg-gris-50"
          }`}
        >
          {choisi ? "✓ Dans le comparateur" : bloque ? "Limite de 3 atteinte" : "+ Comparer ce véhicule"}
        </button>
        {bloque && (
          <p id={`limite-${element.id}`} className="mt-2 text-xs text-alerte">
            {explication}
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={surClic}
      disabled={bloque}
      aria-pressed={choisi}
      title={bloque ? explication : undefined}
      aria-label={
        choisi
          ? `Retirer ${element.titre} du comparateur`
          : bloque
            ? `${element.titre} : ${explication}`
            : `Ajouter ${element.titre} au comparateur`
      }
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-bold shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
        choisi
          ? "border-bleu-600 bg-bleu-600 text-white"
          : "border-white/60 bg-white/95 text-marine-900 hover:bg-white"
      } ${className}`}
    >
      <span aria-hidden="true">{choisi ? "✓" : "+"}</span>
      {choisi ? "Comparé" : bloque ? "Limite atteinte" : "Comparer"}
    </button>
  );
}
