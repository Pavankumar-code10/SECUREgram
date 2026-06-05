import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal, MapPin, ShieldCheck, Plus, X, Loader2, Navigation } from "lucide-react";
import { TopBar } from "@/components/sg/TopBar";
import { BottomNav } from "@/components/sg/BottomNav";
import { TrustBadge } from "@/components/sg/Badge";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/sg/user";
import { toast } from "sonner";

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
      <div className="mobile-shell">
        <TopBar
          title="Marketplace"
          subtitle="Verified Karnataka produce"
          right={user && (
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
            <div key={i.id} className="rounded-3xl bg-card shadow-card border border-border overflow-hidden">
              <div className="aspect-square bg-muted/60 grid place-items-center text-6xl overflow-hidden">
                {i.image_url ? <img src={i.image_url} alt={i.name} className="w-full h-full object-cover" /> : (EMOJI[i.category] || "📦")}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold leading-tight line-clamp-2">{i.name}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{i.stock} {i.unit} available</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-base font-bold">₹{i.price.toLocaleString("en-IN")}</span>
                  <span className="text-[10px] text-muted-foreground">/{i.unit}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {typeof i.distance_km === "number"
                      ? `${i.distance_km.toFixed(1)} km away`
                      : (i.district || i.state || "Karnataka")}
                  </span>
                  <TrustBadge variant="rsa" className="!px-1.5 !py-0.5 !text-[9px]" />
                </div>
              </div>
            </div>
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
    </>
  );
}

function ListItemSheet({ userId, onClose, onCreated }: { userId: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Rice");
  const [price, setPrice] = useState(1000);
  const [stock, setStock] = useState(10);
  const [unit, setUnit] = useState("quintal");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) { toast.error("Add a name"); return; }
    setSaving(true);
    const { error } = await supabase.from("marketplace_items").insert({
      seller_id: userId, name: name.trim(), category, price, stock, unit,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Item listed");
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-end" onClick={onClose}>
      <div className="mobile-shell w-full" onClick={(e) => e.stopPropagation()}>
        <div className="rounded-t-3xl bg-card p-6 space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">List item</h3>
            <button onClick={onClose} className="h-9 w-9 rounded-full bg-muted grid place-items-center"><X className="h-4 w-4" /></button>
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
