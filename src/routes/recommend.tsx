import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { TopBar } from "@/components/sg/TopBar";
import { BottomNav } from "@/components/sg/BottomNav";

export const Route = createFileRoute("/recommend")({ component: Recommend });

type CropRec = {
  crop: string;
  emoji: string;
  yield: string;
  rev: string;
  reasons: string[];
  soils: string[];
  seasons: string[];
};

const cropsDb: CropRec[] = [
  {
    crop: "Tur Dal (Pigeon Pea)",
    emoji: "🫘",
    yield: "8 q/ac",
    rev: "₹72,000",
    reasons: ["Excellent nitrogen fixation for black soils", "High market demand in post-harvest season", "Requires minimal moisture during pod maturity"],
    soils: ["Deep Black Soil", "Black Cotton Soil", "Black Soil", "Red Sandy Loam"],
    seasons: ["Kharif", "Rabi"]
  },
  {
    crop: "Sona Masuri Paddy",
    emoji: "🌾",
    yield: "26 q/ac",
    rev: "₹58,500",
    reasons: ["Ideal clay/alluvial soil moisture holding", "Favorable high humidity season match", "Assured MSP & local Mandi buying"],
    soils: ["Clay Loam", "Clayey Loam", "Alluvial", "Red Sandy Loam"],
    seasons: ["Kharif", "Rabi"]
  },
  {
    crop: "Byadgi Chilli",
    emoji: "🌶️",
    yield: "7 q/ac",
    rev: "₹1,15,000",
    reasons: ["Well-drained soil prevents root diseases", "Perfect warm dry air during harvest", "Premium GI-tagged crop price premium"],
    soils: ["Medium Black Soil", "Red Sandy Loam", "Black Soil"],
    seasons: ["Kharif"]
  },
  {
    crop: "Bt Cotton",
    emoji: "🌱",
    yield: "9 q/ac",
    rev: "₹67,200",
    reasons: ["Pest resistant Bt technology", "Drought tolerant deep taproot system", "Strong demand from local ginning mills"],
    soils: ["Black Cotton Soil", "Deep Black Soil", "Black Soil"],
    seasons: ["Kharif"]
  },
  {
    crop: "Hybrid Maize",
    emoji: "🌽",
    yield: "22 q/ac",
    rev: "₹48,400",
    reasons: ["Short 110-day crop lifecycle", "High commercial demand for poultry feed", "Highly responsive to organic manure"],
    soils: ["Red Sandy Loam", "Clay Loam", "Medium Black Soil", "Sandy Loam"],
    seasons: ["Kharif", "Rabi", "Zaid"]
  },
  {
    crop: "Mandya Sugarcane",
    emoji: "🎋",
    yield: "400 q/ac",
    rev: "₹1,20,000",
    reasons: ["Clay-loam structure retains heavy nutrients", "High brix sugar recovery index", "Proximity to Mandya sugar refineries"],
    soils: ["Clay Loam", "Clayey Loam", "Deep Black Soil", "Red Sandy Loam"],
    seasons: ["Kharif"]
  },
  {
    crop: "Organic Ragi",
    emoji: "🌾",
    yield: "14 q/ac",
    rev: "₹42,000",
    reasons: ["Highly resilient to erratic rainfall", "Perfect fit for porous red soils", "Rising premium health-food demand"],
    soils: ["Red Sandy Loam", "Red Sandy Clay", "Sandy Loam", "Red Gravelly Soil"],
    seasons: ["Kharif"]
  },
  {
    crop: "Organic Tomatoes",
    emoji: "🍅",
    yield: "90 q/ac",
    rev: "₹85,500",
    reasons: ["Rapid 90-day cash return cycle", "Thrives in well-drained loam", "Direct supply routes to major urban mandis"],
    soils: ["Sandy Loam", "Red Sandy Loam", "Clay Loam", "Red Sandy Clay"],
    seasons: ["Kharif", "Rabi", "Zaid"]
  },
  {
    crop: "Giza Groundnut",
    emoji: "🥜",
    yield: "10 q/ac",
    rev: "₹52,000",
    reasons: ["Loose sandy soil supports pod enlargement", "Fixes atmospheric nitrogen naturally", "High oil-extraction demand"],
    soils: ["Sandy Loam", "Red Sandy Loam", "Laterite Soil", "Red Gravelly Soil"],
    seasons: ["Kharif", "Rabi"]
  },
  {
    crop: "Bengal Gram (Chana)",
    emoji: "🫘",
    yield: "7 q/ac",
    rev: "₹41,300",
    reasons: ["Adapts to residual winter soil moisture", "Requires minimal irrigation", "Excellent paddy post-rotation crop"],
    soils: ["Deep Black Soil", "Black Cotton Soil", "Black Soil"],
    seasons: ["Rabi"]
  },
  {
    crop: "Safflower/Sunflower",
    emoji: "🌻",
    yield: "6.5 q/ac",
    rev: "₹35,750",
    reasons: ["Deep root system accesses subsoil water", "High photo-insensitivity allows multi-season sowing", "High local edible oil mill demand"],
    soils: ["Red Sandy Loam", "Medium Black Soil", "Black Soil"],
    seasons: ["Kharif", "Rabi"]
  },
  {
    crop: "Robusta Coffee",
    emoji: "☕",
    yield: "5 q/ac",
    rev: "₹1,10,000",
    reasons: ["Acidic laterite soils match high organic content", "Hilly shade-growth provides quality grade beans", "High global export auction value"],
    soils: ["Laterite Soil", "Red Clayey Loam"],
    seasons: ["Kharif"]
  },
  {
    crop: "Gadag Durum Wheat",
    emoji: "🌾",
    yield: "10 q/ac",
    rev: "₹32,000",
    reasons: ["Thrives in cold winter dry conditions", "Grown using residual soil moisture", "High gluten content fetches market premium"],
    soils: ["Black Cotton Soil", "Deep Black Soil", "Medium Black Soil", "Black Soil"],
    seasons: ["Rabi"]
  },
  {
    crop: "Summer Onion",
    emoji: "🧅",
    yield: "75 q/ac",
    rev: "₹80,000",
    reasons: ["Thrives in dry summer heat with light irrigation", "Strong bulb development in loose loamy soils", "High storage life ensures post-harvest profitability"],
    soils: ["Medium Black Soil", "Red Sandy Loam", "Sandy Loam", "Black Cotton Soil"],
    seasons: ["Zaid"]
  },
  {
    crop: "Greengram (Moong)",
    emoji: "🫘",
    yield: "5 q/ac",
    rev: "₹38,000",
    reasons: ["Very short 65-day catch crop duration", "Improves organic carbon for subsequent Rabi crops", "Highly drought resistant, low water footprint"],
    soils: ["Black Cotton Soil", "Red Sandy Loam", "Medium Black Soil"],
    seasons: ["Kharif", "Zaid"]
  }
];

