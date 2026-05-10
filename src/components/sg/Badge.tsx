import { ShieldCheck, Lock, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "rsa" | "tamper" | "offline" | "verified";

export function TrustBadge({ variant = "rsa", className }: { variant?: Variant; className?: string }) {
  const map = {
    rsa: { icon: ShieldCheck, label: "RSA Signed", cls: "bg-primary/10 text-primary" },
    tamper: { icon: Lock, label: "Tamper-proof", cls: "bg-primary/10 text-primary" },
    verified: { icon: ShieldCheck, label: "Verified", cls: "bg-primary text-primary-foreground" },
    offline: { icon: WifiOff, label: "Offline", cls: "bg-muted text-muted-foreground" },
  } as const;
  const { icon: Icon, label, cls } = map[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        cls,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
