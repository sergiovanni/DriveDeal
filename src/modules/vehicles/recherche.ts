import type { Vehicule } from "./types";

export const TAILLE_PAGE = 6;
export const TAILLES_PAGE = [6, 12, 24] as const;

export type Tri = "recents" | "prix-asc" | "prix-desc" | "km-asc" | "annee-desc";

export const optionsTri: { valeur: Tri; libelle: string }[] = [
  { valeur: "recents", libelle: "Plus récents" },
  { valeur: "prix-asc", libelle: "Prix croissant" },
  { valeur: "prix-desc", libelle: "Prix décroissant" },
  { valeur: "km-asc", libelle: "Kilométrage croissant" },
  { valeur: "annee-desc", libelle: "Année la plus récente" },
];

export type Filtres = {
  q?: string;
  marque?: string;
  carburant?: string;
  transmission?: string;
  carrosserie?: string;
  couleur?: string;
  /** Prix en euros (saisie utilisateur). */
  prixMin?: number;
  prixMax?: number;
  anneeMin?: number;
  kmMax?: number;
  puissanceMin?: number;
  tri: Tri;
  page: number;
  parPage: number;
};

type ParamsBruts = Record<string, string | string[] | undefined>;

function texte(valeur: string | string[] | undefined): string | undefined {
  const v = Array.isArray(valeur) ? valeur[0] : valeur;
  const propre = v?.trim();
  return propre ? propre : undefined;
}

function nombre(valeur: string | string[] | undefined): number | undefined {
  const t = texte(valeur);
  if (t === undefined) return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Convertit les paramètres d'URL (non fiables) en filtres valides. */
export function lireFiltres(params: ParamsBruts): Filtres {
  const triBrut = texte(params.tri);
  const tri = optionsTri.some((o) => o.valeur === triBrut) ? (triBrut as Tri) : "recents";
  const page = Math.max(1, Math.floor(nombre(params.page) ?? 1));
  const parPageBrut = nombre(params.parPage);
  const parPage = TAILLES_PAGE.find((t) => t === parPageBrut) ?? TAILLE_PAGE;

  return {
    q: texte(params.q),
    marque: texte(params.marque),
    carburant: texte(params.carburant),
    transmission: texte(params.transmission),
    carrosserie: texte(params.carrosserie),
    couleur: texte(params.couleur),
    prixMin: nombre(params.prixMin),
    prixMax: nombre(params.prixMax),
    anneeMin: nombre(params.anneeMin),
    kmMax: nombre(params.kmMax),
    puissanceMin: nombre(params.puissanceMin),
    tri,
    page,
    parPage,
  };
}

/** Pastilles de filtres actifs : le paramètre d'URL à retirer et son libellé. */
export type FiltreActif = { cle: string; libelle: string };

export function filtresActifs(f: Filtres): FiltreActif[] {
  const actifs: FiltreActif[] = [];
  if (f.q) actifs.push({ cle: "q", libelle: `Recherche : ${f.q}` });
  if (f.marque) actifs.push({ cle: "marque", libelle: `Marque : ${f.marque}` });
  if (f.carrosserie)
    actifs.push({ cle: "carrosserie", libelle: `Carrosserie : ${f.carrosserie}` });
  if (f.carburant)
    actifs.push({ cle: "carburant", libelle: `Carburant : ${f.carburant}` });
  if (f.transmission)
    actifs.push({ cle: "transmission", libelle: `Transmission : ${f.transmission}` });
  if (f.couleur) actifs.push({ cle: "couleur", libelle: `Couleur : ${f.couleur}` });
  if (f.prixMin !== undefined)
    actifs.push({ cle: "prixMin", libelle: `Prix ≥ ${f.prixMin} €` });
  if (f.prixMax !== undefined)
    actifs.push({ cle: "prixMax", libelle: `Prix ≤ ${f.prixMax} €` });
  if (f.anneeMin !== undefined)
    actifs.push({ cle: "anneeMin", libelle: `Année ≥ ${f.anneeMin}` });
  if (f.kmMax !== undefined) actifs.push({ cle: "kmMax", libelle: `Km ≤ ${f.kmMax}` });
  if (f.puissanceMin !== undefined)
    actifs.push({ cle: "puissanceMin", libelle: `Puissance ≥ ${f.puissanceMin} ch` });
  return actifs;
}

/** Construit l'URL du catalogue à partir de paramètres, en ignorant les valeurs vides. */
export function urlCatalogue(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(params)) {
    if (valeur) q.set(cle, valeur);
  }
  const s = q.toString();
  return s ? `/vehicules?${s}` : "/vehicules";
}

