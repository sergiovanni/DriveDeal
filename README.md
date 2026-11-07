# DriveDeal

Plateforme e-commerce de **vente de véhicules d'occasion** : catalogue détaillé, achat en ligne,
paiement sécurisé, factures et espace d'administration.

> **État du projet : prototype.** Le site public est navigable (accueil, catalogue avec filtres,
> fiches véhicules, À propos, Contact). Les véhicules affichés sont des **données de
> démonstration**. Les comptes, la commande, le paiement, la facturation et le back-office ne
> sont pas encore développés. Voir la [feuille de route](docs/07-roadmap.md).

## Stack

| Rôle | Choix |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Style | Tailwind CSS 4 |
| Base de données | Supabase (PostgreSQL) |
| Accès aux données | Drizzle ORM (schéma et migrations en TypeScript/SQL) |
| Authentification | Supabase Auth (à brancher) |
| Hébergement | Vercel |
| Validation | Zod |
| Tests | Vitest |

> ⚠️ Cette version de Next.js a des changements importants par rapport aux versions
> précédentes (par exemple `middleware` s'appelle maintenant `proxy`). Avant de coder une
> fonctionnalité Next.js, lire le guide correspondant dans `node_modules/next/dist/docs/`.

## Démarrage rapide

Prérequis : **Node.js 22 ou plus** et npm.

```bash
npm install
npm run dev
```

Le site s'ouvre sur <http://localhost:3000>. Il fonctionne **sans base de données** : le
catalogue lit alors les véhicules de démonstration et le formulaire de contact est désactivé.

Pour brancher la vraie base (Supabase), suivre le
[guide de mise en route](docs/09-guide-mise-en-route.md).

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Lance le site en développement |
| `npm run build` | Construit la version de production |
| `npm run start` | Lance la version construite |
| `npm run lint` | Vérifie le style et les erreurs courantes (ESLint) |
| `npm run typecheck` | Vérifie les types TypeScript |
| `npm test` | Lance les tests (Vitest) |
| `npm run format` | Reformate le code (Prettier) |
| `npm run env:verifier` | Vérifie `.env.local` (format puis connexions réelles), sans afficher de secret |
| `npm run db:verifier-securite` | Attaques simulées sur la base de développement (avec `CONFIRMER_TEST_SECURITE=oui`) |
| `npm run db:generate` | Génère une migration SQL à partir du schéma |
| `npm run db:migrate` | Applique les migrations à la base |
| `npm run db:seed-demo` | Remplit la base de **développement** avec les véhicules de démonstration (voir docs/09) |

Avant chaque commit : `npm run typecheck && npm run lint && npm test`.

## Organisation du code

```
src/
  app/            Pages et mises en page (routage Next.js). Peu de logique : elles appellent les modules.
  components/     Composants d'interface réutilisables
    ui/             Éléments de base (bouton, badge, logo, conteneur)
    layout/         En-tête, pied de page, navigation
    animation/      Apparition au défilement, compteurs, barre de progression
    vehicules/      Cartes, filtres, pagination du catalogue
    contact/        Formulaire de contact
    auth/           Formulaires du compte (connexion, inscription, profil…)
  modules/        Logique métier, un dossier par domaine (véhicules, contact…)
  lib/            Outils transverses : base de données, Supabase, authentification (auth/), variables d'environnement, formats
  proxy.ts        Filtre des pages privées et renouvellement de session (nom Next.js 16 de « middleware »)
docs/             Documentation du projet (cadrage, règles, architecture, guides)
drizzle/          Migrations SQL (générées et écrites à la main)
scripts/          Scripts ponctuels (remplissage de la base de développement)
tests/            Tests transverses (sécurité des migrations…)
```

Principes : les pages ne contiennent pas de règles métier ; chaque module expose son API par
un fichier `index.ts` ; tout ce qui vient de l'extérieur (adresse, formulaire) est validé côté
serveur. Détails dans les [conventions de code](docs/10-conventions-de-code.md).

## Documentation

| Document | Contenu |
|---|---|
| [01 — Présentation](docs/01-presentation-projet.md) | Vision, objectifs, périmètre |
| [02 — Besoins](docs/02-expression-des-besoins.md) | Besoins fonctionnels et non fonctionnels, risques |
| [03 — Cahier des charges](docs/03-cahier-des-charges-fonctionnel.md) | Modules et critères d'acceptation |
| [04 — Règles de gestion](docs/04-regles-de-gestion.md) | Règles métier, statuts de commande |
| [05 — Architecture](docs/05-architecture-technique.md) | Stack, architecture, sécurité |
| [06 — Modèle de données](docs/06-modele-de-donnees.md) | Tables et relations |
| [07 — Roadmap](docs/07-roadmap.md) | Modules, dépendances, backlog |
| [08 — Décisions et points en attente](docs/08-decisions-et-points-en-attente.md) | Ce qui reste à décider ou à fournir |
| [09 — Guide de mise en route](docs/09-guide-mise-en-route.md) | Brancher Supabase, déployer sur Vercel |
| [10 — Conventions de code](docs/10-conventions-de-code.md) | Façon d'écrire et de commenter le code |
| [11 — Architecture backend (proposition)](docs/11-proposition-architecture-backend.md) | Authentification, rôles, RLS, stockage, environnements — **en attente de validation** |

## Règles à ne pas oublier

- Une commande créée n'est **pas** une commande payée : un paiement n'est confirmé que par le
  prestataire de paiement, côté serveur.
- Aucune donnée bancaire n'est stockée.
- Aucune facture avec des informations fiscales supposées.
- Pas de bouton ni de fonction factice : ce qui n'existe pas encore est désactivé et expliqué.
- Tout ce qui n'est pas validé par l'entreprise est consigné dans le
  [document 08](docs/08-decisions-et-points-en-attente.md) au lieu d'être inventé.
