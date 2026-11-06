# 05 — Architecture technique

> Statut : **proposition v0.1, non validée.** Aucune décision structurante n'est prise tant qu'elle n'est pas validée ; les choix ouverts sont répertoriés dans le doc 08 (décisions techniques T-01 à T-05).

## 1. État du dépôt existant

Le dépôt contient uniquement le modèle généré par `create-next-app` : **Next.js 16.2.1**, React 19.2.4, TypeScript 5, Tailwind CSS 4, ESLint 9, routeur `app/`, alias `@/*` vers la racine. Aucune logique métier, base de données, authentification ni test.

Conformément au cadrage, **on ne remplace pas cette stack** ; on la prend comme point de départ.

> Attention (AGENTS.md) : Next.js 16 présente des changements importants. Exemple relevé dans `node_modules/next/dist/docs/` : `middleware` est devenu **`proxy`** (fichier `proxy.ts`), destiné aux vérifications optimistes (lecture du cookie) mais pas à une autorisation complète. Les guides pertinents (authentification, data security, forms, route handlers, caching, images, deploying) doivent être relus avant chaque module concerné.

## 2. Stack proposée

| Couche | Proposition | Alternatives | Avantages | Inconvénients |
|---|---|---|---|---|
| Framework web | Next.js 16 (App Router), React 19, TypeScript strict | API séparée (NestJS/Fastify) + front | Déjà en place, SSR/SEO adaptés au catalogue, Server Actions et Route Handlers, un seul déploiement | Backend couplé au framework : discipline de modularité nécessaire |
| Style | Tailwind CSS 4 | CSS Modules | Déjà installé, rapide | Besoin d'un design system maison |
| Base de données | **Supabase (PostgreSQL) — décision du porteur** | — | Transactions, contraintes (unicité partielle, verrous), JSONB, recherche plein texte ; service géré, sauvegardes | Dépendance à un fournisseur ; connexions à gérer depuis Vercel (voir §8) |
| Accès aux données | ORM type Drizzle ou Prisma | SQL brut / Kysely | Typage, migrations | Choix à valider (Prisma : écosystème mature ; Drizzle : plus proche du SQL) |
| Authentification | Supabase Auth (via `@supabase/ssr`) — **décidé** (T-04) | Auth.js / Better Auth sur la base Supabase | Déjà inclus, e-mail de vérification, réinitialisation de mot de passe, pas de cryptographie maison | Rôles/permissions restent dans nos tables ; verrouillage fournisseur |
| Validation | Zod (schémas partagés client/serveur) | Valibot | Validation côté serveur systématique | — |
| Paiement | Stripe (Payment Intents / Checkout + webhooks) | Mollie, PayPlug, Adyen… | Sandbox complète, webhooks signés, remboursements | **Choix à valider** (frais, plafonds, virement, acompte) |
| E-mails | Service transactionnel (Resend, Postmark…) | SMTP | Délivrabilité | **Choix à valider** |
| PDF | Génération côté serveur (ex. `@react-pdf/renderer` ou `pdf-lib`) | Moteur HTML→PDF (Puppeteer) | Pas de navigateur headless avec les premières | Mise en page complexe plus coûteuse |
| Stockage fichiers | Supabase Storage (buckets publics pour les photos, privés pour les PDF avec URL signées) | S3 / Vercel Blob | Même fournisseur que la base, séparation public/privé | Politiques d'accès à configurer avec soin |
| Tests | Vitest (unitaires/intégration), Playwright (E2E), base de test dédiée | Jest | Rapide, TypeScript natif | — |
| Qualité | ESLint, Prettier, CI (lint + typecheck + tests) | — | — | — |

### Option d'architecture comparée

| | A. Monolithe modulaire Next.js (recommandé) | B. Frontend Next.js + API séparée |
|---|---|---|
| Séparation front/back/DB | Logique métier isolée dans des modules serveur ; UI ne parle jamais directement à la DB | Séparation physique |
| Complexité d'exploitation | Faible | Élevée (deux déploiements, CORS, contrats d'API) |
| Évolutivité | Extraction possible d'un module en service plus tard | Immédiate |
| Adapté au MVP | Oui | Surdimensionné |

**Recommandation** : option A, avec des frontières strictes entre modules pour permettre une extraction ultérieure. À valider.

## 3. Architecture applicative proposée

```
app/                       # Routage uniquement (pages, layouts, route handlers fins)
  (public)/                # Site public, catalogue, fiche véhicule
  (compte)/                # Espace client
  admin/                   # Back-office
  api/webhooks/            # Webhooks prestataires
src/
  modules/                 # Un dossier par domaine métier
    vehicles/              # entités, services, schémas, requêtes
    catalogue/
    accounts/
    orders/
    payments/
    invoicing/
    notifications/
    documents/
    admin-dashboard/
  lib/                     # Utilitaires transverses (db, auth, logger, config, mail, storage)
  components/              # Composants UI réutilisables (design system)
docs/
tests/
```

Principes :
- **Les pages ne contiennent pas de logique métier** : elles appellent des services de module.
- Chaque module expose une API publique (`index.ts`) ; pas d'import dans les entrailles d'un autre module.
- Couche d'accès aux données centralisée (DAL) : vérification d'authentification/permission au plus près de la donnée (cf. guide Next.js « data-security » / « authentication »).
- Les mutations passent par Server Actions ou Route Handlers qui revalident l'entrée avec Zod et vérifient les permissions.
- Événements métier internes (`OrderPaid`, `PaymentFailed`…) : un journal d'événements (table *outbox*) déclenche notifications et facturation de manière fiable.
- Machine à états de la commande implémentée dans un seul module (`orders`) ; aucune mise à jour de statut ailleurs.

