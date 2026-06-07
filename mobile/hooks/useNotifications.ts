import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/user";

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

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = async (userId: string) => {
    setLoading(true);
    const localNotifKey = `sg_notifications_${userId}`;
    let local: Notification[] = [];
    try {
      const localStr = await AsyncStorage.getItem(localNotifKey);
      local = localStr ? (JSON.parse(localStr) as Notification[]) : [];
    } catch (e) {
      console.warn("Error reading local notifications:", e);
    }

    try {
      const { data, error } = await supabase
        .from("notifications" as any)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        if (error.message.includes("does not exist")) {
          console.warn("Notifications table does not exist yet. Using local cache.");
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
      await AsyncStorage.setItem(localNotifKey, JSON.stringify(merged));
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
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newNotif = payload.new as Notification;
            setNotifications((prev) => {
              const updated = [newNotif, ...prev];
              const localNotifKey = `sg_notifications_${user.id}`;
              AsyncStorage.setItem(localNotifKey, JSON.stringify(updated)).catch((e) =>
                console.warn(e)
              );
              return updated;
            });

            // Show native alert in Expo app
            Alert.alert(newNotif.title, newNotif.message, [
              {
                text: "Dismiss",
                style: "cancel",
              },
              ...(newNotif.link
                ? [
                    {
                      text: "View",
                      onPress: () => navigateToNotification(newNotif),
                    },
                  ]
                : []),
            ]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Notification;
            setNotifications((prev) => {
              const next = prev.map((n) => (n.id === updated.id ? updated : n));
              const localNotifKey = `sg_notifications_${user.id}`;
              AsyncStorage.setItem(localNotifKey, JSON.stringify(next)).catch((e) =>
                console.warn(e)
              );
              return next;
            });
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };
            setNotifications((prev) => {
              const next = prev.filter((n) => n.id !== deleted.id);
              const localNotifKey = `sg_notifications_${user.id}`;
              AsyncStorage.setItem(localNotifKey, JSON.stringify(next)).catch((e) =>
                console.warn(e)
              );
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));

    if (user) {
      const localNotifKey = `sg_notifications_${user.id}`;
      try {
        const localStr = await AsyncStorage.getItem(localNotifKey);
        const local = localStr ? JSON.parse(localStr) : [];
        const updated = local.map((n: any) => (n.id === id ? { ...n, is_read: true } : n));
        await AsyncStorage.setItem(localNotifKey, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
    }

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

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    const localNotifKey = `sg_notifications_${user.id}`;
    try {
      const localStr = await AsyncStorage.getItem(localNotifKey);
      const local = localStr ? JSON.parse(localStr) : [];
      const updated = local.map((n: any) => ({ ...n, is_read: true }));
      await AsyncStorage.setItem(localNotifKey, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }

    try {
      await supabase
        .from("notifications" as any)
        .update({ is_read: true } as any)
        .eq("user_id", user.id)
        .eq("is_read", false);
    } catch (err: any) {
      console.warn("Failed to mark all as read in database:", err.message);
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    if (user) {
      const localNotifKey = `sg_notifications_${user.id}`;
      try {
        const localStr = await AsyncStorage.getItem(localNotifKey);
        const local = localStr ? JSON.parse(localStr) : [];
        const updated = local.filter((n: any) => n.id !== id);
        await AsyncStorage.setItem(localNotifKey, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
    }

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
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);

    if (!notification.link) return;

    if (notification.link.startsWith("/chat?to=")) {
      const to = notification.link.split("/chat?to=")[1];
      router.push({ pathname: "/chat-thread", params: { partnerId: to } });
    } else if (notification.link.startsWith("/chat")) {
      router.push("/chat");
    } else if (notification.link.startsWith("/transactions")) {
      router.push("/transactions");
    } else if (notification.link.startsWith("/dashboard")) {
      router.push("/dashboard");
    } else if (notification.link.startsWith("/marketplace")) {
      router.push("/marketplace");
    } else {
      // General path routing
      const cleanPath = notification.link.replace(/^\//, "");
      router.push(`/${cleanPath}` as any);
    }
  };

  return React.createElement(
    NotificationContext.Provider,
    {
      value: {
        notifications,
        unreadCount,
        loading,
        isOpen,
        setIsOpen,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        navigateToNotification,
      },
    },
    children
  );
};

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
