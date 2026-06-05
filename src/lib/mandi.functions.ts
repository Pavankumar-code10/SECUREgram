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
