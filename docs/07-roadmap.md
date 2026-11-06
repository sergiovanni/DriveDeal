# 07 — Roadmap et backlog

> Statut : **proposition v0.1.** L'ordre suit le cadrage (§12 Phase 3) et peut être ajusté après validation de l'architecture. Chaque module n'est « terminé » qu'avec ses tests et la mise à jour de la documentation.

## 1. Découpage en modules et dépendances

| Code | Module | Dépend de | Bloqué par une décision métier ? |
|---|---|---|---|
| M0 | Fondations (outillage, qualité, CI, config env, base, design system) | — | Non (hors choix de stack à valider) |
| M1 | Authentification et utilisateurs | M0 | Partiellement : vérification d'e-mail obligatoire avant achat ⏸, prestataire e-mail ⏸ |
| M2 | Gestion des véhicules (back-office) | M0, M1 (admin) | Champs obligatoires de publication ⏸ |
| M3 | Catalogue public | M2 | Non |
| M4 | Recherche et filtres | M3 | Non |
| M5 | Fiche détaillée | M3 | Frais complémentaires ⏸, affichage des véhicules réservés/vendus ⏸ |
| M6 | Espace client | M1 | Non |
| M7 | Favoris | M1, M5 | Non |
| M8 | Commandes (machine à états, réservation) | M2, M6 | **Oui** : statuts finaux, durée de réservation, annulation, retrait/livraison |
| M9 | Paiement | M8 | **Oui** : prestataire, acompte, remboursement |
| M10 | Facturation PDF | M8, M9 | **Oui** : statut juridique, TVA, numérotation |
| M11 | Notifications | M1, M8, M9 | Prestataire e-mail ⏸ (le mécanisme d'événements est indépendant) |
| M12 | Back-office complet | M2, M8, M9, M10 | Dépend des modules ci-dessus |
| M13 | Tableau de bord | M8, M9, M12 | Définition du CA ⏸ |
| M14 | Tests de sécurité, recette, déploiement | Tous | Hébergement ⏸ |

```
M0 → M1 → M2 → M3 → M4
              ↘ M5 → M7
M1 → M6
M2 + M6 → M8 → M9 → M10
M1 + M8 + M9 → M11
M2 + M8 + M9 + M10 → M12 → M13 → M14
```

## 2. Jalons

| Jalon | Contenu | Prérequis |
|---|---|---|
| J0 — Cadrage validé | Docs 01–08 relus, décisions de stack validées | Validation du porteur |
| J1 — Fondations | M0 | J0 |
| J2 — Catalogue exploitable | M1, M2, M3, M4, M5 | J1 |
| J3 — Espace client | M6, M7 | J2 |
| J4 — Parcours d'achat sans paiement réel | M8 (+ M9 en sandbox si prestataire choisi) | Décisions commandes ⏸ |
| J5 — Facturation et notifications | M10, M11 | Décisions fiscales ⏸ |
| J6 — Back-office et tableau de bord | M12, M13 | J4, J5 |
| J7 — Recette et mise en production | M14 | Hébergement, validation juridique ⏸ |

Aucune estimation de durée n'est donnée à ce stade : elle dépendra des décisions de stack et de l'équipe.

## 3. Backlog initial

### Faisables immédiatement (aucune décision métier non validée requise)
Condition : stack technique validée (doc 08, T-01 à T-05).

1. **F-01** Outillage : Prettier, scripts, TypeScript strict, Vitest, Playwright, CI.
2. **F-02** Structure de dossiers modulaire (`src/modules`, `src/lib`, `src/components`).
3. **F-03** Validation des variables d'environnement au démarrage ; `.env.example`.
4. **F-04** Connexion PostgreSQL, outil de migrations, base de test.
5. **F-05** Design system minimal (couleurs, typographie, boutons, champs, cartes, layout public et admin) — identité graphique provisoire ⏸ (I-14).
6. **F-06** Journalisation (logger), gestion d'erreurs, pages 404/500.
7. **F-07** Modèle `rôles/permissions` et squelette d'authentification (inscription, connexion, sessions, réinitialisation du mot de passe).
8. **F-08** Entités marques, modèles, véhicules, photos, équipements + CRUD back-office.
9. **F-09** Catalogue public, filtres, tri, pagination, fiche véhicule (sans bouton d'achat actif tant que M8 n'existe pas — pas de bouton factice).
10. **F-10** Favoris.
11. **F-11** Pages statiques du site (accueil, FAQ, services, contact) avec contenu provisoire clairement identifié.
12. **F-12** Mécanisme d'événements métier (outbox) et journal d'audit.
13. **F-13** Machine à états générique de commande et historique (statuts définitifs ⏸, donc implémentation derrière la validation doc 04).

### En attente de décisions (ne pas démarrer)
- **B-01** Intégration réelle du paiement (I-12, I-07, I-08).
- **B-02** Génération de facture définitive (I-02, I-11).
- **B-03** Durée de réservation et expiration (I-06).
- **B-04** Documents de cession / justificatifs (I-02, I-09, Q-07).
- **B-05** Conditions d'annulation/remboursement (I-08).
- **B-06** Envoi d'e-mails réels (I-13).
- **B-07** Textes légaux (CGV, mentions, confidentialité) — fournis par l'entreprise.
- **B-08** Déploiement production (I-15).

### Hors périmètre
Tout le chapitre marketplace (cadrage §11).

## 4. Critères de passage d'un module à « terminé »

1. Fonctionnalités conformes au doc 03 et aux règles du doc 04.
2. Tests unitaires + intégration adaptés ; E2E pour les parcours critiques.
3. Cas d'erreur et contrôles d'accès testés.
4. Documentation mise à jour (docs 03–08 concernés).
5. Aucune décision structurante non consignée.
