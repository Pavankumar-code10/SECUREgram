import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Mail, Lock, Phone, User as UserIcon, ShieldAlert } from "lucide-react-native";
import { Logo } from "../components/sg/Logo";
import { supabase } from "../lib/supabase";
import { COLORS, SHADOWS, ROUNDING } from "../lib/theme";

export default function LoginScreen() {
  const params = useLocalSearchParams();
  const initialRole = (params.role as "farmer" | "buyer") || "farmer";

  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [chosenRole, setChosenRole] = useState<"farmer" | "buyer">(initialRole);

  useEffect(() => {
    const loadSaved = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem("sg_saved_email");
        const savedPassword = await AsyncStorage.getItem("sg_saved_password");
        if (savedEmail) {
          setEmail(savedEmail);
          setMode("signin");
        }
        if (savedPassword) {
          setPassword(savedPassword);
        }
      } catch (e) {
        console.warn(e);
      }
    };
    loadSaved();
  }, []);

  const validSignup =
    name.trim().length >= 2 &&
    phone.length === 10 &&
    email.includes("@") &&
    password.length >= 6;
  
  const validSignin = email.includes("@") && password.length >= 6;

  const handleSignup = async () => {
    if (!validSignup || busy) return;
    setBusy(true);

    try {
      // 1. Check if email or phone already exists via RPC
      const { data: checkData, error: checkError } = await supabase.rpc(
        "check_user_exists" as any,
        {
          p_email: email.trim().toLowerCase(),
          p_phone: phone.trim(),
        }
      );

      if (checkError) {
        console.warn("Uniqueness check error:", checkError);
      } else if (checkData && checkData.length > 0) {
        const { email_exists, phone_exists } = checkData[0] as any;
        if (email_exists) {
          Alert.alert("Error", "This email is already registered.");
          setBusy(false);
          return;
        }
        if (phone_exists) {
          Alert.alert("Error", "This phone number is already registered.");
          setBusy(false);
          return;
        }
      }

      // 2. Perform SignUp
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
            phone: phone.trim(),
            role: chosenRole,
          },
        },
      });

      if (error) {
        Alert.alert("Sign Up Failed", error.message);
        setBusy(false);
        return;
      }

      // Save credentials for convenient login
      await AsyncStorage.setItem("sg_saved_email", email.trim().toLowerCase());
      await AsyncStorage.setItem("sg_saved_password", password);

      if (signUpData?.session) {
        Alert.alert("Success", "Account created successfully!", [
          {
            text: "Proceed",
            onPress: () => router.replace("/(tabs)/dashboard"),
          },
        ]);
      } else {
        Alert.alert(
          "Verification Needed",
          "Account created! Please check your email to verify.",
          [
            {
              text: "OK",
              onPress: () => setMode("signin"),
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "An unexpected registration error occurred.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignin = async () => {
    if (!validSignin || busy) return;
    setBusy(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        Alert.alert("Sign In Failed", error.message);
        setBusy(false);
        return;
      }

      await AsyncStorage.setItem("sg_saved_email", email.trim().toLowerCase());
      await AsyncStorage.setItem("sg_saved_password", password);

      router.replace("/(tabs)/dashboard");
    } catch (err: any) {
      Alert.alert("Error", err.message || "An unexpected sign-in error occurred.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardView}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Logo size={56} />
          <Text style={styles.title}>SecureGram</Text>
          <Text style={styles.subtitle}>
            {mode === "signup" ? "Create your agricultural ID" : "Welcome back"}
          </Text>
        </View>

        {/* Role Toggle for Signup */}
        {mode === "signup" && (
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                chosenRole === "farmer" && styles.roleActivePrimary,
              ]}
              onPress={() => setChosenRole("farmer")}
            >
              <Text
                style={[
                  styles.roleText,
                  chosenRole === "farmer" && styles.roleTextActive,
                ]}
              >
                Farmer / ರೈತ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleButton,
                chosenRole === "buyer" && styles.roleActiveAction,
              ]}
              onPress={() => setChosenRole("buyer")}
            >
              <Text
                style={[
                  styles.roleText,
                  chosenRole === "buyer" && styles.roleTextActive,
                ]}
              >
                Buyer
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Form Inputs */}
        <View style={styles.form}>
          {mode === "signup" && (
            <>
              {/* Full Name */}
              <View style={styles.inputWrapper}>
                <UserIcon size={20} color={COLORS.light.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor="#9E9E9E"
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Phone */}
              <View style={styles.inputWrapper}>
                <Phone size={20} color={COLORS.light.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  placeholder="Phone Number (10 digits)"
                  placeholderTextColor="#9E9E9E"
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </>
          )}

          {/* Email */}
          <View style={styles.inputWrapper}>
            <Mail size={20} color={COLORS.light.mutedForeground} style={styles.inputIcon} />
            <TextInput
              placeholder="Email Address"
              placeholderTextColor="#9E9E9E"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <Lock size={20} color={COLORS.light.mutedForeground} style={styles.inputIcon} />
            <TextInput
              placeholder="Password (min 6 characters)"
              placeholderTextColor="#9E9E9E"
              secureTextEntry
              autoCapitalize="none"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor:
                  mode === "signup"
                    ? validSignup && !busy
                      ? COLORS.light.primary
                      : "#A5D6A7"
                    : validSignin && !busy
                    ? COLORS.light.primary
                    : "#A5D6A7",
              },
            ]}
            disabled={mode === "signup" ? !validSignup || busy : !validSignin || busy}
            onPress={mode === "signup" ? handleSignup : handleSignin}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>
                {mode === "signup" ? "Register Secure ID" : "Sign In"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Toggle */}
        <View style={styles.toggleModeContainer}>
          <Text style={styles.toggleText}>
            {mode === "signup" ? "Already have an account?" : "New to SecureGram?"}
          </Text>
          <TouchableOpacity
            onPress={() => setMode(mode === "signup" ? "signin" : "signup")}
          >
            <Text style={styles.toggleActionText}>
              {mode === "signup" ? " Sign In" : " Register ID"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.light.foreground,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.light.mutedForeground,
    marginTop: 4,
  },
  roleContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.light.secondary,
    padding: 4,
    borderRadius: ROUNDING.md,
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: ROUNDING.md - 2,
  },
  roleActivePrimary: {
    backgroundColor: COLORS.light.primary,
  },
  roleActiveAction: {
    backgroundColor: COLORS.light.action,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.mutedForeground,
  },
  roleTextActive: {
    color: "#FFFFFF",
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.md,
    paddingHorizontal: 16,
    height: 52,
    ...SHADOWS.card,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.light.foreground,
  },
  submitButton: {
    height: 52,
    borderRadius: ROUNDING.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    ...SHADOWS.card,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  toggleModeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  toggleText: {
    fontSize: 14,
    color: COLORS.light.mutedForeground,
  },
  toggleActionText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
});
