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
| T-12 | Politique de contenu (CSP) | Reportée : demande des « nonces » par requête, ce qui rend toutes les pages dynamiques | CSP stricte par nonces, ou CSP assouplie | ⏸ À étudier |
| T-11 | Cache des données | `unstable_cache` (60 s) + `revalidate = 60` pour l'instant | `use cache` / Cache Components (recommandé par Next.js 16, structure à adapter) | ⏸ À étudier |
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
| 2026-11-06 | Animations : apparition au défilement, compteurs, barre de progression, cartes animées ; réalisées en CSS et petits composants (aucune bibliothèque ajoutée), contenu visible sans JavaScript, animations désactivées si l'utilisateur a demandé de les réduire | Claude Code | Appliqué, à relire |
| 2026-11-06 | Documentation de prise en main ajoutée : README, guide Supabase/Vercel (doc 09) et conventions de code (doc 10) ; commentaires en français ajoutés sur les fichiers et sections principales | Claude Code | Appliqué |
| 2026-11-06 | Schéma de base étendu : catalogue (marques, modèles, véhicules, photos, équipements, documents), comptes (profils, rôles, permissions), favoris ; sécurité par lignes sur toutes les tables ; migrations SQL générées et migrations manuelles (déclencheurs, rôles de départ, stockage). Limites de taille et types de fichiers du stockage proposés par défaut (photos 5 Mo, documents PDF 10 Mo) — à valider. Migrations manuelles non testées sur une vraie base | Claude Code | À relire, à tester sur Supabase |
| 2026-11-06 | Couche d'accès aux données du catalogue : lecture dans la base si `DATABASE_URL` est renseignée, données de démonstration sinon ; cache 60 s ; script de remplissage de la base de développement protégé (confirmation obligatoire, refus en production). Lecture en base non testée sur une vraie base | Claude Code | À tester sur Supabase |
| 2026-11-06 | Proposition d'architecture backend (doc 11) soumise : décisions D1 à D10 en attente de validation ; défauts E1 à E5 relevés sur l'existant ; aucune modification structurelle effectuée | Claude Code | ⏸ En attente de validation |
| 2026-11-07 | Premier branchement réel : projet Supabase de développement créé (région `eu-central-1`, Francfort), `.env.local` vérifié (`npm run env:verifier`), 4 migrations appliquées sans erreur ; migrations manuelles `0002` et `0003` validées sur vraie base ; test de sécurité externe réussi ; commande `db:verifier-securite` ajoutée. Constat : `anon` a tous les droits SQL par défaut (RLS seule barrière) → durcissement `0004` proposé (doc 11, D10) | Claude Code | ✅ Vérifié |
| 2026-11-07 | Authentification développée selon les recommandations du doc 11 (Supabase Auth, e-mail + mot de passe de 12 à 72 caractères, confirmation d'e-mail, rôles lus en base, gardes serveur, proxy.ts). Non faits : MFA administrateur, limitation de débit applicative, migration 0004, CSP. Le flux complet avec envoi d'e-mail n'a pas été testé (service d'e-mails de Supabase limité) | Claude Code | À tester par le porteur |
| 2026-11-07 | Tableau de bord d'administration des véhicules (`/admin`) : liste avec recherche, filtres par statut et pagination ; création/modification ; publication, dépublication, archivage, suppression d'un brouillon (RG-V04) ; journal d'audit ; référence automatique `DD-xxxx`. Champs requis pour publier proposés par défaut (marque, modèle, version, année, km, prix, carburant, boîte, carrosserie, ≥ 1 photo) — Q-11, à confirmer. Vérifié sur vraie base (`db:verifier-admin`, 26/26) ; interface connectée non testée dans le navigateur | Claude Code | À tester par le porteur |
| 2026-11-07 | Photos des véhicules : envoi par URL signée vers Supabase Storage (limite de 4,5 Mo de Vercel contournée), contrôle du type et de la taille côté serveur, galerie publique et gestion dans l'administration. Vérifié sur vraie base (`db:verifier-photos`, 19/19, dont attaques refusées) ; affichage public vérifié dans le navigateur. Sur un réseau IPv6/DNS64, l'optimiseur d'images de Next refuse l'hôte Supabase : option `NEXT_PUBLIC_IMAGES_NON_OPTIMISEES=oui` (chargement direct, aucune protection désactivée) — la désactivation de la protection contre les IP locales a été écartée | Claude Code | ✅ Vérifié |
| 2026-11-07 | Comparateur de véhicules (maximum 3, règle stricte) : bouton « Comparer » sur les cartes et la fiche, barre flottante à 3 emplacements, page `/comparateur` (tableau par catégories, différences surlignées, option « seulement les différences », « meilleure valeur » limitée au prix, au kilométrage et à l'année). Sélection conservée dans le navigateur ; l'adresse (`?ids=`) est validée et la page relit toujours les vraies données. Seules les informations enregistrées sont affichées (« Non renseigné » sinon) : consommation, CO2, Crit'Air, garantie, nombre de propriétaires, première immatriculation ne sont pas dans le modèle de données. Favoris, comparaisons enregistrées dans le compte et achat depuis le comparateur : non faits (dépendent des étapes 4 et commande) | Claude Code | À relire |
| 2026-11-07 | **Changement de parcours (décision du porteur) : pas d'achat en ligne.** Le bouton « Acheter » est remplacé par un formulaire « Faire une demande » sur la fiche véhicule (prénom, nom, e-mail, téléphone facultatif, code postal, consentement) : l'entreprise recontacte le visiteur pour discuter. Le numéro +33 7 46 29 50 85 est affiché sur la fiche et la page Contact (`src/lib/entreprise.ts`). Table `vehicle_requests` (migration 0006, RLS sans politique), page `/admin/demandes` réservée aux administrateurs. Textes du site corrigés (plus de promesse de paiement, commande ou facture en ligne). Le parcours commande/paiement/facturation du cadrage est donc suspendu : à confirmer s'il est abandonné ou seulement reporté. Pas de notification e-mail à l'équipe (I-13) ni de limitation de débit : les demandes sont à consulter dans l'administration | Porteur / Claude Code | Appliqué, à relire |
| 2026-11-06 | Pas de commit/push ni de développement avant validation des fondations techniques | Claude Code | Proposé |

## 6. Prochaines étapes suggérées

1. Relire les documents 01–08 et corriger toute incompréhension.
2. Répondre en priorité à : Q-01, Q-02, Q-03, I-02, I-11, I-12 (ils conditionnent paiement, commandes et facture).
3. Valider ou ajuster T-01 à T-05.
4. Fournir au moins une référence visuelle (site qui plaît) pour I-14.
5. Ensuite seulement : lancer les fondations (backlog F-01 à F-12 dans le doc 07).
