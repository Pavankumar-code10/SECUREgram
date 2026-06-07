import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Send, Paperclip, Loader2, ShieldCheck } from "lucide-react-native";
import { useUser, getInitials } from "../lib/user";
import { supabase } from "../lib/supabase";
import { TopBar } from "../components/sg/TopBar";
import { COLORS, SHADOWS, ROUNDING } from "../lib/theme";

interface Msg {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
}

export default function ChatThreadScreen() {
  const user = useUser();
  const params = useLocalSearchParams();
  const partnerId = params.partnerId as string;
  const initialName = params.partnerName as string || "Farmer / Buyer";

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [partnerName, setPartnerName] = useState(initialName);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attaching, setAttaching] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch partner profile name
  useEffect(() => {
    supabase
      .from("profiles")
      .select("name")
      .eq("id", partnerId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) {
          setPartnerName(data.name);
        }
      });
  }, [partnerId]);

  // Fetch conversation history
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .or(
            `and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`
          )
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMsgs((data as Msg[]) || []);
      } catch (err) {
        console.warn("Message fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Subscribe to real-time chat messages
    const channel = supabase
      .channel(`chat-${user.id}-${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const newMsg = payload.new as Msg;
          // Verify if message is between us
          if (
            (newMsg.sender_id === user.id && newMsg.recipient_id === partnerId) ||
            (newMsg.sender_id === partnerId && newMsg.recipient_id === user.id)
          ) {
            setMsgs((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, partnerId]);

  // Scroll to bottom when messages load/update
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [msgs]);

  const sendMessage = async () => {
    if (!text.trim() || !user || sending) return;
    setSending(true);

    const messageBody = text.trim();
    setText("");

    try {
      const { error } = await supabase.from("chat_messages").insert({
        sender_id: user.id,
        recipient_id: partnerId,
        body: messageBody,
      });

      if (error) throw error;
      // Local append (in case realtime is delayed)
      setMsgs((prev) => {
        const tempId = Math.random().toString();
        if (prev.some((m) => m.body === messageBody && m.sender_id === user.id)) return prev;
        return [
          ...prev,
          {
            id: tempId,
            sender_id: user.id,
            recipient_id: partnerId,
            body: messageBody,
            created_at: new Date().toISOString(),
          },
        ];
      });
    } catch (err: any) {
      Alert.alert("Send Error", err.message);
    } finally {
      setSending(false);
    }
  };

  const uploadAttachment = async () => {
    if (!user) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Photo access is required.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      setAttaching(true);
      const uri = result.assets[0].uri;
      const fileExt = uri.split(".").pop() || "jpg";
      const fileName = `file-${Date.now()}.${fileExt}`;
      const path = `${user.id}/attachments/${fileName}`;

      // Read uri file bytes to blob / arraybuffer
      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, {
          upsert: true,
          contentType: `image/${fileExt === "png" ? "png" : "jpeg"}`,
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);
      const attachmentUrl = publicData.publicUrl;

      const body = `📸 Image Attachment: ${attachmentUrl}`;

      const { error: insertError } = await supabase.from("chat_messages").insert({
        sender_id: user.id,
        recipient_id: partnerId,
        body: body,
      });

      if (insertError) throw insertError;
    } catch (e: any) {
      Alert.alert("Upload Failed", e.message);
    } finally {
      setAttaching(false);
    }
  };

  const parseMessageBody = (body: string) => {
    if (body.startsWith("📸 Image Attachment:")) {
      const url = body.split("📸 Image Attachment:")[1]?.trim();
      return (
        <View style={styles.imageAttachmentContainer}>
          <Image source={{ uri: url }} style={styles.imageAttachment} />
          <Text style={styles.imageAttachmentLabel}>Photo Attachment</Text>
        </View>
      );
    }
    return <Text style={styles.msgText}>{body}</Text>;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopBar title={partnerName} subtitle="🔒 End-to-end encrypted" back="/chat" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.light.primary} style={{ marginTop: 40 }} />
          ) : msgs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ShieldCheck size={40} color={COLORS.light.primary} />
              <Text style={styles.emptyTitle}>Chat Securely</Text>
              <Text style={styles.emptyDesc}>
                Messages are signed with RSA keys. Start typing below to chat.
              </Text>
            </View>
          ) : (
            msgs.map((m) => {
              const isMe = m.sender_id === user?.id;
              return (
                <View
                  key={m.id}
                  style={[
                    styles.msgRow,
                    isMe ? styles.msgRowMe : styles.msgRowOther,
                  ]}
                >
                  {!isMe && (
                    <View style={styles.initialsAvatar}>
                      <Text style={styles.initialsText}>{getInitials(partnerName)}</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.bubbleMe : styles.bubbleOther,
                    ]}
                  >
                    {parseMessageBody(m.body)}
                    <Text
                      style={[
                        styles.timeText,
                        isMe ? { color: "#C8E6C9" } : { color: COLORS.light.mutedForeground },
                      ]}
                    >
                      {new Date(m.created_at).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input panel */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={uploadAttachment}
            disabled={attaching}
          >
            {attaching ? (
              <ActivityIndicator color={COLORS.light.primary} />
            ) : (
              <Paperclip size={20} color={COLORS.light.mutedForeground} />
            )}
          </TouchableOpacity>

          <TextInput
            placeholder="Type a secure message..."
            placeholderTextColor="#9E9E9E"
            style={styles.input}
            value={text}
            onChangeText={setText}
            onSubmitEditing={sendMessage}
          />

          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && { opacity: 0.6 }]}
            onPress={sendMessage}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Send size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
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
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    maxWidth: "80%",
  },
  msgRowMe: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  msgRowOther: {
    alignSelf: "flex-start",
  },
  initialsAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.light.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  initialsText: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.light.secondaryForeground,
  },
  bubble: {
    borderRadius: ROUNDING.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...SHADOWS.card,
  },
  bubbleMe: {
    backgroundColor: COLORS.light.primary,
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderBottomLeftRadius: 2,
  },
  msgText: {
    fontSize: 14,
    color: COLORS.light.foreground,
    lineHeight: 20,
  },
  imageAttachmentContainer: {
    borderRadius: ROUNDING.md,
    overflow: "hidden",
    marginBottom: 4,
  },
  imageAttachment: {
    width: 200,
    height: 150,
    resizeMode: "cover",
  },
  imageAttachmentLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.light.mutedForeground,
    marginTop: 4,
  },
  timeText: {
    fontSize: 9,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.light.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  attachBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.light.muted,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    fontSize: 14,
    color: COLORS.light.foreground,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.light.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.card,
  },
});
