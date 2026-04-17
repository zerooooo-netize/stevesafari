
-- Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Backfill referral codes for existing profiles
UPDATE public.profiles 
SET referral_code = upper(substring(replace(gen_random_uuid()::text,'-',''),1,8))
WHERE referral_code IS NULL;

-- Referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reward_amount NUMERIC DEFAULT 0,
  reward_currency TEXT DEFAULT 'KES',
  reward_paid BOOLEAN DEFAULT false,
  payment_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referred_user_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals (as referrer)"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "System can insert referrals"
ON public.referrals FOR INSERT
WITH CHECK (auth.uid() = referred_user_id);

CREATE POLICY "Admins manage all referrals"
ON public.referrals FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Success stories
CREATE TABLE public.success_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  job_title TEXT,
  country TEXT,
  story TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active success stories"
ON public.success_stories FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins manage success stories"
ON public.success_stories FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_success_stories_updated_at
BEFORE UPDATE ON public.success_stories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user to generate referral code and process referral codes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_id UUID;
  v_ref_code TEXT;
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, referral_code)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    upper(substring(replace(gen_random_uuid()::text,'-',''),1,8))
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  -- Process referral if referred_by code present in metadata
  v_ref_code := NEW.raw_user_meta_data->>'referred_by';
  IF v_ref_code IS NOT NULL AND length(v_ref_code) > 0 THEN
    SELECT user_id INTO v_referrer_id FROM public.profiles WHERE referral_code = upper(v_ref_code) LIMIT 1;
    IF v_referrer_id IS NOT NULL AND v_referrer_id <> NEW.id THEN
      INSERT INTO public.referrals (referrer_id, referred_user_id, referral_code, status)
      VALUES (v_referrer_id, NEW.id, upper(v_ref_code), 'pending')
      ON CONFLICT (referred_user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create storage bucket for success story images
INSERT INTO storage.buckets (id, name, public)
VALUES ('success-stories', 'success-stories', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view success story images"
ON storage.objects FOR SELECT
USING (bucket_id = 'success-stories');

CREATE POLICY "Admins can upload success story images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'success-stories' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update success story images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'success-stories' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete success story images"
ON storage.objects FOR DELETE
USING (bucket_id = 'success-stories' AND has_role(auth.uid(), 'admin'::app_role));
