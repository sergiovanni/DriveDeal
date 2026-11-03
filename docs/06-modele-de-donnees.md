# 06 — Modèle de données

> Statut : **proposition v0.1, non validée.** Modèle logique initial (PostgreSQL). Les noms sont indicatifs ; les champs marqués ⏸ dépendent de décisions métier (doc 08). Conventions : clés primaires UUID, `created_at`/`updated_at` partout, montants en **centimes (entiers)** + code devise, suppression logique plutôt que physique pour les données comptables.

## 1. Vue d'ensemble

```
users ──< addresses
users >──< roles (via user_roles) >──< permissions (via role_permissions)
users ──< favorites >── vehicles
brands ──< models ──< vehicles ──< vehicle_photos
vehicles >──< equipments (via vehicle_equipments)
vehicles ──< vehicle_documents
users ──< orders ──< order_items >── vehicles
orders ──< order_status_history
orders ──< payments ──< refunds
payments ──< payment_events (webhooks)
orders ──< invoices ──< invoice_lines ; invoices ──< credit_notes
orders ──< documents
domain_events (outbox) ──< email_logs
audit_logs, settings, legal_documents
```

## 2. Entités

### Comptes
> Avec Supabase Auth (T-04, décidé) : les identifiants et mots de passe vivent dans le schéma `auth` géré par Supabase ; `users` devient une table de profil (`id` = id Supabase Auth) sans `password_hash`, et la table `sessions` n'est pas créée. Row Level Security activée sur toutes les tables.

| Table | Champs principaux |
|---|---|
| `users` | id, email (unique), password_hash, first_name, last_name, phone, email_verified_at, status (`actif`/`suspendu`), last_login_at |
| `roles` | id, code (`client`, `admin`, …), label |
| `permissions` | id, code (ex. `vehicles.write`, `orders.refund`) |
| `role_permissions`, `user_roles` | tables de liaison |
| `addresses` | id, user_id, type (`facturation`/`autre`), line1, line2, postal_code, city, country, is_default |
| `sessions` | id, user_id, expires_at, ip, user_agent (si sessions en base) |

### Catalogue
| Table | Champs principaux |
|---|---|
| `brands` | id, name (unique), slug |
| `models` | id, brand_id, name, slug |
| `vehicles` | id, reference (unique), brand_id, model_id, version, first_registration_date, mileage_km, price_cents, currency, description, status (`brouillon`/`publié`/`réservé`/`vendu`/`archivé`), published_at, reserved_until, engine, fuel, power_kw/power_hp, gearbox, drivetrain, body_type, doors, seats, color, general_condition, history_notes, maintenance_notes, technical_inspection_notes, view_count |
| `vehicle_photos` | id, vehicle_id, storage_key, position, alt_text |
| `equipments`, `vehicle_equipments` | liste d'équipements normalisée + liaison |
| `vehicle_documents` | id, vehicle_id, type, storage_key, visibility (`public`/`privé`) |
| `vehicle_fees` ⏸ | id, vehicle_id, label, amount_cents — frais complémentaires (nature à définir) |
| `favorites` | user_id, vehicle_id (clé composite), created_at |

> Extension marketplace (non implémentée) : ajouter ultérieurement une référence de propriétaire/vendeur sur `vehicles` (`seller_id` nullable). Aucun champ ni règle marketplace n'est créé maintenant.

### Commandes
| Table | Champs principaux |
|---|---|
| `orders` | id, number (unique), user_id, status, total_cents, currency, billing_address_snapshot (JSON), customer_snapshot (JSON), terms_version, terms_accepted_at, reserved_until, cancelled_reason, created_at |
| `order_items` | id, order_id, vehicle_id, vehicle_snapshot (JSON), unit_price_cents, fees_cents ⏸ |
| `order_status_history` | id, order_id, from_status, to_status, actor_type (`client`/`admin`/`système`/`webhook`), actor_id, reason, created_at |

**Contrainte d'unicité de vente** : index unique partiel sur `order_items(vehicle_id)` pour les commandes dans un statut « actif » (non annulée/non expirée/non remboursée).

### Paiements
| Table | Champs principaux |
|---|---|
| `payments` | id, order_id, provider, provider_reference (unique), amount_cents, currency, status, idempotency_key (unique), method ⏸, kind (`total`/`acompte` ⏸), confirmed_at |
| `payment_events` | id, provider, provider_event_id (**unique**), type, payload (JSON), signature_verified, received_at, processed_at, processing_error |
| `refunds` | id, payment_id, amount_cents, provider_reference, status, reason, requested_by, confirmed_at |

