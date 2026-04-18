-- Path choice on profile
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chosen_path TEXT;

-- Sponsorship applications
CREATE TABLE IF NOT EXISTS public.sponsorship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  application_id UUID NULL,
  service_order_id UUID NULL,
  reason TEXT NOT NULL,
  requested_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'KES',
  application_fee_payment_id UUID NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, fee_pending
  admin_notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsorship_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create their sponsorship applications"
ON public.sponsorship_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view their sponsorship applications"
ON public.sponsorship_applications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage sponsorship applications"
ON public.sponsorship_applications FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_sponsorship_updated_at
BEFORE UPDATE ON public.sponsorship_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Wallet redemptions (spending referral earnings)
CREATE TABLE IF NOT EXISTS public.wallet_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'KES',
  payment_id UUID NULL,
  application_id UUID NULL,
  service_order_id UUID NULL,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, applied, rejected
  admin_notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create their redemptions"
ON public.wallet_redemptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view their redemptions"
ON public.wallet_redemptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage redemptions"
ON public.wallet_redemptions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_redemptions_updated_at
BEFORE UPDATE ON public.wallet_redemptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Default settings
INSERT INTO public.settings (key, value, description, is_secret) VALUES
  ('sponsorship_fee', '500', 'Non-refundable fee to apply for sponsorship (KES)', false),
  ('sponsorship_enabled', 'true', 'Enable sponsorship applications', false),
  ('wallet_auto_threshold', '2000', 'Wallet redemptions at or below this amount are auto-approved (KES)', false),
  ('path_gate_enabled', 'true', 'Show the Jobs vs Documents path screen after login', false)
ON CONFLICT (key) DO NOTHING;