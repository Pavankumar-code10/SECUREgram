import { ReactNode } from "react";

export function MobileShell({ children, noPad = false }: { children: ReactNode; noPad?: boolean }) {
  return (
    <div className="mobile-shell">
      <div className={noPad ? "" : "pb-24"}>{children}</div>
    </div>
  );
}
