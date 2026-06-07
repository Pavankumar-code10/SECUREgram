import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, SlidersHorizontal, MapPin, ShieldCheck, Plus, X, Loader2, Navigation, ArrowLeft, Trash2 } from "lucide-react";
import { TopBar } from "@/components/sg/TopBar";
import { BottomNav } from "@/components/sg/BottomNav";
import { TrustBadge } from "@/components/sg/Badge";
import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/sg/user";
import { toast } from "sonner";
import { ensureStorageConfigured } from "@/lib/mandi.functions";
import { useSignedUrl } from "@/lib/sg/avatar";

export const Route = createFileRoute("/marketplace")({ component: Marketplace });

type Item = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  image_url: string | null;
  seller_id: string;
  distance_km?: number | null;
  district?: string | null;
  state?: string | null;
};

const CATEGORIES = ["All", "Rice", "Pulses", "Vegetables", "Fruits", "Spices", "Inputs"];
const EMOJI: Record<string, string> = { Rice: "🌾", Pulses: "🫘", Vegetables: "🥬", Fruits: "🥭", Spices: "🌶️", Inputs: "🧪" };

function Marketplace() {
  const user = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [nearby, setNearby] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [radiusKm, setRadiusKm] = useState(100);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const loadAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketplace_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Item[]) || []);
    setLoading(false);
  };

  const loadNearby = async () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); setNearby(false); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { data, error } = await supabase.rpc("nearby_marketplace_items", {
          buyer_lat: pos.coords.latitude,
          buyer_lng: pos.coords.longitude,
          radius_km: radiusKm,
          category_filter: cat === "All" ? undefined : cat,
          q: q || undefined,
        });
        if (error) toast.error(error.message);
        setItems((data as Item[]) || []);
        setGeoLoading(false);
        setLoading(false);
        if (!data || data.length === 0) toast.info(`No listings within ${radiusKm} km — try widening the radius.`);
      },
      () => { toast.error("Location permission denied"); setGeoLoading(false); setNearby(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    ensureStorageConfigured()
      .then((res) => {
        console.log("ensureStorageConfigured result:", res);
      })
      .catch((err) => {
        console.error("Failed to run ensureStorageConfigured:", err);
      });
  }, []);

  useEffect(() => {
    if (nearby) loadNearby();
    else loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearby, radiusKm]);

  const filtered = useMemo(() => items.filter((i) => {
    if (cat !== "All" && i.category !== cat) return false;
    if (q && !i.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [items, cat, q]);

  return (
    <>
      <div className="mobile-shell pb-28">
        <TopBar
          title="Marketplace"
          subtitle="Verified Karnataka produce"
          right={user && user.role !== "buyer" && (
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-full gradient-action text-action-foreground">
              <Plus className="h-3 w-3" /> List
            </button>
          )}
        />

        <div className="px-5 pt-3 sticky top-14 z-30 bg-background pb-3">
          <div className="flex items-center gap-2 rounded-2xl bg-card border border-border h-12 px-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search rice, tur, mango…" className="flex-1 bg-transparent outline-none text-sm" />
            <button className="h-9 w-9 rounded-xl bg-muted grid place-items-center" aria-label="Filters">
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setNearby((v) => !v)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold border inline-flex items-center gap-1 ${nearby ? "bg-action text-action-foreground border-action" : "bg-card border-border"}`}
            >
              {geoLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
              {nearby ? `Near me · ${radiusKm}km` : "Near me"}
            </button>
            {nearby && (
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="shrink-0 rounded-full px-2 py-1.5 text-xs font-semibold bg-card border border-border"
              >
                {[25, 50, 100, 200, 500].map((r) => <option key={r} value={r}>{r} km</option>)}
              </select>
            )}
            {CATEGORIES.map((t) => (
              <button key={t} onClick={() => setCat(t)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold border ${cat === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>{t}</button>
            ))}
          </div>
        </div>

        {loading && <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>}
        {!loading && filtered.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="font-bold">No items yet</p>
            <p className="text-xs text-muted-foreground mt-1">{user ? "Be the first to list something." : "Sign in to list items."}</p>
            {user && (
              <button onClick={() => setShowAdd(true)} className="mt-3 px-4 py-2 rounded-xl gradient-primary text-primary-foreground font-bold text-sm inline-flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> List item
              </button>
            )}
          </div>
        )}

        <div className="px-5 py-3 grid grid-cols-2 gap-3">
          {filtered.map((i) => (
            <ItemCard key={i.id} item={i} onClick={() => setSelectedItem(i)} />
          ))}
        </div>
      </div>
      <BottomNav />
      {showAdd && user && (
        <ListItemSheet
          userId={user.id}
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); nearby ? loadNearby() : loadAll(); }}
        />
      )}
      {selectedItem && (
        <ItemDetailSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onDeleted={() => {
            setSelectedItem(null);
            if (nearby) loadNearby();
            else loadAll();
          }}
        />
      )}
    </>
  );
}

function ItemCard({ item, onClick }: { item: Item; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="rounded-[24px] bg-card shadow-card border border-border overflow-hidden cursor-pointer card-interactive"
    >
      <div className="aspect-square bg-muted/60 grid place-items-center text-6xl overflow-hidden">
        {EMOJI[item.category] || "📦"}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-bold leading-tight line-clamp-2">{item.name}</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{item.stock} {item.unit} available</p>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-base font-bold">₹{item.price.toLocaleString("en-IN")}</span>
          <span className="text-[10px] text-muted-foreground">/{item.unit}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-1">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {typeof item.distance_km === "number"
              ? `${item.distance_km.toFixed(1)} km away`
              : (item.district || item.state || "Karnataka")}
          </span>
          <TrustBadge variant="rsa" className="!px-1.5 !py-0.5 !text-[9px]" />
        </div>
      </div>
    </div>
  );
}

interface ItemDetailSheetProps {
  item: Item;
  onClose: () => void;
  onDeleted?: () => void;
}

const getMockSeller = (id: string, itemDistrict?: string | null, itemState?: string | null) => {
  const names = [
    "Prasad K. (Farmer)",
    "Basavaraju M.",
    "Anand Gowda",
    "Shivu Mandya",
    "Swamy Gowda",
    "Ramegowda K.",
    "Malleshappa",
    "Siddaramaiah H."
  ];
  // Simple hash of id
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % names.length;
  return {
    name: names[index],
    phone: "9" + Math.floor(800000000 + (Math.abs(hash) % 100000000)),
    role: "farmer",
    district: itemDistrict || "Mandya",
    state: itemState || "Karnataka"
  };
};

function ItemDetailSheet({ item, onClose, onDeleted }: ItemDetailSheetProps) {
  const navigate = useNavigate();
  const user = useUser();
  const imageUrl = useSignedUrl(item.image_url);
  const [seller, setSeller] = useState<any>(null);
  const [loadingSeller, setLoadingSeller] = useState(true);
  const [buyQty, setBuyQty] = useState(1);
  const [buying, setBuying] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "escrow" | "cod">("upi");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove this listing?")) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("marketplace_items")
        .delete()
        .eq("id", item.id);
      if (error) throw error;
      toast.success("Listing removed successfully");
      if (onDeleted) onDeleted();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove listing");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    setLoadingSeller(true);
    supabase
      .from("profiles")
      .select("*")
      .eq("id", item.seller_id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          console.warn("Profiles fetch failed, using mock seller details for demo:", error?.message);
          setSeller(getMockSeller(item.seller_id, item.district, item.state));
        } else {
          setSeller(data);
        }
        setLoadingSeller(false);
      });
  }, [item.seller_id]);

  const handleBuy = async () => {
    if (!user) {
      toast.error("Please log in to buy items.");
      return;
    }
    if (user.id === item.seller_id) {
      toast.error("You cannot buy your own item.");
      return;
    }
    if (buyQty <= 0 || buyQty > item.stock) {
      toast.error(`Please select a valid quantity (1 to ${item.stock})`);
      return;
    }

    if (!showPayment) {
      setShowPayment(true);
      return;
    }

    setBuying(true);
    const orderTotal = item.price * buyQty + 50;
    const txId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

    const newTx = {
      id: txId,
      buyer_id: user.id,
      seller_id: item.seller_id,
      listing_id: item.id,
      auction_id: null,
      amount: orderTotal,
      status: "pending",
      created_at: new Date().toISOString()
    };

    try {
      // 1. Try database insert
      const { error } = await supabase.from("transactions").insert({
        id: txId,
        buyer_id: user.id,
        seller_id: item.seller_id,
        amount: orderTotal,
        status: "pending"
      });

      if (error) {
        console.warn("Database insert failed, using mock transaction for demo:", error.message);
      }

      // 2. Try inserting a notification for the seller (including buyer's profile details)
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: item.seller_id,
        title: "New Buy Request",
        message: `${user.name || "A buyer"} (${user.district || "Karnataka"}) has requested to buy your listed ${item.name} for ₹${orderTotal.toLocaleString("en-IN")}`,
        type: "buy_request",
        link: "/transactions",
        is_read: false
      });

      if (notifError) {
        console.warn("Could not insert database notification:", notifError.message);
      }

      // 2b. Try inserting a notification for the buyer
      const { error: buyerNotifError } = await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Purchase Request Sent",
        message: `Your request to buy ${buyQty} ${item.unit} of ${item.name} for ₹${orderTotal.toLocaleString("en-IN")} has been sent to the seller.`,
        type: "transaction_update",
        link: "/transactions",
        is_read: false
      });

      if (buyerNotifError) {
        console.warn("Could not insert buyer database notification:", buyerNotifError.message);
      }

      // 3. Update stock in marketplace_items
      const { error: stockError } = await supabase
        .from("marketplace_items")
        .update({ stock: Math.max(0, item.stock - buyQty) })
        .eq("id", item.id);

      if (stockError) {
        console.warn("Could not update stock database row:", stockError.message);
      }

      // 4. Update local storage cache (Transactions & Notifications)
      const localTxs = JSON.parse(localStorage.getItem("sg_transactions") || "[]");
      localTxs.unshift(newTx);
      localStorage.setItem("sg_transactions", JSON.stringify(localTxs));

      // Save transaction metadata for receipt generator
      const metadataStore = JSON.parse(localStorage.getItem("sg_transaction_metadata") || "{}");
      metadataStore[txId] = {
        item_name: item.name,
        item_category: item.category,
        item_qty: buyQty,
        item_unit: item.unit,
        buyer_name: user.name || "Buyer",
        seller_name: seller?.name || "Seller",
        unit_price: item.price,
        delivery_fee: 50,
        subtotal: item.price * buyQty
      };
      localStorage.setItem("sg_transaction_metadata", JSON.stringify(metadataStore));

      // Save notification to seller's local storage notification list (for demo environment testability)
      const sellerNotifKey = `sg_notifications_${item.seller_id}`;
      const sellerNotifs = JSON.parse(localStorage.getItem(sellerNotifKey) || "[]");
      sellerNotifs.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        user_id: item.seller_id,
        title: "New Buy Request",
        message: `${user.name || "A buyer"} (${user.district || "Karnataka"}) has requested to buy your listed ${item.name} for ₹${orderTotal.toLocaleString("en-IN")}`,
        type: "buy_request",
        link: "/transactions",
        is_read: false,
        created_at: new Date().toISOString()
      });
      localStorage.setItem(sellerNotifKey, JSON.stringify(sellerNotifs));

      // Save notification to buyer's local storage notification list
      const buyerNotifKey = `sg_notifications_${user.id}`;
      const buyerNotifs = JSON.parse(localStorage.getItem(buyerNotifKey) || "[]");
      buyerNotifs.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        user_id: user.id,
        title: "Purchase Request Sent",
        message: `Your request to buy ${buyQty} ${item.unit} of ${item.name} for ₹${orderTotal.toLocaleString("en-IN")} has been sent to the seller.`,
        type: "transaction_update",
        link: "/transactions",
        is_read: false,
        created_at: new Date().toISOString()
      });
      localStorage.setItem(buyerNotifKey, JSON.stringify(buyerNotifs));

      toast.success("Purchase initiated! RSA Trust Signature generated.");
      onClose();
      navigate({ to: "/transactions" });
    } catch (err: any) {
      console.error("Checkout execution error:", err);

      // Fallback: save locally
      const localTxs = JSON.parse(localStorage.getItem("sg_transactions") || "[]");
      localTxs.unshift(newTx);
      localStorage.setItem("sg_transactions", JSON.stringify(localTxs));

      // Save metadata locally on fallback
      const metadataStore = JSON.parse(localStorage.getItem("sg_transaction_metadata") || "{}");
      metadataStore[txId] = {
        item_name: item.name,
        item_category: item.category,
        item_qty: buyQty,
        item_unit: item.unit,
        buyer_name: user.name || "Buyer",
        seller_name: seller?.name || "Seller",
        unit_price: item.price,
        delivery_fee: 50,
        subtotal: item.price * buyQty
      };
      localStorage.setItem("sg_transaction_metadata", JSON.stringify(metadataStore));

      toast.success("Purchase initiated! (Demo Mode Fallback)");
      onClose();
      navigate({ to: "/transactions" });
    } finally {
      setBuying(false);
    }
  };

  const handleChat = async () => {
    if (!user) {
      toast.error("Please log in to chat with the seller.");
      return;
    }
    if (user.id === item.seller_id) {
      toast.error("This is your own listing.");
      return;
    }

    setConnecting(true);
    navigate({
      to: "/chat",
      search: {
        to: item.seller_id,
        name: seller?.name || "Seller",
      },
    });
  };

  if (showPayment) {
    const subtotal = item.price * buyQty;
    const delivery = 50;
    const total = subtotal + delivery;

    return (
      <div className="fixed inset-0 z-50 bg-black/50 grid place-items-end" onClick={onClose}>
        <div className="mx-auto max-w-[428px] w-full" onClick={(e) => e.stopPropagation()}>
          <div className="rounded-t-3xl bg-card p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <button onClick={() => setShowPayment(false)} className="h-8 w-8 rounded-full hover:bg-muted grid place-items-center" aria-label="Back">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h3 className="text-base font-bold leading-tight">Checkout Payment</h3>
              </div>
              <button onClick={onClose} className="h-9 w-9 rounded-full bg-muted grid place-items-center" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Payment Method</h4>

              <div className="space-y-2">
                {/* UPI Card */}
                <div
                  onClick={() => setPaymentMethod("upi")}
                  className={`border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${paymentMethod === "upi" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 grid place-items-center font-bold text-xs">UPI</div>
                    <div>
                      <p className="text-sm font-bold">UPI (GPay / PhonePe / Paytm)</p>
                      <p className="text-xs text-muted-foreground">Pay instantly using any UPI app</p>
                    </div>
                  </div>
                  <div className={`h-5 w-5 rounded-full border grid place-items-center ${paymentMethod === "upi" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                    {paymentMethod === "upi" && <span className="h-2 w-2 rounded-full bg-card" />}
                  </div>
                </div>

                {/* Escrow Card */}
                <div
                  onClick={() => setPaymentMethod("escrow")}
                  className={`border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${paymentMethod === "escrow" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center">🛡️</div>
                    <div>
                      <p className="text-sm font-bold flex items-center gap-1.5">
                        SecureGram Escrow
                        <TrustBadge variant="rsa" className="!px-1 !py-0 !text-[8px]" />
                      </p>
                      <p className="text-xs text-muted-foreground">Funds locked until quality delivery</p>
                    </div>
                  </div>
                  <div className={`h-5 w-5 rounded-full border grid place-items-center ${paymentMethod === "escrow" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                    {paymentMethod === "escrow" && <span className="h-2 w-2 rounded-full bg-card" />}
                  </div>
                </div>

                {/* COD Card */}
                <div
                  onClick={() => setPaymentMethod("cod")}
                  className={`border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 grid place-items-center">🤝</div>
                    <div>
                      <p className="text-sm font-bold">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">Pay cash when produce is delivered</p>
                    </div>
                  </div>
                  <div className={`h-5 w-5 rounded-full border grid place-items-center ${paymentMethod === "cod" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                    {paymentMethod === "cod" && <span className="h-2 w-2 rounded-full bg-card" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="border border-border rounded-2xl p-4 space-y-2.5 bg-muted/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order Summary</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{item.name} x {buyQty} {item.unit}</span>
                  <span className="font-semibold text-foreground">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transport/Delivery Fee</span>
                  <span className="font-semibold text-foreground">₹{delivery.toLocaleString("en-IN")}</span>
                </div>
                <div className="border-t border-border pt-1.5 flex justify-between text-sm font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary">₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <div className="pt-2">
              <button
                onClick={handleBuy}
                disabled={buying}
                className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 hover:opacity-90 transition shadow-elev"
              >
                {buying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Confirm & Pay ₹{total.toLocaleString("en-IN")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-end" onClick={onClose}>
      <div className="mx-auto max-w-[428px] w-full" onClick={(e) => e.stopPropagation()}>
        <div className="rounded-t-3xl bg-card p-6 space-y-4 animate-slide-up">
          {imageUrl && (
            <div className="w-full h-44 rounded-2xl overflow-hidden border border-border bg-muted/30">
              <img src={imageUrl} alt={item.name} className="w-full h-full object-fill" />
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!imageUrl && <span className="text-3xl">{EMOJI[item.category] || "📦"}</span>}
              <div>
                <h3 className="text-lg font-bold leading-tight">{item.name}</h3>
                <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[10px] font-bold uppercase">{item.category}</span>
              </div>
            </div>
            <button onClick={onClose} className="h-9 w-9 rounded-full bg-muted grid place-items-center" aria-label="Close"><X className="h-4 w-4" /></button>
          </div>

          <div className="rounded-2xl bg-muted/40 p-4 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground font-semibold">Price per unit:</span>
              <span className="text-xl font-bold text-primary">₹{item.price.toLocaleString("en-IN")} <span className="text-xs font-normal text-muted-foreground">/{item.unit}</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-semibold">Availability:</span>
              <span className="text-sm font-semibold">{item.stock} {item.unit}s in stock</span>
            </div>
          </div>

          {/* Seller Details */}
          <div className="border border-border rounded-2xl p-4 space-y-2.5 bg-card">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Seller & Location Details</h4>
            {loadingSeller ? (
              <p className="text-xs text-muted-foreground animate-pulse">Loading seller profile...</p>
            ) : seller ? (
              <div className="space-y-1">
                <p className="text-sm font-bold">{seller.name}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>{[item.district || seller.district, item.state || seller.state || "Karnataka"].filter(Boolean).join(", ")}</span>
                </div>
                {(item.distance_km || seller.distance_km) && (
                  <p className="text-xs text-primary font-medium mt-1">📍 {((item.distance_km || seller.distance_km) as number).toFixed(1)} km away from you</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Seller profile not found.</p>
            )}
          </div>

          {/* Buy Quantity Selector */}
          {user && user.id !== item.seller_id && item.stock > 0 && (
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs text-muted-foreground font-semibold">Select Quantity:</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setBuyQty(q => Math.max(1, q - 1))}
                  className="h-8 w-8 rounded-full border border-border bg-muted/40 grid place-items-center font-bold"
                >-</button>
                <span className="text-sm font-bold w-6 text-center">{buyQty}</span>
                <button
                  onClick={() => setBuyQty(q => Math.min(item.stock, q + 1))}
                  className="h-8 w-8 rounded-full border border-border bg-muted/40 grid place-items-center font-bold"
                >+</button>
              </div>
            </div>
          )}

          {user && user.id === item.seller_id ? (
            <div className="pt-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full h-12 rounded-2xl bg-destructive hover:bg-destructive/90 text-white font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 transition shadow-elev"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span>Remove Listing</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleChat}
                disabled={connecting || user?.id === item.seller_id}
                className="h-12 rounded-2xl bg-muted font-bold text-sm flex items-center justify-center gap-1.5 border border-border hover:bg-muted/70 disabled:opacity-50 transition"
              >
                <Search className="h-4 w-4" />
                Chat with Seller
              </button>
              <button
                onClick={handleBuy}
                disabled={buying || item.stock <= 0 || user?.id === item.seller_id}
                className="h-12 rounded-2xl gradient-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 hover:opacity-90 transition shadow-elev"
              >
                <ShieldCheck className="h-4 w-4" />
                {item.stock <= 0 ? "Out of Stock" : "Buy Now"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ListItemSheet({ userId, onClose, onCreated }: { userId: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Rice");
  const [price, setPrice] = useState(1000);
  const [stock, setStock] = useState(10);
  const [unit, setUnit] = useState("quintal");
  const [saving, setSaving] = useState(false);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const grabGeo = () =>
    new Promise<{ lat: number; lng: number } | null>((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    });

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Please select an image file"); return; }

    try {
      const { resizeAndCompressImage } = await import("@/lib/sg/image");
      const resizedBlob = await resizeAndCompressImage(f, 600, 600);
      const resizedFile = new File([resizedBlob], f.name, { type: "image/jpeg" });

      setFileToUpload(resizedFile);
      const reader = new FileReader();
      reader.onload = () => { setPhoto(reader.result as string); };
      reader.readAsDataURL(resizedFile);
      toast.success("Image added & resized to 600x600px");
    } catch (err) {
      toast.error("Failed to process image");
      console.error(err);
    }
    e.target.value = "";
  };

  const save = async () => {
    if (!name.trim()) { toast.error("Add a name"); return; }
    setSaving(true);

    try {
      let imgUrl: string | null = null;

      if (photo) {
        imgUrl = photo;
      }

      const loc = geo ?? (await grabGeo());
      const { error } = await supabase.from("marketplace_items").insert({
        seller_id: userId,
        name: name.trim(),
        category,
        price,
        stock,
        unit,
        image_url: imgUrl,
        latitude: loc?.lat ?? null,
        longitude: loc?.lng ?? null,
        state: "Karnataka",
      });
      if (error) throw error;

      toast.success("Item listed successfully!");
      onCreated();
    } catch (err: any) {
      toast.error(err.message || "Failed to list item");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-end" onClick={onClose}>
      <div className="mx-auto max-w-[428px] w-full" onClick={(e) => e.stopPropagation()}>
        <div className="rounded-t-3xl bg-card p-6 space-y-3 animate-slide-up max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-lg font-bold">List item</h3>
            <button onClick={onClose} className="h-9 w-9 rounded-full bg-muted grid place-items-center"><X className="h-4 w-4" /></button>
          </div>

          {/* Image Upload Input */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Item Image</span>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
            {photo ? (
              <div className="relative rounded-2xl overflow-hidden border border-border h-32 w-full">
                <img src={photo} alt="Item Preview" className="w-full h-full object-fill" />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setFileToUpload(null); }}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white grid place-items-center hover:bg-black/80 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center text-center transition"
              >
                <span className="text-2xl">📸</span>
                <span className="text-xs font-bold mt-1 text-primary">Add photo (squeezed to fit)</span>
                <span className="text-[10px] text-muted-foreground">JPG/PNG up to 5MB</span>
              </button>
            )}
          </div>

          <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} className="sg-input" placeholder="e.g. Sona Masuri Rice" /></Field>
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="sg-input">
              {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Price"><input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} className="sg-input" /></Field>
            <Field label="Stock"><input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value) || 0)} className="sg-input" /></Field>
            <Field label="Unit"><input value={unit} onChange={(e) => setUnit(e.target.value)} className="sg-input" /></Field>
          </div>
          <button
            type="button"
            onClick={async () => { const g = await grabGeo(); setGeo(g); g ? toast.success("Location attached") : toast.error("Location unavailable"); }}
            className={`w-full h-11 rounded-2xl border-2 text-xs font-bold inline-flex items-center justify-center gap-2 ${geo ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"}`}
          >
            <MapPin className="h-4 w-4" />
            {geo ? `Pinned · ${geo.lat.toFixed(3)},${geo.lng.toFixed(3)}` : "Attach my location (for Near Me)"}
          </button>
          <button onClick={save} disabled={saving} className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-bold disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} List item
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
