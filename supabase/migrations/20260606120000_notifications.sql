-- ============ notifications table ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable real-time for notifications table
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.notifications;
  end if;
exception
  when others then
    -- Ignore errors if table is already added or publication settings differ
    null;
end $$;

-- ============ Triggers and Functions ============

-- 1. Chat Message Trigger
CREATE OR REPLACE FUNCTION public.handle_new_chat_message_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sender_name text;
BEGIN
  -- Find sender's name
  SELECT name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  
  -- Insert notification for the recipient
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NEW.recipient_id,
    'New message from ' || COALESCE(sender_name, 'User'),
    CASE WHEN length(NEW.body) > 60 THEN left(NEW.body, 57) || '...' ELSE NEW.body END,
    'chat_message',
    '/chat?to=' || NEW.sender_id
  );
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_chat_message_notification ON public.chat_messages;
CREATE TRIGGER trg_chat_message_notification
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_chat_message_notification();


-- 2. Transaction Insert Trigger (Buy Request)
CREATE OR REPLACE FUNCTION public.handle_new_transaction_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  buyer_name text;
BEGIN
  -- Find buyer's name
  SELECT name INTO buyer_name FROM public.profiles WHERE id = NEW.buyer_id;
  
  -- Insert notification for the seller
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NEW.seller_id,
    'New Buy Request',
    COALESCE(buyer_name, 'A buyer') || ' has requested to buy your listed produce for ₹' || NEW.amount,
    'buy_request',
    '/transactions'
  );
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_transaction_notification ON public.transactions;
CREATE TRIGGER trg_transaction_notification
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_transaction_notification();


-- 3. Transaction Update Trigger
CREATE OR REPLACE FUNCTION public.handle_transaction_update_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  updater_id uuid;
  other_party_id uuid;
  title_text text;
  msg_text text;
BEGIN
  -- Check if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- auth.uid() tells us who is performing the update
    updater_id := auth.uid();
    
    -- If updater is buyer, notify seller. If updater is seller, notify buyer.
    -- If updater is null (e.g. system background check), notify buyer.
    IF updater_id = NEW.buyer_id THEN
      other_party_id := NEW.seller_id;
      title_text := 'Order Updated by Buyer';
      msg_text := 'Buyer updated order status to ' || NEW.status || ' for amount ₹' || NEW.amount;
    ELSIF updater_id = NEW.seller_id THEN
      other_party_id := NEW.buyer_id;
      title_text := 'Order Updated by Seller';
      msg_text := 'Seller updated order status to ' || NEW.status || ' for amount ₹' || NEW.amount;
    ELSE
      -- System update, notify buyer (or seller, let's notify buyer as default)
      other_party_id := NEW.buyer_id;
      title_text := 'Order Status Changed';
      msg_text := 'Your order status has changed to ' || NEW.status || ' for amount ₹' || NEW.amount;
    END IF;

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      other_party_id,
      title_text,
      msg_text,
      'transaction_update',
      '/transactions'
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_transaction_update_notification ON public.transactions;
CREATE TRIGGER trg_transaction_update_notification
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_transaction_update_notification();


-- 4. Bid Insert Trigger
CREATE OR REPLACE FUNCTION public.handle_new_bid_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  bidder_name text;
  auction_seller_id uuid;
  auction_title text;
BEGIN
  -- Get bidder's name
  SELECT name INTO bidder_name FROM public.profiles WHERE id = NEW.bidder_id;
  
  -- Get auction's seller and title
  SELECT seller_id, title INTO auction_seller_id, auction_title FROM public.auctions WHERE id = NEW.auction_id;
  
  -- Notify seller (only if bidder is not the seller themselves)
  IF NEW.bidder_id <> auction_seller_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      auction_seller_id,
      'New Bid Placed',
      COALESCE(bidder_name, 'A bidder') || ' placed a bid of ₹' || NEW.amount || ' on "' || COALESCE(auction_title, 'your auction') || '"',
      'bid_alert',
      '/auctions'
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_new_bid_notification ON public.bids;
CREATE TRIGGER trg_new_bid_notification
  AFTER INSERT ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_bid_notification();
