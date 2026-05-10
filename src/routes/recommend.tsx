import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, ShieldCheck, Loader2 } from "lucide-react";
import { TopBar } from "@/components/sg/TopBar";
import { BottomNav } from "@/components/sg/BottomNav";
import { TrustBadge } from "@/components/sg/Badge";

export const Route = createFileRoute("/recommend")({ component: Recommend });

const recs = [
  { crop: "Tur Dal (Arhar)", emoji: "🫘", yield: "8.4 q/ac", rev: "₹71,000", reasons: ["Black soil match", "Aug–Dec season ideal", "Strong mandi demand"] },
  { crop: "Hybrid Maize", emoji: "🌽", yield: "22 q/ac", rev: "₹47,300", reasons: ["Low water need", "60-day shorter cycle", "Stable prices"] },
  { crop: "Cotton (Bt)", emoji: "🌱", yield: "9 q/ac", rev: "₹65,200", reasons: ["High-margin", "Belagavi region fit"] },
];

function Recommend() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <div className="mobile-shell">
        <TopBar title="Crop Recommendation" subtitle="Powered by ACRE AI" />
        <div className="px-5 py-4">
          <div className="rounded-3xl bg-card shadow-card border border-border p-4 space-y-3">
            <Field label="Soil type">
              <select className="sg-input"><option>Black soil</option><option>Red soil</option><option>Alluvial</option><option>Sandy loam</option></select>
            </Field>
            <Field label="District">
              <select className="sg-input"><option>Mandya</option><option>Mysuru</option><option>Belagavi</option><option>Kalaburagi</option><option>Tumakuru</option></select>
            </Field>
            <Field label="Season">
              <div className="grid grid-cols-3 gap-2">
                {["Kharif", "Rabi", "Zaid"].map((s, i) => (
                  <button key={s} className={`h-11 rounded-xl border font-semibold text-sm ${i === 0 ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>{s}</button>
                ))}
              </div>
            </Field>
            <button
              onClick={() => { setLoading(true); setTimeout(() => { setLoading(false); setSubmitted(true); }, 1200); }}
              className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-elev active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Analyzing</> : <><Sparkles className="h-4 w-4" />Get recommendations</>}
            </button>
          </div>

          {submitted && (
            <div className="mt-5 space-y-3 animate-fade-in">
              <p className="text-xs font-semibold text-muted-foreground">Top picks for your farm</p>
              {recs.map((r, idx) => (
                <div key={r.crop} className="rounded-3xl bg-card shadow-card border border-border p-4">
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
                  <ul className="mt-3 space-y-1.5">
                    {r.reasons.map(rs => (
                      <li key={rs} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />{rs}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3"><TrustBadge variant="rsa" /></div>
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
