-- Relax RLS policies for profiles to allow guest/anonymous users to read seller details
DROP POLICY IF EXISTS "profiles readable by authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles readable by everyone" ON public.profiles;

CREATE POLICY "profiles readable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- Relax RLS policies for marketplace_items to allow guest/anonymous users to browse, and anyone to update stock
DROP POLICY IF EXISTS "marketplace readable by authenticated" ON public.marketplace_items;
DROP POLICY IF EXISTS "marketplace readable by everyone" ON public.marketplace_items;

CREATE POLICY "marketplace readable by everyone" ON public.marketplace_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "sellers update own items" ON public.marketplace_items;
DROP POLICY IF EXISTS "update marketplace items" ON public.marketplace_items;

CREATE POLICY "update marketplace items" ON public.marketplace_items
  FOR UPDATE USING (true) WITH CHECK (true);

-- Relax RLS policies for transactions to allow buyers (both authenticated and demo/anon) to create, read, and update transactions
DROP POLICY IF EXISTS "buyers create transactions" ON public.transactions;
CREATE POLICY "buyers create transactions" ON public.transactions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "parties read own transactions" ON public.transactions;
CREATE POLICY "parties read own transactions" ON public.transactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "parties update own transactions" ON public.transactions;
CREATE POLICY "parties update own transactions" ON public.transactions
  FOR UPDATE USING (true) WITH CHECK (true);

-- Relax RLS policies for notifications to allow cross-user inserts and queries
DROP POLICY IF EXISTS "users read own notifications" ON public.notifications;
CREATE POLICY "users read own notifications" ON public.notifications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "users insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "users insert own notifications" ON public.notifications;
CREATE POLICY "users insert own notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "users update own notifications" ON public.notifications;
CREATE POLICY "users update own notifications" ON public.notifications
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users delete own notifications" ON public.notifications;
CREATE POLICY "users delete own notifications" ON public.notifications
  FOR DELETE USING (true);

-- Update Transaction Insert Trigger to include buyer's profile details (district)
CREATE OR REPLACE FUNCTION public.handle_new_transaction_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  buyer_name text;
  buyer_district text;
BEGIN
  -- Find buyer's name and district
  SELECT name, district INTO buyer_name, buyer_district FROM public.profiles WHERE id = NEW.buyer_id;
  
  -- Insert notification for the seller
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NEW.seller_id,
    'New Buy Request',
    COALESCE(buyer_name, 'A buyer') || 
    CASE WHEN buyer_district IS NOT NULL THEN ' from ' || buyer_district ELSE ' from Karnataka' END || 
    ' has requested to buy your listed produce for ₹' || NEW.amount,
    'buy_request',
    '/transactions'
  );
  RETURN NEW;
END; $$;
