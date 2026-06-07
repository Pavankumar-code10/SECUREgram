-- Add grade column to auctions table
ALTER TABLE public.auctions ADD COLUMN grade text NOT NULL DEFAULT 'A' CHECK (grade IN ('A+', 'A', 'B', 'C'));