### Facturation et documents
| Table | Champs principaux |
|---|---|
| `invoice_sequences` | year/série ⏸, last_number (verrouillée à l'attribution) |
| `invoices` | id, number (unique), order_id, status (`émise`/`annulée par avoir`), issued_at, seller_snapshot (JSON ⏸), customer_snapshot (JSON), total_ht_cents ⏸, vat_cents ⏸, total_ttc_cents, vat_regime ⏸, pdf_storage_key, pdf_sha256 |
| `invoice_lines` | id, invoice_id, description, quantity, unit_price_cents, vat_rate ⏸ |
| `credit_notes` | id, number (unique), invoice_id, amount_cents, reason, issued_at, pdf_storage_key |
| `documents` | id, order_id, type (`cession`⏸, `justificatif`⏸, …), storage_key, visibility, created_at |
| `legal_documents` | id, type (`cgv`, `confidentialité`, `mentions`), version, content, published_at |

### Transverse
| Table | Champs principaux |
|---|---|
| `domain_events` (outbox) | id, type, aggregate_type, aggregate_id, payload, created_at, processed_at, attempts |
| `email_logs` | id, event_id, user_id, template, to_email, status, provider_message_id, sent_at, error |
| `audit_logs` | id, actor_id, action, entity_type, entity_id, before/after (JSON), ip, created_at |
| `settings` | key, value (JSON), updated_by — paramètres plateforme et configuration fiscale ⏸ |
| `contact_messages` | id, name, email, subject, message, created_at, status |
| `vehicle_requests` | id, vehicle_id, vehicle_reference, first_name, last_name, email, phone, postal_code, consent, status, created_at (demande « Faire une demande » d'une fiche ; RLS sans politique) |

## 3. Contraintes et index clés

- `users.email` unique (insensible à la casse).
- `vehicles.reference` unique ; index sur (status, brand_id, model_id, price_cents, mileage_km, first_registration_date, published_at) selon les filtres réels mesurés.
- Unicité de vente (voir §Commandes).
- `payment_events.provider_event_id` unique → idempotence des webhooks.
- `payments.idempotency_key` unique.
- `invoices.number` unique et sans trou (attribution transactionnelle).
- Clés étrangères avec `ON DELETE RESTRICT` pour tout ce qui touche commandes, paiements et factures.

## 4. Données personnelles (RGPD)

Données personnelles : `users`, `addresses`, `orders` (snapshots), `invoices` (snapshots), `contact_messages`, `email_logs`, `audit_logs` (IP). Durées de conservation, anonymisation des comptes supprimés et conservation légale des factures ⏸ à définir. Les snapshots permettent d'anonymiser un compte sans altérer les pièces comptables conservées légalement.

## 5. Points ouverts

Voir doc 08 : frais complémentaires, acompte (nouveaux types de paiement), régime TVA (champs de facture), documents automobiles, séries de numérotation, champs obligatoires du véhicule.

## 6. État d'implémentation (schéma Drizzle + migrations)

Le schéma est écrit en TypeScript dans `src/lib/db/schema/` et traduit en SQL dans `drizzle/`.

| Fichier du schéma | Tables | Migration |
|---|---|---|
| `contact.ts` | `contact_messages` | `0000_messages_contact.sql` |
| `demandes.ts` | `vehicle_requests` | `0006_demandes_vehicule.sql` |
| `catalogue.ts` | `brands`, `models`, `vehicles`, `equipments`, `vehicle_equipments`, `vehicle_photos`, `vehicle_documents` | `0001_catalogue_comptes_favoris.sql` |
| `comptes.ts` | `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles` | `0001_…` |
| `favoris.ts` | `favorites` | `0001_…` |
| — (SQL écrit à la main) | déclencheurs `updated_at`, création du profil à l'inscription, rôles `client` et `administrateur` | `0002_automatismes_et_roles.sql` |
| — (SQL écrit à la main) | espaces de stockage `vehicules-photos` (public) et `documents-prives` (privé) | `0003_stockage_fichiers.sql` |

**Pas encore implémentés** (décisions métier en attente, docs/08) : `orders`, `order_items`,
`order_status_history`, `payments`, `payment_events`, `refunds`, `invoices`, `invoice_lines`,
`credit_notes`, `documents` de commande, `domain_events`, `email_logs`, `audit_logs`,
`settings`, `legal_documents`, `vehicle_fees`.

### Choix de réalisation

- **Noms** : les colonnes et tables sont en anglais dans la base (convention SQL courante) ;
  les propriétés TypeScript sont en français (`prixCentimes` ↔ `price_cents`).
- **Statut du véhicule** : colonne `statut` avec contrainte `CHECK` sur les 5 valeurs
  proposées (`brouillon`, `publie`, `reserve`, `vendu`, `archive`). Les autres caractéristiques
  (carburant, boîte, carrosserie…) restent du texte libre tant que les catégories ne sont pas
  validées.
- **Sécurité** : RLS activée sur **toutes** les tables (vérifié par
  `tests/securite-migrations.test.ts`). Lecture publique limitée aux véhicules publiés et à
  leurs éléments liés ; aucune politique d'écriture publique ; favoris et profil limités à leur
  propriétaire.
- **Comptes** : l'identité est dans `auth.users` (Supabase Auth). `profiles.id` en est la
  référence ; un déclencheur crée le profil et le rôle « client » à chaque inscription.
- **Mise à jour des dates** : `updated_at` est géré par un déclencheur de la base.
- **Photos et documents** : la base ne garde que la clé du fichier ; le fichier vit dans
  Supabase Storage.

> ✅ **Vérifié le 2026-11-07** sur le projet Supabase de développement (région `eu-central-1`,
> Francfort) : les 4 migrations s'appliquent sans erreur ; les 14 tables ont la RLS ; les
> déclencheurs `apres_inscription`, `vehicles_updated_at` et `profiles_updated_at` existent ; les
> rôles `client` et `administrateur` sont créés ; les espaces de stockage `vehicules-photos`
> (public, 5 Mo) et `documents-prives` (privé, 10 Mo) existent. Test de sécurité réel :
> `CONFIRMER_TEST_SECURITE=oui npm run db:verifier-securite`.
