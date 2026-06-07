-- Relax bids insert policy to allow simulation/mock bids from client
DROP POLICY IF EXISTS "users insert own bids" ON public.bids;
CREATE POLICY "users insert own bids" ON public.bids
  FOR INSERT TO authenticated WITH CHECK (true);
