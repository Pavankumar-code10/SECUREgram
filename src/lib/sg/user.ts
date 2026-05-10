import { useEffect, useState } from "react";

export type SGUser = {
  id: string;
  name: string;
  phone: string;
  role?: "farmer" | "buyer";
};

const KEY = "sg_user";
const listeners = new Set<() => void>();

function emit() { listeners.forEach(l => l()); }

function read(): SGUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function generateUserId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SG${ts}${rnd}`;
}

export function setUser(u: SGUser | null) {
  if (typeof window === "undefined") return;
  if (u) localStorage.setItem(KEY, JSON.stringify(u));
  else localStorage.removeItem(KEY);
  emit();
}

export function getUser() { return read(); }

export function useUser(): SGUser | null {
  const [user, setU] = useState<SGUser | null>(null);
  useEffect(() => {
    setU(read());
    const l = () => setU(read());
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return user;
}

export function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase()).join("") || "U";
}
