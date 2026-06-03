import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SGUser = {
  id: string;
  name: string;
  phone: string;
  role: "farmer" | "buyer";
  district?: string | null;
  state?: string | null;
  avatar_url?: string | null;
};

const listeners = new Set<(u: SGUser | null) => void>();
let cached: SGUser | null = null;
let inflight: Promise<SGUser | null> | null = null;

function emit(u: SGUser | null) {
  cached = u;
  listeners.forEach((l) => l(u));
}

async function loadProfile(): Promise<SGUser | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,name,phone,role,district,state,avatar_url")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (!profile) {
    return {
      id: auth.user.id,
      name: (auth.user.user_metadata?.name as string) || auth.user.email?.split("@")[0] || "User",
      phone: (auth.user.user_metadata?.phone as string) || "",
      role: ((auth.user.user_metadata?.role as string) || "farmer") as "farmer" | "buyer",
    };
  }
  return profile as SGUser;
}

export function refreshUser() {
  if (!inflight) {
    inflight = loadProfile()
      .then((u) => { emit(u); return u; })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

// One global auth subscription
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange(() => { refreshUser(); });
  refreshUser();
}

export async function setUser(u: SGUser | null) {
  if (u === null) {
    await supabase.auth.signOut();
    emit(null);
  }
}

export function getUser() { return cached; }

export function useUser(): SGUser | null {
  const [user, setU] = useState<SGUser | null>(cached);
  useEffect(() => {
    const l = (u: SGUser | null) => setU(u);
    listeners.add(l);
    if (cached === null) refreshUser();
    return () => { listeners.delete(l); };
  }, []);
  return user;
}

export function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("") || "U";
}
