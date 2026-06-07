"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RootLayout;
var react_1 = require("react");
var react_native_safe_area_context_1 = require("react-native-safe-area-context");
var expo_status_bar_1 = require("expo-status-bar");
var expo_router_1 = require("expo-router");
var useNotifications_1 = require("../hooks/useNotifications");
function RootLayout() {
    return (<react_native_safe_area_context_1.SafeAreaProvider>
      <useNotifications_1.NotificationProvider>
        <expo_status_bar_1.StatusBar style="auto"/>
        <expo_router_1.Stack screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
        }}>
          <expo_router_1.Stack.Screen name="index"/>
          <expo_router_1.Stack.Screen name="onboarding"/>
          <expo_router_1.Stack.Screen name="login"/>
          <expo_router_1.Stack.Screen name="(tabs)"/>
          <expo_router_1.Stack.Screen name="chat-thread"/>
          <expo_router_1.Stack.Screen name="match"/>
          <expo_router_1.Stack.Screen name="transactions"/>
        </expo_router_1.Stack>
      </useNotifications_1.NotificationProvider>
    </react_native_safe_area_context_1.SafeAreaProvider>);
}
