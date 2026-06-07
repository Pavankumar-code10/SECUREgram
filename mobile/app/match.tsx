import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { Star, MapPin, TrendingUp, ShieldCheck } from "lucide-react-native";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "../lib/user";
import { supabase } from "../lib/supabase";
import { TopBar } from "../components/sg/TopBar";
import { TrustBadge } from "../components/sg/Badge";
import { COLORS, SHADOWS, ROUNDING } from "../lib/theme";

export default function MatchScreen() {
  const user = useUser();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [latestListing, setLatestListing] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.role === "buyer") {
      Alert.alert("Denied", "Smart Matches are only available for Farmers/Sellers.");
      router.replace("/(tabs)/dashboard");
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("listings")
      .select("*")
      .eq("seller_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLatestListing(data[0]);
        }
        setLoading(false);
      });
  }, [user]);

  const handleConnect = async (matchName: string) => {
    if (!user) {
      Alert.alert("Sign In Needed", "Please log in to connect with buyers.");
      router.push({ pathname: "/login", params: { role: "farmer" } });
      return;
    }

    setConnectingId(matchName);
    try {
      // 1. Check if profile already exists with this name
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("name", matchName)
        .limit(1);

      if (existing && existing.length > 0) {
        router.push({
          pathname: "/chat-thread",
          params: { partnerId: existing[0].id, partnerName: matchName },
        });
        return;
      }

      // 2. Otherwise create a mock buyer in the background
      const rand = Math.floor(1000 + Math.random() * 9000);
      const email = `${matchName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${rand}@securegram.com`;
      const password = "Password123!";

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

      const tempClient = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });

      const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: matchName,
            phone: "9" + Math.floor(100000000 + Math.random() * 900000000),
            role: "buyer",
            district: "Mandya",
            state: "Karnataka",
          },
        },
      });

      if (signUpError) throw signUpError;

      const newUserId = signUpData.user?.id;
      if (!newUserId) throw new Error("Failed to resolve new user ID");

      // Small delay for PG trigger execution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert(
        "Connected!",
        `Mock buyer created.\nEmail: ${email}\nPassword: ${password}`,
        [
          {
            text: "Start Chat",
            onPress: () =>
              router.push({
                pathname: "/chat-thread",
                params: { partnerId: newUserId, partnerName: matchName },
              }),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Connection Failed", err.message);
    } finally {
      setConnectingId(null);
    }
  };

  const defaultQty = 12;
  const qty = latestListing ? latestListing.quantity_quintal : defaultQty;
  const basePrice = latestListing ? latestListing.price_per_quintal : 2300;

  const dynamicMatches = [
    { name: "Sri Krishna Traders", dist: 12, price: Math.round(basePrice * 1.02), rating: 4.8, verified: true, initial: "K" },
    { name: "Mandya Rice Mills", dist: 24, price: Math.round(basePrice * 1.0), rating: 4.6, verified: true, initial: "M" },
    { name: "Reliance Fresh — Bangalore", dist: 102, price: Math.round(basePrice * 1.04), rating: 4.9, verified: true, initial: "R" },
    { name: "Local Co-op Society", dist: 4, price: Math.round(basePrice * 0.96), rating: 4.4, verified: false, initial: "C" },
  ].map((m) => ({
    ...m,
    rev: Math.round(m.price * qty),
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopBar
        title="Smart Matches"
        subtitle={
          latestListing
            ? `Offers for your ${latestListing.crop} (${qty}q)`
            : "4 verified buyers nearby"
        }
        back="/dashboard"
      />
      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.light.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.list}>
            {dynamicMatches.map((m) => (
              <View key={m.name} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.initialsAvatar}>
                    <Text style={styles.initialsText}>{m.initial}</Text>
                  </View>
                  <View style={styles.cardHeaderDetails}>
                    <View style={styles.nameRow}>
                      <Text style={styles.buyerName} numberOfLines={1}>
                        {m.name}
                      </Text>
                      {m.verified && <ShieldCheck size={16} color={COLORS.light.primary} />}
                    </View>
                    <View style={styles.ratingLocRow}>
                      <MapPin size={11} color={COLORS.light.mutedForeground} />
                      <Text style={styles.ratingLocText}>{m.dist} km away</Text>
                      <Star size={11} color={COLORS.light.action} style={{ marginLeft: 8 }} />
                      <Text style={styles.ratingLocText}>{m.rating}</Text>
                    </View>
                  </View>
                </View>

                {/* Offer Metrics */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Offer</Text>
                    <Text style={styles.metricVal}>
                      ₹{m.price}
                      <Text style={styles.metricUnit}>/q</Text>
                    </Text>
                  </View>
                  <View style={[styles.metricBox, { backgroundColor: "rgba(46, 125, 50, 0.06)" }]}>
                    <Text style={[styles.metricLabel, { color: COLORS.light.primary }]}>
                      Predicted Revenue
                    </Text>
                    <Text style={[styles.metricVal, { color: COLORS.light.primary }]}>
                      ₹{m.rev.toLocaleString("en-IN")}
                    </Text>
                  </View>
                </View>

                {/* Badges and Call-to-actions */}
                <View style={styles.cardFooter}>
                  {m.verified ? <TrustBadge variant="rsa" /> : <View />}
                  <TouchableOpacity
                    style={styles.connectBtn}
                    onPress={() => handleConnect(m.name)}
                    disabled={connectingId !== null}
                  >
                    {connectingId === m.name ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <ShieldCheck size={14} color="#FFFFFF" />
                        <Text style={styles.connectBtnText}>Connect</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
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
    paddingVertical: 16,
    paddingBottom: 40,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.xxl,
    padding: 16,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  initialsAvatar: {
    width: 48,
    height: 48,
    borderRadius: ROUNDING.lg,
    backgroundColor: COLORS.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  cardHeaderDetails: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  buyerName: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.light.foreground,
    flex: 1,
  },
  ratingLocRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingLocText: {
    fontSize: 11,
    color: COLORS.light.mutedForeground,
    marginLeft: 2,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: COLORS.light.muted,
    borderRadius: ROUNDING.xl,
    padding: 10,
    gap: 2,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.light.mutedForeground,
    textTransform: "uppercase",
  },
  metricVal: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  metricUnit: {
    fontSize: 10,
    color: COLORS.light.mutedForeground,
    fontWeight: "normal",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  connectBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: ROUNDING.md,
    gap: 6,
    minWidth: 100,
    justifyContent: "center",
  },
  connectBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
});
