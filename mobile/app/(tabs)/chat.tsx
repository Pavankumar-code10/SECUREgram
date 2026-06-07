import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { MessageSquare } from "lucide-react-native";
import { useUser, getInitials } from "../../lib/user";
import { supabase } from "../../lib/supabase";
import { TopBar } from "../../components/sg/TopBar";
import { COLORS, SHADOWS, ROUNDING } from "../../lib/theme";

interface Contact {
  id: string;
  name: string;
  avatar_url: string | null;
  last: string;
  when: string;
}

export default function ChatInboxScreen() {
  const user = useUser();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInbox = async (meId: string) => {
    setLoading(true);
    try {
      // 1. Fetch messages involving the user
      const { data: msgs, error: msgsErr } = await supabase
        .from("chat_messages")
        .select("*")
        .or(`sender_id.eq.${meId},recipient_id.eq.${meId}`)
        .order("created_at", { ascending: false });

      if (msgsErr) throw msgsErr;

      const seen = new Map<string, { last: string; when: string }>();
      (msgs || []).forEach((m: any) => {
        const other = m.sender_id === meId ? m.recipient_id : m.sender_id;
        if (!seen.has(other)) {
          seen.set(other, { last: m.body, when: m.created_at });
        }
      });

      const ids = Array.from(seen.keys());

      // 2. Fetch profiles of these conversation partners
      let msgProfiles: any[] = [];
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,name,avatar_url")
          .in("id", ids);
        if (profs) msgProfiles = profs;
      }

      // 3. Fetch all other profiles to start new chats
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id,name,avatar_url")
        .neq("id", meId)
        .limit(20);

      const merged = new Map<string, Contact>();
      
      // Seed with all profiles (fallback state: no chat history yet)
      (allProfiles || []).forEach((p: any) => {
        merged.set(p.id, {
          id: p.id,
          name: p.name || "User",
          avatar_url: p.avatar_url || null,
          last: "Start a conversation",
          when: "",
        });
      });

      // Overlay matching profile data
      msgProfiles.forEach((p: any) => {
        merged.set(p.id, {
          id: p.id,
          name: p.name || "User",
          avatar_url: p.avatar_url || null,
          last: "Start a conversation",
          when: "",
        });
      });

      // Insert actual last message bodies
      ids.forEach((id) => {
        const m = merged.get(id) || {
          id,
          name: "User " + id.slice(0, 6),
          avatar_url: null,
          last: "",
          when: "",
        };
        const s = seen.get(id)!;
        merged.set(id, { ...m, last: s.last, when: s.when });
      });

      // Sort by recent messages
      const sortedList = Array.from(merged.values()).sort((a, b) =>
        (b.when || "").localeCompare(a.when || "")
      );
      setContacts(sortedList);
    } catch (err) {
      console.warn("Inbox fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadInbox(user.id);
    }
  }, [user]);

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <TopBar title="Chat" back={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Sign in to chat</Text>
          <Text style={styles.emptyDesc}>Authenticate to see your cryptographically signed chats.</Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push({ pathname: "/login", params: { role: "farmer" } })}
          >
            <Text style={styles.loginBtnText}>Go to login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopBar title="Chat" subtitle="🔒 End-to-end encrypted" back="/dashboard" />
      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.light.primary} style={{ marginTop: 40 }} />
        ) : contacts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageSquare size={44} color={COLORS.light.mutedForeground} />
            <Text style={styles.emptyTitle}>No one to chat with yet</Text>
            <Text style={styles.emptyDesc}>
              Other farmers and buyers will appear here once they register.
            </Text>
          </View>
        ) : (
          <View style={styles.contactList}>
            {contacts.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.contactCard}
                onPress={() =>
                  router.push({
                    pathname: "/chat-thread",
                    params: { partnerId: c.id, partnerName: c.name },
                  })
                }
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(c.name)}</Text>
                </View>
                <View style={styles.contactDetails}>
                  <View style={styles.contactHeader}>
                    <Text style={styles.contactName} numberOfLines={1}>
                      {c.name}
                    </Text>
                    {c.when ? (
                      <Text style={styles.timeText}>
                        {new Date(c.when).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {c.last}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  contactList: {
    gap: 8,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.xxl,
    padding: 12,
    ...SHADOWS.card,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  contactDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contactName: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.foreground,
    flex: 1,
  },
  timeText: {
    fontSize: 10,
    color: COLORS.light.mutedForeground,
  },
  lastMessage: {
    fontSize: 12,
    color: COLORS.light.mutedForeground,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.light.foreground,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 12,
    color: COLORS.light.mutedForeground,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  loginBtn: {
    backgroundColor: COLORS.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: ROUNDING.md,
    marginTop: 20,
    ...SHADOWS.card,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
});
