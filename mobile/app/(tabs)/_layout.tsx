import React from "react";
import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { Leaf, Plus, ShoppingCart, MessageCircle, User } from "lucide-react-native";
import { useUser } from "../../lib/user";
import { useNotifications } from "../../hooks/useNotifications";
import { COLORS } from "../../lib/theme";

export default function TabLayout() {
  const user = useUser();
  const { unreadCount } = useNotifications();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.light.primary,
        tabBarInactiveTintColor: COLORS.light.mutedForeground,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Leaf size={20} color={color} strokeWidth={focused ? 2.4 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: "Sell",
          href: user?.role === "buyer" ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Plus size={20} color={color} strokeWidth={focused ? 2.4 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: "Buy",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <ShoppingCart size={20} color={color} strokeWidth={focused ? 2.4 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <MessageCircle size={20} color={color} strokeWidth={focused ? 2.4 : 2} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <User size={20} color={color} strokeWidth={focused ? 2.4 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.light.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.light.border,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  iconContainer: {
    width: 48,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerActive: {
    backgroundColor: "rgba(46, 125, 50, 0.12)", // primary/12%
  },
  badge: {
    position: "absolute",
    top: -2,
    right: 4,
    backgroundColor: COLORS.light.action,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
  },
});
