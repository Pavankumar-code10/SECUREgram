import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { NotificationProvider } from "../hooks/useNotifications";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NotificationProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat-thread" />
          <Stack.Screen name="match" />
          <Stack.Screen name="transactions" />
        </Stack>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}
