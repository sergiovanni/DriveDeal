# 09 — Guide de mise en route : Supabase et Vercel

> Ce guide explique comment brancher la vraie base de données et mettre le site en ligne.
> Les intitulés exacts des écrans de Supabase et de Vercel peuvent évoluer : en cas de doute,
> chercher le mot-clé indiqué dans leur interface.

## Vue d'ensemble

```
Navigateur ──► Vercel (le site Next.js) ──► Supabase (base PostgreSQL, Auth, fichiers)
```

Le site fonctionne déjà **sans** Supabase (données de démonstration). Brancher Supabase active :
le formulaire de contact, puis, au fil des modules, les comptes, le catalogue réel, les
commandes, etc.

## Partie A — Créer le projet Supabase

1. Créer un compte sur <https://supabase.com> puis un **nouveau projet**.
2. **Région** : choisir une région européenne (Paris ou Francfort) pour la conformité RGPD.
3. **Mot de passe de la base** : en créer un solide et le **conserver dans un gestionnaire de
   mots de passe**. Il ne sera plus affiché ensuite.
4. Attendre quelques minutes la fin de la création.

### Récupérer les valeurs de configuration

| Variable | Où la trouver | Nature |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Réglages du projet → API → « Project URL » | Publique |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Réglages → API → clé « anon » / « publishable » | Publique (protégée par les règles RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Réglages → API → clé « service_role » | **Secrète** : contourne toutes les protections |
| `DATABASE_URL` | Bouton « Connect » → chaîne de connexion **pooler / transaction** (port 6543) | **Secrète** |
| `DATABASE_DIRECT_URL` | Bouton « Connect » → chaîne de connexion **directe** (port 5432) | **Secrète** |

> La chaîne de connexion contient `[YOUR-PASSWORD]` : le remplacer par le mot de passe de la
> base choisi à l'étape 3.

### Renseigner `.env.local`

```bash
cp .env.example .env.local
```

Ouvrir `.env.local` et coller les valeurs. **Ce fichier est ignoré par git** : ne jamais le
commiter, ne jamais envoyer ces clés par message ou par e-mail.

## Partie B — Créer les tables

Les tables sont décrites dans `src/lib/db/schema/` et traduites en SQL dans `drizzle/`.

```bash
npm run db:migrate
```

Cette commande applique les migrations à la base (elle utilise `DATABASE_DIRECT_URL`).
Vérification : dans Supabase → **Table Editor**, la table `contact_messages` doit apparaître,
avec le badge « RLS enabled ».

### Pourquoi « RLS » ?

Supabase expose la base par une API directe. La **Row Level Security** (sécurité par lignes)
décide qui peut lire ou écrire chaque ligne. Règle du projet : **toute table a la RLS activée**,
et les tables sensibles n'ont **aucune** politique publique. Le site y accède par le serveur
(connexion directe), jamais depuis le navigateur.

### Modifier le schéma plus tard

1. Modifier le fichier du schéma dans `src/lib/db/schema/`.
2. `npm run db:generate` : crée une nouvelle migration SQL (à relire).
3. `npm run db:migrate` : l'applique.
4. Commiter le schéma **et** la migration ensemble.

Ne jamais modifier une migration déjà appliquée : en créer une nouvelle.

### Remplir la base de développement (facultatif)

Pour voir le catalogue alimenté par la vraie base avant d'avoir saisi le vrai stock :

```bash
CONFIRMER_SEED=oui npm run db:seed-demo
```

Le script ajoute les 12 véhicules de démonstration (marques, modèles, équipements, documents).
Il peut être relancé sans danger (les véhicules déjà présents sont ignorés). **Ne jamais le
lancer sur la base de production** : ces véhicules sont fictifs (le script refuse de tourner si
`NODE_ENV=production`). Pour les retirer, supprimer les véhicules de référence `DD-0001` à
`DD-0012` depuis le Table Editor de Supabase.

## Partie C — Tester en local

```bash
npm run dev
```

Ouvrir <http://localhost:3000/contact> : le bouton « Envoyer le message » est maintenant actif.
Envoyer un message de test puis vérifier dans Supabase → Table Editor → `contact_messages`
que la ligne est apparue.

Ouvrir ensuite <http://localhost:3000/vehicules> : dès que `DATABASE_URL` est renseignée, le
catalogue lit la **base** (et non plus les données de démonstration intégrées). Si la base est
vide, la page affiche « Aucun véhicule » : c'est normal tant qu'aucun véhicule n'est publié.

> Le catalogue est mis en cache 60 secondes : un véhicule publié peut mettre jusqu'à une minute
> à apparaître.

## Partie D — Mettre en ligne sur Vercel

1. Pousser le code sur GitHub (déjà fait pour la branche `main`).
2. Sur <https://vercel.com> : **Add New → Project**, choisir le dépôt `DriveDeal`.
   Vercel détecte Next.js automatiquement.
3. **Environment Variables** : ajouter les 5 variables du tableau ci-dessus (copier les valeurs
   de `.env.local`) et `NEXT_PUBLIC_SITE_URL` avec l'adresse définitive du site.
4. Choisir une **région de fonctions européenne** (ex. Paris `cdg1`) dans les réglages du
   projet, proche de la base Supabase.
5. **Deploy**. Chaque push sur `main` redéploie ; chaque branche reçoit une adresse de
   prévisualisation.

### Points d'attention

- **Offres payantes** : l'offre gratuite de Vercel (Hobby) est réservée à un usage non
  commercial. Pour un site de vente, prévoir une offre Pro. Côté Supabase, l'offre gratuite met
  les projets en pause après inactivité : prévoir une offre payante et activer les sauvegardes
  avant la mise en production.
- **Deux environnements** : créer un projet Supabase de **développement** et un de
  **production**, avec des clés différentes. Ne jamais tester sur la base de production.
- **Connexions** : le site utilise l'adresse « pooler » (`DATABASE_URL`) ; les migrations
  utilisent la connexion directe. Ne pas les inverser.
- **Nom de domaine** : à ajouter dans Vercel → Domains, puis à reporter dans
  `NEXT_PUBLIC_SITE_URL` et dans les réglages d'authentification de Supabase (URL du site et
  URL de redirection), quand l'authentification sera branchée.

