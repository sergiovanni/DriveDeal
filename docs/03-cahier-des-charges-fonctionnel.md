# 03 — Cahier des charges fonctionnel

> Statut : v0.1. Les critères d'acceptation (CA) décrivent le comportement attendu ; ceux qui dépendent d'une décision métier non validée sont marqués ⏸ et renvoient au doc 08. Règles associées : [04-regles-de-gestion.md](04-regles-de-gestion.md).

## Module M1 — Site public (BF-01, BF-02)

**Pages** : accueil, présentation, véhicules à la une, catalogue, détail, contact, FAQ, services, mentions légales, CGV, confidentialité.

**CA**
- Chaque page est accessible sans compte, responsive, avec titre et métadonnées.
- Le formulaire de contact valide les champs côté serveur, enregistre ou transmet le message, et affiche une confirmation réelle (pas de formulaire factice).
- Les textes légaux sont fournis par l'entreprise ⏸ (pages créées avec contenu éditable ; aucun texte juridique inventé).

## Module M2 — Véhicules et catalogue (BF-05 à BF-08, BF-24)

**Champs d'une fiche**
- Généraux : identifiant unique, marque, modèle, version, année de mise en circulation, kilométrage, prix de vente, description, disponibilité, statut de publication.
- Techniques : motorisation, carburant, puissance, boîte, transmission, carrosserie, portes, places, couleur, équipements.
- Complémentaires : photos, état général, historique, entretien, contrôle technique (si pertinent), documents associés.

**CA**
- Un administrateur peut créer un brouillon, le compléter, le publier, le dépublier, l'archiver ; seul un brouillon peut être supprimé définitivement.
- Un véhicule publié doit avoir les champs obligatoires renseignés (liste à valider ⏸) et au moins une photo.
- Plusieurs photos peuvent être ajoutées, ordonnées, supprimées ; l'ordre est conservé.
- Un véhicule réservé ou vendu n'est plus achetable ; son statut est visible côté public (affiché ou masqué ⏸).
- Les prix sont stockés en centimes (entiers) avec devise.

## Module M3 — Recherche et filtres (BF-03, BF-04)

**CA**
- Filtres combinables : marque, modèle, prix min/max, année, kilométrage, carburant, transmission, carrosserie, puissance, couleur.
- Tris : prix, kilométrage, année, date de publication (croissant/décroissant).
- Pagination serveur ; l'état (filtres, tri, page) est reflété dans l'URL et partageable.
- « Réinitialiser » restaure l'état par défaut.
- Seuls les véhicules publiés apparaissent.
- Aucun résultat → message explicite.

## Module M4 — Fiche détaillée (BF-06 à BF-08)

**CA**
- Galerie photo, toutes caractéristiques, description, prix, frais complémentaires ⏸ (nature des frais à définir), disponibilité, équipements, entretien.
- « Acheter » démarre le parcours d'achat si le véhicule est disponible ; sinon il est désactivé avec le motif.
- « Favoris » : nécessite un compte ; ajout/retrait persistés.
- « Véhicules similaires » : critère de similarité défini (proposition : même carrosserie ou même marque, prix ±20 %) ⏸ à valider.

## Module M5 — Comptes et rôles (BF-09 à BF-12)

**CA**
- Inscription par e-mail et mot de passe ; e-mail de vérification ; compte non vérifié ne peut pas acheter ⏸.
- Connexion/déconnexion sécurisées ; limitation des tentatives ; réinitialisation du mot de passe.
- Profil modifiable ; plusieurs adresses ; une adresse de facturation par défaut.
- Contrôle d'accès vérifié **côté serveur** pour chaque action sensible (pas seulement à l'affichage).
- Rôles et permissions stockés en base, extensibles sans modification du code applicatif de base.

## Module M6 — Favoris (BF-11)

**CA** : un client ajoute/retire un véhicule ; la liste affiche l'état courant (disponible, réservé, vendu, dépublié).

