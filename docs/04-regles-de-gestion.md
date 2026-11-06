# 04 — Règles de gestion

> Statut : v0.1. Légende de la colonne **Origine** : **Cadrage** = énoncé dans le document de cadrage ; **Proposition** = suggestion de l'équipe technique, à valider (voir doc 08) ; **⏸** = dépend d'une information métier manquante, aucune valeur n'est supposée.

## 1. Véhicules

| ID | Règle | Origine |
|---|---|---|
| RG-V01 | Un véhicule est un exemplaire unique et ne peut être vendu qu'une seule fois | Cadrage |
| RG-V02 | Statuts d'un véhicule : `brouillon`, `publié`, `réservé`, `vendu`, `archivé` | Proposition |
| RG-V03 | Seul un véhicule `publié` apparaît dans le catalogue public et peut être acheté | Proposition |
| RG-V04 | Seul un `brouillon` peut être supprimé définitivement ; les autres sont archivés | Cadrage (8.1) |
| RG-V05 | Un véhicule ayant une commande ne peut jamais être supprimé | Proposition |
| RG-V06 | Champs obligatoires pour publier (marque, modèle, année, kilométrage, prix, ≥ 1 photo…) | ⏸ liste à valider |
| RG-V07 | Les prix sont des montants entiers en centimes, avec devise | Proposition |
| RG-V08 | Toute modification de prix d'un véhicule est journalisée ; une commande conserve le prix figé au moment de sa création | Proposition |

## 2. Commandes

| ID | Règle | Origine |
|---|---|---|
| RG-C01 | Une commande créée n'est pas une commande payée | Cadrage |
| RG-C02 | Le système empêche les achats concurrents sur un même véhicule | Cadrage |
| RG-C03 | Une réservation temporaire pendant le paiement est étudiée ; durée de la réservation | ⏸ |
| RG-C04 | Chaque changement de statut est historisé (auteur, date, ancien/nouveau statut, motif) | Cadrage |
| RG-C05 | L'acceptation des CGV est enregistrée avec horodatage et version | Proposition |
| RG-C06 | Annulations et remboursements sont gérés ; conditions | ⏸ |
| RG-C07 | Une commande conserve un instantané des données du véhicule, du prix et de l'adresse de facturation au moment de l'achat | Proposition |
| RG-C08 | Un client ne voit que ses propres commandes | Proposition |

### Statuts de commande (proposition à valider)

| Statut | Signification |
|---|---|
| `brouillon` | Parcours entamé, rien de réservé |
| `en_attente_paiement` | Véhicule réservé temporairement, paiement attendu |
| `paiement_en_cours` | Paiement initié chez le prestataire, résultat non connu |
| `payée` | Paiement **confirmé** par le prestataire (webhook vérifié) |
| `en_préparation` | Préparation de la remise du véhicule et des documents |
| `prête_remise` | Véhicule prêt pour livraison/retrait ⏸ (modalités à définir) |
| `terminée` | Véhicule remis, documents transmis |
| `expirée` | Réservation expirée sans paiement ; véhicule remis en vente |
| `annulée` | Annulation avant ou après paiement |
| `remboursée` | Remboursement total confirmé |

### Transitions autorisées (proposition)

```
brouillon → en_attente_paiement | annulée
en_attente_paiement → paiement_en_cours | expirée | annulée
paiement_en_cours → payée | en_attente_paiement (paiement refusé) | annulée
payée → en_préparation | annulée (avec remboursement) | remboursée
en_préparation → prête_remise | annulée (avec remboursement)
prête_remise → terminée | annulée (avec remboursement)
annulée → remboursée (si paiement à rembourser)
expirée, terminée, remboursée : états finaux
```

Toute transition non listée est refusée côté serveur. Les transitions vers `payée` ne sont déclenchées que par le traitement d'un paiement confirmé, jamais manuellement via l'interface client. Une correction manuelle par un administrateur est une action sensible (audit). **Les statuts exacts, notamment après paiement, dépendent de la logistique réelle ⏸.**

## 3. Réservation

| ID | Règle | Origine |
|---|---|---|
| RG-R01 | Quand un client lance le paiement, le véhicule passe `réservé` pour une durée limitée | Proposition (étudier) |
| RG-R02 | À l'expiration sans paiement confirmé, le véhicule redevient `publié` et la commande `expirée` | Proposition |
| RG-R03 | Si un paiement est confirmé après expiration, le cas est traité manuellement (remboursement ou réattribution) et alerte l'administrateur | Proposition |
| RG-R04 | Durée de réservation (ex. 15–30 min) | ⏸ |
| RG-R05 | Réservation longue par acompte / avant visite | ⏸ |

