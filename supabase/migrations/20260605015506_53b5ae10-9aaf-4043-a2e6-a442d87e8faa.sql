
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

CREATE OR REPLACE FUNCTION public.listings_sync_location()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.location := NULL;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_listings_sync_location ON public.listings;
CREATE TRIGGER trg_listings_sync_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.listings_sync_location();

CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings USING GIST (location);

CREATE OR REPLACE FUNCTION public.nearby_listings(
  buyer_lat double precision,
  buyer_lng double precision,
  radius_km double precision DEFAULT 50,
  crop_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid, seller_id uuid, crop text, quantity_quintal numeric,
  price_per_quintal numeric, description text, district text, state text,
  latitude double precision, longitude double precision,
  distance_km double precision, created_at timestamptz
)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT
    l.id, l.seller_id, l.crop, l.quantity_quintal, l.price_per_quintal,
    l.description, l.district, l.state, l.latitude, l.longitude,
    ST_Distance(l.location, ST_SetSRID(ST_MakePoint(buyer_lng, buyer_lat), 4326)::geography) / 1000.0 AS distance_km,
    l.created_at
  FROM public.listings l
  WHERE l.location IS NOT NULL
    AND ST_DWithin(l.location, ST_SetSRID(ST_MakePoint(buyer_lng, buyer_lat), 4326)::geography, radius_km * 1000)
    AND (crop_filter IS NULL OR l.crop ILIKE '%' || crop_filter || '%')
  ORDER BY distance_km ASC LIMIT 200;
$$;

GRANT EXECUTE ON FUNCTION public.nearby_listings(double precision, double precision, double precision, text) TO authenticated, anon;

CREATE TABLE IF NOT EXISTS public.mandi_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity text NOT NULL,
  variety text,
  market text NOT NULL,
  district text,
  state text NOT NULL,
  min_price numeric NOT NULL,
  max_price numeric NOT NULL,
  modal_price numeric NOT NULL,
  arrival_date date NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mandi_prices TO authenticated, anon;
GRANT ALL ON public.mandi_prices TO service_role;

ALTER TABLE public.mandi_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mandi prices readable by everyone"
  ON public.mandi_prices FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_mandi_commodity_date
  ON public.mandi_prices (commodity, arrival_date DESC);
CREATE INDEX IF NOT EXISTS idx_mandi_state_commodity
  ON public.mandi_prices (state, commodity, arrival_date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_mandi_row
  ON public.mandi_prices (commodity, market, state, arrival_date, COALESCE(variety, ''));
