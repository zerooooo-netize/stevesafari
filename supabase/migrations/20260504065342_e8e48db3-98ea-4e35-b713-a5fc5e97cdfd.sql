
-- Seed admin-configurable onboarding steps. Comma-separated list of step keys.
-- Allowed keys: path, profile, registration-pay, jobs, services, documents, batch, sponsorship, ready
INSERT INTO public.settings (key, value, description, is_secret)
VALUES
  ('onboarding_steps_jobs',
   'path,profile,registration-pay,jobs,documents,batch,sponsorship,ready',
   'Ordered comma-separated step keys for the JOBS onboarding flow. Admin can disable steps by removing keys.',
   false),
  ('onboarding_steps_services',
   'path,profile,services,documents,ready',
   'Ordered comma-separated step keys for the SERVICES onboarding flow. Admin can disable steps by removing keys.',
   false)
ON CONFLICT (key) DO NOTHING;
