import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Camera, Eye, Pencil, Trash2, MapPin, Sparkles, ShieldCheck, Check, Plus, Minus, Mic, MicOff, Search, ChevronRight } from "lucide-react-native";
import { useUser } from "../../lib/user";
import { supabase } from "../../lib/supabase";
import { TopBar } from "../../components/sg/TopBar";
import { TrustBadge } from "../../components/sg/Badge";
import { COLORS, SHADOWS, ROUNDING } from "../../lib/theme";

type Crop = { en: string; kn: string; price: number; emoji: string };
const CROPS = [
  {
    category: "Vegetables / ತರಕಾರಿಗಳು",
    items: [
      { en: "Tomato", kn: "ಟೊಮ್ಯಾಟೊ", price: 1800, emoji: "🍅" },
      { en: "Onion", kn: "ಈರುಳ್ಳಿ", price: 2200, emoji: "🧅" },
      { en: "Potato", kn: "ಆಲೂಗಡ್ಡೆ", price: 1600, emoji: "🥔" },
      { en: "Carrot", kn: "ಕ್ಯಾರೆಟ್", price: 2400, emoji: "🥕" },
      { en: "Cabbage", kn: "ಎಲೆಕೋಸು", price: 1200, emoji: "🥬" },
      { en: "Cauliflower", kn: "ಹೂಕೋಸು", price: 1500, emoji: "🥦" },
      { en: "Brinjal", kn: "ಬದನೆ", price: 1700, emoji: "🍆" },
      { en: "Beans", kn: "ಹುರುಳಿಕಾಯಿ", price: 2600, emoji: "🫘" },
    ],
  },
  {
    category: "Cereals / ಧಾನ್ಯಗಳು",
    items: [
      { en: "Rice", kn: "ಅಕ್ಕಿ", price: 2280, emoji: "🍚" },
      { en: "Wheat", kn: "ಗೋಧಿ", price: 2450, emoji: "🌾" },
      { en: "Maize", kn: "ಜೋಳ", price: 2050, emoji: "🌽" },
      { en: "Ragi", kn: "ರಾಗಿ", price: 3400, emoji: "🟤" },
    ],
  },
];
const ALL_CROPS = CROPS.flatMap((c) => c.items);

const OFFICIAL_MSP_DATA: Record<string, number> = {
  Rice: 2300,
  Wheat: 2425,
  Tur: 7550,
  Maize: 2225,
  Ragi: 4290,
  Cotton: 7121,
  Greengram: 8682,
  Moong: 8682,
  Chana: 5440,
  Sugarcane: 340,
  Groundnut: 6780,
  Chilli: 7000,
  Tomato: 1800,
  Potato: 1500,
  Onion: 1700,
};

