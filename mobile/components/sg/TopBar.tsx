import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { router } from "expo-router";
import { COLORS } from "../../lib/theme";

interface TopBarProps {
  title: string;
  subtitle?: string;
  back?: string | boolean;
  right?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  back = "/dashboard",
  right,
}) => {
  const handleBack = () => {
    if (typeof back === "string") {
      router.push(back as any);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        {back !== false && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={COLORS.light.foreground} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {right && <View style={styles.rightContainer}>{right}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: COLORS.light.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  leftContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.light.mutedForeground,
  },
  rightContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginLeft: 8,
  },
});
