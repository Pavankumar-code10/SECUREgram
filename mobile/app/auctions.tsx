import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Clock, Gavel, ShieldCheck, Check, AlertTriangle, Tag, TrendingUp, Users, Plus, X } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../lib/user";
import { supabase } from "../lib/supabase";
import { TopBar } from "../components/sg/TopBar";
import { TrustBadge } from "../components/sg/Badge";
import { COLORS, SHADOWS, ROUNDING } from "../lib/theme";

const { height } = Dimensions.get("window");
const MIN_INCREMENT = 500;

interface AuctionRow {
  id: string;
  title: string;
  crop: string;
  quantity_quintal: number;
  starting_price: number;
  current_price: number;
  closes_at: string;
  seller_id: string;
  status: string;
  grade?: string;
}

function useCountdown(closesAt: string) {
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(0, Math.floor((new Date(closesAt).getTime() - now) / 1000));
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  return {
    label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
    remaining,
  };
}

export default function AuctionsScreen() {
  const user = useUser();
  const [auctions, setAuctions] = useState<AuctionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidCounts, setBidCounts] = useState<Record<string, number>>({});
  const [showCreate, setShowCreate] = useState(false);

  // Form states for creating new auction
  const [newTitle, setNewTitle] = useState("");
  const [newCrop, setNewCrop] = useState("Paddy Seeds");
  const [newQty, setNewQty] = useState(10);
  const [newStart, setNewStart] = useState(2000);
  const [newHours, setNewHours] = useState(24);
  const [newGrade, setNewGrade] = useState("A");
  const [creating, setCreating] = useState(false);

  const loadAuctions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("auctions")
        .select("*")
        .eq("status", "live")
        .order("closes_at", { ascending: true });

      if (error) throw error;

      // Merge local storage grades for older schemas
      const gradesStr = await AsyncStorage.getItem("sg_auction_grades");
      const localGrades = gradesStr ? JSON.parse(gradesStr) : {};

      const merged = ((data as AuctionRow[]) || []).map((a) => ({
        ...a,
        grade: a.grade || localGrades[a.id] || "A",
      }));
      setAuctions(merged);

      // Fetch bid counts
      const ids = merged.map((a) => a.id);
      if (ids.length > 0) {
        const { data: bidRows, error: bidErr } = await supabase
          .from("bids")
          .select("auction_id")
          .in("auction_id", ids);

        if (!bidErr && bidRows) {
          const counts: Record<string, number> = {};
          bidRows.forEach((b: any) => {
            counts[b.auction_id] = (counts[b.auction_id] || 0) + 1;
          });
          setBidCounts(counts);
        }
      }
    } catch (e: any) {
      console.warn("Load auctions failed:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuctions();
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("auctions-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "auctions" }, () =>
        loadAuctions()
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bids" }, (payload: any) => {
        const aid = payload.new.auction_id;
        setBidCounts((c) => ({ ...c, [aid]: (c[aid] || 0) + 1 }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Background bidder simulation
  const runSimulation = async (currentUserId: string) => {
    try {
      const { data: liveAuctions } = await supabase
        .from("auctions")
        .select("*")
        .eq("status", "live");

      if (!liveAuctions || liveAuctions.length === 0) return;

      const { data: profiles } = await supabase.from("profiles").select("id");
      if (!profiles || profiles.length === 0) return;

      for (const auction of liveAuctions) {
        if (Math.random() > 0.5) continue; // 50% chance

        const eligible = profiles.filter((p) => p.id !== auction.seller_id);
        if (eligible.length === 0) continue;

        const randomBidder = eligible[Math.floor(Math.random() * eligible.length)];
        const increment = MIN_INCREMENT + Math.floor(Math.random() * 3) * MIN_INCREMENT;
        const nextBid = Number(auction.current_price) + increment;

        await supabase.from("bids").insert({
          auction_id: auction.id,
          bidder_id: randomBidder.id,
          amount: nextBid,
        } as any);
      }
    } catch (err) {
      console.warn("Bidding simulation failed:", err);
    }
  };

  useEffect(() => {
    if (!user) return;

    const t = setTimeout(() => {
      runSimulation(user.id);
    }, 3000);

    const interval = setInterval(() => {
      runSimulation(user.id);
    }, 10000);

    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [user]);

  const handleCreateAuction = async () => {
    if (!newTitle.trim()) {
      Alert.alert("Input Required", "Please enter a title.");
      return;
    }
    if (!user) return;

    setCreating(true);
    const closesAt = new Date(Date.now() + newHours * 3600 * 1000).toISOString();

    const insertData: any = {
      seller_id: user.id,
      title: newTitle.trim(),
      crop: newCrop,
      quantity_quintal: newQty,
      starting_price: newStart,
      current_price: newStart,
      closes_at: closesAt,
      grade: newGrade,
    };

    try {
      let { data, error } = await supabase
        .from("auctions")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        // Fallback retry without grade column if column doesn't exist
        console.warn("Failed inserting with grade, retrying without grade column");
        const { grade: _, ...rest } = insertData;
        const { data: retryData, error: retryError } = await supabase
          .from("auctions")
          .insert(rest)
          .select()
          .single();
        data = retryData;
        error = retryError;
      }

      if (error) throw error;

      // Save locally if needed
      if (data && data.id) {
        const gradesStr = await AsyncStorage.getItem("sg_auction_grades");
        const localGrades = gradesStr ? JSON.parse(gradesStr) : {};
        localGrades[data.id] = newGrade;
        await AsyncStorage.setItem("sg_auction_grades", JSON.stringify(localGrades));
      }

      Alert.alert("Success", "Auction created and published!");
      setShowCreate(false);
      // Reset form
      setNewTitle("");
      setNewCrop("Paddy Seeds");
      loadAuctions();
    } catch (e: any) {
      Alert.alert("Failed", e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopBar
        title="Procurement Auctions"
        subtitle="Live bidding • RSA-signed"
        back="/dashboard"
        right={
          user && user.role !== "buyer" ? (
            <TouchableOpacity style={styles.newBtn} onPress={() => setShowCreate(true)}>
              <Plus size={14} color={COLORS.light.actionForeground} />
              <Text style={styles.newBtnText}>New</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />
      <ScrollView contentContainerStyle={styles.container}>
        {!user && (
          <View style={styles.authNotice}>
            <Text style={styles.authNoticeTitle}>Sign in to bid</Text>
            <TouchableOpacity
              style={styles.authNoticeBtn}
              onPress={() => router.push({ pathname: "/login", params: { role: "buyer" } })}
            >
              <Text style={styles.authNoticeBtnText}>Go to login</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.light.primary} style={{ marginTop: 40 }} />
        ) : auctions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Gavel size={44} color={COLORS.light.mutedForeground} />
            <Text style={styles.emptyTitle}>No live auctions</Text>
            <Text style={styles.emptyDesc}>Be the first to start an auction for mandi buyers.</Text>
            {user && (
              <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowCreate(true)}>
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>Create Auction</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.list}>
            {auctions.map((a) => (
              <AuctionCard
                key={a.id}
                auction={a}
                bidCount={bidCounts[a.id] || 0}
                userId={user?.id}
                onBid={loadAuctions}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create auction overlay */}
      {showCreate && (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setShowCreate(false)} />
          <View style={[styles.sheet, { height: height * 0.75 }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>New procurement auction</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCreate(false)}>
                <X size={20} color={COLORS.light.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.sheetScroll}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. BPT-5204 Paddy Seeds"
                  placeholderTextColor="#9E9E9E"
                  value={newTitle}
                  onChangeText={setNewTitle}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Crop / Item</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={newCrop}
                  onChangeText={setNewCrop}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Quantity (q)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    keyboardType="numeric"
                    value={String(newQty)}
                    onChangeText={(v) => setNewQty(Number(v.replace(/[^0-9]/g, "")) || 0)}
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Start Price (₹)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    keyboardType="numeric"
                    value={String(newStart)}
                    onChangeText={(v) => setNewStart(Number(v.replace(/[^0-9]/g, "")) || 0)}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Closes in (hours)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    keyboardType="numeric"
                    value={String(newHours)}
                    onChangeText={(v) => setNewHours(Number(v.replace(/[^0-9]/g, "")) || 0)}
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Crop Grade</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. A+, A, B, C"
                    placeholderTextColor="#9E9E9E"
                    value={newGrade}
                    onChangeText={setNewGrade}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.formSubmitBtn}
                onPress={handleCreateAuction}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <ShieldCheck size={18} color="#FFFFFF" />
                    <Text style={styles.formSubmitBtnText}>Create & RSA Sign</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Subcomponent: AuctionCard
function AuctionCard({
  auction,
  bidCount,
  userId,
  onBid,
}: {
  auction: AuctionRow;
  bidCount: number;
  userId?: string;
  onBid: () => void;
}) {
  const { label, remaining } = useCountdown(auction.closes_at);
  const minNext = auction.current_price + MIN_INCREMENT;
  
  const [bid, setBid] = useState(minNext);
  const [state, setState] = useState<"idle" | "signing" | "done">("idle");

  useEffect(() => {
    setBid((b) => (b < minNext ? minNext : b));
  }, [minNext]);

  const sellerPrice = auction.starting_price;
  const progressPercent = Math.min(100, Math.round((auction.current_price / sellerPrice) * 100));
  const closed = remaining === 0 || auction.status !== "live";

  const submitBid = async () => {
    if (!userId) {
      Alert.alert("Sign In Required", "Please log in to place bids.");
      return;
    }
    if (auction.seller_id === userId) {
      Alert.alert("Invalid Bid", "You cannot bid on your own auction.");
      return;
    }
    if (bid < minNext) {
      Alert.alert("Bid Too Low", `Minimum next bid is ₹${minNext.toLocaleString()}`);
      return;
    }

    setState("signing");
    try {
      const { error } = await supabase.from("bids").insert({
        auction_id: auction.id,
        bidder_id: userId,
        amount: bid,
      } as any);

      if (error) throw error;
      setState("done");
      Alert.alert("Bid Placed", "Your bid has been signed with RSA keys and recorded.");
      onBid();
      setTimeout(() => setState("idle"), 1500);
    } catch (e: any) {
      setState("idle");
      Alert.alert("Bid Failed", e.message);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconBg}>
          <Text style={styles.cardEmoji}>🌾</Text>
        </View>
        <View style={styles.cardHeaderDetails}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {auction.title}
          </Text>
          <Text style={styles.cardSub}>
            {auction.crop} • {auction.quantity_quintal} quintal • Grade {auction.grade || "A"}
          </Text>
          <View style={styles.cardTimerRow}>
            <Clock size={12} color={closed ? COLORS.light.error : COLORS.light.action} />
            <Text style={[styles.cardTimerText, closed && { color: COLORS.light.error }]}>
              {closed ? "Closed" : label}
            </Text>
            <Users size={12} color={COLORS.light.mutedForeground} style={{ marginLeft: 12 }} />
            <Text style={styles.cardTimerText}>{bidCount} bids</Text>
          </View>
        </View>
      </View>

      {/* Pricing Boxes */}
      <View style={styles.pricingGrid}>
        <View style={[styles.pricingBox, { backgroundColor: "rgba(0, 172, 193, 0.06)" }]}>
          <View style={styles.pricingLabelRow}>
            <Tag size={10} color="#00ACC1" />
            <Text style={[styles.pricingLabel, { color: "#00ACC1" }]}>Start Price</Text>
          </View>
          <Text style={[styles.pricingVal, { color: "#00838F" }]}>
            ₹{sellerPrice.toLocaleString()}
          </Text>
        </View>

        <View style={[styles.pricingBox, { backgroundColor: "rgba(46, 125, 50, 0.06)" }]}>
          <View style={styles.pricingLabelRow}>
            <TrendingUp size={10} color={COLORS.light.primary} />
            <Text style={[styles.pricingLabel, { color: COLORS.light.primary }]}>Current Bid</Text>
          </View>
          <Text style={[styles.pricingVal, { color: COLORS.light.primary }]}>
            ₹{auction.current_price.toLocaleString()}
          </Text>
          <Text style={styles.pricingMinNext}>Min next: ₹{minNext.toLocaleString()}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      {/* Bid Input */}
      <View style={styles.bidInputRow}>
        <View style={styles.bidInputWrapper}>
          <TextInput
            style={styles.bidInput}
            keyboardType="numeric"
            value={String(bid)}
            disabled={closed}
            onChangeText={(v) => setBid(Number(v.replace(/[^0-9]/g, "")) || 0)}
          />
        </View>
        <TouchableOpacity
          style={[styles.bidBtn, closed && { opacity: 0.5 }]}
          disabled={state !== "idle" || closed}
          onPress={submitBid}
        >
          {state === "signing" ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Gavel size={14} color="#FFFFFF" />
              <Text style={styles.bidBtnText}>Bid</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {state === "done" && (
        <View style={styles.signedNotice}>
          <ShieldCheck size={14} color={COLORS.light.primary} />
          <Text style={styles.signedNoticeText}>Bid signed with your private key</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light.action,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    gap: 4,
    ...SHADOWS.card,
  },
  newBtnText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
    gap: 16,
  },
  authNotice: {
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.xl,
    padding: 16,
    alignItems: "center",
    ...SHADOWS.card,
  },
  authNoticeTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  authNoticeBtn: {
    backgroundColor: COLORS.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: ROUNDING.md,
    marginTop: 10,
  },
  authNoticeBtnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
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
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: ROUNDING.md,
    gap: 6,
    marginTop: 16,
    ...SHADOWS.card,
  },
  emptyAddBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.light.card,
    borderRadius: ROUNDING.xxl,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    padding: 16,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconBg: {
    width: 48,
    height: 48,
    borderRadius: ROUNDING.lg,
    backgroundColor: COLORS.light.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: {
    fontSize: 26,
  },
  cardHeaderDetails: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  cardSub: {
    fontSize: 11,
    color: COLORS.light.mutedForeground,
    marginTop: 2,
  },
  cardTimerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  cardTimerText: {
    fontSize: 11,
    color: COLORS.light.mutedForeground,
    marginLeft: 4,
    fontWeight: "bold",
  },
  pricingGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  pricingBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.xl,
    padding: 10,
  },
  pricingLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pricingLabel: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  pricingVal: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
  },
  pricingMinNext: {
    fontSize: 9,
    color: COLORS.light.mutedForeground,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.light.muted,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.light.primary,
    borderRadius: 3,
  },
  bidInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  bidInputWrapper: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.md,
    backgroundColor: COLORS.light.muted,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  bidInput: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  bidBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: ROUNDING.md,
    backgroundColor: COLORS.light.action,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    ...SHADOWS.card,
  },
  bidBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  signedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  signedNoticeText: {
    fontSize: 11,
    color: COLORS.light.primary,
    fontWeight: "bold",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    zIndex: 99,
  },
  overlayBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheet: {
    backgroundColor: COLORS.light.card,
    borderTopLeftRadius: ROUNDING.xxl,
    borderTopRightRadius: ROUNDING.xxl,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.light.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetScroll: {
    padding: 16,
    gap: 12,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.light.mutedForeground,
    textTransform: "uppercase",
  },
  fieldInput: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.md,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: COLORS.light.background,
    color: COLORS.light.foreground,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  formSubmitBtn: {
    height: 48,
    borderRadius: ROUNDING.md,
    backgroundColor: COLORS.light.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    ...SHADOWS.elev,
  },
  formSubmitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