const districtSoils: Record<string, { soils: string[]; desc: string }> = {
  "Mandya": { soils: ["Red Sandy Loam", "Clay Loam"], desc: "Sugarcane & Paddy heartland of Cauvery basin" },
  "Mysuru": { soils: ["Red Loam", "Sandy Loam"], desc: "Fertile region with rich traditional cropping" },
  "Belagavi": { soils: ["Black Cotton Soil", "Red Loamy Soil"], desc: "High yielding sugarcane and commercial belt" },
  "Kalaburagi": { soils: ["Deep Black Soil", "Clayey Loam"], desc: "Pulse Bowl of Karnataka (Arhar/Tur dal paradise)" },
  "Tumakuru": { soils: ["Red Sandy Loam", "Red Gravelly Soil"], desc: "Coconut and dryland millet hub" },
  "Bagalkote": { soils: ["Deep Black Soil", "Medium Black Soil"], desc: "Irrigated basin suited for horticulture" },
  "Vijayapura": { soils: ["Deep Black Soil", "Calcareous Soil"], desc: "Dryland grape and pulse cultivation zone" },
  "Chikkamagaluru": { soils: ["Laterite Soil", "Red Clayey Loam"], desc: "Hilly terrain, plantation crops and coffee paradise" },
  "Haveri": { soils: ["Medium Black Soil", "Red Sandy Loam"], desc: "Famous for Byadgi chilli and maize crops" },
  "Davangere": { soils: ["Red Sandy Loam", "Clayey Loam"], desc: "Paddy and maize intensive region" },
  "Chamarajanagar": { soils: ["Red Sandy Loam", "Black Soil"], desc: "Border region with mixed soil drylands" },
  "Kolar": { soils: ["Red Sandy Clay", "Sandy Loam"], desc: "Horticulture leader with sub-surface irrigation" },
  "Raichur": { soils: ["Black Cotton Soil", "Sandy Loam"], desc: "Rice mills center and cotton growing dryland" },
  "Dharwad": { soils: ["Black Cotton Soil", "Red Sandy Clay"], desc: "Hub of pulses, oilseeds and chillies" },
  "Koppal": { soils: ["Medium Black Soil", "Red Gravelly Soil"], desc: "Mixed crop farming belt near Tungabhadra" },
  "Gadag": { soils: ["Black Cotton Soil", "Red Sandy Loam"], desc: "Windmill capital suited for commercial dryland crops" }
};

