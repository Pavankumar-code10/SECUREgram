import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { MapPin, Bell, TrendingUp, Sprout, ShoppingCart, Sparkles, Users, MessageCircle, Receipt } from "lucide-react-native";
import { useUser, getInitials } from "../../lib/user";
import { useNotifications } from "../../hooks/useNotifications";
import { TrustBadge } from "../../components/sg/Badge";
import { COLORS, SHADOWS, ROUNDING } from "../../lib/theme";

const cropData = {
  "7 days": [
    { name: "Rice", color: COLORS.light.primary, points: [58, 62, 59, 61, 60, 63, 64] },
    { name: "Tur", color: COLORS.light.action, points: [45, 43, 46, 44, 47, 48, 49] },
    { name: "Maize", color: COLORS.light.earth, points: [33, 35, 34, 32, 35, 33, 36] },
    { name: "Coconut", color: "#00ACC1", points: [59, 61, 60, 58, 61, 60, 62] },
  ],
  "30 days": [
    { name: "Rice", color: COLORS.light.primary, points: [40, 38, 42, 41, 45, 48, 52, 55, 58, 56, 60, 64] },
    { name: "Tur", color: COLORS.light.action, points: [30, 32, 31, 35, 33, 38, 40, 42, 44, 43, 46, 49] },
    { name: "Maize", color: COLORS.light.earth, points: [22, 24, 26, 25, 27, 28, 30, 32, 31, 34, 35, 36] },
    { name: "Coconut", color: "#00ACC1", points: [50, 51, 49, 52, 54, 53, 55, 57, 58, 60, 59, 62] },
  ],
  "90 days": [
    { name: "Rice", color: COLORS.light.primary, points: [30, 35, 33, 38, 42, 40, 45, 43, 48, 52, 50, 55, 53, 58, 56, 60, 62, 64] },
    { name: "Tur", color: COLORS.light.action, points: [25, 28, 26, 30, 32, 31, 35, 33, 38, 40, 39, 42, 41, 44, 43, 46, 48, 49] },
    { name: "Maize", color: COLORS.light.earth, points: [18, 20, 19, 22, 24, 23, 26, 25, 27, 28, 30, 31, 29, 32, 31, 34, 35, 36] },
    { name: "Coconut", color: "#00ACC1", points: [40, 42, 45, 43, 47, 46, 50, 49, 52, 54, 53, 55, 57, 58, 60, 59, 61, 62] },
  ],
};

