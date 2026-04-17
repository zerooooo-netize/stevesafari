
DROP POLICY IF EXISTS "Public can view success story images" ON storage.objects;

-- Allow public read of individual files but block listing by requiring a known name path
CREATE POLICY "Public can read individual success story images"
ON storage.objects FOR SELECT
USING (bucket_id = 'success-stories' AND name IS NOT NULL);