## 4. Points critiques de conception

### Prévention de la double vente
- Contrainte en base : au plus **une commande active** par véhicule (index unique partiel).
- Réservation : transaction avec verrou (`SELECT … FOR UPDATE`) sur la ligne véhicule, passage à `réservé` avec date d'expiration.
- Tâche planifiée (ou vérification paresseuse) pour libérer les réservations expirées.

### Paiement
- Création de la session/intention de paiement **côté serveur**, avec clé d'idempotence liée à la commande.
- Le navigateur ne confirme jamais un paiement : la page de retour affiche seulement l'état lu en base.
- Webhook : vérification de signature, enregistrement de l'événement (identifiant prestataire unique), traitement idempotent dans une transaction, mise à jour du paiement puis de la commande.
- Réconciliation périodique avec le prestataire (proposition).

### Facturation
- Numérotation séquentielle attribuée dans une transaction (table de séquence verrouillée).
- Modèle de facture paramétré par la configuration fiscale ; génération bloquée si la configuration est incomplète.
- Facture figée (instantané des données) ; PDF stocké en privé ; hash conservé pour intégrité (proposition).

### Sécurité
- Cookies de session `HttpOnly`, `Secure`, `SameSite`.
- Contrôle d'accès par rôle/permission côté serveur ; `proxy.ts` limité aux redirections optimistes.
- Protection CSRF (Server Actions la gèrent par défaut ; à vérifier pour les Route Handlers), limitation de débit sur connexion/contact, en-têtes de sécurité / CSP (guide `content-security-policy`).
- Validation serveur de toute entrée ; échappement des sorties ; pas de secrets côté client (variables non préfixées `NEXT_PUBLIC_`).
- Journal d'audit des opérations sensibles ; données personnelles minimisées (RGPD).
- Téléversements : contrôle du type MIME, de la taille, renommage, stockage hors dépôt.

### Performance
- Rendu serveur/cached pour le catalogue, `next/image` pour les photos, pagination par curseur ou offset borné, index sur les colonnes filtrées.
- Recherche : filtres SQL au départ ; recherche plein texte Postgres si besoin (moteur dédié inutile au MVP).

## 5. Intégrations externes

| Intégration | Usage | Statut |
|---|---|---|
| Prestataire de paiement | Encaissement, remboursements, webhooks | ⏸ à valider |
| Prestataire e-mail | Notifications transactionnelles | ⏸ à valider |
| Supabase Storage | Photos, PDF | ✅ Retenu avec Supabase |
| Vercel (hébergement) + Supabase (PostgreSQL, Storage, Auth) | Production | ✅ Décidé par le porteur |
| Monitoring / logs d'erreurs | Exploitation | À choisir |
| Vérification de véhicule (SIV, historique) | Non demandé | Hors périmètre |

## 6. Environnements

`local` (base locale, prestataires en sandbox) → `staging` (copie de production, données fictives, sandbox paiement) → `production` (après validation). Configuration par variables d'environnement, validées au démarrage (échec explicite si absente). Jamais de secret dans le dépôt.

## 7. Documentation et qualité

- Documentation technique dans `docs/`, mise à jour à chaque module (cadrage §13.12).
- Décisions d'architecture consignées dans le doc 08.
- Tests : unitaires (règles métier, machine à états), intégration (DB réelle de test), E2E (parcours d'achat avec paiement sandbox), sécurité (contrôle d'accès, webhooks invalides), cas d'erreur.

## 8. Hébergement Vercel + base Supabase (décision du porteur)

Impacts à intégrer dans la conception :

| Sujet | Conséquence |
|---|---|
| Connexions à la base | Vercel est « serverless » : utiliser le pooler de connexions de Supabase (URL poolée) pour le code applicatif, la connexion directe uniquement pour les migrations |
| Tâches planifiées | Pas de processus permanent : expiration des réservations, traitement de l'outbox (e-mails) et réconciliation passent par **Vercel Cron** appelant des routes protégées par secret |
| Durée des fonctions | Limites de durée d'exécution : webhooks et génération PDF doivent être rapides ; éviter les navigateurs headless (privilégier une bibliothèque PDF légère) |
| Sécurité des données | Supabase expose une API directe : activer **Row Level Security** sur toutes les tables, ne jamais exposer la clé `service_role` au navigateur, accès aux données via le serveur |
| Région / RGPD | Choisir des régions **européennes** pour Vercel et Supabase |
| Offres | Vercel : l'offre gratuite (Hobby) est réservée à un usage non commercial → une offre payante sera nécessaire pour un site de vente. Supabase : l'offre gratuite met les projets en pause après inactivité → offre payante et sauvegardes pour la production |
| Environnements | Un projet Supabase séparé par environnement (développement / production), variables d'environnement gérées dans Vercel |
| Migrations | Gérées par l'outil de migrations (versionnées dans le dépôt), appliquées via la CLI Supabase ou l'ORM |
| Sessions | Si Supabase Auth est retenu, pas de table `sessions` maison (voir doc 06) |

Ces choix remplacent les alternatives non retenues (autre hébergeur, autre base) mais restent à confirmer pour l'ORM (T-03). L'authentification est décidée : Supabase Auth (T-04).
