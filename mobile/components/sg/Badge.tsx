import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ShieldCheck, Lock, WifiOff } from "lucide-react-native";
import { COLORS } from "../../lib/theme";

type Variant = "rsa" | "tamper" | "offline" | "verified";

interface TrustBadgeProps {
  variant?: Variant;
  style?: any;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({ variant = "rsa", style }) => {
  const map = {
    rsa: {
      icon: ShieldCheck,
      label: "RSA Signed",
      bgColor: COLORS.light.primaryLight,
      textColor: COLORS.light.primary,
    },
    tamper: {
      icon: Lock,
      label: "Tamper-proof",
      bgColor: COLORS.light.primaryLight,
      textColor: COLORS.light.primary,
    },
    verified: {
      icon: ShieldCheck,
      label: "Verified",
      bgColor: COLORS.light.primary,
      textColor: COLORS.light.primaryForeground,
    },
    offline: {
      icon: WifiOff,
      label: "Offline Mode",
      bgColor: COLORS.light.muted,
      textColor: COLORS.light.mutedForeground,
    },
  } as const;

  const { icon: Icon, label, bgColor, textColor } = map[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, style]}>
      <Icon size={12} color={textColor} style={styles.icon} />
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    alignSelf: "flex-start",
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: "bold",
  },
});
