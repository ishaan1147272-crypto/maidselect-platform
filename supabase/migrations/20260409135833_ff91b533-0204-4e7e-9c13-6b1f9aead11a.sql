
ALTER TABLE public.bookings
  ADD COLUMN total_hours numeric DEFAULT 1,
  ADD COLUMN total_amount numeric DEFAULT 0,
  ADD COLUMN platform_fee numeric DEFAULT 0,
  ADD COLUMN payment_id text,
  ADD COLUMN payment_status text DEFAULT 'pending';
