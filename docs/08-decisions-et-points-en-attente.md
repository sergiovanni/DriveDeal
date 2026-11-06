# 08 — Décisions et points en attente

> Document vivant : toute décision structurante, validée ou non, est consignée ici. Aucune information métier n'est inventée : les points **I-xx** sont à fournir par le porteur du projet. Dernière mise à jour : v0.1 (cadrage initial).

## 1. Informations métier à collecter (cadrage §15)

| ID | Information | Statut | Impact principal |
|---|---|---|---|
| I-01 | Nom commercial de la plateforme | ⏸ En attente | Branding, e-mails, CGV, factures |
| I-02 | Identité et statut juridique de l'entreprise (forme, SIRET, TVA intracom., capital…) | ⏸ En attente | Factures, mentions légales, TVA |
| I-03 | Mode d'approvisionnement des véhicules (rachat, dépôt-vente, enchères…) | ⏸ En attente | Propriété du véhicule, TVA, documents |
| I-04 | Gestion du stock physique (lieux, présentation, essai, disponibilité réelle) | ⏸ En attente | Statuts de stock, synchronisation, visites |
| I-05 | Politique de prix et frais supplémentaires (carte grise, préparation, livraison…) | ⏸ En attente | Récapitulatif, facture, `vehicle_fees` |
| I-06 | Modalités de réservation (durée, acompte, réservation avant visite) | ⏸ En attente | Machine à états, expiration |
| I-07 | Paiement intégral ou acompte | ⏸ En attente | Module paiement, facture, statuts |
| I-08 | Conditions d'annulation et de remboursement (dont droit de rétractation applicable) | ⏸ En attente | Commandes, remboursements, CGV |
| I-09 | Livraison ou retrait des véhicules | ⏸ En attente | Statuts post-paiement, notifications, frais |
| I-10 | Politique de garantie | ⏸ En attente | Fiche véhicule, CGV, documents |
| I-11 | Régime fiscal et TVA (TVA classique, TVA sur marge…) | ⏸ En attente | **Bloque la facturation définitive** |
| I-12 | Prestataire de paiement | ⏸ En attente | Intégration paiement |
| I-13 | Prestataire d'envoi d'e-mails | ⏸ En attente | Notifications |
| I-14 | Identité graphique et orientation UX/UI (références visuelles) | ⏸ En attente | Design system, maquettes |
| I-15 | Hébergement et environnement de production | ✅ Décidé : Vercel (hébergement) + Supabase (base). Restent à préciser : offres payantes, régions UE, nom de domaine | Déploiement, stockage, base |

## 2. Décisions techniques à valider

| ID | Sujet | Proposition | Alternatives | Statut |
|---|---|---|---|---|
| T-01 | Style d'architecture | Monolithe modulaire Next.js (modules métier isolés) | Frontend + API séparée | ⏸ À valider |
| T-02 | Base de données | Supabase (PostgreSQL) | — | ✅ Décidé par le porteur |
| T-03 | Accès aux données | ORM typé (Drizzle ou Prisma) | SQL brut / Kysely | ⏸ À valider |
| T-04 | Authentification | Supabase Auth (`@supabase/ssr`), rôles/permissions dans nos tables | Auth.js / Better Auth sur la base Supabase | ✅ Décidé par le porteur |
| T-05 | Tests | Vitest + Playwright | Jest + Cypress | ⏸ À valider |
| T-06 | Stockage de fichiers | Supabase Storage, fichiers privés via URL signées | S3, Vercel Blob | Proposé (cohérent avec Supabase) |
| T-10 | Tâches planifiées | Vercel Cron (expiration des réservations, outbox, réconciliation) | Service de files externe | Proposé |
| T-07 | Génération PDF | Bibliothèque PDF côté serveur | HTML→PDF navigateur headless | ⏸ À valider |
| T-08 | Langue / devise / pays | Français, EUR, France | Multilingue | ⏸ À confirmer |
| T-09 | Rôles | Modèle rôles ↔ permissions en base dès le départ | Rôle unique figé | Proposé (conforme au cadrage §4.3) |

Décisions **actées** par le cadrage (non à rediscuter) : conserver la stack Next.js existante ; marketplace hors MVP ; paiement non confirmé ≠ encaissé ; pas de facture à informations fiscales supposées.

## 3. Ambiguïtés et questions à clarifier

