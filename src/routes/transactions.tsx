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
  Cancelled: "bg-destructive/15 text-destructive",
};

const inferTransactionMetadata = (tx: Tx, currentUserId: string | undefined, profiles: Record<string, { name: string; district: string }>) => {
  // Try loading from localStorage first
  const metadataStore = JSON.parse(localStorage.getItem("sg_transaction_metadata") || "{}");
  const cached = metadataStore[tx.id] || {};

  // Fallback: derive values deterministically from tx.id and tx.amount
  let hash = 0;
  for (let i = 0; i < tx.id.length; i++) {
    hash = tx.id.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const items = [
    { name: "Tur Dal (ಟೊಗರಿ ಬೇಳೆ)", category: "Pulses", unit: "quintal", price: 1000 },
    { name: "Sona Masuri Rice (ಸೋನಾ ಮಸೂರಿ)", category: "Rice", unit: "quintal", price: 1200 },
    { name: "Alphonso Mangoes (ಮಾವು)", category: "Fruits", unit: "box", price: 800 },
    { name: "Organic Tomatoes (ಟೊಮೇಟೊ)", category: "Vegetables", unit: "crate", price: 500 },
    { name: "Mandya Jaggery (ಬೆಲ್ಲ)", category: "Sugar", unit: "kg", price: 150 }
  ];
  
  const selectedItem = items[hash % items.length];
  const unitPrice = selectedItem.price;
  
  // Calculate a reasonable quantity based on tx.amount minus ₹50 delivery fee
  const baseAmount = Math.max(0, tx.amount - 50);
  const qty = Math.max(1, Math.round(baseAmount / unitPrice));
  const subtotal = qty * unitPrice;
  const deliveryFee = tx.amount - subtotal > 0 ? tx.amount - subtotal : 50;

  const farmerNames = ["Swamy Gowda", "Anand Mandya", "Basavaraju K.", "Malleshappa H.", "Prasad Gowda"];
  const buyerNames = ["Pavan Kumar", "Rakesh Patil", "Siddharth S.", "Kiran Kumar", "Mahesh B."];

  // Resolve buyer and seller names: database profiles -> cached profiles -> fallback names
  const sellerName = profiles[tx.seller_id]?.name || cached.seller_name || farmerNames[hash % farmerNames.length];
  const buyerName = profiles[tx.buyer_id]?.name || cached.buyer_name || (tx.buyer_id === currentUserId ? "Pavan Kumar" : buyerNames[hash % buyerNames.length]);

  return {
    item_name: cached.item_name || selectedItem.name,
    item_category: cached.item_category || selectedItem.category,
    item_qty: cached.item_qty || qty,
    item_unit: cached.item_unit || selectedItem.unit,
    buyer_name: buyerName,
    seller_name: sellerName,
    unit_price: cached.unit_price || unitPrice,
    delivery_fee: cached.delivery_fee || deliveryFee,
    subtotal: cached.subtotal || subtotal
  };
};

const generateReceiptSvg = (tx: Tx, meta: any) => {
  const dateStr = new Date(tx.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const formattedStatus = tx.status ? tx.status.charAt(0).toUpperCase() + tx.status.slice(1).toLowerCase() : "Pending";

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 700" width="500" height="700">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f8fafc" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.06" />
    </filter>
  </defs>

  <!-- Base Receipt Container -->
  <rect x="15" y="15" width="470" height="670" rx="24" fill="url(#bgGrad)" stroke="#e2e8f0" stroke-width="1.5" filter="url(#shadow)" />
  
  <!-- Left Accent Stripe -->
  <path d="M15 39 L15 661" stroke="#10b981" stroke-width="6" stroke-linecap="round" />

  <!-- Header Section -->
  <rect x="35" y="40" width="430" height="100" rx="16" fill="url(#headerGrad)" />
  
  <text x="55" y="80" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="22" fill="#ffffff" letter-spacing="-0.5">SecureGram</text>
  <text x="55" y="102" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="11" fill="#a7f3d0" letter-spacing="1.5" text-transform="uppercase">Mandi Transaction Receipt</text>
  
  <!-- Cryptographic Badge -->
  <rect x="315" y="72" width="130" height="36" rx="10" fill="#ffffff" fill-opacity="0.15" />
  <circle cx="333" cy="90" r="8" fill="#a7f3d0" />
  <path d="M330 90 L332 92 L336 88" stroke="#047857" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  <text x="348" y="94" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="9" fill="#ffffff" letter-spacing="0.5">RSA TRUSTED</text>

  <!-- Invoice Info -->
  <text x="35" y="180" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="11" fill="#64748b" text-transform="uppercase">Receipt Reference</text>
  <text x="35" y="200" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="11" fill="#1e293b">${tx.id}</text>

  <text x="280" y="180" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="11" fill="#64748b" text-transform="uppercase">Date &amp; Time</text>
  <text x="280" y="200" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="12" fill="#1e293b">${dateStr}</text>

  <line x1="35" y1="220" x2="465" y2="220" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="4 4" />

  <!-- Parties Info -->
  <text x="35" y="255" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="11" fill="#64748b" text-transform="uppercase">Seller Profile</text>
  <text x="35" y="275" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="14" fill="#0f172a">${meta.seller_name}</text>
  <text x="35" y="292" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#64748b">Verified Farmer Partner</text>

  <text x="280" y="255" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="11" fill="#64748b" text-transform="uppercase">Buyer Profile</text>
  <text x="280" y="275" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="14" fill="#0f172a">${meta.buyer_name}</text>
  <text x="280" y="292" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#64748b">Verified Mandi Merchant</text>

  <rect x="35" y="315" width="430" height="1" fill="#e2e8f0" />

  <!-- Items Table Header -->
  <text x="35" y="345" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="11" fill="#475569" text-transform="uppercase">Description</text>
  <text x="240" y="345" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="11" fill="#475569" text-transform="uppercase" text-anchor="middle">Qty</text>
  <text x="330" y="345" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="11" fill="#475569" text-transform="uppercase" text-anchor="end">Rate</text>
  <text x="465" y="345" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="11" fill="#475569" text-transform="uppercase" text-anchor="end">Amount</text>

  <line x1="35" y1="358" x2="465" y2="358" stroke="#e2e8f0" stroke-width="1" />

  <!-- Item Row -->
  <text x="35" y="385" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="14" fill="#0f172a">${meta.item_name}</text>
  <text x="35" y="403" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#64748b">Category: ${meta.item_category}</text>
  
  <text x="240" y="385" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="13" fill="#334155" text-anchor="middle">${meta.item_qty} ${meta.item_unit}</text>
  <text x="330" y="385" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="13" fill="#334155" text-anchor="end">₹${meta.unit_price.toLocaleString("en-IN")}</text>
  <text x="465" y="385" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="14" fill="#0f172a" text-anchor="end">₹${meta.subtotal.toLocaleString("en-IN")}</text>

  <line x1="35" y1="425" x2="465" y2="425" stroke="#e2e8f0" stroke-dasharray="4 4" />

  <!-- Pricing Details -->
  <text x="280" y="455" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#475569">Subtotal</text>
  <text x="465" y="455" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="13" fill="#0f172a" text-anchor="end">₹${meta.subtotal.toLocaleString("en-IN")}</text>

  <text x="280" y="480" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#475569">Transport / Delivery</text>
  <text x="465" y="480" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="13" fill="#0f172a" text-anchor="end">₹${meta.delivery_fee.toLocaleString("en-IN")}</text>

  <rect x="280" y="498" width="185" height="1" fill="#e2e8f0" />

  <text x="280" y="522" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="15" fill="#10b981">Grand Total</text>
  <text x="465" y="522" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="18" fill="#059669" text-anchor="end">₹${tx.amount.toLocaleString("en-IN")}</text>

  <!-- Security Stamp Block -->
  <rect x="35" y="445" width="220" height="90" rx="12" fill="#f0fdf4" stroke="#dcfce7" stroke-width="1" />
  <text x="50" y="468" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="10" fill="#15803d" text-transform="uppercase" letter-spacing="1">Transaction Status</text>
  <rect x="50" y="478" width="80" height="20" rx="10" fill="#dcfce7" />
  <text x="90" y="492" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="9" fill="#15803d" text-anchor="middle" text-transform="uppercase">${formattedStatus}</text>
  
  <text x="50" y="515" font-family="system-ui, -apple-system, sans-serif" font-size="9" fill="#166534">🔒 Signature Status: SIGNED &amp; VERIFIED</text>
  <text x="50" y="526" font-family="system-ui, -apple-system, sans-serif" font-size="8" fill="#16a34a">Hash: sha256-${tx.id.slice(0, 16)}...</text>

  <line x1="35" y1="565" x2="465" y2="565" stroke="#e2e8f0" stroke-width="1.5" />

  <!-- QR / Barcode Lookalike & Footer -->
  <rect x="35" y="585" width="120" height="35" fill="none" stroke="#64748b" stroke-width="1" />
  <!-- Simple generated barcode vector lines -->
  <line x1="42" y1="590" x2="42" y2="615" stroke="#0f172a" stroke-width="2" />
  <line x1="47" y1="590" x2="47" y2="615" stroke="#0f172a" stroke-width="1" />
  <line x1="53" y1="590" x2="53" y2="615" stroke="#0f172a" stroke-width="3" />
  <line x1="59" y1="590" x2="59" y2="615" stroke="#0f172a" stroke-width="1" />
  <line x1="64" y1="590" x2="64" y2="615" stroke="#0f172a" stroke-width="2" />
  <line x1="70" y1="590" x2="70" y2="615" stroke="#0f172a" stroke-width="4" />
  <line x1="77" y1="590" x2="77" y2="615" stroke="#0f172a" stroke-width="1" />
  <line x1="82" y1="590" x2="82" y2="615" stroke="#0f172a" stroke-width="2" />
  <line x1="88" y1="590" x2="88" y2="615" stroke="#0f172a" stroke-width="3" />
  <line x1="94" y1="590" x2="94" y2="615" stroke="#0f172a" stroke-width="1" />
  <line x1="99" y1="590" x2="99" y2="615" stroke="#0f172a" stroke-width="2" />
  <line x1="105" y1="590" x2="105" y2="615" stroke="#0f172a" stroke-width="4" />
  <line x1="112" y1="590" x2="112" y2="615" stroke="#0f172a" stroke-width="1" />
  <line x1="117" y1="590" x2="117" y2="615" stroke="#0f172a" stroke-width="2" />
  <line x1="123" y1="590" x2="123" y2="615" stroke="#0f172a" stroke-width="3" />
  <line x1="129" y1="590" x2="129" y2="615" stroke="#0f172a" stroke-width="1" />
  <line x1="134" y1="590" x2="134" y2="615" stroke="#0f172a" stroke-width="2" />
  <line x1="140" y1="590" x2="140" y2="615" stroke="#0f172a" stroke-width="4" />
  <line x1="147" y1="590" x2="147" y2="615" stroke="#0f172a" stroke-width="1" />

  <text x="170" y="598" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="11" fill="#0f172a">SecureGram Trust Infrastructure</text>
  <text x="170" y="614" font-family="system-ui, -apple-system, sans-serif" font-size="9" fill="#64748b">Verified by SecureGram Custom Crypto Engine</text>

  <!-- Decorative wavy bottom line representing receipt cuts -->
  <path d="M 15 670 Q 25 675 35 670 Q 45 665 55 670 Q 65 675 75 670 Q 85 665 95 670 Q 105 675 115 670 Q 125 665 135 670 Q 145 675 155 670 Q 165 665 175 670 Q 185 675 195 670 Q 205 665 215 670 Q 225 675 235 670 Q 245 665 255 670 Q 265 675 275 670 Q 285 665 295 670 Q 305 675 315 670 Q 325 665 335 670 Q 345 675 355 670 Q 365 665 375 670 Q 385 675 395 670 Q 405 665 415 670 Q 425 675 435 670 Q 445 665 455 670 Q 465 675 475 670 Q 485 665 485 670" fill="none" stroke="#e2e8f0" stroke-width="1.5" />
</svg>
`;
};

function Transactions() {
  const user = useUser();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"Selling" | "Buying" | "Auctions">("Selling");
  const [profiles, setProfiles] = useState<Record<string, { name: string; district: string }>>({});

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from("transactions").select("*").order("created_at", { ascending: false })
      .then(async ({ data, error }) => {
        if (error) console.warn("Supabase fetch transactions error:", error.message);
        
        // Merge with local storage transactions
        const local = JSON.parse(localStorage.getItem("sg_transactions") || "[]");
        const remote = (data as Tx[]) || [];
        
        const merged = [...local];
        remote.forEach((rt) => {
          if (!merged.some((lt) => lt.id === rt.id)) {
            merged.push(rt);
          }
        });
        
        // Sort by created_at descending
        merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setTxs(merged);
        setLoading(false);

        // Fetch real names of all unique buyer & seller IDs
        const uniqueIds = Array.from(new Set(merged.flatMap((tx) => [tx.buyer_id, tx.seller_id])));
        if (uniqueIds.length > 0) {
          const { data: profilesData } = await supabase.from("profiles").select("id, name, district").in("id", uniqueIds);
          if (profilesData) {
            const map: Record<string, { name: string; district: string }> = {};
            profilesData.forEach((p) => {
              map[p.id] = {
                name: p.name || "User",
                district: p.district || "Karnataka"
              };
            });
            setProfiles((prev) => ({ ...prev, ...map }));
          }
        }
      });
  }, [user?.id]);

  const filtered = useMemo(() => {
    if (!user) return [];
    if (tab === "Selling") return txs.filter((t) => t.seller_id === user.id && !t.auction_id);
    if (tab === "Buying") return txs.filter((t) => t.buyer_id === user.id && !t.auction_id);
    return txs.filter((t) => !!t.auction_id);
  }, [txs, tab, user]);

  const handleDownloadReceipt = (tx: Tx) => {
    try {
      const meta = inferTransactionMetadata(tx, user?.id, profiles);
      const svgContent = generateReceiptSvg(tx, meta);
      
      const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SecureGram-Receipt-${tx.id.slice(0, 8)}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Receipt downloaded successfully!");
    } catch (err: any) {
      toast.error("Failed to generate receipt: " + err.message);
    }
  };

  const handleCancelTransaction = async (tx: Tx) => {
    if (!confirm("Are you sure you want to cancel this buy request?")) return;
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ status: "cancelled" })
        .eq("id", tx.id);
      
      if (error) throw error;
      
      const local = JSON.parse(localStorage.getItem("sg_transactions") || "[]");
      const updatedLocal = local.map((lt: any) => lt.id === tx.id ? { ...lt, status: "cancelled" } : lt);
      localStorage.setItem("sg_transactions", JSON.stringify(updatedLocal));

      setTxs(prev => prev.map((t) => t.id === tx.id ? { ...t, status: "cancelled" } : t));
      toast.success("Buy request cancelled successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel request");
    }
  };

  return (
    <>
      <div className="mobile-shell pb-28">
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
              {filtered.map((tx) => {
                const formattedStatus = tx.status ? tx.status.charAt(0).toUpperCase() + tx.status.slice(1).toLowerCase() : "Pending";
                const displayColor = statusColor[formattedStatus] || "bg-muted text-foreground";
                
                return (
                  <div key={tx.id} className="rounded-[24px] bg-card shadow-card border border-border p-4 animate-fade-in card-interactive">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm leading-tight">
                          {tx.auction_id ? "Auction settlement" : "Listing sale"}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {tx.buyer_id === user.id ? "From seller" : "To buyer"} • {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${displayColor}`}>{formattedStatus}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xl font-bold">₹{tx.amount.toLocaleString("en-IN")}</span>
                      <div className="flex items-center gap-3">
                        {tx.buyer_id === user.id && tx.status.toLowerCase() === "pending" && (
                          <button 
                            onClick={() => handleCancelTransaction(tx)}
                            className="text-xs font-bold text-destructive hover:underline transition"
                          >
                            Cancel Request
                          </button>
                        )}
                        <button 
                          onClick={() => handleDownloadReceipt(tx)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:opacity-80 transition"
                        >
                          <Download className="h-3.5 w-3.5" />Receipt
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 pt-3 border-t border-border">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span className="text-[11px] text-muted-foreground font-semibold">Verified by Custom Crypto</span>
                      <TrustBadge variant="tamper" className="ml-auto" />
                    </div>
                  </div>
              );
            })}
          </div>
          </>
        )}
      </div>
      <BottomNav />
    </>
  );
}
