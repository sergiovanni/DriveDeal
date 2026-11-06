/**
 * Schéma de la base de données (Drizzle) : point d'entrée unique.
 *
 * Les tables sont réparties par domaine (docs/06-modele-de-donnees.md) et ajoutées module
 * par module, après validation des règles métier concernées (docs/08).
 * Les commandes, paiements et factures ne sont PAS encore définis : ils dépendent de
 * décisions métier en attente (TVA, acompte, remboursement…).
 *
 * Pour modifier le schéma : voir docs/09-guide-mise-en-route.md, « Modifier le schéma plus tard ».
 */
export * from "./catalogue";
export * from "./comptes";
export * from "./constantes";
export * from "./contact";
export * from "./favoris";
