import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/sg/user";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export type NotificationType = "chat_message" | "buy_request" | "transaction_update" | "bid_alert";

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  navigateToNotification: (notification: Notification) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = async (userId: string) => {
    setLoading(true);
    const localNotifKey = `sg_notifications_${userId}`;
    const local = JSON.parse(localStorage.getItem(localNotifKey) || "[]") as Notification[];
    
    try {
      const { data, error } = await supabase
        .from("notifications" as any)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
 
      if (error) {
        if (error.message.includes("does not exist")) {
          console.warn("Notifications table does not exist in schema yet. Run migration.");
          setNotifications(local);
          return;
        }
        throw error;
      }
      
      const remote = (data as any) || [];
      const merged = [...local];
      remote.forEach((rt: Notification) => {
        if (!merged.some((lt) => lt.id === rt.id)) {
          merged.push(rt);
        }
      });
      
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(merged);
    } catch (err: any) {
      console.error("Error loading notifications:", err.message);
      setNotifications(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    fetchNotifications(user.id);

    // Subscribe to real-time notifications
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newNotif = payload.new as Notification;
            setNotifications((prev) => [newNotif, ...prev]);

            // Show real-time Toast using Sonner
            toast.info(newNotif.title, {
              description: newNotif.message,
              duration: 5000,
              action: newNotif.link
                ? {
                    label: "View",
                    onClick: () => navigateToNotification(newNotif),
                  }
                : undefined,
            });
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Notification;
            setNotifications((prev) =>
              prev.map((n) => (n.id === updated.id ? updated : n))
            );
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };
            setNotifications((prev) =>
              prev.filter((n) => n.id !== deleted.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markAsRead = async (id: string) => {
    // 1. Update local state
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );

    // 2. Update local storage
    if (user) {
      const localNotifKey = `sg_notifications_${user.id}`;
      const local = JSON.parse(localStorage.getItem(localNotifKey) || "[]");
      const updated = local.map((n: any) => n.id === id ? { ...n, is_read: true } : n);
      localStorage.setItem(localNotifKey, JSON.stringify(updated));
    }

    // 3. Update database
    try {
      await supabase
        .from("notifications" as any)
        .update({ is_read: true } as any)
        .eq("id", id);
    } catch (err: any) {
      console.warn("Failed to mark notification as read in database:", err.message);
    }
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    
    // 1. Update local state
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    // 2. Update local storage
    const localNotifKey = `sg_notifications_${user.id}`;
    const local = JSON.parse(localStorage.getItem(localNotifKey) || "[]");
    const updated = local.map((n: any) => ({ ...n, is_read: true }));
    localStorage.setItem(localNotifKey, JSON.stringify(updated));

    // 3. Update database
    try {
      await supabase
        .from("notifications" as any)
        .update({ is_read: true } as any)
        .eq("user_id", user.id)
        .eq("is_read", false);
      toast.success("All notifications marked as read");
    } catch (err: any) {
      console.warn("Failed to mark all as read in database:", err.message);
    }
  };

  const deleteNotification = async (id: string) => {
    // 1. Update local state
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    // 2. Update local storage
    if (user) {
      const localNotifKey = `sg_notifications_${user.id}`;
      const local = JSON.parse(localStorage.getItem(localNotifKey) || "[]");
      const updated = local.filter((n: any) => n.id !== id);
      localStorage.setItem(localNotifKey, JSON.stringify(updated));
    }

    // 3. Update database
    try {
      await supabase
        .from("notifications" as any)
        .delete()
        .eq("id", id);
    } catch (err: any) {
      console.warn("Failed to delete notification in database:", err.message);
    }
  };

  const navigateToNotification = (notification: Notification) => {
    // Mark as read immediately
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    // Close notifications panel
    setIsOpen(false);

    if (!notification.link) return;

    // Parse route and search params
    if (notification.link.startsWith("/chat?to=")) {
      const to = notification.link.split("/chat?to=")[1];
      navigate({ to: "/chat", search: { to } });
    } else {
      navigate({ to: notification.link as any });
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        isOpen,
        setIsOpen,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        navigateToNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
