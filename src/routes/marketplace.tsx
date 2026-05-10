import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal, MapPin, ShieldCheck } from "lucide-react";
import { TopBar } from "@/components/sg/TopBar";
import { BottomNav } from "@/components/sg/BottomNav";
import { TrustBadge } from "@/components/sg/Badge";
import { useState } from "react";

export const Route = createFileRoute("/marketplace")({ component: Marketplace });

const items = [
  { emoji: "🌾", name: "Sona Masuri Rice", qty: "12 q", price: 2380, dist: 12, district: "Mandya", verified: true },
  { emoji: "🫘", name: "Tur Dal — Grade A", qty: "8 q", price: 8450, dist: 34, district: "Kalaburagi", verified: true },
  { emoji: "🌽", name: "Yellow Maize", qty: "20 q", price: 2150, dist: 56, district: "Davangere", verified: true },
  { emoji: "🥥", name: "Tender Coconut", qty: "1500 nos", price: 24, dist: 18, district: "Hassan", verified: true },
  { emoji: "🌾", name: "Ragi (Finger Millet)", qty: "6 q", price: 3380, dist: 22, district: "Tumakuru", verified: false },
  { emoji: "🥭", name: "Alphonso Mango", qty: "4 q", price: 12200, dist: 88, district: "Belagavi", verified: true },
];

function Marketplace() {
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const list = items.filter(i => !verifiedOnly || i.verified);

  return (
    <>
      <div className="mobile-shell">
        <TopBar title="Marketplace" subtitle="Verified Karnataka produce" />

        <div className="px-5 pt-3 sticky top-14 z-30 bg-background pb-3">
          <div className="flex items-center gap-2 rounded-2xl bg-card border border-border h-12 px-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input placeholder="Search rice, tur, mango…" className="flex-1 bg-transparent outline-none text-sm" />
            <button className="h-9 w-9 rounded-xl bg-muted grid place-items-center" aria-label="Filters">
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {["All", "Rice", "Pulses", "Vegetables", "Fruits", "Spices"].map((t, i) => (
              <button key={t} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold border ${i === 0 ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>{t}</button>
            ))}
            <button
              onClick={() => setVerifiedOnly(v => !v)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold border inline-flex items-center gap-1 ${verifiedOnly ? "bg-primary/10 border-primary text-primary" : "bg-card border-border"}`}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Verified only
            </button>
          </div>
        </div>

        <div className="px-5 py-3 grid grid-cols-2 gap-3">
          {list.map((i) => (
            <div key={i.name} className="rounded-3xl bg-card shadow-card border border-border overflow-hidden">
              <div className="aspect-square bg-muted/60 grid place-items-center text-6xl">{i.emoji}</div>
              <div className="p-3">
                <h3 className="text-sm font-bold leading-tight line-clamp-2">{i.name}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{i.qty} available</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-base font-bold">₹{i.price.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin className="h-3 w-3" />{i.dist}km
                  </span>
                  {i.verified && <TrustBadge variant="rsa" className="!px-1.5 !py-0.5 !text-[9px]" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