## Checklist avant la mise en production

- [ ] Projet Supabase de production créé, région européenne, sauvegardes activées
- [ ] Toutes les tables ont la RLS activée
- [ ] Clé `service_role` présente uniquement dans les variables d'environnement serveur
- [ ] Aucune clé dans le dépôt (`git log -p | grep -i service_role` ne doit rien renvoyer)
- [ ] Variables d'environnement renseignées dans Vercel (production)
- [ ] Nom de domaine et HTTPS actifs
- [ ] Textes légaux fournis et publiés (mentions légales, CGV, confidentialité)
- [ ] Décisions métier du [document 08](08-decisions-et-points-en-attente.md) validées pour les
      modules mis en ligne (TVA, paiement, remboursement…)
- [ ] Paiement testé en mode **sandbox** uniquement tant que le prestataire n'est pas validé

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| « Variables d'environnement invalides ou manquantes » | `.env.local` absent ou incomplet | Comparer avec `.env.example` |
| `npm run db:migrate` échoue sur la connexion | Mauvaise chaîne ou mot de passe | Vérifier `DATABASE_DIRECT_URL` et le mot de passe |
| Erreur « prepared statement » en production | Connexion directe utilisée à la place du pooler | `DATABASE_URL` doit être l'adresse pooler (port 6543) |
| Bouton de contact grisé | `DATABASE_URL` vide | Renseigner `.env.local` puis relancer `npm run dev` |
| Message « Votre message n'a pas pu être enregistré » | Migration non appliquée ou base inaccessible | Lancer `npm run db:migrate`, consulter les logs du serveur |