## Module M7 — Commandes et parcours d'achat (BF-13 à BF-17)

**Parcours** : 1 consulter → 2 « Acheter » → 3 connexion/inscription → 4 informations personnelles → 5 vérification facturation → 6 récapitulatif → 7 montant total → 8 acceptation des conditions → 9 paiement → 10 confirmation → 11 suivi → 12 facture et documents.

**CA**
- Cliquer sur « Acheter » sur un véhicule indisponible est impossible.
- Créer une commande ne signifie pas qu'elle est payée (statut distinct).
- L'acceptation des CGV est horodatée et conservée avec la version des CGV acceptée.
- Le récapitulatif affiche prix, frais, total, conformément aux règles de prix ⏸.
- Deux clients ne peuvent pas payer le même véhicule : le second reçoit un message clair.
- Chaque changement de statut est historisé (qui, quand, ancien/nouveau statut, motif).
- Le client voit le statut de sa commande et l'historique de ses étapes.

## Module M8 — Paiement (BF-18 à BF-20)

**CA**
- Aucune donnée de carte ne transite par nos serveurs ni n'est stockée.
- Un paiement n'est « confirmé » que sur réception d'un webhook vérifié (signature) ou après vérification serveur auprès du prestataire.
- Un même événement reçu deux fois n'est traité qu'une fois.
- États gérés : en attente, confirmé, refusé, annulé, remboursé (total/partiel ⏸).
- Historique complet des transactions consultable en back-office.
- Remboursement initiable depuis le back-office selon permissions ; traçabilité conservée.
- Tests exclusivement en environnement sandbox ; aucun paiement réel avant validation.

## Module M9 — Facturation et documents (BF-21 à BF-23)

**CA**
- Une facture n'est émise que pour une commande dont le paiement est confirmé ⏸ (règle exacte pour l'acompte à définir).
- Numérotation unique, séquentielle sans trou ⏸ (format à valider avec le comptable).
- Mentions légales, TVA/TVA sur marge ⏸ : bloquées tant que le régime fiscal n'est pas fourni ; aucune valeur par défaut supposée.
- Une facture émise est immuable ; toute correction passe par un avoir.
- PDF archivé, téléchargeable par le client propriétaire uniquement, consultable en back-office, envoyé par e-mail.
- Les documents automobiles (cession, justificatifs) sont des documents distincts des factures ⏸ (liste et génération à définir).

## Module M10 — Notifications (BF-29)

**CA**
- Chaque e-mail est déclenché par un événement métier enregistré (pas par un appel direct depuis l'interface).
- Les envois sont journalisés (destinataire, type, statut, date) et rejouables en cas d'échec.
- Le contenu ne divulgue pas de données sensibles inutiles.

## Module M11 — Back-office (BF-24 à BF-27)

**CA**
- Toutes les routes `/admin` exigent authentification et permission spécifique, vérifiées côté serveur.
- Recherche/filtrage des commandes, clients et factures (numéro, client, date).
- Les actions sensibles (remboursement, annulation, changement de prix, suppression, changement de rôle) sont journalisées (audit).
- Les changements de statut proposés ne sont que ceux autorisés par la matrice de transitions (doc 04).

## Module M12 — Tableau de bord (BF-28)

**CA**
- Indicateurs : véhicules disponibles/vendus/réservés, commandes, clients, CA, paiements confirmés/en attente, évolution des ventes, véhicules les plus consultés.
- Définitions explicites : **commandes** (créées), **encaissements** (paiements confirmés), **remboursements** — jamais confondus ; le CA est défini ⏸ (HT/TTC, date de référence).
- Chaque indicateur est calculé à partir de données réelles ; aucun chiffre de démonstration en production.

## Transverse

- Journal d'audit (BNF-01), gestion des erreurs et pages d'erreur, SEO de base, accessibilité de base (contrastes, navigation clavier, textes alternatifs), RGPD (consentement cookies si traceurs, export/suppression des données).
