import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Loader2, Check, Sparkles, ShieldCheck, X, Eye, Pencil, Image as ImageIcon, TrendingUp, TrendingDown } from "lucide-react";
import { TopBar } from "@/components/sg/TopBar";
import { BottomNav } from "@/components/sg/BottomNav";
import { TrustBadge } from "@/components/sg/Badge";
import { celebrate } from "@/lib/sg/confetti";
import { useUser } from "@/lib/sg/user";
import { toast } from "sonner";

export const Route = createFileRoute("/sell")({ component: Sell });

type Crop = { en: string; kn: string; price: number };
const CROPS: { category: string; items: Crop[] }[] = [
  {
    category: "Vegetables",
    items: [
      { en: "Tomato", kn: "ಟೊಮ್ಯಾಟೊ", price: 1800 },
      { en: "Onion", kn: "ಈರುಳ್ಳಿ", price: 2200 },
      { en: "Potato", kn: "ಆಲೂಗಡ್ಡೆ", price: 1600 },
      { en: "Carrot", kn: "ಕ್ಯಾರೆಟ್", price: 2400 },
      { en: "Cabbage", kn: "ಎಲೆಕೋಸು", price: 1200 },
      { en: "Cauliflower", kn: "ಹೂಕೋಸು", price: 1500 },
      { en: "Brinjal", kn: "ಬದನೆ", price: 1700 },
      { en: "Ladies Finger", kn: "ಬೆಂಡೆಕಾಯಿ", price: 2000 },
      { en: "Beans", kn: "ಹುರುಳಿಕಾಯಿ", price: 2600 },
      { en: "Peas", kn: "ಬಟಾಣಿ", price: 3200 },
      { en: "Spinach", kn: "ಪಾಲಕ್", price: 1400 },
      { en: "Coriander", kn: "ಕೊತ್ತಂಬರಿ", price: 3000 },
      { en: "Beetroot", kn: "ಬೀಟ್‌ರೂಟ್", price: 2100 },
      { en: "Radish", kn: "ಮೂಲಂಗಿ", price: 1300 },
      { en: "Cucumber", kn: "ಸೌತೆಕಾಯಿ", price: 1500 },
      { en: "Pumpkin", kn: "ಕುಂಬಳಕಾಯಿ", price: 1100 },
    ],
  },
  {
    category: "Cereals",
    items: [
      { en: "Rice", kn: "ಅಕ್ಕಿ", price: 2280 },
      { en: "Wheat", kn: "ಗೋಧಿ", price: 2450 },
      { en: "Maize", kn: "ಜೋಳ", price: 2050 },
      { en: "Bajra", kn: "ಸಜ್ಜೆ", price: 2350 },
      { en: "Jowar", kn: "ಬಿಳಿಜೋಳ", price: 2900 },
      { en: "Ragi", kn: "ರಾಗಿ", price: 3400 },
      { en: "Barley", kn: "ಬಾರ್ಲಿ", price: 2150 },
    ],
  },
];
const ALL_CROPS = CROPS.flatMap(c => c.items);

