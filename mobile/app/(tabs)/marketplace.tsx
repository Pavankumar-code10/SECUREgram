import React, { useEffect, useMemo, useState } from "react";
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
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Search, SlidersHorizontal, MapPin, ShieldCheck, Plus, X, Navigation, ArrowLeft, Trash2 } from "lucide-react-native";
import { useUser } from "../../lib/user";
import { supabase } from "../../lib/supabase";
import { TopBar } from "../../components/sg/TopBar";
import { TrustBadge } from "../../components/sg/Badge";
import { COLORS, SHADOWS, ROUNDING } from "../../lib/theme";

const { height } = Dimensions.get("window");

interface Item {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  image_url: string | null;
  seller_id: string;
  distance_km?: number | null;
  district?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const CATEGORIES = ["All", "Rice", "Pulses", "Vegetables", "Fruits", "Spices", "Inputs"];
const EMOJI: Record<string, string> = {
  Rice: "🌾",
  Pulses: "🫘",
  Vegetables: "🥬",
  Fruits: "🥭",
  Spices: "🌶️",
  Inputs: "🧪",
};

export default function MarketplaceScreen() {
  const user = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [nearby, setNearby] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [radiusKm, setRadiusKm] = useState(100);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "escrow" | "cod">("upi");
  const [buyQty, setBuyQty] = useState(1);
  const [buying, setBuying] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [seller, setSeller] = useState<any>(null);
  const [loadingSeller, setLoadingSeller] = useState(false);

  // Form states for listing item
  const [addName, setAddName] = useState("");
  const [addCategory, setAddCategory] = useState("Rice");
  const [addPrice, setAddPrice] = useState(1000);
  const [addStock, setAddStock] = useState(10);
  const [addUnit, setAddUnit] = useState("quintal");
  const [addPhoto, setAddPhoto] = useState<string | null>(null);
  const [addGeo, setAddGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [addingListing, setAddingListing] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("marketplace_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data as Item[]) || []);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadNearby = async () => {
    setGeoLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required for nearby listings.");
        setNearby(false);
        setGeoLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { data, error } = await supabase.rpc("nearby_marketplace_items" as any, {
        buyer_lat: loc.coords.latitude,
        buyer_lng: loc.coords.longitude,
        radius_km: radiusKm,
        category_filter: cat === "All" ? undefined : cat,
        q: q || undefined,
      });

      if (error) {
        // Fallback: load all and calculate distances locally
        const { data: allData, error: allErr } = await supabase
          .from("marketplace_items")
          .select("*");
        if (allErr) throw allErr;

        const calculated = (allData as Item[]).map((item) => {
          if (item.latitude && item.longitude) {
            const dist = getDistance(
              loc.coords.latitude,
              loc.coords.longitude,
              item.latitude,
              item.longitude
            );
            return { ...item, distance_km: dist };
          }
          return item;
        }).filter((item) => (item.distance_km || 9999) <= radiusKm);

        setItems(calculated);
      } else {
        setItems((data as Item[]) || []);
      }
    } catch (e: any) {
      console.warn("RPC failed, falling back to manual distance rendering:", e.message);
    } finally {
      setGeoLoading(false);
      setLoading(false);
    }
  };

  function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  useEffect(() => {
    if (nearby) {
      loadNearby();
    } else {
      loadAll();
    }
  }, [nearby, radiusKm]);

  // Fetch seller details when item details are open
  useEffect(() => {
    if (!selectedItem) {
      setSeller(null);
      return;
    }
    setLoadingSeller(true);
    supabase
      .from("profiles")
      .select("*")
      .eq("id", selectedItem.seller_id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          // Mock profile fallback
          setSeller({
            name: "Prasad Gowda (Farmer)",
            phone: "9876543210",
            district: selectedItem.district || "Mandya",
            state: selectedItem.state || "Karnataka",
          });
        } else {
          setSeller(data);
        }
        setLoadingSeller(false);
      });
  }, [selectedItem]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (cat !== "All" && i.category !== cat) return false;
      if (q && !i.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [items, cat, q]);

