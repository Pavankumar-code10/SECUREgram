import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, Gavel, ShieldCheck, Loader2, Check, AlertCircle, Tag, TrendingUp, Users } from "lucide-react";
import { TopBar } from "@/components/sg/TopBar";
import { BottomNav } from "@/components/sg/BottomNav";
import { celebrate } from "@/lib/sg/confetti";
import { useUser } from "@/lib/sg/user";
import { toast } from "sonner";

export const Route = createFileRoute("/auctions")({ component: Auctions });

const MIN_INCREMENT = 500;

function useCountdown(seconds: number) {
  const [t, setT] = useState(seconds);
  useEffect(() => {
    const id = setInterval(() => setT(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function Auctions() {
  const user = useUser();
  return (
    <>
      <div className="mobile-shell">
        <TopBar
          title="Procurement Auctions"
          subtitle="Live bidding • RSA-signed"
          right={user && (
            <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-primary/10 text-primary font-bold">
              {user.id.slice(0, 10)}…
            </span>
          )}
        />
        <div className="px-5 py-4 space-y-4">
          <AuctionCard
            emoji="🌾"
            title="Hybrid Paddy Seeds (BPT-5204)"
            sub="50 bags • 40kg each"
            startSec={2 * 3600 + 14 * 60 + 33}
            sellerPrice={2500}
            initialBid={1240}
            initialBids={7}
            highlight
          />
          <AuctionCard emoji="🌱" title="Organic NPK Fertilizer" sub="200 bags • 50kg" startSec={5 * 3600 + 42} sellerPrice={1500} initialBid={820} initialBids={12} />
          <AuctionCard emoji="🚜" title="Drip Irrigation Kits" sub="25 sets • 1 acre" startSec={1 * 3600 + 12 * 60} sellerPrice={6000} initialBid={4750} initialBids={4} />
        </div>
      </div>
      <BottomNav />
    </>
  );
}

function AuctionCard({
  emoji, title, sub, startSec, sellerPrice, initialBid, initialBids, highlight,
}: { emoji: string; title: string; sub: string; startSec: number; sellerPrice: number; initialBid: number; initialBids: number; highlight?: boolean }) {
  const time = useCountdown(startSec);
  const [currentBid, setCurrentBid] = useState(initialBid);
  const [bidCount, setBidCount] = useState(initialBids);
  const [pulse, setPulse] = useState(false);
  const minNext = currentBid + MIN_INCREMENT;
  const [bid, setBid] = useState(minNext);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "signing" | "done">("idle");

  // Simulate other bidders raising the bid
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() > 0.7) {
        setCurrentBid(c => {
          const next = c + MIN_INCREMENT + Math.floor(Math.random() * 4) * 100;
          if (next >= sellerPrice) return c;
          setBidCount(b => b + 1);
          setPulse(true);
          setTimeout(() => setPulse(false), 800);
          return next;
        });
      }
    }, 8000);
    return () => clearInterval(id);
  }, [sellerPrice]);

  // keep bid input >= minNext when current bid changes
  useEffect(() => {
    setBid(b => (b < currentBid + MIN_INCREMENT ? currentBid + MIN_INCREMENT : b));
  }, [currentBid]);

  const submit = () => {
    setError(null);
    if (bid < minNext) {
      setError(`Minimum next bid is ₹${minNext.toLocaleString()} (₹${MIN_INCREMENT} above current bid)`);
      return;
    }
    setState("signing");
    setTimeout(() => {
      setCurrentBid(bid);
      setBidCount(b => b + 1);
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
      setState("done");
      celebrate();
      toast.success("Bid placed and RSA-signed");
      setTimeout(() => setState("idle"), 1800);
    }, 1500);
  };

  const progress = Math.min(100, Math.round((currentBid / sellerPrice) * 100));

  return (
    <div className={`rounded-3xl border p-4 shadow-card ${highlight ? "bg-action/8 border-action/30" : "bg-card border-border"}`}>
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 rounded-2xl bg-muted grid place-items-center text-3xl">{emoji}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold leading-tight">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{sub}</p>
          <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1 text-action"><Clock className="h-3.5 w-3.5" />{time}</span>
            <span className="text-muted-foreground inline-flex items-center gap-1"><Users className="h-3 w-3" />{bidCount} bids</span>
          </div>
        </div>
      </div>

      {/* Dual bid display */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl p-3 border" style={{ background: "color-mix(in oklab, oklch(0.6 0.12 240) 10%, transparent)", borderColor: "color-mix(in oklab, oklch(0.6 0.12 240) 30%, transparent)" }}>
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide font-bold" style={{ color: "oklch(0.5 0.14 240)" }}>
            <Tag className="h-3 w-3" /> Seller Price
          </div>
          <p className="mt-1 text-lg font-bold" style={{ color: "oklch(0.45 0.14 240)" }}>₹{sellerPrice.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Asking price</p>
        </div>
        <div className={`rounded-2xl p-3 border bg-primary/10 border-primary/30 transition ${pulse ? "animate-scale-in ring-2 ring-primary" : ""}`}>
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide font-bold text-primary">
            <TrendingUp className="h-3 w-3" /> Current Bid
          </div>
          <p className="mt-1 text-lg font-bold text-primary">₹{currentBid.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Min next: ₹{minNext.toLocaleString()}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-3">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full gradient-primary transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground text-right">{progress}% to seller price</p>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-destructive/10 text-destructive px-3 py-2 text-[11px] font-semibold animate-fade-in">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </div>
      )}

      <div className="mt-3 flex items-end gap-2">
        <div className="flex-1">
          <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Your bid (₹)</label>
          <input
            type="number"
            value={bid}
            min={minNext}
            step={MIN_INCREMENT}
            onChange={e => { setError(null); setBid(Number(e.target.value)); }}
            placeholder={`Min ₹${minNext}`}
            className="mt-1 w-full h-11 px-3 rounded-xl bg-card border border-border outline-none text-sm font-semibold focus:border-primary"
          />
        </div>
        <button
          onClick={submit}
          disabled={state !== "idle"}
          className="h-11 px-4 rounded-xl gradient-action text-action-foreground font-bold text-sm shadow-card active:scale-[0.97] transition flex items-center gap-1.5 disabled:opacity-70"
        >
          {state === "idle" && (<><Gavel className="h-4 w-4" />Bid</>)}
          {state === "signing" && (<><Loader2 className="h-4 w-4 animate-spin" />Signing</>)}
          {state === "done" && (<><Check className="h-4 w-4 animate-check-pop" />Placed</>)}
        </button>
      </div>
      {state === "done" && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-primary font-semibold animate-fade-in">
          <ShieldCheck className="h-3.5 w-3.5" /> Bid signed with your private key
        </div>
      )}
    </div>
  );
}
