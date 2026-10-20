CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title_id TEXT NOT NULL,
  title_en TEXT NOT NULL,
  era TEXT NOT NULL,
  description_id TEXT NOT NULL,
  description_en TEXT NOT NULL,
  material TEXT,
  location TEXT,
  image_url TEXT,
  image_alt TEXT NOT NULL
);

ALTER TABLE public.artifacts
  ADD COLUMN IF NOT EXISTS slug TEXT;

DO $$
DECLARE
  artifact_record RECORD;
  base_slug TEXT;
  candidate_slug TEXT;
  suffix INTEGER;
BEGIN
  FOR artifact_record IN
    SELECT id, title_id
    FROM public.artifacts
    WHERE slug IS NULL OR btrim(slug) = ''
    ORDER BY created_at, id
  LOOP
    base_slug := regexp_replace(
      regexp_replace(lower(artifact_record.title_id), '[^a-z0-9]+', '-', 'g'),
      '(^-+|-+$)',
      '',
      'g'
    );
    IF base_slug = '' THEN
      base_slug := 'artifact';
    END IF;

    candidate_slug := base_slug;
    suffix := 2;
    WHILE EXISTS (
      SELECT 1 FROM public.artifacts
      WHERE slug = candidate_slug AND id <> artifact_record.id
    ) LOOP
      candidate_slug := base_slug || '-' || suffix;
      suffix := suffix + 1;
    END LOOP;

    UPDATE public.artifacts
    SET slug = candidate_slug
    WHERE id = artifact_record.id;
  END LOOP;
END
$$;

ALTER TABLE public.artifacts
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS artifacts_slug_key
  ON public.artifacts (slug);

CREATE OR REPLACE FUNCTION public.assign_artifact_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  candidate_slug TEXT;
  suffix INTEGER := 2;
BEGIN
  IF NEW.slug IS NOT NULL AND btrim(NEW.slug) <> '' THEN
    RETURN NEW;
  END IF;

  base_slug := regexp_replace(
    regexp_replace(lower(coalesce(NEW.title_id, '')), '[^a-z0-9]+', '-', 'g'),
    '(^-+|-+$)',
    '',
    'g'
  );
  IF base_slug = '' THEN
    base_slug := 'artifact';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(base_slug, 0));
  candidate_slug := base_slug;
  WHILE EXISTS (
    SELECT 1 FROM public.artifacts
    WHERE slug = candidate_slug AND id <> NEW.id
  ) LOOP
    candidate_slug := base_slug || '-' || suffix;
    suffix := suffix + 1;
  END LOOP;
  NEW.slug := candidate_slug;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS artifacts_assign_slug ON public.artifacts;
CREATE TRIGGER artifacts_assign_slug
  BEFORE INSERT ON public.artifacts
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_artifact_slug();

ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.artifacts TO anon, authenticated;

DROP POLICY IF EXISTS "Public can read artifacts" ON public.artifacts;
CREATE POLICY "Public can read artifacts"
  ON public.artifacts FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Development clients can insert artifacts" ON public.artifacts;
CREATE POLICY "Development clients can insert artifacts"
  ON public.artifacts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Development clients can update artifacts" ON public.artifacts;
CREATE POLICY "Development clients can update artifacts"
  ON public.artifacts FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Development clients can delete artifacts" ON public.artifacts;
CREATE POLICY "Development clients can delete artifacts"
  ON public.artifacts FOR DELETE
  TO anon, authenticated
  USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('artifact-images', 'artifact-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Public can view artifact images" ON storage.objects;
CREATE POLICY "Public can view artifact images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'artifact-images');

DROP POLICY IF EXISTS "Development clients can upload artifact images" ON storage.objects;
CREATE POLICY "Development clients can upload artifact images"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'artifact-images');

DROP POLICY IF EXISTS "Development clients can update artifact images" ON storage.objects;
CREATE POLICY "Development clients can update artifact images"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'artifact-images')
  WITH CHECK (bucket_id = 'artifact-images');

DROP POLICY IF EXISTS "Development clients can delete artifact images" ON storage.objects;
CREATE POLICY "Development clients can delete artifact images"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'artifact-images');
