-- Ensure the avatars bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Relax storage policies for the avatars bucket to allow public access and anonymous uploads/views
DROP POLICY IF EXISTS "avatars read own" ON storage.objects;
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars insert own" ON storage.objects;
DROP POLICY IF EXISTS "avatars public insert" ON storage.objects;
CREATE POLICY "avatars public insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars update own" ON storage.objects;
DROP POLICY IF EXISTS "avatars public update" ON storage.objects;
CREATE POLICY "avatars public update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars delete own" ON storage.objects;
DROP POLICY IF EXISTS "avatars public delete" ON storage.objects;
CREATE POLICY "avatars public delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars');

-- Relax insert and delete policies for marketplace_items to allow listing management without authentication constraints
DROP POLICY IF EXISTS "sellers insert own items" ON public.marketplace_items;
DROP POLICY IF EXISTS "marketplace insert items" ON public.marketplace_items;
CREATE POLICY "marketplace insert items" ON public.marketplace_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "sellers delete own items" ON public.marketplace_items;
DROP POLICY IF EXISTS "marketplace delete items" ON public.marketplace_items;
CREATE POLICY "marketplace delete items" ON public.marketplace_items
  FOR DELETE USING (true);