| ID | Question | Pourquoi c'est important |
|---|---|---|
| Q-01 | « Acheter » engage-t-il un achat ferme, ou une réservation avec validation par l'entreprise avant paiement ? | Change toute la machine à états (validation manuelle ou non) |
| Q-02 | Le montant complet d'un véhicule est-il réellement payé par carte en ligne ? Plafonds de carte et frais à étudier ; virement possible ? | Choix du prestataire et du parcours |
| Q-03 | Le droit de rétractation de 14 jours s'applique-t-il à ces ventes ? (dépend de la nature du vendeur et du mode de vente) | Annulation, remboursement, CGV |
| Q-04 | Le véhicule réservé/vendu reste-t-il visible publiquement (mention « vendu ») ou disparaît-il ? | Catalogue, SEO |
| Q-05 | Un client peut-il acheter sans vérifier son e-mail ? Faut-il vérifier l'identité (pièce d'identité) avant livraison ? | Sécurité, fraude, conformité |
| Q-06 | Faut-il gérer la reprise d'un ancien véhicule, le financement, l'assurance ? | Hors cadrage : à confirmer comme exclus |
| Q-07 | Quels « documents de cession et justificatifs réglementaires » doivent être produits, par qui, à quel moment ? | Module documents |
| Q-08 | Le chiffre d'affaires du tableau de bord : HT ou TTC ? Date de commande, de paiement ou de remise ? | Indicateurs |
| Q-09 | Combien de personnes administreront la plateforme, avec quels rôles dès le MVP ? | Permissions |
| Q-10 | Quelle langue pour l'interface et les documents ? Un seul pays ? | Internationalisation |
| Q-11 | Quels champs sont obligatoires pour publier un véhicule ? | Validation, qualité du catalogue |
| Q-12 | Critère des « véhicules similaires » (marque, carrosserie, budget) ? | Fiche véhicule |
| Q-13 | Combien de véhicules en stock prévus ? Volume de visiteurs attendu ? | Dimensionnement, hébergement |
| Q-14 | Le contact et la FAQ sont-ils gérés par l'administrateur (éditables) ou fixes ? | Périmètre du back-office |
| Q-15 | Qui rédige les textes légaux (CGV, mentions, confidentialité) et les contenus éditoriaux ? | Pages publiques |

## 4. Fonctionnalités incomplètes dans le cadrage

- « Gestion des catégories et marques » (§4.3) : les catégories ne sont pas définies (type de carrosserie ? segments ?).
- « Gestion des paramètres de la plateforme » : liste des paramètres non précisée.
- « Informations relatives à la remise du véhicule » (§9) : modalités inconnues (I-09).
- « Statistiques » : seuls les indicateurs listés sont couverts.
- Pas de besoin exprimé sur : SEO avancé, multilingue, chat, comparateur, alertes de nouveaux véhicules, avis clients, prise de rendez-vous / essai. **Non pris en compte** tant que non demandé.
- Reprise des données existantes (stock actuel, clients) : non mentionnée.

## 5. Journal des décisions

| Date | Décision | Auteur | Statut |
|---|---|---|---|
| 2026-11-06 | Documentation initiale créée (docs 01–08) | Claude Code | Proposé, à relire |
| 2026-11-06 | Hébergement sur Vercel et base de données Supabase (demande du porteur) | Porteur | ✅ Décidé |
| 2026-11-06 | Authentification par Supabase Auth ; rôles et permissions dans nos tables | Porteur | ✅ Décidé |
| 2026-11-06 | Prototype réalisé : interface 100 % en français, logo DriveDeal, style bleu nuit inspiré de la maquette Stitch ; accueil, catalogue (filtres, tri, pagination) et fiche véhicule sur données de démonstration | Claude Code | Prototype, à relire |
| 2026-11-06 | Du design Stitch, seule l'apparence est reprise : séquestre, KYC, financement et cryptomonnaie ne sont pas dans le cadrage et ne sont pas implémentés | Claude Code | À confirmer |
| 2026-11-06 | Bouton « Acheter » désactivé et expliqué tant que le parcours de commande et de paiement n'existe pas (pas de bouton factice) | Claude Code | Appliqué |
| 2026-11-06 | Seconde lecture de la maquette Stitch : reprise des pastilles de filtres, du tri en tête de liste, des chiffres clés et ancres de la fiche, du bloc « documents associés », du récapitulatif de prix et du parcours en étapes. Écartés car inventés ou hors cadrage : témoignages, statistiques fictives, newsletter, financement mensuel, séquestre | Claude Code | Appliqué, à relire |
| 2026-11-06 | Page Contact : formulaire validé côté serveur (Zod), message enregistré dans la table `contact_messages` (migration générée, RLS activée), consentement RGPD obligatoire, champ piège anti-robots. Le formulaire reste désactivé tant que la base n'est pas connectée. Aucune notification e-mail à l'entreprise tant que I-13 (prestataire e-mail) n'est pas décidé ; limitation de débit à ajouter | Claude Code | À relire |
| 2026-11-06 | Page À propos : textes limités à ce qui est dans le cadrage ; histoire, équipe, adresse et garanties laissées en attente (I-01, I-02, I-10) | Claude Code | À relire |
| 2026-11-06 | Pas de commit/push ni de développement avant validation des fondations techniques | Claude Code | Proposé |

## 6. Prochaines étapes suggérées

1. Relire les documents 01–08 et corriger toute incompréhension.
2. Répondre en priorité à : Q-01, Q-02, Q-03, I-02, I-11, I-12 (ils conditionnent paiement, commandes et facture).
3. Valider ou ajuster T-01 à T-05.
4. Fournir au moins une référence visuelle (site qui plaît) pour I-14.
5. Ensuite seulement : lancer les fondations (backlog F-01 à F-12 dans le doc 07).