## 4. Paiement

| ID | Règle | Origine |
|---|---|---|
| RG-P01 | Aucune donnée bancaire sensible n'est stockée | Cadrage |
| RG-P02 | Un paiement n'est confirmé qu'après vérification serveur auprès du prestataire | Cadrage |
| RG-P03 | Les signatures des webhooks sont vérifiées ; un webhook invalide est rejeté et journalisé | Cadrage |
| RG-P04 | Un même événement (identifiant prestataire) n'est traité qu'une fois | Cadrage |
| RG-P05 | Toute opération financière est tracée (qui, quand, montant, référence prestataire) | Cadrage |
| RG-P06 | Le montant payé doit être égal au montant dû de la commande ; sinon alerte | Proposition |
| RG-P07 | États d'un paiement : `en_attente`, `réussi`, `échoué`, `annulé`, `remboursé_partiel`, `remboursé` | Proposition |
| RG-P08 | Paiement intégral ou acompte ; montant et règles de l'acompte | ⏸ |
| RG-P09 | Prestataire de paiement et moyens autorisés (carte, virement…) | ⏸ |

## 5. Remboursements

| ID | Règle | Origine |
|---|---|---|
| RG-RB01 | Un remboursement est lié à un paiement confirmé et ne peut dépasser le montant restant remboursable | Proposition |
| RG-RB02 | Un remboursement est confirmé uniquement par le prestataire (comme un paiement) | Proposition |
| RG-RB03 | Un remboursement après émission de facture génère un avoir | Cadrage (avoirs) |
| RG-RB04 | Conditions d'annulation et de remboursement, délais, retenues | ⏸ |

## 6. Facturation

| ID | Règle | Origine |
|---|---|---|
| RG-F01 | Numéro de facture unique | Cadrage |
| RG-F02 | Facture générée uniquement à partir d'une vente validée avec paiement confirmé | Cadrage |
| RG-F03 | Aucune information fiscale supposée : tant que le régime (TVA classique, TVA sur marge…) n'est pas validé, la génération de facture définitive est désactivée | Cadrage |
| RG-F04 | Une facture émise est immuable ; correction par avoir | Proposition (pratique comptable) |
| RG-F05 | Numérotation séquentielle sans trou ; format | ⏸ validation comptable |
| RG-F06 | Facture ≠ documents de cession / justificatifs réglementaires (documents distincts) | Cadrage |
| RG-F07 | Mentions légales obligatoires, informations de l'entreprise, régime de TVA | ⏸ |
| RG-F08 | Durée et mode d'archivage des factures | ⏸ (obligations légales à confirmer) |

## 7. Comptes et sécurité

| ID | Règle | Origine |
|---|---|---|
| RG-U01 | Adresse e-mail unique par compte | Proposition |
| RG-U02 | Mots de passe stockés hachés (algorithme moderne) ; jamais en clair ni journalisés | Proposition |
| RG-U03 | Chaque action sensible vérifie authentification et permission côté serveur | Cadrage |
| RG-U04 | Les opérations sensibles sont journalisées | Cadrage |
| RG-U05 | Le client n'accède qu'à ses données (commandes, factures, documents) | Proposition |
| RG-U06 | Vérification de l'e-mail obligatoire avant achat | ⏸ |
| RG-U07 | Rôles intermédiaires futurs : modèle `rôle ↔ permissions` en base | Cadrage |

## 8. Notifications

| ID | Règle | Origine |
|---|---|---|
| RG-N01 | Les e-mails sont déclenchés par des événements métier enregistrés (ex. « paiement confirmé ») | Cadrage |
| RG-N02 | Un événement ne déclenche pas deux fois le même e-mail (idempotence) | Proposition |
| RG-N03 | Les envois sont journalisés et rejouables | Proposition |

## 9. Indicateurs

| ID | Règle | Origine |
|---|---|---|
| RG-D01 | Commandes, encaissements et remboursements sont trois mesures distinctes | Cadrage |
| RG-D02 | Définition du chiffre d'affaires (HT/TTC, date de référence) | ⏸ |

## 10. Extensibilité (marketplace)

| ID | Règle | Origine |
|---|---|---|
| RG-X01 | Aucune règle marketplace n'est implémentée ; aucune règle de commission, de reversement ou de responsabilité n'est supposée | Cadrage |
| RG-X02 | Les choix techniques ne doivent pas rendre impossible l'ajout futur d'un vendeur propriétaire d'un véhicule | Cadrage |
