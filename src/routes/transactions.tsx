import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, ShieldCheck } from "lucide-react";
import { TopBar } from "@/components/sg/TopBar";
import { BottomNav } from "@/components/sg/BottomNav";
import { TrustBadge } from "@/components/sg/Badge";
import { useUser } from "@/lib/sg/user";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/transactions")({ component: Transactions });

type Tx = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string | null;
  auction_id: string | null;
};

const statusColor: Record<string, string> = {
  Signed: "bg-primary/15 text-primary",
  Delivered: "bg-primary text-primary-foreground",
  Pending: "bg-action/15 text-action",
  Won: "bg-action text-action-foreground",
};

function Transactions() {
  const user = useUser();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"Selling" | "Buying" | "Auctions">("Selling");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from("transactions").select("*").order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setTxs((data as Tx[]) || []);
        setLoading(false);
      });
  }, [user?.id]);

  const filtered = useMemo(() => {
    if (!user) return [];
    if (tab === "Selling") return txs.filter((t) => t.seller_id === user.id && !t.auction_id);
    if (tab === "Buying") return txs.filter((t) => t.buyer_id === user.id && !t.auction_id);
    return txs.filter((t) => !!t.auction_id);
  }, [txs, tab, user]);

  return (
    <>
      <div className="mobile-shell">
        <TopBar title="My Transactions" subtitle="Verified by Custom Crypto" />

        {!user ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">Sign in to view your transactions.</div>
        ) : (
          <>
            <div className="px-5 pt-4">
              <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-muted">
                {(["Selling", "Buying", "Auctions"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)} className={`h-10 rounded-xl text-sm font-semibold transition ${tab === t ? "bg-card shadow-card" : "text-muted-foreground"}`}>{t}</button>
                ))}
              </div>
            </div>

            <div className="px-5 py-4 space-y-3">
              {loading && <p className="text-center text-sm text-muted-foreground py-6">Loading…</p>}
              {!loading && filtered.length === 0 && (
                <div className="rounded-3xl border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No {tab.toLowerCase()} transactions yet.
                </div>
              )}
              {filtered.map((tx) => (
                <div key={tx.id} className="rounded-3xl bg-card shadow-card border border-border p-4 animate-fade-in">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm leading-tight">
                        {tx.auction_id ? "Auction settlement" : "Listing sale"}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {tx.buyer_id === user.id ? "From seller" : "To buyer"} • {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusColor[tx.status] || "bg-muted text-foreground"}`}>{tx.status}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xl font-bold">₹{tx.amount.toLocaleString("en-IN")}</span>
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
          </>
        )}
      </div>
      <BottomNav />
    </>
  );
}
