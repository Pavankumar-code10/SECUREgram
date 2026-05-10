import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Copy, Check, Moon, Sun, WifiOff, LogOut, Globe, ShieldCheck, ChevronRight, FileText, Fingerprint } from "lucide-react";
import { TopBar } from "@/components/sg/TopBar";
import { BottomNav } from "@/components/sg/BottomNav";
import { toast } from "sonner";
import { useUser, getInitials, setUser } from "@/lib/sg/user";

export const Route = createFileRoute("/profile")({ component: Profile });

const PUBLIC_KEY = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8K9j2vH3qZ4nE7tR2bW1xL5oF3sQ8aB6Y";

function Profile() {
  const navigate = useNavigate();
  const user = useUser();
  const name = user?.name || "Guest";
  const initials = getInitials(name);
  const [dark, setDark] = useState(false);
  const [offline, setOffline] = useState(false);
  const [lang, setLang] = useState<"EN" | "KN">("EN");
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const copy = () => {
    navigator.clipboard.writeText(PUBLIC_KEY);
    setCopied(true);
    toast.success("Public key copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <div className="mobile-shell">
        <TopBar title="Profile" subtitle="ಪ್ರೊಫೈಲ್" />

        <div className="px-5 py-5">
          <div className="rounded-3xl gradient-primary text-primary-foreground p-5 shadow-elev">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur grid place-items-center text-2xl font-bold">P</div>
              <div>
                <h2 className="text-xl font-bold">Pradeep Kumar</h2>
                <p className="text-sm opacity-90">+91 98765 43210</p>
                <p className="text-xs opacity-80">Mandya, Karnataka</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2 text-[11px]">
              <span className="rounded-full bg-white/20 px-2.5 py-1 font-semibold">Farmer</span>
              <span className="rounded-full bg-white/20 px-2.5 py-1 font-semibold inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" />KYC verified</span>
            </div>
          </div>

          {/* Public key */}
          <div className="mt-5 rounded-3xl bg-card shadow-card border border-border p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Public Key (RSA-2048)</h3>
              <button onClick={copy} className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-[11px] font-mono break-all bg-muted/60 rounded-xl p-3 leading-relaxed">{PUBLIC_KEY}…</p>
            <p className="mt-2 text-[10px] text-muted-foreground">Share this so anyone can verify your signed listings. Your private key stays on this device.</p>
          </div>

          <h3 className="mt-6 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Preferences</h3>
          <div className="mt-2 rounded-3xl bg-card shadow-card border border-border divide-y divide-border overflow-hidden">
            <SettingRow icon={Globe} label="Language" right={
              <div className="flex rounded-full bg-muted p-0.5">
                {(["EN", "KN"] as const).map(l => (
                  <button key={l} onClick={() => setLang(l)} className={`px-3 py-1 rounded-full text-xs font-bold ${lang === l ? "bg-card shadow-card" : "text-muted-foreground"}`}>{l === "EN" ? "English" : "ಕನ್ನಡ"}</button>
                ))}
              </div>
            } />
            <SettingRow icon={dark ? Moon : Sun} label="Dark mode" right={<Toggle checked={dark} onChange={setDark} />} />
            <SettingRow icon={WifiOff} label="Offline mode" sub="Sync when online" right={<Toggle checked={offline} onChange={setOffline} />} />
          </div>

          <h3 className="mt-6 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Account</h3>
          <div className="mt-2 rounded-3xl bg-card shadow-card border border-border divide-y divide-border overflow-hidden">
            <LinkRow to="/transactions" icon={FileText} label="My transactions" />
            <LinkRow to="/" icon={LogOut} label="Logout" danger />
          </div>

          <p className="mt-6 text-center text-[10px] text-muted-foreground">SecureGram v1.0 • RSA-2048 • SHA-256</p>
        </div>
      </div>
      <BottomNav />
    </>
  );
}

function SettingRow({ icon: Icon, label, sub, right }: { icon: any; label: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 min-h-12">
      <div className="h-9 w-9 rounded-xl bg-muted grid place-items-center"><Icon className="h-4 w-4" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

function LinkRow({ to, icon: Icon, label, danger }: { to: string; icon: any; label: string; danger?: boolean }) {
  return (
    <Link to={to as any} className={`flex items-center gap-3 px-4 py-3.5 min-h-12 active:bg-muted ${danger ? "text-destructive" : ""}`}>
      <div className={`h-9 w-9 rounded-xl grid place-items-center ${danger ? "bg-destructive/10" : "bg-muted"}`}><Icon className="h-4 w-4" /></div>
      <p className="flex-1 text-sm font-semibold">{label}</p>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`h-7 w-12 rounded-full p-0.5 transition ${checked ? "bg-primary" : "bg-muted"}`}
      aria-pressed={checked}
    >
      <span className={`block h-6 w-6 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}
