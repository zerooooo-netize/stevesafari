-- New settings (idempotent inserts)
INSERT INTO public.settings (key, value, description, is_secret) VALUES
  ('referral_bonus_mode', 'fixed', 'Referral bonus calculation mode: fixed or percent', false),
  ('referral_bonus_percent', '5', 'Referral bonus percent of payment when mode=percent', false),
  ('referral_signup_discount', '1000', 'Auto-discount (KES) applied to first application fee for referred users', false),
  ('referral_signup_discount_enabled', 'true', 'Enable auto-discount for referred users', false),
  ('business_name', 'Steve Safari Agency', 'Registered business name shown in trust bar', false),
  ('business_phone', '+254700000000', 'Public business phone (click-to-call)', false),
  ('business_email', 'info@stevesafari.co.ke', 'Public business email', false),
  ('business_address', 'Nairobi, Kenya', 'Public office location', false),
  ('verified_badge_enabled', 'true', 'Show Verified Agency badge', false),
  ('trust_bar_enabled', 'true', 'Show persistent trust bar on every page', false),
  ('team_section_enabled', 'true', 'Show Meet the Team section on homepage', false)
ON CONFLICT (key) DO NOTHING;

-- Discount codes (admin-managed promo codes)
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'fixed', -- 'fixed' or 'percent'
  discount_value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'KES',
  max_uses INTEGER, -- null = unlimited
  uses_count INTEGER NOT NULL DEFAULT 0,
  applies_to TEXT NOT NULL DEFAULT 'application_fee', -- application_fee | service | any
  job_id UUID, -- optional: restrict to a specific job
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active discount codes"
  ON public.discount_codes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage discount codes"
  ON public.discount_codes FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_discount_codes_updated_at
  BEFORE UPDATE ON public.discount_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Track redemptions to prevent abuse
CREATE TABLE IF NOT EXISTS public.discount_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID,
  code TEXT NOT NULL,
  user_id UUID NOT NULL,
  payment_id UUID,
  amount_discounted NUMERIC NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'referral_auto'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their redemptions"
  ON public.discount_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create their redemptions"
  ON public.discount_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all discount redemptions"
  ON public.discount_redemptions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Team members
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active team members"
  ON public.team_members FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage team members"
  ON public.team_members FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public storage bucket for team photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-photos', 'team-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Team photos publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'team-photos');

CREATE POLICY "Admins upload team photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'team-photos' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update team photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'team-photos' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete team photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'team-photos' AND has_role(auth.uid(), 'admin'));