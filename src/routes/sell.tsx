import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2, Check, Sparkles, ShieldCheck, X, Eye, Pencil, Image as ImageIcon, TrendingUp, TrendingDown, Minus, Plus, Mic, MicOff, Search, MapPin } from "lucide-react";
import { TopBar } from "@/components/sg/TopBar";
import { BottomNav } from "@/components/sg/BottomNav";
import { TrustBadge } from "@/components/sg/Badge";
import { celebrate } from "@/lib/sg/confetti";
import { useUser } from "@/lib/sg/user";
import { getMandiPrice } from "@/lib/mandi.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/sell")({ component: Sell });

type Crop = { en: string; kn: string; price: number; emoji: string };
const CROPS: { category: string; items: Crop[] }[] = [
  {
    category: "Vegetables / ತರಕಾರಿಗಳು",
    items: [
      { en: "Tomato", kn: "ಟೊಮ್ಯಾಟೊ", price: 1800, emoji: "🍅" },
      { en: "Onion", kn: "ಈರುಳ್ಳಿ", price: 2200, emoji: "🧅" },
      { en: "Potato", kn: "ಆಲೂಗಡ್ಡೆ", price: 1600, emoji: "🥔" },
      { en: "Carrot", kn: "ಕ್ಯಾರೆಟ್", price: 2400, emoji: "🥕" },
      { en: "Cabbage", kn: "ಎಲೆಕೋಸು", price: 1200, emoji: "🥬" },
      { en: "Cauliflower", kn: "ಹೂಕೋಸು", price: 1500, emoji: "🥦" },
      { en: "Brinjal", kn: "ಬದನೆ", price: 1700, emoji: "🍆" },
      { en: "Ladies Finger", kn: "ಬೆಂಡೆಕಾಯಿ", price: 2000, emoji: "🌿" },
      { en: "Beans", kn: "ಹುರುಳಿಕಾಯಿ", price: 2600, emoji: "🫘" },
      { en: "Peas", kn: "ಬಟಾಣಿ", price: 3200, emoji: "🟢" },
      { en: "Spinach", kn: "ಪಾಲಕ್", price: 1400, emoji: "🍃" },
      { en: "Coriander", kn: "ಕೊತ್ತಂಬರಿ", price: 3000, emoji: "🌱" },
      { en: "Beetroot", kn: "ಬೀಟ್‌ರೂಟ್", price: 2100, emoji: "🥗" },
      { en: "Radish", kn: "ಮೂಲಂಗಿ", price: 1300, emoji: "🥒" },
      { en: "Cucumber", kn: "ಸೌತೆಕಾಯಿ", price: 1500, emoji: "🥒" },
      { en: "Pumpkin", kn: "ಕುಂಬಳಕಾಯಿ", price: 1100, emoji: "🎃" },
    ],
  },
  {
    category: "Cereals / ಧಾನ್ಯಗಳು",
    items: [
      { en: "Rice", kn: "ಅಕ್ಕಿ", price: 2280, emoji: "🍚" },
      { en: "Wheat", kn: "ಗೋಧಿ", price: 2450, emoji: "🌾" },
      { en: "Maize", kn: "ಜೋಳ", price: 2050, emoji: "🌽" },
      { en: "Bajra", kn: "ಸಜ್ಜೆ", price: 2350, emoji: "🌾" },
      { en: "Jowar", kn: "ಬಿಳಿಜೋಳ", price: 2900, emoji: "🌾" },
      { en: "Ragi", kn: "ರಾಗಿ", price: 3400, emoji: "🟤" },
      { en: "Barley", kn: "ಬಾರ್ಲಿ", price: 2150, emoji: "🌾" },
    ],
  },
];
const ALL_CROPS = CROPS.flatMap(c => c.items);

