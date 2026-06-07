import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Logo } from "../components/sg/Logo";
import { supabase } from "../lib/supabase";
import { COLORS } from "../lib/theme";

export default function SplashScreen() {
  useEffect(() => {
    const checkSession = async () => {
      // Small timeout to show the splash logo animation/premium layout
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Query profile to see if onboarding is needed
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile?.role) {
          router.replace("/(tabs)/dashboard");
        } else {
          router.replace("/onboarding");
        }
      } else {
        router.replace("/onboarding");
      }
    };

    checkSession();
  }, []);

  return (
    <View style={styles.container}>
      <Logo size={120} />
      <ActivityIndicator
        size="large"
        color={COLORS.light.primary}
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loader: {
    marginTop: 40,
  },
});
