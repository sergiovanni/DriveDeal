# 01 — Présentation du projet

> Statut : v0.1 — rédigé à partir du document de cadrage initial (v1.0). Tout ce qui n'est pas dans le cadrage est signalé comme **proposition** ou renvoyé vers [08-decisions-et-points-en-attente.md](08-decisions-et-points-en-attente.md).

## 1. Compréhension du projet

Nous construisons une **plateforme e-commerce de vente de véhicules d'occasion** pour le compte d'une entreprise qui vend **son propre stock**. Ce n'est pas un site vitrine : c'est un outil de gestion commerciale complet.

Un client doit pouvoir : découvrir un véhicule, en consulter toutes les caractéristiques, l'acheter, payer en ligne, recevoir sa confirmation et accéder à sa facture. L'entreprise doit pouvoir gérer depuis un back-office son stock, ses clients, ses commandes, ses paiements, ses factures et son activité.

Particularité métier structurante : **chaque véhicule est un exemplaire unique**. Il ne peut être vendu qu'une fois, ce qui impose une gestion rigoureuse de la concurrence (réservation temporaire, verrouillage) et rend les notions de « panier » et de « stock » très différentes d'un e-commerce classique.

## 2. Objectifs

1. Plateforme e-commerce automobile moderne.
2. Vente du stock propre de l'entreprise.
3. Recherche et consultation du catalogue.
4. Achat direct en ligne, avec paiement sécurisé.
5. Gestion automatisée des commandes.
6. Génération automatique des factures et documents commerciaux.
7. Espace client.
8. Back-office complet.
9. Architecture évolutive (ouverture future à des vendeurs particuliers).

## 3. Périmètre

### Inclus dans le MVP
Site public, catalogue, recherche/filtres, fiche véhicule, comptes clients, favoris, parcours d'achat, paiement en ligne, facturation PDF, notifications e-mail, back-office, tableau de bord.

### Explicitement exclu du MVP
- **Marketplace** (vendeurs particuliers, commissions, reversements, vérification d'identité…). L'architecture ne doit pas l'interdire, mais rien n'est développé ni spécifié en règles métier.
- Paiement réel, facturation fiscale définitive et mise en production tant que les décisions correspondantes ne sont pas validées.

## 4. Acteurs

| Acteur | Description |
|---|---|
| Visiteur | Consulte le site et le catalogue, peut créer un compte |
| Client | Compte authentifié : profil, adresses, favoris, commandes, paiements, factures, documents |
| Administrateur | Accès complet au back-office selon ses permissions |
| Rôles intermédiaires (futur) | Gestionnaire de stock, commercial, responsable administratif… : le modèle de permissions doit les permettre sans refonte |
| Vendeur particulier (hors périmètre) | Futur — marketplace |
| Systèmes externes | Prestataire de paiement, prestataire e-mail, stockage de fichiers, hébergement |

## 5. Principes directeurs

- Construire une base solide, documenter chaque décision, développer progressivement.
- Ne jamais inventer une règle métier : tout élément non validé est tracé dans le doc 08.
- Commande créée ≠ commande payée. Paiement réussi = confirmé par le prestataire côté serveur, jamais par le navigateur.
- Aucune facture avec des informations fiscales supposées.
- Aucune fonctionnalité factice : pas de bouton sans comportement réel.
- Une fonctionnalité n'est terminée que si elle est testée.

## 6. Index de la documentation

| Fichier | Contenu |
|---|---|
| 01-presentation-projet.md | Ce document |
| 02-expression-des-besoins.md | Besoins fonctionnels et non fonctionnels, risques |
| 03-cahier-des-charges-fonctionnel.md | Modules, fonctionnalités, critères d'acceptation |
| 04-regles-de-gestion.md | Règles métier, statuts et transitions |
| 05-architecture-technique.md | Stack proposée, architecture, intégrations, sécurité |
| 06-modele-de-donnees.md | Modèle de données initial |
| 07-roadmap.md | Modules, dépendances, backlog |
| 08-decisions-et-points-en-attente.md | Ambiguïtés, décisions à valider, informations manquantes |
| 09-guide-mise-en-route.md | Brancher Supabase, déployer sur Vercel, checklist de mise en production |
| 10-conventions-de-code.md | Façon d'écrire, de commenter et de sécuriser le code |
| 11-proposition-architecture-backend.md | **Proposition en attente de validation** : backend Supabase + Vercel, rôles, RLS, environnements, étapes |
