import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, MapPin, TrendingUp, ShieldCheck } from "lucide-react";
import { TopBar } from "@/components/sg/TopBar";
import { BottomNav } from "@/components/sg/BottomNav";
import { TrustBadge } from "@/components/sg/Badge";

export const Route = createFileRoute("/match")({ component: Match });

const matches = [
  { name: "Sri Krishna Traders", dist: 12, price: 2380, rating: 4.8, rev: 28560, verified: true, initial: "K" },
  { name: "Mandya Rice Mills", dist: 24, price: 2340, rating: 4.6, rev: 28080, verified: true, initial: "M" },
  { name: "Reliance Fresh — Bangalore", dist: 102, price: 2410, rating: 4.9, rev: 28920, verified: true, initial: "R" },
  { name: "Local Co-op Society", dist: 4, price: 2250, rating: 4.4, rev: 27000, verified: false, initial: "C" },
];

function Match() {
  return (
    <>
      <div className="mobile-shell">
        <TopBar title="Smart Matches" subtitle="4 verified buyers nearby" />
        <div className="px-5 py-4 space-y-3">
          {matches.map((m) => (
            <div key={m.name} className="rounded-3xl bg-card shadow-card border border-border p-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-2xl gradient-primary grid place-items-center text-primary-foreground font-bold text-lg">
                  {m.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold truncate">{m.name}</h3>
                    {m.verified && <ShieldCheck className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.dist} km</span>
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-action text-action" />{m.rating}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Offer</p>
                  <p className="text-lg font-bold">₹{m.price}<span className="text-xs text-muted-foreground">/q</span></p>
                </div>
                <div className="rounded-2xl bg-primary/8 p-3">
                  <p className="text-[10px] text-primary font-semibold uppercase flex items-center gap-1"><TrendingUp className="h-3 w-3" />Predicted revenue</p>
                  <p className="text-lg font-bold text-primary">₹{m.rev.toLocaleString("en-IN")}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                {m.verified && <TrustBadge variant="rsa" />}
                <Link
                  to="/chat"
                  className="ml-auto inline-flex items-center gap-1.5 rounded-xl gradient-primary text-primary-foreground px-4 py-2.5 text-sm font-bold shadow-card active:scale-[0.97] transition"
                >
                  <ShieldCheck className="h-4 w-4" /> Connect
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
