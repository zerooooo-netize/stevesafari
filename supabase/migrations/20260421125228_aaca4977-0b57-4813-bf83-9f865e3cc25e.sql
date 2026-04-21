-- Fix check constraint to allow all payment types used by the app
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_payment_type_check
  CHECK (payment_type = ANY (ARRAY[
    'application_fee'::text,
    'registration_fee'::text,
    'deposit'::text,
    'service_fee'::text,
    'travel_fee'::text,
    'accommodation_fee'::text,
    'sponsorship_fee'::text,
    'other'::text
  ]));

-- Seed brand + flow defaults if missing (admin can edit later)
INSERT INTO public.settings (key, value, description, is_secret)
VALUES
  ('site_name', 'Steve Safari Agency', 'Brand name shown in navbar and emails', false),
  ('site_logo_url', '', 'Public URL of the site logo (leave blank to use default)', false),
  ('site_tagline', 'Your Gateway to Working in Canada', 'Short tagline shown under the brand', false)
ON CONFLICT (key) DO NOTHING;