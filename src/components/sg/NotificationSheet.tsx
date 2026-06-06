import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useNotifications, Notification, NotificationType } from "@/hooks/useNotifications";
import {
  MessageCircle,
  ShoppingBag,
  RefreshCw,
  TrendingUp,
  Trash2,
  CheckCheck,
  Inbox,
  Bell,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "chat_message":
      return (
        <div className="h-9 w-9 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 grid place-items-center flex-shrink-0">
          <MessageCircle className="h-5 w-5" />
        </div>
      );
    case "buy_request":
      return (
        <div className="h-9 w-9 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 grid place-items-center flex-shrink-0">
          <ShoppingBag className="h-5 w-5" />
        </div>
      );
    case "transaction_update":
      return (
        <div className="h-9 w-9 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 grid place-items-center flex-shrink-0">
          <RefreshCw className="h-5 w-5" />
        </div>
      );
    case "bid_alert":
      return (
        <div className="h-9 w-9 rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 grid place-items-center flex-shrink-0">
          <TrendingUp className="h-5 w-5" />
        </div>
      );
    default:
      return (
        <div className="h-9 w-9 rounded-full bg-gray-500/10 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400 grid place-items-center flex-shrink-0">
          <Bell className="h-5 w-5" />
        </div>
      );
  }
};

const getRelativeTime = (dateString: string) => {
  const d = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export function NotificationSheet() {
  const {
    notifications,
    isOpen,
    setIsOpen,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    navigateToNotification,
    unreadCount,
  } = useNotifications();

  // Group notifications
  const todayNotifs: Notification[] = [];
  const yesterdayNotifs: Notification[] = [];
  const olderNotifs: Notification[] = [];

  const now = new Date();
  const todayStr = now.toDateString();
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  const yesterdayStr = yesterdayDate.toDateString();

  notifications.forEach((n) => {
    const notifDate = new Date(n.created_at).toDateString();
    if (notifDate === todayStr) {
      todayNotifs.push(n);
    } else if (notifDate === yesterdayStr) {
      yesterdayNotifs.push(n);
    } else {
      olderNotifs.push(n);
    }
  });

  const renderSection = (title: string, list: Notification[]) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          {title}
        </h3>
        <div className="space-y-2">
          {list.map((n) => (
            <div
              key={n.id}
              onClick={() => navigateToNotification(n)}
              className={cn(
                "group relative flex gap-3 p-3.5 rounded-xl border border-transparent transition-all duration-200 cursor-pointer overflow-hidden",
                n.is_read
                  ? "bg-card hover:bg-muted/30 border-muted/20"
                  : "bg-primary/5 hover:bg-primary/10 border-primary/10 shadow-sm"
              )}
            >
              {/* Unread indicator dot */}
              {!n.is_read && (
                <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}

              {getNotificationIcon(n.type)}

              <div className="flex-1 space-y-1 pr-6">
                <div className="flex items-start justify-between">
                  <h4 className={cn("text-sm leading-snug", !n.is_read ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
                    {n.title}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {n.message}
                </p>
                <span className="text-[10px] font-medium text-muted-foreground/60 block pt-0.5">
                  {getRelativeTime(n.created_at)}
                </span>
              </div>

              {/* Delete action */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(n.id);
                }}
                className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
                aria-label="Delete notification"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full bg-background border-l border-muted/30 shadow-2xl">
        <SheetHeader className="p-5 border-b border-muted/20 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-lg font-bold">Notifications</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread update${unreadCount > 1 ? "s" : ""}`
                  : "All caught up!"}
              </SheetDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-all"
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Mark all read</span>
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="h-16 w-16 rounded-full bg-muted/30 grid place-items-center text-muted-foreground/40 animate-bounce">
                <Inbox className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground/80">No Notifications Yet</h3>
                <p className="text-xs text-muted-foreground max-w-[240px] mt-1 mx-auto">
                  We'll notify you here when you receive new chat messages, buy requests, or auction bids.
                </p>
              </div>
            </div>
          ) : (
            <>
              {renderSection("Today", todayNotifs)}
              {renderSection("Yesterday", yesterdayNotifs)}
              {renderSection("Older", olderNotifs)}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
