import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Loader2, Check, Sparkles, ShieldCheck } from "lucide-react";
import { TopBar } from "@/components/sg/TopBar";
import { BottomNav } from "@/components/sg/BottomNav";
import { TrustBadge } from "@/components/sg/Badge";
import { celebrate } from "@/lib/sg/confetti";

export const Route = createFileRoute("/sell")({ component: Sell });

function Sell() {
  const navigate = useNavigate();
  const [crop, setCrop] = useState("Rice (Sona Masuri)");
  const [qty, setQty] = useState("12");
  const [quality, setQuality] = useState<"A" | "B" | "C">("A");
  const [price, setPrice] = useState("2350");
  const [state, setState] = useState<"idle" | "signing" | "done">("idle");

  const fairPrice = 2280;

  const sign = () => {
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
        <TopBar title="List Produce" subtitle="ಉತ್ಪನ್ನ ಪಟ್ಟಿಮಾಡಿ" />
        <div className="px-5 py-5 space-y-5">
          {/* Photo */}
          <button className="w-full h-44 rounded-3xl border-2 border-dashed border-border bg-muted/40 grid place-items-center text-center">
            <div>
              <Camera className="h-7 w-7 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm font-semibold">Add photos</p>
              <p className="text-[11px] text-muted-foreground">Up to 6 • Max 10MB each</p>
            </div>
          </button>

          <Field label="Crop">
            <select value={crop} onChange={e => setCrop(e.target.value)} className="sg-input">
              <option>Rice (Sona Masuri)</option>
              <option>Tur Dal</option>
              <option>Maize</option>
              <option>Coconut</option>
              <option>Ragi</option>
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
                  className={`h-12 rounded-xl border font-bold text-sm transition ${
                    quality === g ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
                  }`}
                >
                  Grade {g}
                </button>
              ))}
            </div>
          </Field>

          {/* Predicted price */}
          <div className="rounded-3xl border border-primary/30 bg-primary/8 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold">GRAMA fair price prediction</p>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">₹{fairPrice}</span>
              <span className="text-sm text-muted-foreground">/quintal</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Based on 14-day mandi avg + your grade. You'll likely get matched within 4 hours.
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

      <style>{`.sg-input{width:100%;height:48px;padding:0 14px;border-radius:14px;background:var(--card);border:1px solid var(--border);outline:none;font-size:16px}.sg-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in oklab,var(--primary) 20%,transparent)}`}</style>
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
