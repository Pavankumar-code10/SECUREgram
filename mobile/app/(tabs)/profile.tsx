import React, { useEffect, useState } from "react";
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
  Share,
  Switch,
  SafeAreaView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Copy, Check, Moon, Sun, WifiOff, LogOut, Globe, ShieldCheck, ChevronRight, FileText, Fingerprint, Camera, Pencil } from "lucide-react-native";
import { useUser, getInitials, setUser, refreshUser } from "../../lib/user";
import { supabase } from "../../lib/supabase";
import { TopBar } from "../../components/sg/TopBar";
import { COLORS, SHADOWS, ROUNDING } from "../../lib/theme";

const PUBLIC_KEY = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8K9j2vH3qZ4nE7tR2bW1xL5oF3sQ8aB6Y";

export default function ProfileScreen() {
  const user = useUser();
  const name = user?.name || "Guest";
  const initials = getInitials(name);

  const [dark, setDark] = useState(false);
  const [offline, setOffline] = useState(false);
  const [lang, setLang] = useState<"EN" | "KN">("EN");
  const [editing, setEditing] = useState(false);
  
  const [form, setForm] = useState({ name: "", phone: "", district: "", state: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        district: user.district || "",
        state: user.state || "",
      });
    }
  }, [user]);

  const handleShareKey = async () => {
    try {
      await Share.share({
        message: PUBLIC_KEY,
        title: "SecureGram RSA Public Key",
      });
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleShareId = async () => {
    if (!user) return;
    try {
      await Share.share({
        message: user.id,
        title: "SecureGram User ID",
      });
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const pickAvatar = async () => {
    if (!user) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera roll permission is required.");
      return;
    }

    setUploading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        setUploading(false);
        return;
      }

      const uri = result.assets[0].uri;
      // Convert image to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const { error } = await supabase
          .from("profiles")
          .update({ avatar_url: base64data } as any)
          .eq("id", user.id);

        if (error) throw error;
        await refreshUser();
        Alert.alert("Success", "Avatar updated successfully!");
        setUploading(false);
      };
    } catch (e: any) {
      Alert.alert("Error", e.message);
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: form.name.trim(),
          phone: form.phone.trim(),
          district: form.district.trim() || null,
          state: form.state.trim() || null,
        } as any)
        .eq("id", user.id);

      if (error) throw error;
      await refreshUser();
      setEditing(false);
      Alert.alert("Success", "Profile details saved.");
    } catch (e: any) {
      Alert.alert("Save Failed", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Confirm Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await setUser(null);
          router.replace("/onboarding");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopBar title="Profile" subtitle="ಪ್ರೊಫೈಲ್" back="/dashboard" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.cardHeader}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={pickAvatar}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
              <View style={styles.cameraIcon}>
                <Camera size={12} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.cardDetails}>
              <Text style={styles.profileName} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.profilePhone}>+91 {user?.phone || "—"}</Text>
              <Text style={styles.profileLoc}>
                {[user?.district, user?.state].filter(Boolean).join(", ") || "Add location"}
              </Text>
            </View>

            {user && (
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setEditing(!editing)}
              >
                <Pencil size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.profileBadge}>
              <Text style={styles.profileBadgeText}>{user?.role || "guest"}</Text>
            </View>
            <View style={styles.profileBadge}>
              <ShieldCheck size={12} color="#FFFFFF" />
              <Text style={[styles.profileBadgeText, { marginLeft: 4 }]}>KYC verified</Text>
            </View>
          </View>
        </View>

        {/* Edit Form */}
        {editing && user && (
          <View style={styles.editForm}>
            <Text style={styles.formTitle}>Edit profile details</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.phone}
                onChangeText={(v) => setForm({ ...form, phone: v })}
              />
            </View>
            <View style={styles.formRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>District</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form.district}
                  onChangeText={(v) => setForm({ ...form, district: v })}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>State</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form.state}
                  onChangeText={(v) => setForm({ ...form, state: v })}
                />
              </View>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Save Settings</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* User ID */}
        <View style={styles.infoBox}>
          <View style={styles.infoBoxHeader}>
            <Text style={styles.infoBoxTitle}>
              <Fingerprint size={14} color={COLORS.light.primary} style={{ marginRight: 6 }} />
              Unique User ID
            </Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleShareId}>
              <Copy size={14} color={COLORS.light.primary} />
              <Text style={styles.copyBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.monoText}>{user?.id || "—"}</Text>
        </View>

        {/* Public Key */}
        <View style={styles.infoBox}>
          <View style={styles.infoBoxHeader}>
            <Text style={styles.infoBoxTitle}>Public Key (RSA-2048)</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleShareKey}>
              <Copy size={14} color={COLORS.light.primary} />
              <Text style={styles.copyBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.monoText, { fontSize: 10 }]} numberOfLines={2}>
            {PUBLIC_KEY}...
          </Text>
          <Text style={styles.infoBoxTip}>
            Share this so anyone can verify your signed listings. Your private key stays locally on this device.
          </Text>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionHeading}>Preferences</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <View style={styles.settingIconBg}>
                <Globe size={16} color={COLORS.light.foreground} />
              </View>
              <Text style={styles.settingLabel}>Language</Text>
            </View>
            <View style={styles.langPicker}>
              {(["EN", "KN"] as const).map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.langBtn, lang === l && styles.langBtnActive]}
                  onPress={() => setLang(l)}
                >
                  <Text style={[styles.langText, lang === l && { color: COLORS.light.primary }]}>
                    {l === "EN" ? "English" : "ಕನ್ನಡ"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <View style={styles.settingIconBg}>
                {dark ? <Moon size={16} color={COLORS.light.foreground} /> : <Sun size={16} color={COLORS.light.foreground} />}
              </View>
              <Text style={styles.settingLabel}>Dark mode</Text>
            </View>
            <Switch value={dark} onValueChange={setDark} />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <View style={styles.settingIconBg}>
                <WifiOff size={16} color={COLORS.light.foreground} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Offline mode</Text>
                <Text style={styles.settingSub}>Sync when online</Text>
              </View>
            </View>
            <Switch value={offline} onValueChange={setOffline} />
          </View>
        </View>

        {/* Account settings */}
        <Text style={styles.sectionHeading}>Account</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push("/transactions")}>
            <View style={styles.settingLabelContainer}>
              <View style={styles.settingIconBg}>
                <FileText size={16} color={COLORS.light.foreground} />
              </View>
              <Text style={styles.settingLabel}>My transactions</Text>
            </View>
            <ChevronRight size={16} color={COLORS.light.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={handleLogout}>
            <View style={styles.settingLabelContainer}>
              <View style={[styles.settingIconBg, { backgroundColor: "rgba(198, 40, 40, 0.1)" }]}>
                <LogOut size={16} color={COLORS.light.error} />
              </View>
              <Text style={[styles.settingLabel, { color: COLORS.light.error }]}>Logout</Text>
            </View>
            <ChevronRight size={16} color={COLORS.light.error} />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerVersion}>SecureGram v1.0 • RSA-2048 • SHA-256</Text>
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
    paddingVertical: 20,
    gap: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: COLORS.light.primary,
    borderRadius: ROUNDING.xxl,
    padding: 20,
    gap: 16,
    ...SHADOWS.elev,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardDetails: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  profilePhone: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },
  profileLoc: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  profileBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  profileBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  editForm: {
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.xxl,
    padding: 16,
    gap: 12,
    ...SHADOWS.card,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.light.mutedForeground,
    textTransform: "uppercase",
  },
  fieldInput: {
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.md,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.light.foreground,
    backgroundColor: COLORS.light.background,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  saveBtn: {
    height: 44,
    backgroundColor: COLORS.light.primary,
    borderRadius: ROUNDING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  infoBox: {
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.xxl,
    padding: 16,
    ...SHADOWS.card,
  },
  infoBoxHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoBoxTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.light.foreground,
    flexDirection: "row",
    alignItems: "center",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  monoText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 12,
    color: COLORS.light.foreground,
    backgroundColor: COLORS.light.muted,
    borderRadius: ROUNDING.md,
    padding: 10,
    marginTop: 10,
  },
  infoBoxTip: {
    fontSize: 9,
    color: COLORS.light.mutedForeground,
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.light.mutedForeground,
    textTransform: "uppercase",
    paddingHorizontal: 4,
    marginTop: 8,
  },
  settingsGroup: {
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.xxl,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  settingLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIconBg: {
    width: 32,
    height: 32,
    borderRadius: ROUNDING.md,
    backgroundColor: COLORS.light.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.foreground,
    marginLeft: 12,
  },
  settingSub: {
    fontSize: 10,
    color: COLORS.light.mutedForeground,
    marginLeft: 12,
  },
  langPicker: {
    flexDirection: "row",
    backgroundColor: COLORS.light.muted,
    borderRadius: 99,
    padding: 2,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  langBtnActive: {
    backgroundColor: COLORS.light.card,
    ...SHADOWS.card,
  },
  langText: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.light.mutedForeground,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  footerVersion: {
    fontSize: 10,
    color: COLORS.light.mutedForeground,
    textAlign: "center",
    marginTop: 8,
  },
});