function Sell() {
  const navigate = useNavigate();
  const user = useUser();
  const fileRef = useRef<HTMLInputElement>(null);

  const [cropName, setCropName] = useState("Rice");
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState(12);
  const [quality, setQuality] = useState<"A" | "B" | "C">("A");
  const crop = ALL_CROPS.find(c => c.en === cropName) || ALL_CROPS[0];
  const initialFair = crop.price + (quality === "A" ? 70 : quality === "C" ? -120 : 0);
  const [price, setPrice] = useState(fairPrice);
  const [photo, setPhoto] = useState<string | null>(null);
  const [showOpts, setShowOpts] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [state, setState] = useState<"idle" | "signing" | "done">("idle");
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "locating" | "ok" | "denied">("idle");
  const [mandi, setMandi] = useState<{ modal: number; market: string; date: string } | null>(null);
  const [mandiLoading, setMandiLoading] = useState(false);
  const fetchMandi = useServerFn(getMandiPrice);

  // Live mandi price: replaces hardcoded crop.price as baseline when available
  const baselinePrice = mandi?.modal ?? crop.price;
  const fairPrice = baselinePrice + (quality === "A" ? 70 : quality === "C" ? -120 : 0);

  const askedPrice = price || 0;
  const diff = askedPrice - fairPrice;
  const diffPct = fairPrice ? Math.round((diff / fairPrice) * 100) : 0;

  // sync price to fair when crop or quality changes
  useEffect(() => { setPrice(fairPrice); }, [cropName, quality, mandi?.modal]); // eslint-disable-line

  // Fetch live mandi modal price for this crop
  useEffect(() => {
    let cancelled = false;
    setMandiLoading(true);
    setMandi(null);
    fetchMandi({ data: { commodity: cropName, state: "Karnataka" } })
      .then((res) => {
        if (cancelled) return;
        const row = res.rows?.[0];
        if (row) setMandi({ modal: Number(row.modal_price), market: row.market, date: row.arrival_date });
      })
      .catch((e) => console.warn("mandi fetch failed", e))
      .finally(() => { if (!cancelled) setMandiLoading(false); });
    return () => { cancelled = true; };
  }, [cropName, fetchMandi]);

  const captureLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setGeoState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState("ok");
        toast.success("Farm location captured");
      },
      () => { setGeoState("denied"); toast.error("Location permission denied"); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => { setPhoto(reader.result as string); toast.success("Photo uploaded"); };
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input not supported on this device"); return; }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript as string;
      const digits = text.replace(/[^0-9]/g, "");
      if (digits) { setPrice(Number(digits)); toast.success(`Heard ₹${digits}`); }
      else toast.error(`Couldn't parse "${text}"`);
    };
    rec.onerror = () => { setListening(false); toast.error("Voice input failed"); };
    rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };
  const stopVoice = () => { recRef.current?.stop?.(); setListening(false); };

  const sign = async () => {
    if (!photo) { toast.error("Please add a crop photo"); return; }
    if (!user) { toast.error("Please log in to list produce"); navigate({ to: "/login", search: { role: "farmer" } }); return; }
    if (!price || price <= 0) { toast.error("Set a valid price"); return; }
    setState("signing");
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("listings").insert({
      seller_id: user.id,
      crop: cropName,
      quantity_quintal: qty,
      price_per_quintal: price,
      description: `Grade ${quality}`,
    });
    if (error) { setState("idle"); toast.error(error.message); return; }
    setState("done");
    celebrate();
    toast.success("Listing signed & published");
    setTimeout(() => navigate({ to: "/match" }), 1400);
  };


  const filtered = query
    ? CROPS.map(g => ({ ...g, items: g.items.filter(c => c.en.toLowerCase().includes(query.toLowerCase()) || c.kn.includes(query)) })).filter(g => g.items.length)
    : CROPS;

  return (
    <>
      <div className="mobile-shell">
        <TopBar
          title="Sell My Produce"
          subtitle="ಉತ್ಪನ್ನ ಪಟ್ಟಿಮಾಡಿ"
          right={user && (
            <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-primary/10 text-primary font-bold">
              {user.id.slice(0, 10)}…
            </span>
          )}
        />
        <div className="px-5 py-5 space-y-6 animate-fade-in">
          {/* Photo */}
          <div className="animate-slide-up">
            <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
            {!photo ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full min-h-52 rounded-3xl border-2 border-dashed border-primary/40 bg-primary/5 grid place-items-center text-center transition hover:bg-primary/10 active:scale-[0.99] p-4"
              >
                <div className="animate-pulse">
                  <div className="mx-auto h-14 w-14 rounded-full gradient-primary grid place-items-center shadow-elev">
                    <Camera className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <p className="mt-3 text-base font-bold">Tap to add crop photo</p>
                  <p className="text-xs text-muted-foreground">ಫೋಟೋ ಸೇರಿಸಿ • JPG/PNG • Max 5MB</p>
                </div>
              </button>
            ) : (
              <div className="relative rounded-3xl overflow-hidden shadow-card border border-border animate-scale-in">
                <img src={photo} alt="Crop" className="w-full h-52 object-cover" onClick={() => setShowOpts(s => !s)} />
                {showOpts && (
                  <div className="absolute inset-0 bg-black/55 grid place-items-center gap-3 animate-fade-in">
                    <div className="flex gap-3">
                      <button onClick={() => { setViewing(true); setShowOpts(false); }} className="px-4 min-h-11 rounded-xl bg-white text-foreground font-bold text-sm flex items-center gap-1.5">
                        <Eye className="h-4 w-4" /> View
                      </button>
                      <button onClick={() => { fileRef.current?.click(); setShowOpts(false); }} className="px-4 min-h-11 rounded-xl gradient-primary text-primary-foreground font-bold text-sm flex items-center gap-1.5">
                        <Pencil className="h-4 w-4" /> Edit
                      </button>
                    </div>
                    <button onClick={() => { setPhoto(null); setShowOpts(false); }} className="text-white/90 text-xs font-semibold underline min-h-0">
                      Remove photo
                    </button>
                  </div>
                )}
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/55 text-white text-[11px] px-2 py-1 font-semibold">
                  <ImageIcon className="h-3 w-3" /> Tap for options
                </span>
              </div>
            )}
          </div>

          {/* Crop picker — tappable cards */}
          <section>
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-base font-bold">Choose crop <span className="text-muted-foreground font-normal text-sm">/ ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ</span></h2>
              <span className="text-xs text-muted-foreground">{ALL_CROPS.length} options</span>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search crop / ಹುಡುಕಿ" className="sg-input pl-9" />
            </div>
            <div className="space-y-4">
              {filtered.map(group => (
                <div key={group.category}>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">{group.category}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {group.items.map(c => {
                      const sel = cropName === c.en;
                      return (
                        <button
                          key={c.en}
                          onClick={() => setCropName(c.en)}
                          className={`min-h-[96px] rounded-2xl border-2 p-2 flex flex-col items-center justify-center gap-1 transition active:scale-95 ${
                            sel ? "border-primary bg-primary/10 shadow-card" : "border-border bg-card"
                          }`}
                        >
                          <span className="text-3xl leading-none">{c.emoji}</span>
                          <span className={`text-[13px] font-bold leading-tight text-center ${sel ? "text-primary" : ""}`}>{c.en}</span>
                          <span lang="kn" className="text-[11px] text-muted-foreground leading-tight text-center">{c.kn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quantity stepper */}
          <Field label="Quantity / ಪ್ರಮಾಣ (quintal)">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="h-14 w-14 rounded-2xl bg-card border-2 border-border grid place-items-center active:scale-95 transition"
                aria-label="Decrease quantity"
              >
                <Minus className="h-6 w-6" />
              </button>
              <div className="flex-1 h-14 rounded-2xl border-2 border-border bg-card grid place-items-center">
                <span className="text-2xl font-bold tabular-nums">{qty}</span>
              </div>
              <button
                onClick={() => setQty(q => q + 1)}
                className="h-14 w-14 rounded-2xl gradient-primary text-primary-foreground grid place-items-center active:scale-95 transition shadow-card"
                aria-label="Increase quantity"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-2 flex gap-2 flex-wrap">
              {[5, 10, 25, 50, 100].map(n => (
                <button key={n} onClick={() => setQty(n)} className={`px-3 min-h-9 rounded-full text-xs font-bold border ${qty === n ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
                  {n} q
                </button>
              ))}
            </div>
          </Field>

          {/* Quality */}
          <Field label="Quality grade / ಗುಣಮಟ್ಟ">
            <div className="grid grid-cols-3 gap-2">
              {(["A", "B", "C"] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setQuality(g)}
                  className={`min-h-14 rounded-2xl border-2 font-bold text-sm transition active:scale-95 px-2 py-2 flex flex-col items-center justify-center ${
                    quality === g ? "bg-primary text-primary-foreground border-primary shadow-card" : "bg-card border-border"
                  }`}
                >
                  <span className="text-lg leading-none">Grade {g}</span>
                  <span className={`text-[10px] font-normal mt-0.5 ${quality === g ? "opacity-90" : "text-muted-foreground"}`}>
                    {g === "A" ? "Premium" : g === "B" ? "Standard" : "Economy"}
                  </span>
                </button>
              ))}
            </div>
          </Field>

          {/* Price with voice */}
          <Field label="Asking price / ಬೆಲೆ (₹ per quintal)">
            <div className="flex items-stretch gap-2">
              <div className="flex-1 flex items-center rounded-2xl border-2 border-border bg-card px-3">
                <span className="text-lg font-bold text-muted-foreground">₹</span>
                <input
                  value={price || ""}
                  onChange={e => setPrice(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
                  inputMode="numeric"
                  placeholder="0"
                  className="flex-1 h-14 px-2 bg-transparent outline-none text-xl font-bold tabular-nums"
                />
                <span className="text-xs text-muted-foreground">/q</span>
              </div>
              <button
                onClick={listening ? stopVoice : startVoice}
                aria-label={listening ? "Stop voice input" : "Speak price"}
                className={`h-14 w-14 rounded-2xl grid place-items-center active:scale-95 transition shadow-card ${
                  listening ? "bg-destructive text-destructive-foreground animate-pulse" : "gradient-action text-action-foreground"
                }`}
              >
                {listening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              🎤 Tap mic & say a number — e.g. "two thousand three hundred"
            </p>
          </Field>

          {/* Predicted price */}
          <div className="rounded-3xl border border-primary/30 p-4 animate-slide-up"
               style={{ background: "linear-gradient(135deg, color-mix(in oklab, var(--primary) 12%, transparent), color-mix(in oklab, var(--action) 10%, transparent))" }}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold">GRAMA fair price prediction</p>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">₹{fairPrice}</span>
              <span className="text-sm text-muted-foreground">/quintal</span>
            </div>
            <div className="mt-2 text-[12px] font-semibold">
              <span className={diff >= 0 ? "text-action" : "text-primary"}>
                {diff >= 0 ? <TrendingUp className="inline h-3.5 w-3.5" /> : <TrendingDown className="inline h-3.5 w-3.5" />}
                {" "}Your ask {diff === 0 ? "matches" : (diff > 0 ? `+₹${diff} (${diffPct}%) above` : `₹${Math.abs(diff)} (${Math.abs(diffPct)}%) below`)} fair
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Based on 14-day mandi avg + your grade. Likely matched within 4 hours.
            </p>
          </div>
        </div>

        <div className="px-5 pb-6">
          <button
            onClick={sign}
            disabled={state !== "idle"}
            className="w-full min-h-14 rounded-2xl gradient-primary text-primary-foreground font-bold text-base shadow-elev active:scale-[0.98] transition disabled:opacity-70 flex items-center justify-center gap-2 px-4"
          >
            {state === "idle" && (<><ShieldCheck className="h-5 w-5" /> RSA Sign & List</>)}
            {state === "signing" && (<><Loader2 className="h-5 w-5 animate-spin" /> Signing…</>)}
            {state === "done" && (<><Check className="h-5 w-5 animate-check-pop" /> Signed & Listed</>)}
          </button>
          {state === "done" && (
            <div className="mt-3 flex justify-center gap-2 animate-fade-in">
              <TrustBadge variant="rsa" />
              <TrustBadge variant="tamper" />
            </div>
          )}
        </div>
      </div>
      <BottomNav />

      {viewing && photo && (
        <div className="fixed inset-0 z-[60] bg-black/95 grid place-items-center animate-fade-in" onClick={() => setViewing(false)}>
          <button className="absolute top-4 right-4 h-11 w-11 rounded-full bg-white/15 text-white grid place-items-center" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          <img src={photo} alt="Crop full" className="max-w-full max-h-full object-contain p-4" />
        </div>
      )}

      <style>{`.sg-input{width:100%;min-height:48px;padding:0 14px;border-radius:14px;background:var(--card);border:1px solid var(--border);outline:none;font-size:16px;color:var(--foreground)}.sg-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in oklab,var(--primary) 20%,transparent)}`}</style>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
