# 10 — Conventions de code

> Objectif : un code lisible par quelqu'un qui découvre le projet, sûr par défaut, et facile à
> faire évoluer. Ces règles s'appliquent à tout le code ; en cas d'exception, l'expliquer en
> commentaire.

## 1. Langue

- **Français** pour : textes affichés, commentaires, documentation, messages de commit, noms
  des notions métier (`vehicule`, `commande`, `facture`, `filtres`…).
- **Anglais** pour ce qui est imposé par les outils : mots-clés du langage, noms des API
  (`useState`, `searchParams`…), noms de fichiers de convention Next.js (`page.tsx`,
  `layout.tsx`, `not-found.tsx`).
- Les noms doivent dire ce qu'ils font : `filtrerVehicules` plutôt que `filtre`.

## 2. Commenter : le pourquoi, pas le comment

Un bon commentaire répond à « pourquoi est-ce écrit ainsi ? », pas à « que fait cette ligne ? »
(le code le dit déjà).

| À faire | À éviter |
|---|---|
| Expliquer une règle métier ou une décision (« les montants sont en centimes pour éviter les erreurs d'arrondi ») | Paraphraser le code (`// incrémente i`) |
| Signaler un piège ou une contrainte (« `prepare: false` : requis avec le pooler Supabase ») | Laisser du code mort commenté |
| Renvoyer vers la doc quand une règle n'est pas encore validée (« à valider, docs/08 Q-12 ») | Des commentaires qui mentent après une modification |

**Où commenter :**

- **Chaque fichier important** : un commentaire `/** … */` avant l'export principal qui dit à
  quoi sert le fichier et ce qu'il faut savoir avant de le modifier.
- **Chaque fonction ou composant exporté** : une phrase de description, plus les paramètres non
  évidents.
- **Les pages** : un commentaire par grande section de la page (`{/* Héros : … */}`).
- **Les types métier** : un commentaire par champ dont l'unité ou le sens n'est pas évident
  (`prixCentimes`, `statut`).
- **Mettre à jour le commentaire en même temps que le code.**

## 3. Structure et responsabilités

- Les **pages** (`src/app`) assemblent et affichent ; elles ne contiennent pas de règle métier.
- La **logique métier** vit dans `src/modules/<domaine>/` ; chaque module expose une API
  publique par `index.ts`. On n'importe pas les fichiers internes d'un autre module.
- Les **composants** (`src/components`) sont réutilisables et ne connaissent pas la base.
- `src/lib` contient les outils sans règle métier (formats, base, Supabase, environnement).
- Un composant est **serveur par défaut**. On ne passe en composant client (`"use client"`)
  que s'il faut de l'interactivité (état, événements, API du navigateur) ; on le garde le plus
  petit possible.

## 4. Sécurité : règles non négociables

1. **Tout ce qui vient de l'extérieur est suspect** : adresse (`searchParams`), formulaire,
   en-têtes. On le valide côté serveur (Zod) avant de l'utiliser. Exemple : `lireFiltres`.
2. Les **contrôles d'accès** (connexion, rôle, propriétaire) se font côté serveur, au plus près
   de la donnée. Masquer un bouton n'est pas une protection.
3. **Aucun secret côté navigateur** : seules les variables `NEXT_PUBLIC_*` sont publiques.
   `SUPABASE_SERVICE_ROLE_KEY` et `DATABASE_URL` ne sont jamais importées dans un composant
   client.
4. **RLS activée sur toutes les tables.** Les tables sensibles n'ont aucune politique publique.
5. **Jamais de détail technique dans un message d'erreur affiché** : on journalise côté serveur,
   on affiche un message simple.
6. Aucune donnée bancaire n'est stockée ni journalisée.

## 5. Données

- **Montants en centimes** (entiers) avec un code devise ; formatage uniquement à l'affichage
  (`formaterPrix`).
- **Dates** en UTC en base (`timestamptz`), formatées à l'affichage.
- Le **schéma de base** est la source de vérité : on le modifie dans `src/lib/db/schema/`, on
  génère une migration (`npm run db:generate`), on la relit, puis on l'applique. Une migration
  appliquée n'est jamais modifiée.
- Les **règles métier non validées** ne sont pas implémentées : elles sont consignées dans le
  [document 08](08-decisions-et-points-en-attente.md).

## 6. Interface

- Pas de bouton ni de fonction factice : si une fonctionnalité n'existe pas encore, l'élément
  est désactivé et une phrase explique pourquoi.
- Accessibilité : labels liés aux champs, `aria-invalid` et `aria-describedby` pour les
  erreurs, `aria-current` sur la page active, texte alternatif sur les illustrations, focus
  visible.
- **Animations** : uniquement `transform` et `opacity` ; le contenu doit rester visible sans
  JavaScript ; tout doit s'arrêter si l'utilisateur a demandé de réduire les animations
  (`prefers-reduced-motion`).
- Couleurs et espacements viennent des variables définies dans `globals.css`, pas de valeurs
  écrites au hasard.

## 7. Tests

- Toute **règle métier** et toute **fonction de validation** a ses tests (`*.test.ts` à côté du
  code). Un cas normal, un cas limite, un cas d'erreur.
- Avant chaque commit : `npm run typecheck && npm run lint && npm test`.
- Une fonctionnalité n'est « terminée » que si elle est testée et que la documentation est à
  jour.

## 8. Git

- **Commits de taille moyenne** : un commit = un ensemble cohérent (par exemple « schéma des
  véhicules + migration + tests »), ni une ligne isolée ni tout le projet.
- Message en français : une première ligne courte à l'indicatif (« Ajoute… », « Corrige… »),
  puis un paragraphe qui explique le **pourquoi**.
- Pas de mention d'outil ou d'auteur automatique dans les messages.
- `main` doit toujours passer type-check, lint, tests et build.
- Ne jamais commiter de secret (`.env.local`) ; vérifier avec `git status` avant `git add`.

## 9. Spécificités de Next.js 16

- `searchParams` et `params` sont des **promesses** : on les `await`.
- `middleware.ts` est renommé **`proxy.ts`** et ne sert qu'à des vérifications légères (lecture
  d'un cookie) : l'autorisation complète se fait dans les pages et les actions serveur.
- `cookies()` et `headers()` sont **asynchrones**.
- Pour une page d'erreur, la fonction de nouvelle tentative s'appelle `unstable_retry`.
- Dans le doute : lire le guide dans `node_modules/next/dist/docs/` avant d'écrire le code.
