import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Bell, TrendingUp, Sprout, ShoppingCart, Sparkles, Users, MessageCircle, Receipt } from "lucide-react";
import { BottomNav } from "@/components/sg/BottomNav";
import { TrustBadge } from "@/components/sg/Badge";
import { useUser, getInitials } from "@/lib/sg/user";
import { useNotifications } from "@/hooks/useNotifications";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

const cropData: Record<"7 days" | "30 days" | "90 days", { name: string; color: string; points: number[] }[]> = {
  "7 days": [
    { name: "Rice", color: "var(--primary)", points: [58, 62, 59, 61, 60, 63, 64] },
    { name: "Tur", color: "var(--action)", points: [45, 43, 46, 44, 47, 48, 49] },
    { name: "Maize", color: "var(--earth)", points: [33, 35, 34, 32, 35, 33, 36] },
    { name: "Coconut", color: "oklch(0.6 0.12 200)", points: [59, 61, 60, 58, 61, 60, 62] },
  ],
  "30 days": [
    { name: "Rice", color: "var(--primary)", points: [40, 38, 42, 41, 45, 48, 52, 55, 58, 56, 60, 64] },
    { name: "Tur", color: "var(--action)", points: [30, 32, 31, 35, 33, 38, 40, 42, 44, 43, 46, 49] },
    { name: "Maize", color: "var(--earth)", points: [22, 24, 26, 25, 27, 28, 30, 32, 31, 34, 35, 36] },
    { name: "Coconut", color: "oklch(0.6 0.12 200)", points: [50, 51, 49, 52, 54, 53, 55, 57, 58, 60, 59, 62] },
  ],
  "90 days": [
    { name: "Rice", color: "var(--primary)", points: [30, 35, 33, 38, 42, 40, 45, 43, 48, 52, 50, 55, 53, 58, 56, 60, 62, 64] },
    { name: "Tur", color: "var(--action)", points: [25, 28, 26, 30, 32, 31, 35, 33, 38, 40, 39, 42, 41, 44, 43, 46, 48, 49] },
    { name: "Maize", color: "var(--earth)", points: [18, 20, 19, 22, 24, 23, 26, 25, 27, 28, 30, 31, 29, 32, 31, 34, 35, 36] },
    { name: "Coconut", color: "oklch(0.6 0.12 200)", points: [40, 42, 45, 43, 47, 46, 50, 49, 52, 54, 53, 55, 57, 58, 60, 59, 61, 62] },
  ]
};

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
  const user = useUser();
  const { unreadCount, setIsOpen } = useNotifications();
  const [period, setPeriod] = useState<"7 days" | "30 days" | "90 days">("30 days");
  
  const name = user?.name || "Guest";
  const initials = getInitials(name);
  const crops = cropData[period];

  return (
    <>
      <div className="mobile-shell pb-28">
        {/* Top */}
        <div className="px-5 pt-12 pb-6 gradient-hero">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Hello, ನಮಸ್ಕಾರ ({user?.role === "buyer" ? "Buyer" : "Farmer"})</p>
              <h1 className="text-xl font-bold truncate">{name}!</h1>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{[user?.district || "Mandya", user?.state || "Karnataka"].filter(Boolean).join(", ")}</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="h-11 w-11 rounded-full bg-card shadow-card grid place-items-center relative hover:bg-muted/50 active:scale-95 transition-all"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-action text-white text-[10px] font-bold grid place-items-center animate-pulse border border-background shadow-sm">
                  {unreadCount}
                </span>
              )}
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
              <select 
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="text-xs font-semibold rounded-full bg-muted px-3 py-1.5 outline-none cursor-pointer border border-border hover:bg-muted/70 transition"
              >
                <option value="7 days">7 days</option>
                <option value="30 days">30 days</option>
                <option value="90 days">90 days</option>
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
            {user?.role === "buyer" ? (
              <>
                <ActionCard to="/marketplace" icon={ShoppingCart} label="Explore Produce" sub="ಖರೀದಿ ಮಾಡಿ" tone="primary" />
                <ActionCard to="/transactions" icon={Receipt} label="My Orders" sub="ಖರೀದಿ ಇತಿಹಾಸ" tone="earth" />
                <ActionCard to="/auctions" icon={TrendingUp} label="Live Auctions" sub="Bid on crops" tone="action" />
                <ActionCard to="/chat" icon={MessageCircle} label="Farmer Chat" sub="ಚಾಟ್ ಮಾಡಿ" tone="primary" />
              </>
            ) : (
              <>
                <ActionCard to="/sell" icon={Sprout} label="Sell Produce" sub="ಮಾರಾಟ ಮಾಡಿ" tone="primary" />
                <ActionCard to="/marketplace" icon={ShoppingCart} label="Buy Inputs" sub="Seeds & inputs" tone="earth" />
                <ActionCard to="/recommend" icon={Sparkles} label="Crop Advice" sub="ACRE AI" tone="action" />
                <ActionCard to="/match" icon={Users} label="Smart Match" sub="Find buyers" tone="primary" />
              </>
            )}
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
          className="mt-3 block rounded-[24px] bg-card shadow-card border border-border p-4 card-interactive"
        >
          {user?.role === "buyer" ? (
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-action/15 grid place-items-center text-2xl">🌾</div>
              <div className="flex-1">
                <p className="font-bold">Organic Sona Masuri — 120 quintals</p>
                <p className="text-xs text-muted-foreground">Closing in 03:45:12 • 12 bids</p>
              </div>
              <span className="text-action font-bold">₹2,450/q</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-action/15 grid place-items-center text-2xl">🌾</div>
              <div className="flex-1">
                <p className="font-bold">Hybrid Paddy Seeds — 50 bags</p>
                <p className="text-xs text-muted-foreground">Closing in 02:14:33 • 7 bids</p>
              </div>
              <span className="text-action font-bold">₹1,240</span>
            </div>
          )}
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
    className="rounded-[24px] bg-card shadow-card border border-border p-4 card-interactive"
  >
      <div className={`h-11 w-11 rounded-2xl grid place-items-center ${cls}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-bold">{label}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </Link>
  );
}
