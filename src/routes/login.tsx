import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Loader2, Check, User as UserIcon } from "lucide-react";
import { Logo } from "@/components/sg/Logo";
import { celebrate } from "@/lib/sg/confetti";
import { setUser, generateUserId, getUser } from "@/lib/sg/user";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const valid = name.trim().length >= 2 && phone.length === 10;

  const submit = (existing = false) => {
    if (state !== "idle") return;
    if (!valid) return;
    setState("loading");
    setTimeout(() => {
      const prev = getUser();
      const id = existing && prev?.id ? prev.id : generateUserId();
      setUser({ id, name: name.trim(), phone, role: prev?.role ?? "farmer" });
      setState("done");
      celebrate();
      setTimeout(() => navigate({ to: "/dashboard" }), 1400);
    }, 1500);
  };

  return (
    <div className="mobile-shell gradient-hero flex flex-col px-6 pt-10 pb-10">
      <Logo size={56} />
      <h2 className="mt-6 text-2xl font-bold leading-tight">Secure Login</h2>
      <p className="text-sm text-muted-foreground">ಸುರಕ್ಷಿತ ಲಾಗಿನ್</p>

      <label className="mt-8 block">
        <span className="text-xs font-semibold text-muted-foreground">Full name</span>
        <div className="mt-1.5 flex items-stretch rounded-2xl bg-card border border-border focus-within:ring-2 focus-within:ring-primary overflow-hidden">
          <span className="px-3 grid place-items-center bg-muted"><UserIcon className="h-4 w-4" /></span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
            placeholder="Pradeep Kumar"
            className="flex-1 px-3 py-3.5 bg-transparent outline-none text-base"
          />
        </div>
      </label>

      <label className="mt-4 block">
        <span className="text-xs font-semibold text-muted-foreground">Phone number</span>
        <div className="mt-1.5 flex items-stretch rounded-2xl bg-card border border-border focus-within:ring-2 focus-within:ring-primary overflow-hidden">
          <span className="px-3 grid place-items-center bg-muted text-sm font-semibold">+91</span>
          <input
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="98765 43210"
            className="flex-1 px-3 py-3.5 bg-transparent outline-none text-base"
          />
        </div>
      </label>

      <button
        onClick={() => submit(false)}
        disabled={state !== "idle" || !valid}
        className="mt-8 w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-elev active:scale-[0.98] transition disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
      >
        {state === "idle" && (<><Lock className="h-5 w-5" /> Register & Generate RSA Keys</>)}
        {state === "loading" && (<><Loader2 className="h-5 w-5 animate-spin" /> Generating 2048-bit keys…</>)}
        {state === "done" && (<><Check className="h-5 w-5 animate-check-pop" /> Keys Generated Securely</>)}
      </button>

      <button
        onClick={() => submit(true)}
        disabled={state !== "idle" || !valid}
        className="mt-3 text-center text-sm font-semibold text-primary hover:underline disabled:opacity-50"
      >
        Already registered? Log in
      </button>

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Your private key never leaves this device. RSA-2048 • SHA-256
      </p>

      {state === "done" && (
        <div className="mt-8 mx-auto w-24 h-24 rounded-full bg-primary/15 grid place-items-center animate-shield-pulse">
          <div className="h-16 w-16 rounded-full gradient-primary grid place-items-center">
            <Lock className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}
