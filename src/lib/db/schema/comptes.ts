import { sql } from "drizzle-orm";
import { pgPolicy, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { authUsers, authenticatedRole } from "drizzle-orm/supabase";
import { horodatage } from "./commun";

/**
 * Comptes, rôles et permissions (docs/06, section « Comptes »).
 *
 * Principe : Supabase Auth gère l'identité (e-mail, mot de passe, vérification) dans son
 * propre schéma `auth`. Ici, on ne garde que ce qui est propre à DriveDeal :
 * le profil et les rôles. `profiles.id` est le même identifiant que `auth.users.id`.
 *
 * Sécurité : RLS activée partout. Un utilisateur connecté ne voit et ne modifie que son
 * propre profil. Les rôles et permissions n'ont AUCUNE politique publique : seul le serveur
 * (connexion directe à la base) les lit, pour décider ce qu'un utilisateur a le droit de faire.
 */

/** Profil d'un utilisateur : coordonnées modifiables depuis l'espace client. */
export const profils = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      // Si le compte Auth est supprimé, le profil l'est aussi (droit à l'effacement, RGPD).
      .references(() => authUsers.id, { onDelete: "cascade" }),
    prenom: text("first_name"),
    nom: text("last_name"),
    telephone: text("phone"),
    ...horodatage,
  },
  () => [
    pgPolicy("profil_lecture_proprietaire", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = id`,
    }),
    pgPolicy("profil_modification_proprietaire", {
      for: "update",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = id`,
      withCheck: sql`(select auth.uid()) = id`,
    }),
  ],
).enableRLS();

/** Rôle : regroupe des permissions (ex. « client », « administrateur »). */
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Identifiant technique stable, utilisé dans le code. */
  code: text("code").notNull().unique(),
  /** Nom affiché dans l'administration. */
  libelle: text("label").notNull(),
}).enableRLS();

/**
 * Permission : une action précise (ex. « vehicules.ecrire », « commandes.rembourser »).
 * La liste est créée au fil des modules ; elle permet d'ajouter des rôles intermédiaires
 * (gestionnaire de stock, commercial…) sans modifier le code (docs/02 BF-12).
 */
export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  libelle: text("label").notNull(),
}).enableRLS();

/** Liaison rôle ↔ permission. */
export const rolesPermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
).enableRLS();

/** Liaison utilisateur ↔ rôle. Un utilisateur peut avoir plusieurs rôles. */
export const utilisateursRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })],
).enableRLS();
