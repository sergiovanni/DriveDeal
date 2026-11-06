-- =====================================================================================
-- Migration écrite à la main : espaces de stockage des fichiers (Supabase Storage).
--
-- Cette migration suppose le schéma « storage » propre à Supabase : elle ne fonctionne
-- pas sur une base PostgreSQL ordinaire.
--
-- Limites de taille et types de fichiers : valeurs PROPOSÉES par défaut, faciles à
-- modifier dans une nouvelle migration (docs/08, point à valider).
-- =====================================================================================

-- Photos des véhicules : publiques (affichées sur le site sans connexion).
-- Documents privés : jamais accessibles directement ; le serveur les distribuera
-- (par lien temporaire signé) aux personnes autorisées.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('vehicules-photos', 'vehicules-photos', true, 5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('documents-prives', 'documents-prives', false, 10485760,
    ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint

-- Lecture publique des photos. Aucune politique d'écriture : seul le serveur (clé de
-- service) peut ajouter ou supprimer des fichiers, après vérification des droits.
-- Aucune politique sur « documents-prives » : accès refusé à tous sauf au serveur.
CREATE POLICY "photos_vehicules_lecture_publique"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'vehicules-photos');
