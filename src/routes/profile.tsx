import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Copy, Check, Moon, Sun, WifiOff, LogOut, Globe, ShieldCheck, ChevronRight, FileText, Fingerprint, Camera, Loader2, Pencil } from "lucide-react";
import { TopBar } from "@/components/sg/TopBar";
import { BottomNav } from "@/components/sg/BottomNav";
import { toast } from "sonner";
import { useUser, getInitials, setUser, refreshUser } from "@/lib/sg/user";
import { supabase } from "@/integrations/supabase/client";
import { uploadAvatar, useAvatarUrl } from "@/lib/sg/avatar";

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
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", district: "", state: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const avatarUrl = useAvatarUrl(user?.avatar_url);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    if (user) setForm({ name: user.name || "", phone: user.phone || "", district: user.district || "", state: user.state || "" });
  }, [user?.id]);

  const copy = () => {
    navigator.clipboard.writeText(PUBLIC_KEY);
    setCopied(true);
    toast.success("Public key copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !user) return;
    if (!f.type.startsWith("image/")) { toast.error("Pick an image"); return; }
    setUploading(true);
    try {
      const { resizeAndCompressImage } = await import("@/lib/sg/image");
      const resizedBlob = await resizeAndCompressImage(f, 600, 600);
      const resizedFile = new File([resizedBlob], f.name, { type: "image/jpeg" });

      const path = await uploadAvatar(user.id, resizedFile);
      const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
      if (error) throw error;
      await refreshUser();
      toast.success("Avatar updated");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name: form.name.trim(),
      phone: form.phone.trim(),
      district: form.district.trim() || null,
      state: form.state.trim() || null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await refreshUser();
    setEditing(false);
    toast.success("Profile saved");
  };

  return (
    <>
      <div className="mobile-shell pb-28">
        <TopBar title="Profile" subtitle="ಪ್ರೊಫೈಲ್" />

        <div className="px-5 py-5">
          <div className="rounded-3xl gradient-primary text-primary-foreground p-5 shadow-elev">
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={!user || uploading}
                  className="h-16 w-16 rounded-full bg-white/20 backdrop-blur grid place-items-center text-2xl font-bold overflow-hidden relative"
                  aria-label="Change avatar"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                  <span className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 grid place-items-center transition">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold truncate">{name}</h2>
                <p className="text-sm opacity-90">+91 {user?.phone || "—"}</p>
                <p className="text-xs opacity-80">{[user?.district, user?.state].filter(Boolean).join(", ") || "Add your location"}</p>
              </div>
              {user && (
                <button onClick={() => setEditing((e) => !e)} className="h-9 w-9 rounded-full bg-white/20 grid place-items-center" aria-label="Edit profile">
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mt-4 flex gap-2 text-[11px] flex-wrap">
              <span className="rounded-full bg-white/20 px-2.5 py-1 font-semibold capitalize">{user?.role || "guest"}</span>
              <span className="rounded-full bg-white/20 px-2.5 py-1 font-semibold inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" />KYC verified</span>
            </div>
          </div>

          {editing && user && (
            <div className="mt-4 rounded-3xl bg-card border border-border p-4 space-y-3 animate-slide-up">
              <h3 className="font-bold text-sm">Edit profile</h3>
              <EditField label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <EditField label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <div className="grid grid-cols-2 gap-3">
                <EditField label="District" value={form.district} onChange={(v) => setForm({ ...form, district: v })} />
                <EditField label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
              </div>
              <button onClick={saveProfile} disabled={saving} className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
              </button>
            </div>
          )}

          {/* User ID */}
          <div className="mt-5 rounded-3xl bg-card shadow-card border border-border p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1.5"><Fingerprint className="h-4 w-4 text-primary" />Unique User ID</h3>
              <button
                onClick={() => {
                  if (!user) return;
                  navigator.clipboard.writeText(user.id);
                  setCopiedId(true);
                  toast.success("User ID copied");
                  setTimeout(() => setCopiedId(false), 1500);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary"
              >
                {copiedId ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedId ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-sm font-mono break-all bg-muted/60 rounded-xl p-3 leading-relaxed">{user?.id || "—"}</p>
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
            <button
              onClick={() => { setUser(null); navigate({ to: "/" }); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 min-h-12 text-left text-destructive"
            >
              <div className="h-9 w-9 rounded-xl bg-destructive/10 grid place-items-center"><LogOut className="h-4 w-4" /></div>
              <span className="flex-1 text-sm font-semibold">Logout</span>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </button>
          </div>

          <p className="mt-6 text-center text-[10px] text-muted-foreground">SecureGram v1.0 • RSA-2048 • SHA-256</p>
        </div>
      </div>
      <BottomNav />
    </>
  );
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full h-11 px-3 rounded-xl bg-background border border-border outline-none text-sm focus:border-primary" />
    </label>
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
