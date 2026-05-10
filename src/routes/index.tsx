import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/sg/Logo";

export const Route = createFileRoute("/")({
  component: Splash,
  head: () => ({ meta: [{ title: "SecureGram — Secure Agri-Market" }] }),
});

function Splash() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setProgress((p) => Math.min(100, p + 4)), 60);
    const t = setTimeout(() => navigate({ to: "/onboarding" }), 2200);
    return () => { clearInterval(id); clearTimeout(t); };
  }, [navigate]);

  return (
    <div className="mobile-shell gradient-hero flex flex-col items-center justify-center px-8 text-center">
      <div className="animate-scale-in">
        <Logo size={104} />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight animate-fade-in">SecureGram</h1>
      <p className="mt-2 text-sm font-medium text-muted-foreground animate-fade-in">
        Secure • Direct • Fair Agri-Market
      </p>
      <p className="mt-1 text-xs text-muted-foreground/80">ಸುರಕ್ಷಿತ ಕೃಷಿ ಮಾರುಕಟ್ಟೆ</p>

      <div className="mt-12 w-44 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full gradient-primary transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <Link to="/onboarding" className="mt-8 text-xs font-medium text-primary underline-offset-4 hover:underline">
        Skip
      </Link>
    </div>
  );
}
