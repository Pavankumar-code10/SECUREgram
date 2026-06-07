import React from "react";
import { View, StyleSheet } from "react-native";
import { Shield } from "lucide-react-native";
import { COLORS, SHADOWS, ROUNDING } from "../../lib/theme";

export const Logo: React.FC<{ size?: number }> = ({ size = 64 }) => {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.35,
        },
      ]}
    >
      <Shield size={size * 0.52} color="#FFFFFF" strokeWidth={2.5} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.light.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.elev,
  },
});
