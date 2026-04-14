
ALTER TABLE public.maids ADD COLUMN phone text;

INSERT INTO storage.buckets (id, name, public) VALUES ('maid-images', 'maid-images', true);

CREATE POLICY "Anyone can view maid images" ON storage.objects FOR SELECT USING (bucket_id = 'maid-images');

CREATE POLICY "Admins can upload maid images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'maid-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update maid images" ON storage.objects FOR UPDATE USING (bucket_id = 'maid-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete maid images" ON storage.objects FOR DELETE USING (bucket_id = 'maid-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