function Sell() {
  const navigate = useNavigate();
  const user = useUser();
  const fileRef = useRef<HTMLInputElement>(null);

  const [cropName, setCropName] = useState("Rice");
  const [qty, setQty] = useState("12");
  const [quality, setQuality] = useState<"A" | "B" | "C">("A");
  const crop = ALL_CROPS.find(c => c.en === cropName) || ALL_CROPS[0];
  const fairPrice = crop.price + (quality === "A" ? 70 : quality === "C" ? -120 : 0);
  const [price, setPrice] = useState(String(fairPrice));
  const [photo, setPhoto] = useState<string | null>(null);
  const [showOpts, setShowOpts] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [state, setState] = useState<"idle" | "signing" | "done">("idle");

  const askedPrice = Number(price) || 0;
  const diff = askedPrice - fairPrice;
  const diffPct = fairPrice ? Math.round((diff / fairPrice) * 100) : 0;

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

  const sign = () => {
    if (!photo) { toast.error("Please add a crop photo"); return; }
    setState("signing");
    setTimeout(() => {
      setState("done");
      celebrate();
      setTimeout(() => navigate({ to: "/match" }), 1600);
    }, 1800);
  };

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
        <div className="px-5 py-5 space-y-5 animate-fade-in">
          {/* Photo */}
          <div className="animate-slide-up">
            <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
            {!photo ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-52 rounded-3xl border-2 border-dashed border-primary/40 bg-primary/5 grid place-items-center text-center transition hover:bg-primary/10 active:scale-[0.99]"
              >
                <div className="animate-pulse">
                  <div className="mx-auto h-14 w-14 rounded-full gradient-primary grid place-items-center shadow-elev">
                    <Camera className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <p className="mt-3 text-sm font-bold">Tap to add crop photo</p>
                  <p className="text-[11px] text-muted-foreground">JPG / PNG • Max 5MB • Required</p>
                </div>
              </button>
            ) : (
              <div className="relative rounded-3xl overflow-hidden shadow-card border border-border animate-scale-in">
                <img src={photo} alt="Crop" className="w-full h-52 object-cover" onClick={() => setShowOpts(s => !s)} />
                {showOpts && (
                  <div className="absolute inset-0 bg-black/55 grid place-items-center gap-3 animate-fade-in">
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setViewing(true); setShowOpts(false); }}
                        className="px-4 h-11 rounded-xl bg-white text-foreground font-bold text-sm flex items-center gap-1.5"
                      >
                        <Eye className="h-4 w-4" /> View
                      </button>
                      <button
                        onClick={() => { fileRef.current?.click(); setShowOpts(false); }}
                        className="px-4 h-11 rounded-xl gradient-primary text-primary-foreground font-bold text-sm flex items-center gap-1.5"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </button>
                    </div>
                    <button
                      onClick={() => { setPhoto(null); setShowOpts(false); }}
                      className="text-white/90 text-xs font-semibold underline"
                    >
                      Remove photo
                    </button>
                  </div>
                )}
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/55 text-white text-[10px] px-2 py-1 font-semibold">
                  <ImageIcon className="h-3 w-3" /> Tap for options
                </span>
              </div>
            )}
          </div>

          <Field label="Crop">
            <select value={cropName} onChange={e => { setCropName(e.target.value); const c = ALL_CROPS.find(x => x.en === e.target.value); if (c) setPrice(String(c.price)); }} className="sg-input">
              {CROPS.map(group => (
                <optgroup key={group.category} label={group.category}>
                  {group.items.map(c => (
                    <option key={c.en} value={c.en}>{c.en} • {c.kn}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity (quintal)">
              <input value={qty} onChange={e => setQty(e.target.value)} inputMode="numeric" className="sg-input" />
            </Field>
            <Field label="Asking price (₹/q)">
              <input value={price} onChange={e => setPrice(e.target.value)} inputMode="numeric" className="sg-input" />
            </Field>
          </div>

          <Field label="Quality grade">
            <div className="grid grid-cols-3 gap-2">
              {(["A", "B", "C"] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setQuality(g)}
                  className={`h-12 rounded-xl border font-bold text-sm transition active:scale-95 ${
                    quality === g ? "bg-primary text-primary-foreground border-primary shadow-card" : "bg-card border-border"
                  }`}
                >
                  Grade {g}
                </button>
              ))}
            </div>
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
            <div className="mt-2 flex items-center gap-2 text-[12px] font-semibold">
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
            className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-elev active:scale-[0.98] transition disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {state === "idle" && (<><ShieldCheck className="h-5 w-5" /> RSA Sign & List</>)}
            {state === "signing" && (<><Loader2 className="h-5 w-5 animate-spin" /> Signing with private key…</>)}
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

      {/* Full-screen view */}
      {viewing && photo && (
        <div className="fixed inset-0 z-[60] bg-black/95 grid place-items-center animate-fade-in" onClick={() => setViewing(false)}>
          <button className="absolute top-4 right-4 h-11 w-11 rounded-full bg-white/15 text-white grid place-items-center" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          <img src={photo} alt="Crop full" className="max-w-full max-h-full object-contain p-4" />
        </div>
      )}

      <style>{`.sg-input{width:100%;height:48px;padding:0 14px;border-radius:14px;background:var(--card);border:1px solid var(--border);outline:none;font-size:16px;color:var(--foreground)}.sg-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in oklab,var(--primary) 20%,transparent)}`}</style>
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
