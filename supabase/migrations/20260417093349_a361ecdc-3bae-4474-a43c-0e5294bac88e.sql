-- Jobs: deposit support
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS deposit_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_type TEXT DEFAULT 'percentage' CHECK (deposit_type IN ('percentage','fixed')),
  ADD COLUMN IF NOT EXISTS deposit_value NUMERIC DEFAULT 0;

-- Payments: deposit + balance + receipt
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS is_deposit BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS balance_remaining NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receipt_number TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS payments_receipt_number_idx ON public.payments(receipt_number) WHERE receipt_number IS NOT NULL;

-- Auto-generate receipt number on insert
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.receipt_number IS NULL THEN
    NEW.receipt_number := 'RCP-' || to_char(now(),'YYYYMMDD') || '-' || upper(substring(replace(gen_random_uuid()::text,'-',''),1,6));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payments_receipt_number ON public.payments;
CREATE TRIGGER trg_payments_receipt_number
BEFORE INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.generate_receipt_number();

-- Service orders: link to payment
ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS payment_id UUID;

-- Email templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage email templates" ON public.email_templates;
CREATE POLICY "Admins manage email templates" ON public.email_templates
  FOR ALL USING (has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Anyone can read email templates" ON public.email_templates;
CREATE POLICY "Anyone can read email templates" ON public.email_templates
  FOR SELECT USING (true);

DROP TRIGGER IF EXISTS trg_email_templates_updated ON public.email_templates;
CREATE TRIGGER trg_email_templates_updated
BEFORE UPDATE ON public.email_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default templates (idempotent)
INSERT INTO public.email_templates (template_key, subject, body, description) VALUES
  ('registration','Welcome to Steve Safari Agency','Hi {{full_name}},

Welcome aboard! Your account has been created successfully.

You can now browse jobs in Canada, order document services, and track your application progress from your dashboard.

— Steve Safari Agency Team','Sent on user signup'),
  ('payment_success','Payment Received — Receipt {{receipt_number}}','Hi {{full_name}},

We have received your payment.

Receipt: {{receipt_number}}
Amount: KES {{amount}}
Type: {{payment_type}}
Reference: {{reference}}
Date: {{date}}

{{balance_line}}

Thank you for choosing Steve Safari Agency.','Receipt + payment confirmation'),
  ('status_update','Application Update — {{status}}','Hi {{full_name}},

Your application status has been updated to: {{status}}.

Log in to your dashboard to see details and next steps.

— Steve Safari Agency Team','Application status change'),
  ('service_complete','Your document is ready','Hi {{full_name}},

Good news — your service order ({{service_name}}) has been completed.

Log in to your dashboard to download the completed document.

— Steve Safari Agency Team','Service order completed by admin')
ON CONFLICT (template_key) DO NOTHING;

-- Seed deposit-related settings (idempotent)
INSERT INTO public.settings (key, value, description, is_secret) VALUES
  ('deposit_enabled_default','false','Global default: are deposits allowed?', false),
  ('smtp_from_email','noreply@stevesafari.co.ke','Default From: address for outbound emails', false),
  ('smtp_from_name','Steve Safari Agency','Default From: name', false)
ON CONFLICT (key) DO NOTHING;