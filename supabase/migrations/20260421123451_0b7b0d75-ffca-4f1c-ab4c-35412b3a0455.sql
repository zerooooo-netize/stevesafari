
-- 1. Sponsorship: track mode + proof file
ALTER TABLE public.sponsorship_applications
  ADD COLUMN IF NOT EXISTS sponsor_mode text NOT NULL DEFAULT 'agency',
  ADD COLUMN IF NOT EXISTS proof_file_url text;

-- 2. Application: batch readiness
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS batch_ready boolean NOT NULL DEFAULT false;

-- 3. Storage bucket for accommodation proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('accommodation-proofs', 'accommodation-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Per-user upload/read; admins read all
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Users upload own accommodation proofs') THEN
    CREATE POLICY "Users upload own accommodation proofs"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'accommodation-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Users read own accommodation proofs') THEN
    CREATE POLICY "Users read own accommodation proofs"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'accommodation-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Admins read all accommodation proofs') THEN
    CREATE POLICY "Admins read all accommodation proofs"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'accommodation-proofs' AND public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 4. Seed settings (idempotent)
INSERT INTO public.settings (key, value, description, is_secret) VALUES
  ('accommodation_fee', '15000', 'Default accommodation/sponsorship fee in KES', false),
  ('max_active_applications', '3', 'Max active job applications per user', false),
  ('sponsorship_self_proof_enabled', 'true', 'Allow users to upload proof of self funding', false),
  ('referral_enabled', 'true', 'Enable referral rewards', false),
  ('referral_bonus_mode', 'fixed', 'Referral bonus mode: fixed or percent', false),
  ('referral_bonus_amount', '200', 'Fixed referral bonus in KES', false),
  ('referral_bonus_percent', '5', 'Referral bonus percent (when mode=percent)', false)
ON CONFLICT (key) DO NOTHING;
