import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, MapPin, TrendingUp, ShieldCheck, Loader2 } from "lucide-react";
import { TopBar } from "@/components/sg/TopBar";
import { BottomNav } from "@/components/sg/BottomNav";
import { TrustBadge } from "@/components/sg/Badge";
import { useUser } from "@/lib/sg/user";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/match")({ component: Match });

function Match() {
  const user = useUser();
  const navigate = useNavigate();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [latestListing, setLatestListing] = useState<any>(null);
  const [loadingListing, setLoadingListing] = useState(false);

  useEffect(() => {
    if (user && user.role === "buyer") {
      toast.error("Smart Matches are only available for Farmers/Sellers.");
      navigate({ to: "/dashboard" });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    setLoadingListing(true);
    supabase
      .from("listings")
      .select("*")
      .eq("seller_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLatestListing(data[0]);
        }
        setLoadingListing(false);
      });
  }, [user?.id]);

  const handleConnect = async (matchName: string) => {
    if (!user) {
      toast.error("Please sign in to connect.");
      navigate({ to: "/login", search: { role: "farmer" } });
      return;
    }

    setConnectingId(matchName);
    
    try {
      // 1. Check if profile already exists with this name
      const { data: existingProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("name", matchName)
        .limit(1);

      if (existingProfiles && existingProfiles.length > 0) {
        navigate({ to: "/chat", search: { to: existingProfiles[0].id, name: matchName } });
        return;
      }

      // 2. Otherwise create a mock buyer user in the background
      const rand = Math.floor(1000 + Math.random() * 9000);
      const email = `${matchName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${rand}@securegram.com`;
      const password = "Password123!";
      
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
      
      const tempClient = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      });

      const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: matchName,
            phone: "9" + Math.floor(100000000 + Math.random() * 900000000),
            role: "buyer",
            district: "Mandya",
            state: "Karnataka"
          }
        }
      });

      if (signUpError) throw signUpError;

      const newUserId = signUpData.user?.id;
      if (!newUserId) throw new Error("Failed to retrieve new user ID");

      // Give Postgres a tiny moment to create the profile row via trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success(`Connected! Log in as buyer in another tab: ${email} / Password123!`);
      navigate({ to: "/chat", search: { to: newUserId, name: matchName } });
    } catch (err: any) {
      console.error("Connection failed", err);
      toast.error("Could not connect to buyer: " + err.message);
    } finally {
      setConnectingId(null);
    }
  };

  const defaultQty = 12;
  const qty = latestListing ? latestListing.quantity_quintal : defaultQty;
  const basePrice = latestListing ? latestListing.price_per_quintal : 2300;

  const dynamicMatches = [
    { name: "Sri Krishna Traders", dist: 12, price: Math.round(basePrice * 1.02), rating: 4.8, verified: true, initial: "K" },
    { name: "Mandya Rice Mills", dist: 24, price: Math.round(basePrice * 1.00), rating: 4.6, verified: true, initial: "M" },
    { name: "Reliance Fresh — Bangalore", dist: 102, price: Math.round(basePrice * 1.04), rating: 4.9, verified: true, initial: "R" },
    { name: "Local Co-op Society", dist: 4, price: Math.round(basePrice * 0.96), rating: 4.4, verified: false, initial: "C" },
  ].map(m => ({
    ...m,
    rev: Math.round(m.price * qty)
  }));

  return (
    <>
      <div className="mobile-shell pb-28">
        <TopBar 
          title="Smart Matches" 
          subtitle={latestListing ? `Offers for your ${latestListing.crop} (${qty}q)` : "4 verified buyers nearby"} 
        />
        <div className="px-5 py-4 space-y-3">
          {dynamicMatches.map((m) => (
            <div key={m.name} className="rounded-[24px] bg-card shadow-card border border-border p-4 animate-fade-in card-interactive">
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
                <button
                  disabled={connectingId !== null}
                  onClick={() => handleConnect(m.name)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-xl gradient-primary text-primary-foreground px-4 py-2.5 text-sm font-bold shadow-card active:scale-[0.97] transition disabled:opacity-60 min-w-[100px] justify-center"
                >
                  {connectingId === m.name ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </>
  );
}

