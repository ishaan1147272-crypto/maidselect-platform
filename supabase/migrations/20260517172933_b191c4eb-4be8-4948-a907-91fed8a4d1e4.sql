
ALTER TABLE public.maids
  ADD COLUMN IF NOT EXISTS weekly_rate numeric,
  ADD COLUMN IF NOT EXISTS monthly_rate numeric,
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;
