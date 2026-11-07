-- =====================================================================================
-- Migration écrite à la main : numérotation automatique des références de véhicules.
--
-- Chaque nouveau véhicule reçoit une référence « DD-0100 », « DD-0101 »… sans que
-- l'administrateur ait à la saisir. La suite démarre à 100 pour ne pas entrer en collision
-- avec les 12 véhicules de démonstration (DD-0001 à DD-0012, script db:seed-demo).
-- Une séquence PostgreSQL est « atomique » : deux créations simultanées ne reçoivent
-- jamais le même numéro.
-- =====================================================================================

CREATE SEQUENCE IF NOT EXISTS public.vehicle_reference_seq START WITH 100;
--> statement-breakpoint

-- Supabase accorde par défaut des droits sur les séquences aux rôles de l'API publique :
-- on les retire. Seul le serveur (connexion directe) crée des véhicules.
REVOKE ALL ON SEQUENCE public.vehicle_reference_seq FROM PUBLIC, anon, authenticated;
