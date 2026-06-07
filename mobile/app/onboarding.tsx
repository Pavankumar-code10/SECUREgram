import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { Sprout, ShoppingBasket, ShieldCheck } from "lucide-react-native";
import { router } from "expo-router";
import { Logo } from "../components/sg/Logo";
import { COLORS, SHADOWS, ROUNDING } from "../lib/theme";

export default function Onboarding() {
  const selectRole = (role: "farmer" | "buyer") => {
    router.push({
      pathname: "/login",
      params: { role },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Branding */}
        <View style={styles.brandContainer}>
          <Logo size={42} />
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandName}>SecureGram</Text>
            <Text style={styles.brandSubtitle}>RSA Signed • Tamper-proof</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            Choose your <Text style={styles.primaryText}>role</Text>
          </Text>
          <Text style={styles.subtitle}>ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ</Text>
        </View>

        {/* Cards */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => selectRole("farmer")}
          >
            <View style={[styles.iconContainer, { backgroundColor: COLORS.light.primary }]}>
              <Sprout size={32} color={COLORS.light.primaryForeground} />
            </View>
            <View style={styles.cardDetails}>
              <Text style={styles.cardTitle}>I am a Farmer</Text>
              <Text style={styles.cardDesc}>ನಾನು ರೈತ • Sell your produce directly</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => selectRole("buyer")}
          >
            <View style={[styles.iconContainer, { backgroundColor: COLORS.light.action }]}>
              <ShoppingBasket size={32} color={COLORS.light.actionForeground} />
            </View>
            <View style={styles.cardDetails}>
              <Text style={styles.cardTitle}>I am a Buyer</Text>
              <Text style={styles.cardDesc}>Source verified produce at fair prices</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <ShieldCheck size={16} color={COLORS.light.primary} style={styles.footerIcon} />
          <Text style={styles.footerText}>End-to-end RSA encrypted</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandTextContainer: {
    marginLeft: 12,
  },
  brandName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  brandSubtitle: {
    fontSize: 11,
    color: COLORS.light.mutedForeground,
  },
  titleContainer: {
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  primaryText: {
    color: COLORS.light.primary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.light.mutedForeground,
    marginTop: 4,
  },
  cardsContainer: {
    marginTop: 32,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.light.card,
    borderRadius: ROUNDING.xxl,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.light.border,
    ...SHADOWS.card,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: ROUNDING.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  cardDetails: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.light.mutedForeground,
    marginTop: 4,
  },
  footer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: "auto",
    paddingTop: 24,
  },
  footerIcon: {
    marginRight: 6,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.light.mutedForeground,
  },
});