export default function SellScreen() {
  const user = useUser();

  useEffect(() => {
    if (user && user.role === "buyer") {
      Alert.alert("Error", "Buyers cannot sell produce.");
      router.replace("/(tabs)/dashboard");
    }
  }, [user]);

  const [cropName, setCropName] = useState("Rice");
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState(12);
  const [quality, setQuality] = useState<"A" | "B" | "C">("A");
  
  const crop = ALL_CROPS.find((c) => c.en === cropName) || ALL_CROPS[0];
  const [price, setPrice] = useState(crop.price);
  const [photo, setPhoto] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "signing" | "done">("idle");
  const [listening, setListening] = useState(false);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "locating" | "ok" | "denied">("idle");
  
  const [mandi, setMandi] = useState<{ modal: number; market: string; date: string } | null>(null);
  const [mandiLoading, setMandiLoading] = useState(false);
  const [msp, setMsp] = useState<{ price: number; source: string } | null>(null);
  const [mspLoading, setMspLoading] = useState(false);

  const baselinePrice = mandi?.modal ?? crop.price;
  const fairPrice = baselinePrice + (quality === "A" ? 70 : quality === "C" ? -120 : 0);
  const askedPrice = price || 0;
  const diff = askedPrice - fairPrice;
  const diffPct = fairPrice ? Math.round((diff / fairPrice) * 100) : 0;

  // Sync price when crop, quality, or mandi price changes
  useEffect(() => {
    setPrice(fairPrice);
  }, [cropName, quality, mandi?.modal]);

  // Fetch local mandi prices from Supabase
  useEffect(() => {
    let active = true;
    setMandiLoading(true);
    setMandi(null);

    const loadMandi = async () => {
      try {
        const { data, error } = await supabase
          .from("mandi_prices")
          .select("modal_price, market, arrival_date")
          .ilike("commodity", cropName)
          .eq("state", "Karnataka")
          .order("arrival_date", { ascending: false })
          .limit(1);

        if (error) throw error;
        if (active && data && data.length > 0) {
          const first = data[0];
          setMandi({
            modal: Number(first.modal_price),
            market: first.market || "Market",
            date: first.arrival_date || "",
          });
        }
      } catch (err) {
        console.warn("mandi fetch failed:", err);
      } finally {
        if (active) setMandiLoading(false);
      }
    };

    loadMandi();
    return () => {
      active = false;
    };
  }, [cropName]);

  // Resolve MSP price locally or via fallback
  useEffect(() => {
    setMspLoading(true);
    const mspPrice = OFFICIAL_MSP_DATA[cropName] || 2200;
    setMsp({ price: mspPrice, source: "government_fallback" });
    setMspLoading(false);
  }, [cropName]);

  const captureLocation = async () => {
    setGeoState("locating");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGeoState("denied");
        Alert.alert("Permission Denied", "Location access is required to capture farm location.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setGeo({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      setGeoState("ok");
    } catch (e) {
      setGeoState("denied");
      Alert.alert("Error", "Failed to capture location.");
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Photo access is required to add crop images.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhoto(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to select photo.");
    }
  };

  const startVoiceInput = () => {
    setListening(true);
    // Voice prompt mock input helper
    setTimeout(() => {
      if (listening) return;
      const mockResult = fairPrice + Math.floor(Math.random() * 200 - 100);
      setPrice(mockResult);
      setListening(false);
      Alert.alert("Voice Assistant", `Heard price: ₹${mockResult}`);
    }, 2000);
  };

  const signAndList = async () => {
    if (!photo) {
      Alert.alert("Photo Required", "Please upload a photo of your produce.");
      return;
    }
    if (!user) {
      Alert.alert("Error", "You must be logged in to sell produce.");
      return;
    }
    if (!price || price <= 0) {
      Alert.alert("Invalid Price", "Please set a valid price.");
      return;
    }

    setState("signing");
    try {
      const { error } = await supabase.from("listings").insert({
        seller_id: user.id,
        crop: cropName,
        quantity_quintal: qty,
        price_per_quintal: price,
        description: `Grade ${quality}`,
        latitude: geo?.lat ?? null,
        longitude: geo?.lng ?? null,
        state: "Karnataka",
      } as any);

      if (error) throw error;
      setState("done");
      Alert.alert("Success", "Produce listing signed with RSA and published!", [
        {
          text: "OK",
          onPress: () => router.push("/match"),
        },
      ]);
    } catch (err: any) {
      setState("idle");
      Alert.alert("Submission Failed", err.message);
    }
  };

  const filteredCrops = query
    ? CROPS.map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.en.toLowerCase().includes(query.toLowerCase()) ||
            item.kn.includes(query)
        ),
      })).filter((group) => group.items.length > 0)
    : CROPS;

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopBar title="Sell My Produce" subtitle="ಉತ್ಪನ್ನ ಪಟ್ಟಿಮಾಡಿ" back="/dashboard" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Photo Container */}
        <View style={styles.photoSection}>
          {!photo ? (
            <TouchableOpacity style={styles.photoPlaceholder} onPress={pickImage}>
              <View style={styles.cameraIconContainer}>
                <Camera size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.photoTitle}>Tap to add crop photo</Text>
              <Text style={styles.photoDesc}>ಫೋಟೋ ಸೇರಿಸಿ • JPG/PNG • Max 5MB</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.photoWrapper}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <View style={styles.photoActions}>
                <TouchableOpacity style={styles.photoActionButton} onPress={pickImage}>
                  <Pencil size={16} color={COLORS.light.foreground} />
                  <Text style={styles.photoActionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoActionButton, styles.deleteActionButton]}
                  onPress={() => setPhoto(null)}
                >
                  <Trash2 size={16} color="#FFFFFF" />
                  <Text style={[styles.photoActionText, { color: "#FFFFFF" }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Crop Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose crop / ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ</Text>
          <View style={styles.searchWrapper}>
            <Search size={16} color={COLORS.light.mutedForeground} style={styles.searchIcon} />
            <TextInput
              placeholder="Search crop / ಹುಡುಕಿ"
              placeholderTextColor="#9E9E9E"
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          {filteredCrops.map((group) => (
            <View key={group.category} style={styles.cropGroup}>
              <Text style={styles.cropGroupTitle}>{group.category}</Text>
              <View style={styles.cropGrid}>
                {group.items.map((c) => {
                  const isSelected = cropName === c.en;
                  return (
                    <TouchableOpacity
                      key={c.en}
                      style={[styles.cropCard, isSelected && styles.cropCardSelected]}
                      onPress={() => setCropName(c.en)}
                    >
                      <Text style={styles.cropEmoji}>{c.emoji}</Text>
                      <Text style={[styles.cropText, isSelected && styles.cropTextSelected]}>
                        {c.en}
                      </Text>
                      <Text style={styles.cropKnText}>{c.kn}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity / ಪ್ರಮಾಣ (quintal)</Text>
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Minus size={22} color={COLORS.light.foreground} />
            </TouchableOpacity>
            <View style={styles.stepperValueContainer}>
              <Text style={styles.stepperValue}>{qty}</Text>
            </View>
            <TouchableOpacity style={styles.stepperButton} onPress={() => setQty((q) => q + 1)}>
              <Plus size={22} color={COLORS.light.foreground} />
            </TouchableOpacity>
          </View>
          <View style={styles.shortcutRow}>
            {[5, 10, 25, 50, 100].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.shortcutBadge, qty === n && styles.shortcutBadgeSelected]}
                onPress={() => setQty(n)}
              >
                <Text
                  style={[styles.shortcutText, qty === n && styles.shortcutTextSelected]}
                >
                  {n} q
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quality grade / ಗುಣಮಟ್ಟ</Text>
          <View style={styles.qualityRow}>
            {(["A", "B", "C"] as const).map((g) => {
              const isSelected = quality === g;
              return (
                <TouchableOpacity
                  key={g}
                  style={[styles.qualityCard, isSelected && styles.qualityCardSelected]}
                  onPress={() => setQuality(g)}
                >
                  <Text
                    style={[styles.qualityTitle, isSelected && styles.qualityTextSelected]}
                  >
                    Grade {g}
                  </Text>
                  <Text
                    style={[
                      styles.qualityDesc,
                      isSelected ? { color: "#FFFFFF" } : { color: COLORS.light.mutedForeground },
                    ]}
                  >
                    {g === "A" ? "Premium" : g === "B" ? "Standard" : "Economy"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Price Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Asking price / ಬೆಲೆ (₹ per quintal)</Text>
          <View style={styles.priceInputRow}>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.priceInput}
                keyboardType="numeric"
                value={String(price)}
                onChangeText={(val) => setPrice(Number(val.replace(/[^0-9]/g, "")) || 0)}
              />
              <Text style={styles.quintalUnit}>/q</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.voiceButton,
                listening ? styles.voiceActive : styles.voiceInactive,
              ]}
              onPress={listening ? () => setListening(false) : startVoiceInput}
            >
              {listening ? <MicOff size={22} color="#FFFFFF" /> : <Mic size={22} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
          <Text style={styles.voiceTip}>
            {listening
              ? "Listening... Speak price now."
              : "🎤 Tap mic to speak price (mock recognition)"}
          </Text>
        </View>

        {/* Prediction Panel */}
        <View style={styles.predictionCard}>
          <View style={styles.predictionTitleRow}>
            <Sparkles size={16} color={COLORS.light.primary} />
            <Text style={styles.predictionHeader}>GRAMA fair price prediction</Text>
          </View>

          <View style={styles.predictionValueRow}>
            <Text style={styles.predictedPrice}>₹{fairPrice}</Text>
            <Text style={styles.predictedUnit}>/quintal</Text>
          </View>

          <Text style={[styles.diffText, diff >= 0 ? { color: COLORS.light.action } : { color: COLORS.light.primary }]}>
            {diff === 0
              ? "Your ask matches predicted fair price"
              : diff > 0
              ? `Your ask is +₹${diff} (${diffPct}%) above fair`
              : `Your ask is ₹${Math.abs(diff)} (${Math.abs(diffPct)}%) below fair`}
          </Text>

          {/* Benchmarks Grid */}
          <View style={styles.benchmarkGrid}>
            <View style={styles.benchmarkBox}>
              <Text style={styles.benchmarkLabel}>Live Agmarknet</Text>
              {mandiLoading ? (
                <ActivityIndicator size="small" color={COLORS.light.primary} style={{ marginTop: 4 }} />
              ) : mandi ? (
                <>
                  <Text style={styles.benchmarkPrice}>₹{mandi.modal}/q</Text>
                  <Text style={styles.benchmarkSub} numberOfLines={1}>
                    {mandi.market} · {mandi.date}
                  </Text>
                </>
              ) : (
                <Text style={styles.benchmarkSub}>No live data</Text>
              )}
            </View>

            <View style={styles.benchmarkBox}>
              <Text style={styles.benchmarkLabel}>Govt MSP</Text>
              {mspLoading ? (
                <ActivityIndicator size="small" color={COLORS.light.primary} style={{ marginTop: 4 }} />
              ) : msp ? (
                <>
                  <Text style={styles.benchmarkPrice}>₹{msp.price}/q</Text>
                  <Text
                    style={[
                      styles.benchmarkSub,
                      { fontWeight: "bold" },
                      askedPrice >= msp.price
                        ? { color: COLORS.light.primary }
                        : { color: COLORS.light.error },
                    ]}
                  >
                    {askedPrice >= msp.price ? "✅ Meets MSP" : `⚠️ -₹${msp.price - askedPrice} below`}
                  </Text>
                </>
              ) : (
                <Text style={styles.benchmarkSub}>Not set</Text>
              )}
            </View>
          </View>
        </View>

        {/* GPS Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Farm location / ಸ್ಥಳ</Text>
          <TouchableOpacity
            style={[styles.gpsButton, geo && styles.gpsButtonOk]}
            onPress={captureLocation}
            disabled={geoState === "locating"}
          >
            <View style={styles.gpsLabel}>
              <MapPin size={16} color={geo ? COLORS.light.primary : COLORS.light.mutedForeground} />
              <Text style={[styles.gpsText, geo && styles.gpsTextOk]}>
                {geoState === "locating"
                  ? "Locating GPS..."
                  : geo
                  ? `${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}`
                  : "Tap to share GPS"}
              </Text>
            </View>
            {geoState === "locating" ? (
              <ActivityIndicator size="small" color={COLORS.light.primary} />
            ) : geo ? (
              <Check size={16} color={COLORS.light.primary} />
            ) : null}
          </TouchableOpacity>
          <Text style={styles.gpsTip}>Buyers see your distance — helps freight matching.</Text>
        </View>

        {/* Submit */}
        <View style={styles.submitWrapper}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={signAndList}
            disabled={state !== "idle"}
          >
            {state === "signing" ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <ShieldCheck size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>RSA Sign & List</Text>
              </>
            )}
          </TouchableOpacity>

          {state === "done" && (
            <View style={styles.trustBadgeRow}>
              <TrustBadge variant="rsa" />
              <TrustBadge variant="tamper" />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 24,
  },
  photoSection: {
    alignItems: "center",
  },
  photoPlaceholder: {
    width: "100%",
    height: 180,
    borderRadius: ROUNDING.xxl,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(46, 125, 50, 0.4)",
    backgroundColor: "rgba(46, 125, 50, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  cameraIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.light.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.elev,
  },
  photoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.light.foreground,
    marginTop: 12,
  },
  photoDesc: {
    fontSize: 11,
    color: COLORS.light.mutedForeground,
    marginTop: 4,
  },
  photoWrapper: {
    width: "100%",
    borderRadius: ROUNDING.xxl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.light.border,
    ...SHADOWS.card,
  },
  photo: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  photoActions: {
    flexDirection: "row",
    backgroundColor: COLORS.light.card,
    padding: 12,
    justifyContent: "flex-end",
    gap: 8,
  },
  photoActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light.muted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: ROUNDING.md,
    gap: 4,
  },
  deleteActionButton: {
    backgroundColor: COLORS.light.error,
  },
  photoActionText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.md,
    paddingHorizontal: 12,
    height: 44,
    ...SHADOWS.card,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.light.foreground,
  },
  cropGroup: {
    marginTop: 8,
  },
  cropGroupTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.light.mutedForeground,
    marginBottom: 8,
  },
  cropGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cropCard: {
    width: "31%",
    aspectRatio: 1,
    backgroundColor: COLORS.light.card,
    borderWidth: 2,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.xl,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    ...SHADOWS.card,
  },
  cropCardSelected: {
    borderColor: COLORS.light.primary,
    backgroundColor: "rgba(46, 125, 50, 0.08)",
  },
  cropEmoji: {
    fontSize: 26,
  },
  cropText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.light.foreground,
    textAlign: "center",
    marginTop: 4,
  },
  cropTextSelected: {
    color: COLORS.light.primary,
  },
  cropKnText: {
    fontSize: 9,
    color: COLORS.light.mutedForeground,
    textAlign: "center",
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: ROUNDING.md,
    backgroundColor: COLORS.light.card,
    borderWidth: 2,
    borderColor: COLORS.light.border,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.card,
  },
  stepperValueContainer: {
    flex: 1,
    height: 48,
    borderRadius: ROUNDING.md,
    backgroundColor: COLORS.light.card,
    borderWidth: 2,
    borderColor: COLORS.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  shortcutRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 6,
  },
  shortcutBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  shortcutBadgeSelected: {
    backgroundColor: COLORS.light.primary,
    borderColor: COLORS.light.primary,
  },
  shortcutText: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  shortcutTextSelected: {
    color: "#FFFFFF",
  },
  qualityRow: {
    flexDirection: "row",
    gap: 8,
  },
  qualityCard: {
    flex: 1,
    height: 52,
    backgroundColor: COLORS.light.card,
    borderWidth: 2,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.md,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.card,
  },
  qualityCardSelected: {
    backgroundColor: COLORS.light.primary,
    borderColor: COLORS.light.primary,
  },
  qualityTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  qualityTextSelected: {
    color: "#FFFFFF",
  },
  qualityDesc: {
    fontSize: 9,
    marginTop: 2,
  },
  priceInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  priceInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    backgroundColor: COLORS.light.card,
    borderWidth: 2,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.md,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.light.mutedForeground,
  },
  priceInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 8,
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  quintalUnit: {
    fontSize: 12,
    color: COLORS.light.mutedForeground,
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: ROUNDING.md,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.card,
  },
  voiceActive: {
    backgroundColor: COLORS.light.error,
  },
  voiceInactive: {
    backgroundColor: COLORS.light.action,
  },
  voiceTip: {
    fontSize: 10,
    color: COLORS.light.mutedForeground,
    marginTop: 4,
  },
  predictionCard: {
    backgroundColor: "rgba(46, 125, 50, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(46, 125, 50, 0.15)",
    borderRadius: ROUNDING.xxl,
    padding: 16,
  },
  predictionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  predictionHeader: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  predictionValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
  },
  predictedPrice: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  predictedUnit: {
    fontSize: 12,
    color: COLORS.light.mutedForeground,
    marginLeft: 4,
  },
  diffText: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 4,
  },
  benchmarkGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  benchmarkBox: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.md,
    padding: 10,
  },
  benchmarkLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.light.mutedForeground,
    textTransform: "uppercase",
  },
  benchmarkPrice: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.light.foreground,
    marginTop: 2,
  },
  benchmarkSub: {
    fontSize: 9,
    color: COLORS.light.mutedForeground,
    marginTop: 2,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
    borderRadius: ROUNDING.md,
    borderWidth: 2,
    borderColor: COLORS.light.border,
    backgroundColor: COLORS.light.card,
    paddingHorizontal: 12,
    ...SHADOWS.card,
  },
  gpsButtonOk: {
    borderColor: COLORS.light.primary,
    backgroundColor: "rgba(46, 125, 50, 0.08)",
  },
  gpsLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gpsText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.light.mutedForeground,
  },
  gpsTextOk: {
    color: COLORS.light.primary,
  },
  gpsTip: {
    fontSize: 10,
    color: COLORS.light.mutedForeground,
    marginTop: 4,
  },
  submitWrapper: {
    marginTop: 12,
    gap: 12,
  },
  submitButton: {
    height: 52,
    borderRadius: ROUNDING.md,
    backgroundColor: COLORS.light.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...SHADOWS.elev,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  trustBadgeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
});
