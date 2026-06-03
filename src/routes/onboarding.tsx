import { createFileRoute, Link } from "@tanstack/react-router";
import { Sprout, ShoppingBasket, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/sg/Logo";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

function Onboarding() {
  return (
    <div className="mobile-shell gradient-hero flex flex-col px-6 pt-10 pb-10">
      <div className="flex items-center gap-3">
        <Logo size={40} />
        <div>
          <p className="text-sm font-bold leading-tight">SecureGram</p>
          <p className="text-[11px] text-muted-foreground">RSA Signed • Tamper-proof</p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-3xl font-bold leading-tight">
          Choose your <span className="text-primary">role</span>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <Link
          to="/login"
          search={{ role: "farmer" }}
          className="block rounded-3xl bg-card shadow-card p-6 border border-border active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl gradient-primary grid place-items-center">
              <Sprout className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">I am a Farmer</h3>
              <p className="text-xs text-muted-foreground">ನಾನು ರೈತ • Sell your produce directly</p>
            </div>
          </div>
        </Link>

        <Link
          to="/login"
          search={{ role: "buyer" }}
          className="block rounded-3xl bg-card shadow-card p-6 border border-border active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl gradient-action grid place-items-center">
              <ShoppingBasket className="h-8 w-8 text-action-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">I am a Buyer</h3>
              <p className="text-xs text-muted-foreground">Source verified produce at fair prices</p>
            </div>
          </div>
        </Link>

      </div>

      <div className="mt-auto pt-10">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>End-to-end RSA encrypted</span>
        </div>
      </div>
    </div>
  );
}
