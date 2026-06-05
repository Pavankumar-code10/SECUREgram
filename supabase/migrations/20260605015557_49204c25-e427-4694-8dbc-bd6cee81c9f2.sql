
ALTER TABLE public.marketplace_items
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

CREATE OR REPLACE FUNCTION public.marketplace_items_sync_location()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.location := NULL;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_marketplace_items_sync_location ON public.marketplace_items;
CREATE TRIGGER trg_marketplace_items_sync_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON public.marketplace_items
FOR EACH ROW EXECUTE FUNCTION public.marketplace_items_sync_location();

CREATE INDEX IF NOT EXISTS idx_marketplace_items_location
  ON public.marketplace_items USING GIST (location);

CREATE OR REPLACE FUNCTION public.nearby_marketplace_items(
  buyer_lat double precision,
  buyer_lng double precision,
  radius_km double precision DEFAULT 100,
  category_filter text DEFAULT NULL,
  q text DEFAULT NULL
)
RETURNS TABLE (
  id uuid, seller_id uuid, name text, category text,
  price numeric, stock numeric, unit text, image_url text,
  district text, state text,
  latitude double precision, longitude double precision,
  distance_km double precision, created_at timestamptz
)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT
    m.id, m.seller_id, m.name, m.category, m.price, m.stock, m.unit, m.image_url,
    m.district, m.state, m.latitude, m.longitude,
    ST_Distance(m.location, ST_SetSRID(ST_MakePoint(buyer_lng, buyer_lat), 4326)::geography) / 1000.0 AS distance_km,
    m.created_at
  FROM public.marketplace_items m
  WHERE m.location IS NOT NULL
    AND ST_DWithin(m.location, ST_SetSRID(ST_MakePoint(buyer_lng, buyer_lat), 4326)::geography, radius_km * 1000)
    AND (category_filter IS NULL OR m.category = category_filter)
    AND (q IS NULL OR m.name ILIKE '%' || q || '%')
  ORDER BY distance_km ASC LIMIT 200;
$$;

GRANT EXECUTE ON FUNCTION public.nearby_marketplace_items(double precision, double precision, double precision, text, text) TO authenticated, anon;
