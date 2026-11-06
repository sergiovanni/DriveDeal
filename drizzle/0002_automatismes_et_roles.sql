-- =====================================================================================
-- Migration écrite à la main : automatismes de base et rôles de départ.
-- (Drizzle ne sait pas générer les fonctions et déclencheurs : on les écrit ici.)
--
-- Chaque instruction est séparée par « statement-breakpoint » : c'est ce que Drizzle
-- utilise pour exécuter les instructions une par une.
-- =====================================================================================

-- 1. Mise à jour automatique de la colonne « updated_at » ---------------------------
-- Évite d'oublier de la renseigner dans le code : la base le fait toujours.
CREATE OR REPLACE FUNCTION public.mettre_a_jour_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint

CREATE TRIGGER vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.mettre_a_jour_updated_at();
--> statement-breakpoint

CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.mettre_a_jour_updated_at();
--> statement-breakpoint

-- 2. Rôles de départ -----------------------------------------------------------------
-- « client » (donné à chaque inscription) et « administrateur » (donné à la main).
-- D'autres rôles (gestionnaire de stock, commercial…) s'ajouteront plus tard.
INSERT INTO public.roles (code, label)
VALUES ('client', 'Client'), ('administrateur', 'Administrateur')
ON CONFLICT (code) DO NOTHING;
--> statement-breakpoint

-- 3. Création du profil à chaque inscription -----------------------------------------
-- Quand Supabase Auth crée un compte (table auth.users), on crée automatiquement :
--   - la ligne de profil correspondante,
--   - le rôle « client ».
-- SECURITY DEFINER : la fonction s'exécute avec les droits de son propriétaire, car
-- l'utilisateur qui s'inscrit n'a pas encore le droit d'écrire dans ces tables.
-- SET search_path = '' : protège contre le détournement de noms de tables.
CREATE OR REPLACE FUNCTION public.creer_profil_apres_inscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role_id)
  SELECT NEW.id, r.id FROM public.roles r WHERE r.code = 'client'
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
--> statement-breakpoint

-- Cette fonction n'a pas à être appelable depuis l'API publique.
REVOKE EXECUTE ON FUNCTION public.creer_profil_apres_inscription() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint

DROP TRIGGER IF EXISTS apres_inscription ON auth.users;
--> statement-breakpoint

CREATE TRIGGER apres_inscription
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.creer_profil_apres_inscription();
