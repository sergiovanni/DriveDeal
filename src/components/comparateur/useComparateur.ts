"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  MAX_COMPARAISON,
  ajouter as ajouterRegle,
  nettoyerSelection,
  retirer as retirerRegle,
  type ElementComparaison,
  type ResultatAjout,
} from "@/modules/comparateur/regles";

/**
 * Sélection du comparateur, partagée entre TOUS les composants de la page (cartes, barre
 * flottante, page de comparaison) et conservée dans le navigateur (localStorage), donc
 * encore là quand on change de page ou qu'on rouvre le site.
 *
 * Technique : un petit « store » externe lu avec `useSyncExternalStore` (le moyen prévu
 * par React pour ça). Avantages : pas de fournisseur à placer dans la mise en page,
 * pas de décalage entre serveur et navigateur (le serveur voit toujours une sélection vide).
 *
 * Le stockage du navigateur peut être indisponible (navigation privée, blocage) : tout
 * est protégé par try/catch et la sélection reste alors simplement en mémoire.
 */

const CLE_STOCKAGE = "drivedeal:comparateur";
/** Valeur vue par le serveur : toujours vide, et toujours le MÊME objet (exigé par React). */
const SELECTION_VIDE: ElementComparaison[] = [];

let selectionCourante: ElementComparaison[] = SELECTION_VIDE;
let charge = false;
const ecouteurs = new Set<() => void>();

function lireStockage(): ElementComparaison[] {
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE);
    return brut ? nettoyerSelection(JSON.parse(brut)) : SELECTION_VIDE;
  } catch {
    return SELECTION_VIDE;
  }
}

function prevenir() {
  ecouteurs.forEach((f) => f());
}

function ecrire(selection: ElementComparaison[]) {
  selectionCourante = selection.length === 0 ? SELECTION_VIDE : selection;
  try {
    window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(selectionCourante));
  } catch {
    // Stockage indisponible : la sélection vit seulement dans cette page.
  }
  prevenir();
}

function lireSelection(): ElementComparaison[] {
  if (!charge) {
    selectionCourante = lireStockage();
    charge = true;
  }
  return selectionCourante;
}

function surStockage(e: StorageEvent) {
  // Une autre fenêtre a modifié la sélection : on se met à jour.
  if (e.key === CLE_STOCKAGE || e.key === null) {
    selectionCourante = lireStockage();
    prevenir();
  }
}

function sAbonner(rappel: () => void) {
  ecouteurs.add(rappel);
  if (ecouteurs.size === 1) window.addEventListener("storage", surStockage);
  return () => {
    ecouteurs.delete(rappel);
    if (ecouteurs.size === 0) window.removeEventListener("storage", surStockage);
  };
}

export function useComparateur() {
  const selection = useSyncExternalStore(sAbonner, lireSelection, () => SELECTION_VIDE);

  /** Ajoute un véhicule ; le résultat permet d'expliquer à l'utilisateur ce qui s'est passé. */
  const ajouter = useCallback((element: ElementComparaison): ResultatAjout => {
    const { selection: suite, resultat } = ajouterRegle(lireSelection(), element);
    if (resultat === "ajoute") ecrire(suite);
    return resultat;
  }, []);

  const retirer = useCallback((id: string) => {
    ecrire(retirerRegle(lireSelection(), id));
  }, []);

  const vider = useCallback(() => ecrire([]), []);

  /** Aligne la sélection sur une liste donnée (page de comparaison ouverte depuis un lien). */
  const remplacer = useCallback((elements: ElementComparaison[]) => {
    const actuels = lireSelection();
    const memes =
      actuels.length === elements.length && actuels.every((e, i) => e.id === elements[i].id);
    if (!memes) ecrire(nettoyerSelection(elements));
  }, []);

  return {
    selection,
    ids: selection.map((e) => e.id),
    plein: selection.length >= MAX_COMPARAISON,
    ajouter,
    retirer,
    vider,
    remplacer,
  };
}