function Recommend() {
  const [district, setDistrict] = useState("Mandya");
  const [soil, setSoil] = useState("Red Sandy Loam");
  const [season, setSeason] = useState("Kharif");
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState<CropRec[]>([]);

  // Automatically update soil types when district changes
  useEffect(() => {
    const config = districtSoils[district];
    if (config && config.soils.length > 0) {
      setSoil(config.soils[0]);
    }
  }, [district]);

  const handleGetRecommendations = () => {
    setLoading(true);
    setSubmitted(false);
    setTimeout(() => {
      const matched = cropsDb.filter(crop => {
        const soilMatch = crop.soils.some(s => s.toLowerCase().includes(soil.toLowerCase()) || soil.toLowerCase().includes(s.toLowerCase()));
        const seasonMatch = crop.seasons.includes(season);
        return soilMatch && seasonMatch;
      });

      // Fallback if no exact match: select general suitable crops
      const finalRecs = matched.length > 0 ? matched : cropsDb.filter(c => c.seasons.includes(season)).slice(0, 3);
      setRecs(finalRecs);
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  const currentDistrictInfo = districtSoils[district] || { soils: [], desc: "" };

  return (
    <>
      <div className="mobile-shell pb-28">
        <TopBar title="Crop Recommendation" subtitle="ACRE Agro Intelligence" />
        <div className="px-5 py-4">
          <div className="rounded-3xl bg-card shadow-card border border-border p-4 space-y-3">
            
            <Field label="District (ಜಿಲ್ಲೆ)">
              <select 
                value={district} 
                onChange={(e) => setDistrict(e.target.value)} 
                className="sg-input focus:border-primary transition"
              >
                {Object.keys(districtSoils).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>

            {currentDistrictInfo.desc && (
              <p className="text-[11px] text-primary font-semibold italic px-1">
                ℹ️ {currentDistrictInfo.desc}
              </p>
            )}

            <Field label="Typical Soil Type (ಮಣ್ಣಿನ प्रकार)">
              <select 
                value={soil} 
                onChange={(e) => setSoil(e.target.value)} 
                className="sg-input focus:border-primary transition"
              >
                {currentDistrictInfo.soils.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>

            <Field label="Season (ಹಂಗಾಮು)">
              <div className="grid grid-cols-3 gap-2">
                {["Kharif", "Rabi", "Zaid"].map((s) => (
                  <button 
                    key={s} 
                    onClick={() => setSeason(s)}
                    className={`h-11 rounded-xl border font-semibold text-sm transition ${season === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>

            <button
              onClick={handleGetRecommendations}
              className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-elev active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Analyzing Agro-Data</> : <><Sparkles className="h-4 w-4" />Get Recommendations</>}
            </button>
          </div>

          {submitted && (
            <div className="mt-5 space-y-3 animate-fade-in">
              <p className="text-xs font-semibold text-muted-foreground px-1">Top picks based on region and soil type</p>
              {recs.map((r, idx) => (
                <div key={r.crop} className="rounded-[24px] bg-card shadow-card border border-border p-4 card-interactive">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-muted grid place-items-center text-2xl">{r.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{r.crop}</h3>
                        {idx === 0 && <span className="rounded-full bg-action/15 text-action px-2 py-0.5 text-[10px] font-bold">Best match</span>}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-[11px]">
                        <span className="text-muted-foreground">Expected yield <b className="text-foreground">{r.yield}</b></span>
                        <span className="text-primary font-bold">{r.rev}/ac</span>
                      </div>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1.5 border-t border-border/50 pt-3">
                    {r.reasons.map(rs => (
                      <li key={rs} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{rs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
      <style>{`.sg-input{width:100%;height:48px;padding:0 14px;border-radius:14px;background:var(--card);border:1px solid var(--border);outline:none;font-size:16px}`}</style>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
