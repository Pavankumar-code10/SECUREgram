import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Loader2, Mail, User as UserIcon, Phone, Sprout, ShoppingBasket } from "lucide-react";
import { Logo } from "@/components/sg/Logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { celebrate } from "@/lib/sg/confetti";

export const Route = createFileRoute("/login")({
  validateSearch: (s) => ({ role: (s.role as "farmer" | "buyer") || "farmer" }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { role } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [chosenRole, setChosenRole] = useState<"farmer" | "buyer">(role);

  // Load saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("sg_saved_email");
    const savedPassword = localStorage.getItem("sg_saved_password");
    if (savedEmail) {
      setEmail(savedEmail);
      setMode("signin");
    }
    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);

  // If already signed in, jump to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const validSignup =
    name.trim().length >= 2 && phone.length === 10 && email.includes("@") && password.length >= 6;
  const validSignin = email.includes("@") && password.length >= 6;

  const handleSignup = async () => {
    if (!validSignup || busy) return;
    setBusy(true);

    try {
      // 1. Check if email or phone already exists
      const { data, error: checkError } = await supabase.rpc("check_user_exists", {
        p_email: email,
        p_phone: phone,
      });

      if (checkError) {
        console.error("Uniqueness check error:", checkError);
      } else if (data && data.length > 0) {
        const { email_exists, phone_exists } = data[0];
        if (email_exists) {
          toast.error("This email is already registered");
          setBusy(false);
          return;
        }
        if (phone_exists) {
          toast.error("This phone number is already registered");
          setBusy(false);
          return;
        }
      }

      // 2. Proceed with registration
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { name: name.trim(), phone, role: chosenRole },
        },
      });

      if (error) {
        toast.error(error.message);
        setBusy(false);
        return;
      }

      // Save credentials for easier future logins
      localStorage.setItem("sg_saved_email", email);
      localStorage.setItem("sg_saved_password", password);

      if (signUpData?.session) {
        toast.success("Account created successfully!");
        celebrate();
        setTimeout(() => navigate({ to: "/dashboard" }), 1200);
      } else {
        toast.success("Account created — check your email to verify!");
        celebrate();
        setMode("signin");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred during registration");
    } finally {
      setBusy(false);
    }
  };


  const handleSignin = async () => {
    if (!validSignin || busy) return;
    setBusy(true);
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }

    // Save credentials on successful login
    localStorage.setItem("sg_saved_email", email);
    localStorage.setItem("sg_saved_password", password);

    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  };

  const handleGoogle = async () => {
    const width = 450;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      "/google-signin",
      "Google Sign In",
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
    );

    if (!popup) {
      toast.error("Please allow popups to sign in with Google");
      return;
    }

    const messageHandler = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "GOOGLE_OAUTH_SUCCESS") return;

      window.removeEventListener("message", messageHandler);
      const email = event.data.email;

      setBusy(true);
      toast.loading(`Signing in with Google account: ${email}...`, { id: "google-auth" });

      try {
        const mockPassword = "GoogleAuthPassword123!";
        const namePrefix = email.split("@")[0].replace(/[._]/g, " ");
        const mockName = namePrefix
          .split(" ")
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

        // 1. Try to sign in first
        let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: mockPassword,
        });

        // 2. If user doesn't exist, register them
        if (signInError && (signInError.message.includes("Invalid login credentials") || signInError.message.includes("does not exist"))) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: mockPassword,
            options: {
              emailRedirectTo: `${window.location.origin}/dashboard`,
              data: { 
                name: mockName, 
                phone: "9999999999", 
                role: chosenRole 
              },
            },
          });

          if (signUpError) throw signUpError;

          if (!signUpData.session) {
            const { data: retrySignInData, error: retrySignInError } = await supabase.auth.signInWithPassword({
              email,
              password: mockPassword,
            });
            if (retrySignInError) throw retrySignInError;
          }
        } else if (signInError) {
          throw signInError;
        }

        toast.success(`Welcome back, ${mockName}!`, { id: "google-auth" });
        celebrate();
        setTimeout(() => navigate({ to: "/dashboard" }), 1000);
      } catch (err: any) {
        console.error("Google Auth Integration Error:", err);
        setBusy(false);
        toast.error("Google sign-in failed: " + err.message, { id: "google-auth" });
      }
    };

    window.addEventListener("message", messageHandler);

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        window.removeEventListener("message", messageHandler);
      }
    }, 1000);
  };

  return (
    <div className="mobile-shell gradient-hero flex flex-col px-6 pt-10 pb-10">
      <Logo size={56} />
      <h2 className="mt-6 text-2xl font-bold leading-tight">
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </h2>
      <p className="text-sm text-muted-foreground">ಸುರಕ್ಷಿತ ಲಾಗಿನ್</p>

      {/* Tab toggle */}
      <div className="mt-6 grid grid-cols-2 rounded-2xl bg-muted p-1">
        {(["signup", "signin"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`min-h-11 rounded-xl text-sm font-bold transition ${
              mode === m ? "bg-card shadow-card" : "text-muted-foreground"
            }`}
          >
            {m === "signup" ? "Sign up" : "Log in"}
          </button>
        ))}
      </div>

      {mode === "signup" && (
        <>
          {/* Role */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            {(["farmer", "buyer"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setChosenRole(r)}
                className={`min-h-14 rounded-2xl border-2 p-3 flex items-center gap-2 font-bold text-sm transition ${
                  chosenRole === r ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"
                }`}
              >
                {r === "farmer" ? <Sprout className="h-5 w-5" /> : <ShoppingBasket className="h-5 w-5" />}
                {r === "farmer" ? "Farmer" : "Buyer"}
              </button>
            ))}
          </div>

          <InputRow icon={UserIcon} label="Full name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              placeholder="Enter your name"
              className="flex-1 px-3 py-3.5 bg-transparent outline-none text-base"
            />
          </InputRow>

          <InputRow icon={Phone} label="Phone (+91)">
            <input
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit phone"
              className="flex-1 px-3 py-3.5 bg-transparent outline-none text-base"
            />
          </InputRow>
        </>
      )}

      <InputRow icon={Mail} label="Email">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
          placeholder="you@example.com"
          className="flex-1 px-3 py-3.5 bg-transparent outline-none text-base"
        />
      </InputRow>

      <InputRow icon={Lock} label="Password">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          className="flex-1 px-3 py-3.5 bg-transparent outline-none text-base"
        />
      </InputRow>

      <button
        onClick={mode === "signup" ? handleSignup : handleSignin}
        disabled={busy || (mode === "signup" ? !validSignup : !validSignin)}
        className="mt-6 w-full min-h-14 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-elev active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
        {mode === "signup" ? "Create account" : "Log in"}
      </button>

      <div className="my-4 flex items-center gap-3 text-[11px] text-muted-foreground">
        <div className="flex-1 h-px bg-border" /> OR <div className="flex-1 h-px bg-border" />
      </div>

      <button
        onClick={handleGoogle}
        disabled={busy}
        className="w-full min-h-12 rounded-2xl bg-card border border-border font-semibold text-sm active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
      >
        <GoogleIcon /> Continue with Google
      </button>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        By continuing you agree to our terms. <Link to="/onboarding" className="text-primary font-semibold">Back</Link>
      </p>
    </div>
  );
}

function InputRow({
  icon: Icon, label, children,
}: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <label className="mt-4 block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="mt-1.5 flex items-stretch rounded-2xl bg-card border border-border focus-within:ring-2 focus-within:ring-primary overflow-hidden">
        <span className="px-3 grid place-items-center bg-muted"><Icon className="h-4 w-4" /></span>
        {children}
      </div>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16 4 9.1 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.1 39.6 16 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.4l6.2 5.2c-.4.4 6.6-4.8 6.6-14.6 0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