const normaliser = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export function filtrerVehicules(vehicules: Vehicule[], f: Filtres): Vehicule[] {
  const q = f.q ? normaliser(f.q) : undefined;
  return vehicules.filter((v) => {
    if (v.statut !== "publie") return false;
    if (q && !normaliser(`${v.marque} ${v.modele} ${v.version}`).includes(q))
      return false;
    if (f.marque && v.marque !== f.marque) return false;
    if (f.carburant && v.carburant !== f.carburant) return false;
    if (f.transmission && v.transmission !== f.transmission) return false;
    if (f.carrosserie && v.carrosserie !== f.carrosserie) return false;
    if (f.couleur && v.couleur !== f.couleur) return false;
    if (f.prixMin !== undefined && v.prixCentimes < f.prixMin * 100) return false;
    if (f.prixMax !== undefined && v.prixCentimes > f.prixMax * 100) return false;
    if (f.anneeMin !== undefined && v.annee < f.anneeMin) return false;
    if (f.kmMax !== undefined && v.kilometrage > f.kmMax) return false;
    if (f.puissanceMin !== undefined && v.puissanceCh < f.puissanceMin) return false;
    return true;
  });
}

export function trierVehicules(vehicules: Vehicule[], tri: Tri): Vehicule[] {
  const copie = [...vehicules];
  switch (tri) {
    case "prix-asc":
      return copie.sort((a, b) => a.prixCentimes - b.prixCentimes);
    case "prix-desc":
      return copie.sort((a, b) => b.prixCentimes - a.prixCentimes);
    case "km-asc":
      return copie.sort((a, b) => a.kilometrage - b.kilometrage);
    case "annee-desc":
      return copie.sort((a, b) => b.annee - a.annee);
    default:
      return copie.sort((a, b) => b.publieLe.localeCompare(a.publieLe));
  }
}

export type Resultat = {
  vehicules: Vehicule[];
  total: number;
  page: number;
  pages: number;
};

export function rechercher(vehicules: Vehicule[], f: Filtres): Resultat {
  const filtres = trierVehicules(filtrerVehicules(vehicules, f), f.tri);
  const pages = Math.max(1, Math.ceil(filtres.length / f.parPage));
  const page = Math.min(f.page, pages);
  const debut = (page - 1) * f.parPage;
  return {
    vehicules: filtres.slice(debut, debut + f.parPage),
    total: filtres.length,
    page,
    pages,
  };
}

/** Valeurs distinctes d'un champ, pour alimenter les listes de filtres. */
export function valeursDistinctes(
  vehicules: Vehicule[],
  champ: keyof Vehicule,
): string[] {
  return [
    ...new Set(
      vehicules.filter((v) => v.statut === "publie").map((v) => String(v[champ])),
    ),
  ].sort((a, b) => a.localeCompare(b, "fr"));
}

/** Véhicules similaires : même carrosserie ou même marque, hors véhicule courant (à valider, docs/08 Q-12). */
export function vehiculesSimilaires(
  vehicules: Vehicule[],
  courant: Vehicule,
  max = 3,
): Vehicule[] {
  return vehicules
    .filter((v) => v.statut === "publie" && v.id !== courant.id)
    .map((v) => ({
      v,
      score:
        (v.carrosserie === courant.carrosserie ? 2 : 0) +
        (v.marque === courant.marque ? 1 : 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.v);
}
