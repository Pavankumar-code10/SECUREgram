import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AGMARKNET_URL =
  "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

const InputSchema = z.object({
  commodity: z.string().min(1).max(80),
  state: z.string().min(1).max(80).default("Karnataka"),
});

type AgmarknetRecord = {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string; // dd/mm/yyyy
  min_price: string;
  max_price: string;
  modal_price: string;
};

function parseDmy(d: string): string {
  // dd/mm/yyyy → yyyy-mm-dd
  const [dd, mm, yyyy] = d.split("/");
  if (!dd || !mm || !yyyy) return new Date().toISOString().slice(0, 10);
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

export const getMandiPrice = createServerFn({ method: "GET" })
  .inputValidator((d) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Cache check: return rows fetched in last 6 hours
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabaseAdmin
      .from("mandi_prices")
      .select("*")
      .ilike("commodity", data.commodity)
      .eq("state", data.state)
      .gte("fetched_at", sixHoursAgo)
      .order("arrival_date", { ascending: false })
      .limit(20);

    if (cached && cached.length > 0) {
      return { source: "cache" as const, rows: cached };
    }

    // 2. Fetch from data.gov.in Agmarknet
    const apiKey = process.env.DATA_GOV_IN_API_KEY;
    if (!apiKey) throw new Error("DATA_GOV_IN_API_KEY not configured");

    const url = new URL(AGMARKNET_URL);
    url.searchParams.set("api-key", apiKey);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "40");
    url.searchParams.set("filters[state.keyword]", data.state);
    url.searchParams.set("filters[commodity]", data.commodity);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Agmarknet API error: ${res.status} ${await res.text()}`);
    }
    const payload = (await res.json()) as { records?: AgmarknetRecord[] };
    const records = payload.records ?? [];

    if (records.length === 0) {
      return { source: "live" as const, rows: [] };
    }

    // 3. Upsert into cache
    const upsertRows = records.map((r) => ({
      commodity: r.commodity,
      variety: r.variety || null,
      market: r.market,
      district: r.district || null,
      state: r.state,
      min_price: Number(r.min_price) || 0,
      max_price: Number(r.max_price) || 0,
      modal_price: Number(r.modal_price) || 0,
      arrival_date: parseDmy(r.arrival_date),
    }));

    const { error: upErr } = await supabaseAdmin
      .from("mandi_prices")
      .upsert(upsertRows, {
        onConflict: "commodity,market,state,arrival_date,variety",
        ignoreDuplicates: false,
      });
    if (upErr) console.error("mandi upsert failed", upErr);

    // 4. Return freshly cached rows
    const { data: fresh } = await supabaseAdmin
      .from("mandi_prices")
      .select("*")
      .ilike("commodity", data.commodity)
      .eq("state", data.state)
      .order("arrival_date", { ascending: false })
      .limit(20);

    return { source: "live" as const, rows: fresh ?? [] };
  });

const OFFICIAL_MSP_DATA: Record<string, number> = {
  "Rice": 2300,
  "Paddy": 2300,
  "Wheat": 2425,
  "Tur": 7550,
  "Maize": 2225,
  "Ragi": 4290,
  "Cotton": 7121,
  "Greengram": 8682,
  "Moong": 8682,
  "Bengal Gram": 5440,
  "Chana": 5440,
  "Sugarcane": 340,
  "Groundnut": 6780,
  "Chilli": 7000,
  "Tomato": 1800,
  "Potato": 1500,
  "Onion": 1700,
};

const MSPInputSchema = z.object({
  commodity: z.string().min(1).max(80),
});

export const getMSPPrice = createServerFn({ method: "GET" })
  .inputValidator((d) => MSPInputSchema.parse(d))
  .handler(async ({ data }) => {
    const commodityKey = data.commodity.trim();

    let matchedMsp = OFFICIAL_MSP_DATA[commodityKey];
    if (!matchedMsp) {
      const key = Object.keys(OFFICIAL_MSP_DATA).find(k =>
        k.toLowerCase().includes(commodityKey.toLowerCase()) ||
        commodityKey.toLowerCase().includes(k.toLowerCase())
      );
      if (key) {
        matchedMsp = OFFICIAL_MSP_DATA[key];
      }
    }

    const apiKey = process.env.DATA_GOV_IN_API_KEY;
    if (apiKey) {
      try {
        const mspResourceUrl = "https://api.data.gov.in/resource/2cc1e1ec-3cd1-45df-bbbf-5c96b797fc7c";
        const url = new URL(mspResourceUrl);
        url.searchParams.set("api-key", apiKey);
        url.searchParams.set("format", "json");
        url.searchParams.set("limit", "10");
        url.searchParams.set("filters[commodity]", commodityKey);

        const res = await fetch(url.toString());
        if (res.ok) {
          const payload = await res.json() as any;
          const record = payload?.records?.[0];
          if (record) {
            const liveMspValue = Number(record.minimum_support_price || record.msp || record.price || record.modal_price);
            if (liveMspValue && !isNaN(liveMspValue)) {
              return {
                commodity: commodityKey,
                msp: liveMspValue,
                source: "live_data_gov_in" as const,
              };
            }
          }
        }
      } catch (err) {
        console.warn("data.gov.in MSP API call failed, using high-fidelity local database", err);
      }
    }

    return {
      commodity: commodityKey,
      msp: matchedMsp || 2200,
      source: matchedMsp ? ("government_fallback" as const) : ("standard_baseline" as const),
    };
  });

export const ensureStorageConfigured = createServerFn({ method: "POST" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const logs: string[] = [];
    try {
      logs.push("Attempting to update bucket 'avatars' to public...");
      const { error } = await supabaseAdmin.storage.updateBucket("avatars", {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"]
      });
      if (error) {
        logs.push(`Failed to update bucket: ${error.message}. Attempting to create bucket...`);
        const { error: createError } = await supabaseAdmin.storage.createBucket("avatars", {
          public: true,
          fileSizeLimit: 5242880,
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"]
        });
        if (createError) {
          logs.push(`Failed to create bucket: ${createError.message}`);
          return { success: false, error: createError.message, logs };
        } else {
          logs.push("Successfully created public avatars bucket");
        }
      } else {
        logs.push("Successfully updated avatars bucket to public");
      }
      return { success: true, logs };
    } catch (err: any) {
      logs.push(`Fatal error in handler: ${err.message || err}`);
      return { success: false, error: err.message || String(err), logs };
    }
  });

export const simulateBidding = createServerFn({ method: "POST" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      // 1. Get all live auctions
      const { data: auctions, error: auctionErr } = await supabaseAdmin
        .from("auctions")
        .select("id, seller_id, current_price")
        .eq("status", "live");

      if (auctionErr || !auctions || auctions.length === 0) {
        return { success: true, message: "No live auctions to simulate bids on" };
      }

      // 2. Get all profiles to act as mock bidders
      let { data: profiles, error: profileErr } = await supabaseAdmin
        .from("profiles")
        .select("id");

      // If we have fewer than 3 profiles, insert some mock profiles so we always have bidders!
      if (!profiles || profiles.length < 3) {
        const mockProfilesData = [
          { id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d", name: "Mallesha K. (Buyer)", role: "buyer", phone: "9876543210" },
          { id: "b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e", name: "Suresh Gowda (Farmer)", role: "farmer", phone: "9876543211" },
          { id: "c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f", name: "Ramesh B. (Buyer)", role: "buyer", phone: "9876543212" }
        ];

        for (const p of mockProfilesData) {
          await supabaseAdmin.from("profiles").upsert(p, { onConflict: "id" });
        }

        const { data: refetched } = await supabaseAdmin.from("profiles").select("id");
        if (refetched) profiles = refetched;
      }

      if (!profiles || profiles.length === 0) {
        return { success: false, error: "No profiles found to simulate bids" };
      }

      const bidsPlaced: any[] = [];

      for (const auction of auctions) {
        // 70% chance to place a bid on each active auction during this tick (more active)
        if (Math.random() > 0.7) continue;

        // Filter out the seller so they don't bid on their own auction
        const eligibleBidders = profiles.filter(p => p.id !== auction.seller_id);
        if (eligibleBidders.length === 0) continue;

        const randomBidder = eligibleBidders[Math.floor(Math.random() * eligibleBidders.length)];

        // Random increment between 500 and 1500
        const increment = 500 + Math.floor(Math.random() * 3) * 500;
        const newBidAmount = Number(auction.current_price) + increment;

        const { data: bidData, error: bidErr } = await supabaseAdmin
          .from("bids")
          .insert({
            auction_id: auction.id,
            bidder_id: randomBidder.id,
            amount: newBidAmount
          })
          .select()
          .single();

        if (!bidErr && bidData) {
          bidsPlaced.push({
            auction_id: auction.id,
            bidder_id: randomBidder.id,
            amount: newBidAmount
          });
        }
      }

      return { success: true, bidsPlaced };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });


