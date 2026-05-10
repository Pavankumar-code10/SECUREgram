import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Bell, TrendingUp, Sprout, ShoppingCart, Sparkles, Users } from "lucide-react";
import { BottomNav } from "@/components/sg/BottomNav";
import { TrustBadge } from "@/components/sg/Badge";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

const crops = [
  { name: "Rice", color: "var(--primary)", points: [40, 38, 42, 41, 45, 48, 52, 55, 58, 56, 60, 64] },
  { name: "Tur", color: "var(--action)", points: [30, 32, 31, 35, 33, 38, 40, 42, 44, 43, 46, 49] },
  { name: "Maize", color: "var(--earth)", points: [22, 24, 26, 25, 27, 28, 30, 32, 31, 34, 35, 36] },
  { name: "Coconut", color: "oklch(0.6 0.12 200)", points: [50, 51, 49, 52, 54, 53, 55, 57, 58, 60, 59, 62] },
];

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const w = 360, h = 140, max = 70, min = 20;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${i * step},${h - ((p - min) / (max - min)) * h}`)
    .join(" ");
  return (
    <path d={path} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  );
}

function Dashboard() {
  return (
    <>
      <div className="mobile-shell">
        {/* Top */}
        <div className="px-5 pt-12 pb-6 gradient-hero">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold">
              P
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Namaskara, ನಮಸ್ಕಾರ</p>
              <h1 className="text-xl font-bold truncate">Pradeep Kumar</h1>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" /> Mandya, Karnataka
              </div>
            </div>
            <button className="h-11 w-11 rounded-full bg-card shadow-card grid place-items-center relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-action" />
            </button>
          </div>

          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <TrustBadge variant="verified" />
            <TrustBadge variant="rsa" />
          </div>
        </div>

        {/* Chart */}
        <div className="px-5 -mt-4">
          <div className="rounded-3xl bg-card shadow-card p-5 border border-border animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Mandi price trends</p>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  ₹/quintal <TrendingUp className="h-4 w-4 text-primary" />
                </h2>
              </div>
              <select className="text-xs font-semibold rounded-full bg-muted px-3 py-1.5 outline-none">
                <option>30 days</option><option>7 days</option><option>90 days</option>
              </select>
            </div>

            <svg viewBox="0 0 360 140" className="mt-3 w-full h-32">
              {[0,1,2,3].map(i => (
                <line key={i} x1="0" x2="360" y1={i*46+2} y2={i*46+2} stroke="var(--border)" strokeDasharray="2 4" />
              ))}
              {crops.map(c => <Sparkline key={c.name} points={c.points} color={c.color} />)}
            </svg>

            <div className="mt-3 flex flex-wrap gap-3">
              {crops.map(c => (
                <div key={c.name} className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-6 px-5">
          <h2 className="text-base font-bold">Quick actions</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <ActionCard to="/sell" icon={Sprout} label="Sell Produce" sub="ಮಾರಾಟ ಮಾಡಿ" tone="primary" />
            <ActionCard to="/marketplace" icon={ShoppingCart} label="Buy Inputs" sub="Seeds & inputs" tone="earth" />
            <ActionCard to="/recommend" icon={Sparkles} label="Crop Advice" sub="ACRE AI" tone="action" />
            <ActionCard to="/match" icon={Users} label="Smart Match" sub="Find buyers" tone="primary" />
          </div>
        </div>

        {/* Auctions */}
        <div className="mt-6 px-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Live auctions</h2>
            <Link to="/auctions" className="text-xs font-semibold text-primary">See all</Link>
          </div>
          <Link
            to="/auctions"
            className="mt-3 block rounded-3xl bg-card shadow-card border border-border p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-action/15 grid place-items-center text-2xl">🌾</div>
              <div className="flex-1">
                <p className="font-bold">Hybrid Paddy Seeds — 50 bags</p>
                <p className="text-xs text-muted-foreground">Closing in 02:14:33 • 7 bids</p>
              </div>
              <span className="text-action font-bold">₹1,240</span>
            </div>
          </Link>
        </div>
      </div>
      <BottomNav />
    </>
  );
}

function ActionCard({
  to, icon: Icon, label, sub, tone,
}: { to: string; icon: any; label: string; sub: string; tone: "primary" | "action" | "earth" }) {
  const cls = {
    primary: "gradient-primary text-primary-foreground",
    action: "gradient-action text-action-foreground",
    earth: "bg-earth text-earth-foreground",
  }[tone];
  return (
    <Link
      to={to as any}
      className="rounded-3xl bg-card shadow-card border border-border p-4 active:scale-[0.97] transition-transform"
    >
      <div className={`h-11 w-11 rounded-2xl grid place-items-center ${cls}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-bold">{label}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </Link>
  );
}
