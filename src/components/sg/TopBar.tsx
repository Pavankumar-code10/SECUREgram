import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { ReactNode } from "react";

export function TopBar({
  title,
  back = "/dashboard",
  right,
  subtitle,
}: {
  title: string;
  back?: string | false;
  right?: ReactNode;
  subtitle?: string;
}) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-border">
      <div className="flex items-center gap-2 px-3 h-14">
        {back !== false && (
          <Link
            to={back as string}
            className="h-10 w-10 grid place-items-center rounded-full hover:bg-muted active:bg-accent"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
