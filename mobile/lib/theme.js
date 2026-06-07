"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROUNDING = exports.SHADOWS = exports.COLORS = void 0;
exports.COLORS = {
    // Light mode colors
    light: {
        background: "#F9FBF7", // OKLCH(0.985 0.003 120) soft greenish-white
        foreground: "#1B231D", // OKLCH(0.18 0.02 150) very dark green-gray
        card: "#FFFFFF",
        cardForeground: "#1B231D",
        primary: "#2E7D32", // OKLCH(0.62 0.17 145) premium green
        primaryLight: "#E8F5E9",
        primaryForeground: "#FFFFFF",
        secondary: "#F0F4F1", // OKLCH(0.95 0.02 130)
        secondaryForeground: "#2E3D32",
        muted: "#F5F7F5",
        mutedForeground: "#707E73",
        accent: "#E8ECE9",
        accentForeground: "#2E3D32",
        border: "#E2E8E3", // OKLCH(0.9 0.01 130)
        input: "#ECEFEA",
        earth: "#8D6E63", // OKLCH(0.5 0.06 50) earth brown
        earthForeground: "#FFFFFF",
        action: "#E65100", // OKLCH(0.74 0.18 60) action orange
        actionForeground: "#FFF3E0",
        success: "#2E7D32",
        error: "#C62828",
        warning: "#EF6C00",
        verified: "#2E7D32",
        glassBg: "rgba(255, 255, 255, 0.82)",
    },
    // Dark mode colors
    dark: {
        background: "#111613", // OKLCH(0.14 0.012 150)
        foreground: "#E3E9E4", // OKLCH(0.96 0.01 130)
        card: "#19201C", // OKLCH(0.18 0.018 150)
        cardForeground: "#E3E9E4",
        primary: "#4CAF50", // OKLCH(0.7 0.18 145)
        primaryLight: "#1B2E1D",
        primaryForeground: "#0A120B",
        secondary: "#222B24",
        secondaryForeground: "#E3E9E4",
        muted: "#1D2520",
        mutedForeground: "#9EB0A2",
        accent: "#243127",
        accentForeground: "#E3E9E4",
        border: "#29342B",
        input: "#212A23",
        earth: "#A1887F",
        earthForeground: "#1B1210",
        action: "#FF9800",
        actionForeground: "#1E1200",
        success: "#4CAF50",
        error: "#E53935",
        warning: "#FFA726",
        verified: "#4CAF50",
        glassBg: "rgba(25, 32, 28, 0.85)",
    },
};
exports.SHADOWS = {
    card: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    elev: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
    },
};
exports.ROUNDING = {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};
