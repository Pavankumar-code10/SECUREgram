import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, Gavel, ShieldCheck, Loader2, Check } from "lucide-react";
import { TopBar } from "@/components/sg/TopBar";
import { BottomNav } from "@/components/sg/BottomNav";
import { celebrate } from "@/lib/sg/confetti";

export const Route = createFileRoute("/auctions")({ component: Auctions });

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
  return (
    <>
      <div className="mobile-shell">
        <TopBar title="Procurement Auctions" subtitle="Inputs • seeds • fertilizer" />
        <div className="px-5 py-4 space-y-4">
          <AuctionCard
            emoji="🌾"
            title="Hybrid Paddy Seeds (BPT-5204)"
            sub="50 bags • 40kg each"
            startSec={2 * 3600 + 14 * 60 + 33}
            highBid={1240}
            bids={7}
            highlight
          />
          <AuctionCard emoji="🌱" title="Organic NPK Fertilizer" sub="200 bags • 50kg" startSec={5 * 3600 + 42} highBid={820} bids={12} />
          <AuctionCard emoji="🚜" title="Drip Irrigation Kits" sub="25 sets • 1 acre" startSec={1 * 3600 + 12 * 60} highBid={4750} bids={4} />
        </div>
      </div>
      <BottomNav />
    </>
  );
}

function AuctionCard({
  emoji, title, sub, startSec, highBid, bids, highlight,
}: { emoji: string; title: string; sub: string; startSec: number; highBid: number; bids: number; highlight?: boolean }) {
  const time = useCountdown(startSec);
  const [bid, setBid] = useState(highBid + 20);
  const [state, setState] = useState<"idle" | "signing" | "done">("idle");

  const submit = () => {
    setState("signing");
    setTimeout(() => { setState("done"); celebrate(); }, 1500);
  };

  return (
    <div className={`rounded-3xl border p-4 shadow-card ${highlight ? "bg-action/8 border-action/30" : "bg-card border-border"}`}>
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 rounded-2xl bg-muted grid place-items-center text-3xl">{emoji}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold leading-tight">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{sub}</p>
          <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1 text-action"><Clock className="h-3.5 w-3.5" />{time}</span>
            <span className="text-muted-foreground">{bids} bids</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Highest bid</p>
          <p className="text-2xl font-bold">₹{highBid}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={bid}
            onChange={e => setBid(Number(e.target.value))}
            className="w-24 h-11 px-3 rounded-xl bg-card border border-border outline-none text-sm font-semibold focus:border-primary"
          />
          <button
            onClick={submit}
            disabled={state !== "idle"}
            className="h-11 px-4 rounded-xl gradient-action text-action-foreground font-bold text-sm shadow-card active:scale-[0.97] transition flex items-center gap-1.5 disabled:opacity-70"
          >
            {state === "idle" && (<><Gavel className="h-4 w-4" />Signed bid</>)}
            {state === "signing" && (<><Loader2 className="h-4 w-4 animate-spin" />Signing</>)}
            {state === "done" && (<><Check className="h-4 w-4 animate-check-pop" />Placed</>)}
          </button>
        </div>
      </div>
      {state === "done" && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-primary font-semibold animate-fade-in">
          <ShieldCheck className="h-3.5 w-3.5" /> Bid signed with your private key
        </div>
      )}
    </div>
  );
}