export default function DashboardScreen() {
  const user = useUser();
  const { unreadCount, setIsOpen } = useNotifications();
  const [period, setPeriod] = useState<"7 days" | "30 days" | "90 days">("30 days");

  const name = user?.name || "Guest";
  const initials = getInitials(name);
  const crops = cropData[period];

  const handlePeriodChange = (val: "7 days" | "30 days" | "90 days") => {
    setPeriod(val);
  };

  const handleQuickAction = (path: string) => {
    if (path === "recommend") {
      router.push("/recommend");
    } else {
      router.push(path as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.greeting}>
                Hello, ನಮಸ್ಕಾರ ({user?.role === "buyer" ? "Buyer" : "Farmer"})
              </Text>
              <Text style={styles.userName}>{name}!</Text>
              <View style={styles.locationContainer}>
                <MapPin size={12} color={COLORS.light.mutedForeground} style={styles.locationIcon} />
                <Text style={styles.locationText}>
                  {[user?.district || "Mandya", user?.state || "Karnataka"]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => setIsOpen(true)}
          >
            <Bell size={22} color={COLORS.light.foreground} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Badges */}
        <View style={styles.badgeRow}>
          <TrustBadge variant="verified" />
          <TrustBadge variant="rsa" />
        </View>

        {/* Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartLabel}>Mandi price trends</Text>
              <Text style={styles.chartTitle}>
                ₹/quintal <TrendingUp size={16} color={COLORS.light.primary} />
              </Text>
            </View>

            {/* Pill Selectors */}
            <View style={styles.pillContainer}>
              {(["7 days", "30 days", "90 days"] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.pill, period === p && styles.pillActive]}
                  onPress={() => handlePeriodChange(p)}
                >
                  <Text style={[styles.pillText, period === p && styles.pillTextActive]}>
                    {p.split(" ")[0]}d
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bar Trend representation (High Fidelity representation) */}
          <View style={styles.chartBarsContainer}>
            <View style={styles.chartGridLines}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.gridLine} />
              ))}
            </View>
            <View style={styles.barsRow}>
              {crops.map((crop) => {
                const maxVal = 70;
                const latestPoint = crop.points[crop.points.length - 1];
                const heightPercent = `${Math.min(100, (latestPoint / maxVal) * 100)}%`;
                return (
                  <View key={crop.name} style={styles.barItem}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: heightPercent, backgroundColor: crop.color },
                        ]}
                      />
                    </View>
                    <Text style={styles.barName}>{crop.name}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.gridContainer}>
            {user?.role === "buyer" ? (
              <>
                <ActionCard
                  icon={ShoppingCart}
                  label="Explore Produce"
                  sub="ಖರೀದಿ ಮಾಡಿ"
                  color={COLORS.light.primary}
                  textColor="#FFFFFF"
                  onPress={() => handleQuickAction("/marketplace")}
                />
                <ActionCard
                  icon={Receipt}
                  label="My Orders"
                  sub="ಖರೀದಿ ಇತಿಹಾಸ"
                  color={COLORS.light.earth}
                  textColor="#FFFFFF"
                  onPress={() => handleQuickAction("/transactions")}
                />
                <ActionCard
                  icon={TrendingUp}
                  label="Live Auctions"
                  sub="Bid on crops"
                  color={COLORS.light.action}
                  textColor="#FFFFFF"
                  onPress={() => handleQuickAction("/auctions")}
                />
                <ActionCard
                  icon={MessageCircle}
                  label="Farmer Chat"
                  sub="ಚಾಟ್ ಮಾಡಿ"
                  color={COLORS.light.primary}
                  textColor="#FFFFFF"
                  onPress={() => handleQuickAction("/chat")}
                />
              </>
            ) : (
              <>
                <ActionCard
                  icon={Sprout}
                  label="Sell Produce"
                  sub="ಮಾರಾಟ ಮಾಡಿ"
                  color={COLORS.light.primary}
                  textColor="#FFFFFF"
                  onPress={() => handleQuickAction("/sell")}
                />
                <ActionCard
                  icon={ShoppingCart}
                  label="Buy Inputs"
                  sub="Seeds & inputs"
                  color={COLORS.light.earth}
                  textColor="#FFFFFF"
                  onPress={() => handleQuickAction("/marketplace")}
                />
                <ActionCard
                  icon={Sparkles}
                  label="Crop Advice"
                  sub="ACRE AI"
                  color={COLORS.light.action}
                  textColor="#FFFFFF"
                  onPress={() => handleQuickAction("recommend")}
                />
                <ActionCard
                  icon={Users}
                  label="Smart Match"
                  sub="Find buyers"
                  color={COLORS.light.primary}
                  textColor="#FFFFFF"
                  onPress={() => handleQuickAction("/match")}
                />
              </>
            )}
          </View>
        </View>

        {/* Live Auctions Promo Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live auctions</Text>
            <TouchableOpacity onPress={() => router.push("/auctions")}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.auctionCard}
            onPress={() => router.push("/auctions")}
          >
            <View style={styles.auctionIconContainer}>
              <Text style={styles.auctionEmoji}>🌾</Text>
            </View>
            <View style={styles.auctionDetails}>
              <Text style={styles.auctionTitle}>
                {user?.role === "buyer"
                  ? "Organic Sona Masuri — 120 quintals"
                  : "Hybrid Paddy Seeds — 50 bags"}
              </Text>
              <Text style={styles.auctionSub}>
                {user?.role === "buyer"
                  ? "Closing in 03:45:12 • 12 bids"
                  : "Closing in 02:14:33 • 7 bids"}
              </Text>
            </View>
            <Text style={styles.auctionPrice}>
              {user?.role === "buyer" ? "₹2,450/q" : "₹1,240"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface ActionCardProps {
  icon: any;
  label: string;
  sub: string;
  color: string;
  textColor: string;
  onPress: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
  icon: Icon,
  label,
  sub,
  color,
  textColor,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.actionIconWrapper, { backgroundColor: color }]}>
        <Icon size={20} color={textColor} />
      </View>
      <Text style={styles.actionLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.actionSub} numberOfLines={1}>
        {sub}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  greeting: {
    fontSize: 11,
    color: COLORS.light.mutedForeground,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  locationIcon: {
    marginRight: 4,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.light.mutedForeground,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.light.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.light.border,
    ...SHADOWS.card,
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: COLORS.light.action,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.light.background,
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
  },
  badgeRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  chartCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.light.card,
    borderRadius: ROUNDING.xxl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    ...SHADOWS.card,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartLabel: {
    fontSize: 11,
    color: COLORS.light.mutedForeground,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  pillContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.light.muted,
    borderRadius: 99,
    padding: 2,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  pillActive: {
    backgroundColor: COLORS.light.card,
    ...SHADOWS.card,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.light.mutedForeground,
  },
  pillTextActive: {
    color: COLORS.light.primary,
  },
  chartBarsContainer: {
    height: 120,
    justifyContent: "flex-end",
    position: "relative",
  },
  chartGridLines: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
  },
  gridLine: {
    height: 1,
    backgroundColor: COLORS.light.border,
    borderStyle: "dashed",
  },
  barsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: "100%",
    zIndex: 2,
  },
  barItem: {
    alignItems: "center",
    width: 50,
  },
  barTrack: {
    height: 80,
    width: 14,
    backgroundColor: COLORS.light.muted,
    borderRadius: 7,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 7,
  },
  barName: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.light.foreground,
    marginTop: 6,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.light.foreground,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 12,
    color: COLORS.light.primary,
    fontWeight: "bold",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: "48%",
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.xxl,
    padding: 16,
    ...SHADOWS.card,
  },
  actionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: ROUNDING.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  actionSub: {
    fontSize: 11,
    color: COLORS.light.mutedForeground,
    marginTop: 2,
  },
  auctionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.xxl,
    padding: 16,
    ...SHADOWS.card,
  },
  auctionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: ROUNDING.lg,
    backgroundColor: "rgba(230, 81, 0, 0.12)", // action/12%
    alignItems: "center",
    justifyContent: "center",
  },
  auctionEmoji: {
    fontSize: 22,
  },
  auctionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  auctionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  auctionSub: {
    fontSize: 11,
    color: COLORS.light.mutedForeground,
    marginTop: 2,
  },
  auctionPrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.light.action,
  },
});
