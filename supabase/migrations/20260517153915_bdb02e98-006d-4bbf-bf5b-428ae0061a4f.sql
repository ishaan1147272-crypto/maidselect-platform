INSERT INTO storage.buckets (id, name, public)
VALUES ('maid-photos', 'maid-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public can view maid-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'maid-photos');

CREATE POLICY "Admins can upload maid-photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'maid-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update maid-photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'maid-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete maid-photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'maid-photos' AND public.has_role(auth.uid(), 'admin'));