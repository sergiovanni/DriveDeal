# 02 — Expression des besoins

> Statut : v0.1. Les identifiants **BF-xx** (fonctionnels) et **BNF-xx** (non fonctionnels) sont référencés dans les autres documents. Source : cadrage initial v1.0.

## 1. Besoins fonctionnels

### Site public
- **BF-01** Pages : accueil, présentation de l'entreprise, véhicules mis en avant, catalogue, détail véhicule, contact, FAQ, services.
- **BF-02** Pages légales : mentions légales, CGV, politique de confidentialité.
- **BF-03** Recherche textuelle et filtres (marque, modèle, prix min/max, année, kilométrage, carburant, transmission, carrosserie, puissance, couleur).
- **BF-04** Tri (prix, kilométrage, année, date de publication), pagination, réinitialisation des filtres.

### Catalogue et fiche véhicule
- **BF-05** Fiche véhicule : informations générales, caractéristiques techniques, informations complémentaires (voir doc 03, module Véhicules).
- **BF-06** Galerie photo, équipements, entretien, contrôle technique (si pertinent), documents associés.
- **BF-07** Affichage du prix, des frais complémentaires éventuels et de la disponibilité.
- **BF-08** Véhicules similaires, bouton favoris, bouton « Acheter ».

### Comptes
- **BF-09** Inscription, connexion, vérification de l'adresse e-mail.
- **BF-10** Gestion du profil, des coordonnées et des adresses de facturation.
- **BF-11** Favoris.
- **BF-12** Rôles et permissions extensibles (visiteur, client, administrateur, rôles intermédiaires futurs).

### Achat et commandes
- **BF-13** Parcours d'achat en 12 étapes (voir doc 03, module Commandes).
- **BF-14** Unicité de vente : un véhicule ne peut pas être vendu deux fois ; achats concurrents bloqués.
- **BF-15** Réservation temporaire pendant le paiement (à étudier).
- **BF-16** Historique des changements de statut ; annulations et remboursements.
- **BF-17** Suivi de commande côté client.

### Paiement
- **BF-18** Intégration d'un prestataire de paiement, paiement par carte, acompte (à étudier).
- **BF-19** Gestion des paiements confirmés, refusés, en attente ; remboursements ; historique des transactions.
- **BF-20** Réception et vérification des webhooks (signature, idempotence).

### Facturation et documents
- **BF-21** Facture PDF générée automatiquement à partir d'une vente validée, numéro unique, archivage, téléchargement client, envoi e-mail, consultation back-office.
- **BF-22** Avoirs, historique des documents émis.
- **BF-23** Distinction facture / documents automobiles (cession, justificatifs réglementaires).

### Back-office
- **BF-24** Gestion des véhicules (CRUD, photos, prix, disponibilité, publication, archivage, vendus/réservés).
- **BF-25** Gestion des commandes, paiements, remboursements, annulations.
- **BF-26** Gestion des clients et des factures (recherche par numéro, client, date).
- **BF-27** Gestion des marques et catégories, paramètres de la plateforme, utilisateurs.
- **BF-28** Tableau de bord (véhicules disponibles/vendus/réservés, commandes, CA, clients, paiements confirmés/en attente, évolution des ventes, véhicules les plus consultés), avec distinction commandes / encaissements / remboursements.

### Notifications
- **BF-29** E-mails transactionnels : création de compte, vérification, confirmation de commande, confirmation/échec de paiement, facture disponible, annulation, remboursement, remise du véhicule. Déclenchés par des événements métier fiables.

## 2. Besoins non fonctionnels

| ID | Domaine | Besoin |
|---|---|---|
| BNF-01 | Sécurité | Authentification sécurisée, rôles/permissions, validation serveur, protection contre les vulnérabilités courantes (OWASP), journalisation des opérations sensibles |
| BNF-02 | Sécurité financière | Aucune donnée bancaire stockée, vérification des paiements côté serveur, webhooks signés, anti double-traitement, traçabilité |
| BNF-03 | Performance | Chargement optimisé, images optimisées, pagination, requêtes DB optimisées |
| BNF-04 | Ergonomie | Interface moderne, navigation intuitive, parcours d'achat simple, responsive |
| BNF-05 | Maintenabilité | Code structuré, architecture modulaire, séparation des responsabilités, documentation technique, tests automatisés |
| BNF-06 | Évolutivité | Ajout futur de vendeurs externes, de moyens de paiement, de modules |
| BNF-07 | Conformité | RGPD, mentions légales, CGV, obligations de vente automobile, obligations fiscales et de facturation |
| BNF-08 | Exploitation | Variables d'environnement, sauvegardes, monitoring, HTTPS, procédure de mise à jour |

## 3. Risques et contraintes

| ID | Risque / contrainte | Impact | Mitigation proposée |
|---|---|---|---|
| R-01 | Double vente d'un véhicule unique | Critique | Contrainte en base + verrouillage transactionnel + réservation temporaire |
| R-02 | Paiement considéré à tort comme réussi | Critique | Seul le webhook vérifié (ou une vérification serveur auprès du prestataire) confirme un paiement |
| R-03 | Webhook rejoué ou reçu dans le désordre | Élevé | Table d'événements avec identifiant unique prestataire, traitement idempotent |
| R-04 | Facture fiscalement incorrecte (TVA sur marge, statut juridique inconnu) | Élevé | Génération de facture **bloquée** tant que le régime fiscal n'est pas validé ; modèles de facture paramétrables |
| R-05 | Non-conformité RGPD | Élevé | Minimisation des données, consentement, droits d'accès/suppression, registre des traitements |
| R-06 | Vente automobile à distance : obligations légales (information précontractuelle, rétractation ou non, garantie) mal définies | Élevé | Validation juridique avant mise en ligne ; textes CGV fournis par l'entreprise |
| R-07 | Montant élevé d'une transaction vs plafonds de carte / règles de l'acquéreur | Moyen | Étudier virement bancaire ou acompte avec le prestataire retenu |
| R-08 | Dérive du périmètre vers la marketplace | Moyen | Marketplace documentée comme hors périmètre ; seulement des points d'extension |
| R-09 | Décisions métier tardives bloquant le développement | Moyen | Backlog séparant ce qui est faisable sans décision (doc 07) |
| R-10 | Stack Next.js 16 différente des connaissances habituelles (ex. `middleware` renommé `proxy`) | Faible | Lire `node_modules/next/dist/docs/` avant chaque développement concerné |

## 4. Hypothèses de travail (à confirmer)

- Langue de l'interface : français, devise : euro (à confirmer, voir doc 08).
- Marché : France (RGPD, droit français de la consommation et de l'automobile) — à confirmer.
- Un achat = un véhicule (pas de panier multi-véhicules). Le modèle de données prévoit tout de même des lignes de commande pour rester extensible.
