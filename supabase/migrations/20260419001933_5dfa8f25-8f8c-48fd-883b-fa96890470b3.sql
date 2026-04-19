
-- Profile verification status
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'none';

-- Application checklist gate
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS checklist_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Seed default settings (idempotent via ON CONFLICT)
INSERT INTO public.settings (key, value, description, is_secret) VALUES
  ('payment_gate_enabled',          'true',  'Block application submission until payment + docs done', false),
  ('registration_deposit_percent',  '10',    'Default deposit % to reserve a slot when deposit not configured per-job', false),
  ('service_half_payment_enabled',  'true',  'Allow users to pay 50% upfront and 50% on delivery for services', false),
  ('business_name',                 'Steve Safari Agency', 'Business name shown across the site', false),
  ('business_phone',                '+254700000000', 'Primary contact phone', false),
  ('business_email',                'info@stevesafari.co.ke', 'Primary contact email', false),
  ('whatsapp_number',               '254700000000', 'WhatsApp number (digits, no +)', false),
  ('business_address',              'Nairobi, Kenya', 'Office address', false),
  ('verified_badge_enabled',        'true',  'Show "Verified Agency" badge in TrustBar', false),
  ('trust_bar_enabled',             'true',  'Show TrustBar across all pages', false),
  ('team_section_enabled',          'true',  'Show team section on homepage', false),
  ('path_gate_enabled',             'true',  'Force users to choose Jobs vs Services path after signup', false),
  ('referral_enabled',              'true',  'Enable the whole referral system', false),
  ('referral_bonus_amount',         '1000',  'Referral bonus (KES) — used when mode=fixed', false),
  ('referral_bonus_mode',           'fixed', 'fixed | percent', false),
  ('referral_bonus_percent',        '5',     'Referral bonus % of paid amount (when mode=percent)', false),
  ('referral_signup_discount_enabled','true','Auto-apply discount to first payment for referred users', false),
  ('referral_signup_discount',      '1000',  'KES discount auto-applied for referred users on first payment', false),
  ('wallet_auto_threshold',         '2000',  'Wallet redemption auto-approved up to this KES amount', false),
  ('sponsorship_enabled',           'true',  'Show sponsorship application option', false),
  ('sponsorship_fee',               '500',   'Non-refundable sponsorship application fee (KES)', false)
ON CONFLICT (key) DO NOTHING;