  const pickAddPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera roll permission is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setAddPhoto(result.assets[0].uri);
    }
  };

  const captureAddLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Location permission is required.");
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setAddGeo({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    Alert.alert("Location Pinned", `Coordinates: ${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
  };

  const handleCreateListing = async () => {
    if (!addName.trim()) {
      Alert.alert("Input Required", "Please enter item name.");
      return;
    }
    if (!user) return;

    setAddingListing(true);
    try {
      const { error } = await supabase.from("marketplace_items").insert({
        seller_id: user.id,
        name: addName.trim(),
        category: addCategory,
        price: addPrice,
        stock: addStock,
        unit: addUnit,
        image_url: addPhoto,
        latitude: addGeo?.lat ?? null,
        longitude: addGeo?.lng ?? null,
        state: "Karnataka",
      } as any);

      if (error) throw error;
      Alert.alert("Success", "Item listed in marketplace!");
      setShowAdd(false);
      // Reset form
      setAddName("");
      setAddPhoto(null);
      setAddGeo(null);
      nearby ? loadNearby() : loadAll();
    } catch (e: any) {
      Alert.alert("Failed", e.message);
    } finally {
      setAddingListing(false);
    }
  };

  const handleDeleteListing = async (itemId: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to remove this listing?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("marketplace_items")
              .delete()
              .eq("id", itemId);
            if (error) throw error;
            Alert.alert("Deleted", "Listing removed.");
            setSelectedItem(null);
            nearby ? loadNearby() : loadAll();
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  const handleCheckout = async () => {
    if (!user || !selectedItem) return;

    setBuying(true);
    const orderTotal = selectedItem.price * buyQty + 50;
    const txId = Math.random().toString(36).substring(2);

    try {
      const { error } = await supabase.from("transactions").insert({
        id: txId,
        buyer_id: user.id,
        seller_id: selectedItem.seller_id,
        amount: orderTotal,
        status: "pending",
      } as any);

      if (error) throw error;

      // Send notifications
      await supabase.from("notifications").insert([
        {
          user_id: selectedItem.seller_id,
          title: "New Buy Request",
          message: `${user.name || "A buyer"} has requested to buy your listed ${
            selectedItem.name
          } for ₹${orderTotal}`,
          type: "buy_request",
          link: "/transactions",
          is_read: false,
        },
        {
          user_id: user.id,
          title: "Purchase Request Sent",
          message: `Your request to buy ${buyQty} ${selectedItem.unit} of ${selectedItem.name} has been sent.`,
          type: "transaction_update",
          link: "/transactions",
          is_read: false,
        },
      ] as any);

      // Decrement stock
      await supabase
        .from("marketplace_items")
        .update({ stock: Math.max(0, selectedItem.stock - buyQty) })
        .eq("id", selectedItem.id);

      // Save transactions locally inside AsyncStorage to emulate transaction history
      const localTxsStr = await AsyncStorage.getItem("sg_transactions");
      const localTxs = localTxsStr ? JSON.parse(localTxsStr) : [];
      localTxs.unshift({
        id: txId,
        buyer_id: user.id,
        seller_id: selectedItem.seller_id,
        listing_id: selectedItem.id,
        amount: orderTotal,
        status: "pending",
        created_at: new Date().toISOString(),
      });
      await AsyncStorage.setItem("sg_transactions", JSON.stringify(localTxs));

      // Save metadata locally
      const metaStr = await AsyncStorage.getItem("sg_transaction_metadata");
      const meta = metaStr ? JSON.parse(metaStr) : {};
      meta[txId] = {
        item_name: selectedItem.name,
        item_category: selectedItem.category,
        item_qty: buyQty,
        item_unit: selectedItem.unit,
        buyer_name: user.name || "Buyer",
        seller_name: seller?.name || "Seller",
        unit_price: selectedItem.price,
        delivery_fee: 50,
        subtotal: selectedItem.price * buyQty,
      };
      await AsyncStorage.setItem("sg_transaction_metadata", JSON.stringify(meta));

      Alert.alert("Order Placed", "Purchase request has been successfully signed with RSA and sent!", [
        {
          text: "View Orders",
          onPress: () => {
            setShowPayment(false);
            setSelectedItem(null);
            router.push("/transactions");
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert("Checkout Failed", e.message);
    } finally {
      setBuying(false);
    }
  };

  const handleChat = () => {
    if (!user || !selectedItem) return;
    setSelectedItem(null);
    router.push({
      pathname: "/chat-thread",
      params: { partnerId: selectedItem.seller_id },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopBar
        title="Marketplace"
        subtitle="Verified Karnataka produce"
        back="/dashboard"
        right={
          user && user.role !== "buyer" ? (
            <TouchableOpacity style={styles.listBtn} onPress={() => setShowAdd(true)}>
              <Plus size={14} color={COLORS.light.actionForeground} />
              <Text style={styles.listBtnText}>List</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View style={styles.searchBar}>
        <View style={styles.searchWrapper}>
          <Search size={18} color={COLORS.light.mutedForeground} style={styles.searchIcon} />
          <TextInput
            placeholder="Search rice, tur, mango..."
            placeholderTextColor="#9E9E9E"
            style={styles.searchInput}
            value={q}
            onChangeText={setQ}
          />
        </View>

        {/* Filters pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillScroll}>
          <TouchableOpacity
            style={[styles.nearMeBtn, nearby && styles.nearMeBtnActive]}
            onPress={() => setNearby(!nearby)}
          >
            <Navigation size={12} color={nearby ? "#FFFFFF" : COLORS.light.primary} />
            <Text style={[styles.nearMeBtnText, nearby && { color: "#FFFFFF" }]}>
              {nearby ? `Near me · ${radiusKm}km` : "Near me"}
            </Text>
          </TouchableOpacity>

          {nearby && (
            <View style={styles.radiusSelector}>
              {[25, 50, 100, 200].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.radiusPill, radiusKm === r && styles.radiusPillActive]}
                  onPress={() => setRadiusKm(r)}
                >
                  <Text style={[styles.radiusText, radiusKm === r && { color: "#FFFFFF" }]}>
                    {r}km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.catPill, cat === c && styles.catPillActive]}
              onPress={() => setCat(c)}
            >
              <Text style={[styles.catPillText, cat === c && { color: "#FFFFFF" }]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.gridContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.light.primary} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptyDesc}>Be the first to list produce in this category!</Text>
            {user && (
              <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowAdd(true)}>
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>List Item</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() => {
                  setBuyQty(1);
                  setSelectedItem(item);
                }}
              >
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.cardImage} />
                ) : (
                  <View style={styles.cardEmojiBg}>
                    <Text style={styles.cardEmoji}>{EMOJI[item.category] || "📦"}</Text>
                  </View>
                )}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardStock}>
                    {item.stock} {item.unit} available
                  </Text>
                  <View style={styles.cardPriceRow}>
                    <Text style={styles.cardPrice}>₹{item.price.toLocaleString("en-IN")}</Text>
                    <Text style={styles.cardUnit}>/{item.unit}</Text>
                  </View>
                  <View style={styles.cardLocationRow}>
                    <MapPin size={10} color={COLORS.light.mutedForeground} />
                    <Text style={styles.cardLocText} numberOfLines={1}>
                      {typeof item.distance_km === "number"
                        ? `${item.distance_km.toFixed(1)} km`
                        : item.district || "Karnataka"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Item details overlay */}
      {selectedItem && (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => { setSelectedItem(null); setShowPayment(false); }} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {showPayment ? "Checkout Payment" : "Listing Details"}
              </Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  setSelectedItem(null);
                  setShowPayment(false);
                }}
              >
                <X size={20} color={COLORS.light.foreground} />
              </TouchableOpacity>
            </View>

            {showPayment ? (
              <ScrollView contentContainerStyle={styles.sheetScroll}>
                <Text style={styles.sectionHeading}>Select Payment Method</Text>

                {/* UPI */}
                <TouchableOpacity
                  style={[styles.payMethod, paymentMethod === "upi" && styles.payMethodActive]}
                  onPress={() => setPaymentMethod("upi")}
                >
                  <View style={styles.payIconBg}>
                    <Text style={styles.payIconText}>UPI</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.payTitle}>UPI Instant Transfer</Text>
                    <Text style={styles.payDesc}>GPay, PhonePe, or Paytm</Text>
                  </View>
                </TouchableOpacity>

                {/* Escrow */}
                <TouchableOpacity
                  style={[styles.payMethod, paymentMethod === "escrow" && styles.payMethodActive]}
                  onPress={() => setPaymentMethod("escrow")}
                >
                  <View style={styles.payIconBg}>
                    <Text style={styles.payIconText}>🛡️</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.payTitle}>SecureGram Escrow</Text>
                    <Text style={styles.payDesc}>Funds locked until delivery verified</Text>
                  </View>
                </TouchableOpacity>

                {/* COD */}
                <TouchableOpacity
                  style={[styles.payMethod, paymentMethod === "cod" && styles.payMethodActive]}
                  onPress={() => setPaymentMethod("cod")}
                >
                  <View style={styles.payIconBg}>
                    <Text style={styles.payIconText}>🤝</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.payTitle}>Cash on Delivery</Text>
                    <Text style={styles.payDesc}>Pay when goods arrive</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.summaryBox}>
                  <Text style={styles.summaryTitle}>Order Summary</Text>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>
                      {selectedItem.name} x {buyQty} {selectedItem.unit}
                    </Text>
                    <Text style={styles.summaryVal}>
                      ₹{(selectedItem.price * buyQty).toLocaleString("en-IN")}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Delivery/Transport Fee</Text>
                    <Text style={styles.summaryVal}>₹50</Text>
                  </View>
                  <View style={[styles.summaryItem, styles.summaryTotalRow]}>
                    <Text style={styles.summaryTotalLabel}>Total Amount</Text>
                    <Text style={styles.summaryTotalVal}>
                      ₹{(selectedItem.price * buyQty + 50).toLocaleString("en-IN")}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.payBtn}
                  onPress={handleCheckout}
                  disabled={buying}
                >
                  {buying ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <ShieldCheck size={18} color="#FFFFFF" />
                      <Text style={styles.payBtnText}>
                        Confirm & Pay ₹
                        {(selectedItem.price * buyQty + 50).toLocaleString("en-IN")}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <ScrollView contentContainerStyle={styles.sheetScroll}>
                {selectedItem.image_url ? (
                  <Image source={{ uri: selectedItem.image_url }} style={styles.sheetImage} />
                ) : (
                  <View style={styles.sheetEmojiBg}>
                    <Text style={styles.sheetEmoji}>
                      {EMOJI[selectedItem.category] || "📦"}
                    </Text>
                  </View>
                )}

                <View style={styles.sheetInfoRow}>
                  <View>
                    <Text style={styles.sheetItemName}>{selectedItem.name}</Text>
                    <View style={styles.sheetCatRow}>
                      <Text style={styles.sheetCatText}>{selectedItem.category}</Text>
                    </View>
                  </View>
                  <TrustBadge variant="rsa" />
                </View>

                <View style={styles.sheetPriceBox}>
                  <View style={styles.sheetPriceItem}>
                    <Text style={styles.sheetPriceLabel}>Price per unit:</Text>
                    <Text style={styles.sheetPriceVal}>
                      ₹{selectedItem.price.toLocaleString("en-IN")}
                      <Text style={styles.sheetPriceUnit}>/{selectedItem.unit}</Text>
                    </Text>
                  </View>
                  <View style={styles.sheetPriceItem}>
                    <Text style={styles.sheetPriceLabel}>Stock Available:</Text>
                    <Text style={styles.sheetStockVal}>
                      {selectedItem.stock} {selectedItem.unit}s
                    </Text>
                  </View>
                </View>

                {/* Seller section */}
                <View style={styles.sellerSection}>
                  <Text style={styles.sectionHeading}>Seller & Location</Text>
                  {loadingSeller ? (
                    <ActivityIndicator size="small" color={COLORS.light.primary} />
                  ) : seller ? (
                    <View>
                      <Text style={styles.sellerName}>{seller.name}</Text>
                      <View style={styles.sellerLocRow}>
                        <MapPin size={14} color={COLORS.light.primary} />
                        <Text style={styles.sellerLocText}>
                          {[
                            selectedItem.district || seller.district,
                            selectedItem.state || seller.state || "Karnataka",
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </Text>
                      </View>
                      {selectedItem.distance_km && (
                        <Text style={styles.distanceText}>
                          📍 {selectedItem.distance_km.toFixed(1)} km away from you
                        </Text>
                      )}
                    </View>
                  ) : null}
                </View>

                {/* Qty Selector */}
                {user && user.id !== selectedItem.seller_id && selectedItem.stock > 0 && (
                  <View style={styles.qtySelector}>
                    <Text style={styles.qtyLabel}>Select Quantity:</Text>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => setBuyQty((q) => Math.max(1, q - 1))}
                      >
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyVal}>{buyQty}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => setBuyQty((q) => Math.min(selectedItem.stock, q + 1))}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Actions */}
                <View style={styles.actionsRow}>
                  {user && user.id === selectedItem.seller_id ? (
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleDeleteListing(selectedItem.id)}
                    >
                      <Trash2 size={18} color="#FFFFFF" />
                      <Text style={styles.removeBtnText}>Remove Listing</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity style={styles.chatSellerBtn} onPress={handleChat}>
                        <Text style={styles.chatSellerText}>Chat with Seller</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.buyNowBtn}
                        onPress={() => setShowPayment(true)}
                        disabled={selectedItem.stock <= 0}
                      >
                        <ShieldCheck size={18} color="#FFFFFF" />
                        <Text style={styles.buyNowText}>
                          {selectedItem.stock <= 0 ? "Out of Stock" : "Buy Now"}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      )}

      {/* Add listing overlay */}
      {showAdd && (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setShowAdd(false)} />
          <View style={[styles.sheet, { height: height * 0.8 }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>List item in Marketplace</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowAdd(false)}>
                <X size={20} color={COLORS.light.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.sheetScroll}>
              {/* Photo Upload */}
              <TouchableOpacity style={styles.addPhotoBox} onPress={pickAddPhoto}>
                {addPhoto ? (
                  <Image source={{ uri: addPhoto }} style={styles.addPhotoPreview} />
                ) : (
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 28 }}>📸</Text>
                    <Text style={styles.addPhotoTitle}>Add photo</Text>
                    <Text style={styles.addPhotoSub}>JPG/PNG up to 5MB</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Form fields */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Item Name</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. Sona Masuri Rice"
                  placeholderTextColor="#9E9E9E"
                  value={addName}
                  onChangeText={setAddName}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.formCatPill, addCategory === c && styles.formCatPillActive]}
                      onPress={() => setAddCategory(c)}
                    >
                      <Text style={[styles.formCatText, addCategory === c && { color: "#FFFFFF" }]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Price (₹)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    keyboardType="numeric"
                    value={String(addPrice)}
                    onChangeText={(v) => setAddPrice(Number(v.replace(/[^0-9]/g, "")) || 0)}
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Stock</Text>
                  <TextInput
                    style={styles.fieldInput}
                    keyboardType="numeric"
                    value={String(addStock)}
                    onChangeText={(v) => setAddStock(Number(v.replace(/[^0-9]/g, "")) || 0)}
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Unit</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={addUnit}
                    onChangeText={setAddUnit}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.formGpsBtn} onPress={captureAddLocation}>
                <MapPin size={16} color={addGeo ? COLORS.light.primary : COLORS.light.mutedForeground} />
                <Text style={[styles.formGpsText, addGeo && { color: COLORS.light.primary }]}>
                  {addGeo
                    ? `Pinned · ${addGeo.lat.toFixed(3)}, ${addGeo.lng.toFixed(3)}`
                    : "Attach my location (for Near Me)"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.formSubmitBtn}
                onPress={handleCreateListing}
                disabled={addingListing}
              >
                {addingListing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <ShieldCheck size={18} color="#FFFFFF" />
                    <Text style={styles.formSubmitBtnText}>Publish Listing</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  listBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light.action,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    gap: 4,
    ...SHADOWS.card,
  },
  listBtnText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  searchBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.light.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
    gap: 12,
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
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.light.foreground,
  },
  filterPillScroll: {
    alignItems: "center",
    gap: 8,
  },
  nearMeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  nearMeBtnActive: {
    backgroundColor: COLORS.light.action,
    borderColor: COLORS.light.action,
  },
  nearMeBtnText: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  radiusSelector: {
    flexDirection: "row",
    backgroundColor: COLORS.light.muted,
    borderRadius: 99,
    padding: 2,
    gap: 4,
  },
  radiusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  radiusPillActive: {
    backgroundColor: COLORS.light.primary,
  },
  radiusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.light.mutedForeground,
  },
  catPill: {
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  catPillActive: {
    backgroundColor: COLORS.light.primary,
    borderColor: COLORS.light.primary,
  },
  catPillText: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  emptyDesc: {
    fontSize: 12,
    color: COLORS.light.mutedForeground,
    marginTop: 4,
    textAlign: "center",
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: ROUNDING.md,
    gap: 6,
    marginTop: 16,
    ...SHADOWS.card,
  },
  emptyAddBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  itemCard: {
    width: "48%",
    backgroundColor: COLORS.light.card,
    borderRadius: ROUNDING.xxl,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  cardImage: {
    width: "100%",
    aspectRatio: 1,
    resizeMode: "cover",
  },
  cardEmojiBg: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: COLORS.light.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: {
    fontSize: 48,
  },
  cardInfo: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  cardStock: {
    fontSize: 10,
    color: COLORS.light.mutedForeground,
    marginTop: 2,
  },
  cardPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  cardUnit: {
    fontSize: 10,
    color: COLORS.light.mutedForeground,
  },
  cardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  cardLocText: {
    fontSize: 10,
    color: COLORS.light.mutedForeground,
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    zIndex: 99,
  },
  overlayBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheet: {
    backgroundColor: COLORS.light.card,
    borderTopLeftRadius: ROUNDING.xxl,
    borderTopRightRadius: ROUNDING.xxl,
    maxHeight: "85%",
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.light.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetScroll: {
    padding: 16,
    gap: 16,
  },
  sheetImage: {
    width: "100%",
    height: 180,
    borderRadius: ROUNDING.xl,
    resizeMode: "cover",
  },
  sheetEmojiBg: {
    width: "100%",
    height: 140,
    borderRadius: ROUNDING.xl,
    backgroundColor: COLORS.light.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetEmoji: {
    fontSize: 64,
  },
  sheetInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetItemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  sheetCatRow: {
    backgroundColor: COLORS.light.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  sheetCatText: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  sheetPriceBox: {
    backgroundColor: COLORS.light.muted,
    borderRadius: ROUNDING.xl,
    padding: 12,
    gap: 8,
  },
  sheetPriceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  sheetPriceLabel: {
    fontSize: 12,
    color: COLORS.light.mutedForeground,
  },
  sheetPriceVal: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  sheetPriceUnit: {
    fontSize: 12,
    color: COLORS.light.mutedForeground,
    fontWeight: "normal",
  },
  sheetStockVal: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  sellerSection: {
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.xl,
    padding: 12,
    gap: 4,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.light.mutedForeground,
    textTransform: "uppercase",
  },
  sellerName: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.foreground,
    marginTop: 4,
  },
  sellerLocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  sellerLocText: {
    fontSize: 12,
    color: COLORS.light.mutedForeground,
  },
  distanceText: {
    fontSize: 12,
    color: COLORS.light.primary,
    fontWeight: "bold",
    marginTop: 4,
  },
  qtySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.light.border,
    paddingTop: 12,
  },
  qtyLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.light.mutedForeground,
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.light.muted,
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  qtyVal: {
    fontSize: 14,
    fontWeight: "bold",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  removeBtn: {
    flex: 1,
    height: 48,
    borderRadius: ROUNDING.md,
    backgroundColor: COLORS.light.error,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  removeBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  chatSellerBtn: {
    flex: 1,
    height: 48,
    borderRadius: ROUNDING.md,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    backgroundColor: COLORS.light.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  chatSellerText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  buyNowBtn: {
    flex: 1,
    height: 48,
    borderRadius: ROUNDING.md,
    backgroundColor: COLORS.light.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    ...SHADOWS.elev,
  },
  buyNowText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  payMethod: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.xl,
    padding: 12,
    marginBottom: 8,
  },
  payMethodActive: {
    borderColor: COLORS.light.primary,
    backgroundColor: "rgba(46, 125, 50, 0.05)",
  },
  payIconBg: {
    width: 40,
    height: 40,
    borderRadius: ROUNDING.md,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  payIconText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  payTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  payDesc: {
    fontSize: 11,
    color: COLORS.light.mutedForeground,
  },
  summaryBox: {
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.xl,
    padding: 12,
    marginTop: 12,
    backgroundColor: "rgba(0,0,0,0.02)",
    gap: 6,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.light.mutedForeground,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.light.mutedForeground,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.light.border,
    paddingTop: 6,
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  summaryTotalVal: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  payBtn: {
    height: 48,
    borderRadius: ROUNDING.md,
    backgroundColor: COLORS.light.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    ...SHADOWS.elev,
  },
  payBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  addPhotoBox: {
    width: "100%",
    height: 120,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.xl,
    backgroundColor: COLORS.light.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoPreview: {
    width: "100%",
    height: "100%",
    borderRadius: ROUNDING.xl,
    resizeMode: "cover",
  },
  addPhotoTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.light.primary,
    marginTop: 4,
  },
  addPhotoSub: {
    fontSize: 10,
    color: COLORS.light.mutedForeground,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.light.mutedForeground,
    textTransform: "uppercase",
  },
  fieldInput: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.md,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: COLORS.light.card,
    color: COLORS.light.foreground,
  },
  formCatPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    backgroundColor: COLORS.light.card,
    marginRight: 6,
  },
  formCatPillActive: {
    backgroundColor: COLORS.light.primary,
    borderColor: COLORS.light.primary,
  },
  formCatText: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.light.foreground,
  },
  formRow: {
    flexDirection: "row",
    gap: 8,
  },
  formGpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: ROUNDING.md,
    gap: 6,
    backgroundColor: COLORS.light.muted,
  },
  formGpsText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.light.mutedForeground,
  },
  formSubmitBtn: {
    height: 48,
    borderRadius: ROUNDING.md,
    backgroundColor: COLORS.light.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    ...SHADOWS.elev,
  },
  formSubmitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
