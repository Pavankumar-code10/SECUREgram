import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, ShieldCheck } from "lucide-react";
import { TopBar } from "@/components/sg/TopBar";
import { BottomNav } from "@/components/sg/BottomNav";
import { TrustBadge } from "@/components/sg/Badge";

export const Route = createFileRoute("/transactions")({ component: Transactions });

const data = {
  Selling: [
    { item: "Sona Masuri Rice • 12 q", to: "Sri Krishna Traders", amt: 28560, status: "Signed", date: "Today" },
    { item: "Tur Dal • 5 q", to: "Mandya Mills", amt: 42250, status: "Delivered", date: "2 days ago" },
    { item: "Coconut • 800 nos", to: "Reliance Fresh", amt: 19200, status: "Pending", date: "1 week ago" },
  ],
  Buying: [
    { item: "NPK Fertilizer • 4 bags", to: "AgriCo Inputs", amt: 3280, status: "Delivered", date: "Yesterday" },
  ],
  Auctions: [
    { item: "BPT-5204 Seeds • 2 bags", to: "Auction #A2104", amt: 2480, status: "Won", date: "3 days ago" },
  ],
} as const;

const statusColor: Record<string, string> = {
  Signed: "bg-primary/15 text-primary",
  Delivered: "bg-primary text-primary-foreground",
  Pending: "bg-action/15 text-action",
  Won: "bg-action text-action-foreground",
};

function Transactions() {
  const [tab, setTab] = useState<keyof typeof data>("Selling");
  return (
    <>
      <div className="mobile-shell">
        <TopBar title="My Transactions" subtitle="Verified by Custom Crypto" />
        <div className="px-5 pt-4">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-muted">
            {(Object.keys(data) as (keyof typeof data)[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`h-10 rounded-xl text-sm font-semibold transition ${tab === t ? "bg-card shadow-card" : "text-muted-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          {data[tab].map((tx, i) => (
            <div key={i} className="rounded-3xl bg-card shadow-card border border-border p-4 animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm leading-tight">{tx.item}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{tx.to} • {tx.date}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusColor[tx.status]}`}>{tx.status}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xl font-bold">₹{tx.amt.toLocaleString("en-IN")}</span>
                <button className="inline-flex items-center gap-1.5 text-xs font-bold text-primary"><Download className="h-3.5 w-3.5" />Receipt</button>
              </div>
              <div className="mt-3 flex items-center gap-2 pt-3 border-t border-border">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-[11px] text-muted-foreground font-semibold">Verified by Custom Crypto</span>
                <TrustBadge variant="tamper" className="ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
