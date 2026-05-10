import { Link, useLocation } from "@tanstack/react-router";
import { Leaf, Plus, ShoppingCart, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items: { to: string; icon: typeof Leaf; label: string; badge?: number }[] = [
  { to: "/dashboard", icon: Leaf, label: "Home" },
  { to: "/sell", icon: Plus, label: "Sell" },
  { to: "/marketplace", icon: ShoppingCart, label: "Buy" },
  { to: "/chat", icon: MessageCircle, label: "Chat", badge: 2 },
  { to: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pointer-events-none">
      <div className="mobile-shell pointer-events-auto">
        <div className="glass border-t border-border px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <ul className="flex items-end justify-between">
            {items.map(({ to, icon: Icon, label, badge }) => {
              const active = pathname === to || (to === "/dashboard" && pathname === "/");
              return (
                <li key={to} className="flex-1">
                  <Link
                    to={to}
                    className={cn(
                      "relative flex flex-col items-center gap-1 py-2 rounded-2xl transition-colors",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-14 items-center justify-center rounded-2xl transition-all",
                        active && "bg-primary/12"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", active && "fill-primary/20")} strokeWidth={active ? 2.4 : 2} />
                      {badge ? (
                        <span className="absolute top-1 right-[calc(50%-22px)] h-4 min-w-4 rounded-full bg-action px-1 text-[10px] font-bold text-action-foreground grid place-items-center">
                          {badge}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[11px] font-medium">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
