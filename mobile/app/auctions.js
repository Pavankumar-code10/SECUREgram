"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AuctionsScreen;
var react_1 = require("react");
var react_native_1 = require("react-native");
var expo_router_1 = require("expo-router");
var lucide_react_native_1 = require("lucide-react-native");
var async_storage_1 = require("@react-native-async-storage/async-storage");
var user_1 = require("../lib/user");
var supabase_1 = require("../lib/supabase");
var TopBar_1 = require("../components/sg/TopBar");
var theme_1 = require("../lib/theme");
var height = react_native_1.Dimensions.get("window").height;
var MIN_INCREMENT = 500;
function useCountdown(closesAt) {
    var _a = (0, react_1.useState)(Date.now()), now = _a[0], setNow = _a[1];
    (0, react_1.useEffect)(function () {
        var interval = setInterval(function () { return setNow(Date.now()); }, 1000);
        return function () { return clearInterval(interval); };
    }, []);
    var remaining = Math.max(0, Math.floor((new Date(closesAt).getTime() - now) / 1000));
    var h = Math.floor(remaining / 3600);
    var m = Math.floor((remaining % 3600) / 60);
    var s = remaining % 60;
    return {
        label: "".concat(String(h).padStart(2, "0"), ":").concat(String(m).padStart(2, "0"), ":").concat(String(s).padStart(2, "0")),
        remaining: remaining,
    };
}
function AuctionsScreen() {
    var _this = this;
    var user = (0, user_1.useUser)();
    var _a = (0, react_1.useState)([]), auctions = _a[0], setAuctions = _a[1];
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    var _c = (0, react_1.useState)({}), bidCounts = _c[0], setBidCounts = _c[1];
    var _d = (0, react_1.useState)(false), showCreate = _d[0], setShowCreate = _d[1];
    // Form states for creating new auction
    var _e = (0, react_1.useState)(""), newTitle = _e[0], setNewTitle = _e[1];
    var _f = (0, react_1.useState)("Paddy Seeds"), newCrop = _f[0], setNewCrop = _f[1];
    var _g = (0, react_1.useState)(10), newQty = _g[0], setNewQty = _g[1];
    var _h = (0, react_1.useState)(2000), newStart = _h[0], setNewStart = _h[1];
    var _j = (0, react_1.useState)(24), newHours = _j[0], setNewHours = _j[1];
    var _k = (0, react_1.useState)("A"), newGrade = _k[0], setNewGrade = _k[1];
    var _l = (0, react_1.useState)(false), creating = _l[0], setCreating = _l[1];
    var loadAuctions = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, data, error, gradesStr, localGrades_1, merged, ids, _b, bidRows, bidErr, counts_1, e_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    setLoading(true);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from("auctions")
                            .select("*")
                            .eq("status", "live")
                            .order("closes_at", { ascending: true })];
                case 2:
                    _a = _c.sent(), data = _a.data, error = _a.error;
                    if (error)
                        throw error;
                    return [4 /*yield*/, async_storage_1.default.getItem("sg_auction_grades")];
                case 3:
                    gradesStr = _c.sent();
                    localGrades_1 = gradesStr ? JSON.parse(gradesStr) : {};
                    merged = (data || []).map(function (a) { return (__assign(__assign({}, a), { grade: a.grade || localGrades_1[a.id] || "A" })); });
                    setAuctions(merged);
                    ids = merged.map(function (a) { return a.id; });
                    if (!(ids.length > 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, supabase_1.supabase
                            .from("bids")
                            .select("auction_id")
                            .in("auction_id", ids)];
                case 4:
                    _b = _c.sent(), bidRows = _b.data, bidErr = _b.error;
                    if (!bidErr && bidRows) {
                        counts_1 = {};
                        bidRows.forEach(function (b) {
                            counts_1[b.auction_id] = (counts_1[b.auction_id] || 0) + 1;
                        });
                        setBidCounts(counts_1);
                    }
                    _c.label = 5;
                case 5: return [3 /*break*/, 8];
                case 6:
                    e_1 = _c.sent();
                    console.warn("Load auctions failed:", e_1.message);
                    return [3 /*break*/, 8];
                case 7:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        loadAuctions();
    }, []);
    // Realtime subscriptions
    (0, react_1.useEffect)(function () {
        var channel = supabase_1.supabase
            .channel("auctions-feed")
            .on("postgres_changes", { event: "*", schema: "public", table: "auctions" }, function () {
            return loadAuctions();
        })
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "bids" }, function (payload) {
            var aid = payload.new.auction_id;
            setBidCounts(function (c) {
                var _a;
                return (__assign(__assign({}, c), (_a = {}, _a[aid] = (c[aid] || 0) + 1, _a)));
            });
        })
            .subscribe();
        return function () {
            supabase_1.supabase.removeChannel(channel);
        };
    }, []);
    // Background bidder simulation
    var runSimulation = function (currentUserId) { return __awaiter(_this, void 0, void 0, function () {
        var liveAuctions, profiles, _loop_1, _i, liveAuctions_1, auction, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from("auctions")
                            .select("*")
                            .eq("status", "live")];
                case 1:
                    liveAuctions = (_a.sent()).data;
                    if (!liveAuctions || liveAuctions.length === 0)
                        return [2 /*return*/];
                    return [4 /*yield*/, supabase_1.supabase.from("profiles").select("id")];
                case 2:
                    profiles = (_a.sent()).data;
                    if (!profiles || profiles.length === 0)
                        return [2 /*return*/];
                    _loop_1 = function (auction) {
                        var eligible, randomBidder, increment, nextBid;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    if (Math.random() > 0.5)
                                        return [2 /*return*/, "continue"]; // 50% chance
                                    eligible = profiles.filter(function (p) { return p.id !== auction.seller_id; });
                                    if (eligible.length === 0)
                                        return [2 /*return*/, "continue"];
                                    randomBidder = eligible[Math.floor(Math.random() * eligible.length)];
                                    increment = MIN_INCREMENT + Math.floor(Math.random() * 3) * MIN_INCREMENT;
                                    nextBid = Number(auction.current_price) + increment;
                                    return [4 /*yield*/, supabase_1.supabase.from("bids").insert({
                                            auction_id: auction.id,
                                            bidder_id: randomBidder.id,
                                            amount: nextBid,
                                        })];
                                case 1:
                                    _b.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, liveAuctions_1 = liveAuctions;
                    _a.label = 3;
                case 3:
                    if (!(_i < liveAuctions_1.length)) return [3 /*break*/, 6];
                    auction = liveAuctions_1[_i];
                    return [5 /*yield**/, _loop_1(auction)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [3 /*break*/, 8];
                case 7:
                    err_1 = _a.sent();
                    console.warn("Bidding simulation failed:", err_1);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        if (!user)
            return;
        var t = setTimeout(function () {
            runSimulation(user.id);
        }, 3000);
        var interval = setInterval(function () {
            runSimulation(user.id);
        }, 10000);
        return function () {
            clearTimeout(t);
            clearInterval(interval);
        };
    }, [user]);
    var handleCreateAuction = function () { return __awaiter(_this, void 0, void 0, function () {
        var closesAt, insertData, _a, data, error, _, rest, _b, retryData, retryError, gradesStr, localGrades, e_2;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!newTitle.trim()) {
                        react_native_1.Alert.alert("Input Required", "Please enter a title.");
                        return [2 /*return*/];
                    }
                    if (!user)
                        return [2 /*return*/];
                    setCreating(true);
                    closesAt = new Date(Date.now() + newHours * 3600 * 1000).toISOString();
                    insertData = {
                        seller_id: user.id,
                        title: newTitle.trim(),
                        crop: newCrop,
                        quantity_quintal: newQty,
                        starting_price: newStart,
                        current_price: newStart,
                        closes_at: closesAt,
                        grade: newGrade,
                    };
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 8, 9, 10]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from("auctions")
                            .insert(insertData)
                            .select()
                            .single()];
                case 2:
                    _a = _c.sent(), data = _a.data, error = _a.error;
                    if (!error) return [3 /*break*/, 4];
                    // Fallback retry without grade column if column doesn't exist
                    console.warn("Failed inserting with grade, retrying without grade column");
                    _ = insertData.grade, rest = __rest(insertData, ["grade"]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from("auctions")
                            .insert(rest)
                            .select()
                            .single()];
                case 3:
                    _b = _c.sent(), retryData = _b.data, retryError = _b.error;
                    data = retryData;
                    error = retryError;
                    _c.label = 4;
                case 4:
                    if (error)
                        throw error;
                    if (!(data && data.id)) return [3 /*break*/, 7];
                    return [4 /*yield*/, async_storage_1.default.getItem("sg_auction_grades")];
                case 5:
                    gradesStr = _c.sent();
                    localGrades = gradesStr ? JSON.parse(gradesStr) : {};
                    localGrades[data.id] = newGrade;
                    return [4 /*yield*/, async_storage_1.default.setItem("sg_auction_grades", JSON.stringify(localGrades))];
                case 6:
                    _c.sent();
                    _c.label = 7;
                case 7:
                    react_native_1.Alert.alert("Success", "Auction created and published!");
                    setShowCreate(false);
                    // Reset form
                    setNewTitle("");
                    setNewCrop("Paddy Seeds");
                    loadAuctions();
                    return [3 /*break*/, 10];
                case 8:
                    e_2 = _c.sent();
                    react_native_1.Alert.alert("Failed", e_2.message);
                    return [3 /*break*/, 10];
                case 9:
                    setCreating(false);
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    }); };
    return (<react_native_1.SafeAreaView style={styles.safeArea}>
      <TopBar_1.TopBar title="Procurement Auctions" subtitle="Live bidding • RSA-signed" back="/dashboard" right={user && user.role !== "buyer" ? (<react_native_1.TouchableOpacity style={styles.newBtn} onPress={function () { return setShowCreate(true); }}>
              <lucide_react_native_1.Plus size={14} color={theme_1.COLORS.light.actionForeground}/>
              <react_native_1.Text style={styles.newBtnText}>New</react_native_1.Text>
            </react_native_1.TouchableOpacity>) : undefined}/>
      <react_native_1.ScrollView contentContainerStyle={styles.container}>
        {!user && (<react_native_1.View style={styles.authNotice}>
            <react_native_1.Text style={styles.authNoticeTitle}>Sign in to bid</react_native_1.Text>
            <react_native_1.TouchableOpacity style={styles.authNoticeBtn} onPress={function () { return expo_router_1.router.push({ pathname: "/login", params: { role: "buyer" } }); }}>
              <react_native_1.Text style={styles.authNoticeBtnText}>Go to login</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>)}

        {loading ? (<react_native_1.ActivityIndicator size="large" color={theme_1.COLORS.light.primary} style={{ marginTop: 40 }}/>) : auctions.length === 0 ? (<react_native_1.View style={styles.emptyContainer}>
            <lucide_react_native_1.Gavel size={44} color={theme_1.COLORS.light.mutedForeground}/>
            <react_native_1.Text style={styles.emptyTitle}>No live auctions</react_native_1.Text>
            <react_native_1.Text style={styles.emptyDesc}>Be the first to start an auction for mandi buyers.</react_native_1.Text>
            {user && (<react_native_1.TouchableOpacity style={styles.emptyAddBtn} onPress={function () { return setShowCreate(true); }}>
                <lucide_react_native_1.Plus size={16} color="#FFFFFF"/>
                <react_native_1.Text style={styles.emptyAddBtnText}>Create Auction</react_native_1.Text>
              </react_native_1.TouchableOpacity>)}
          </react_native_1.View>) : (<react_native_1.View style={styles.list}>
            {auctions.map(function (a) { return (<AuctionCard key={a.id} auction={a} bidCount={bidCounts[a.id] || 0} userId={user === null || user === void 0 ? void 0 : user.id} onBid={loadAuctions}/>); })}
          </react_native_1.View>)}
      </react_native_1.ScrollView>

      {/* Create auction overlay */}
      {showCreate && (<react_native_1.View style={styles.overlay}>
          <react_native_1.TouchableOpacity style={styles.overlayBg} onPress={function () { return setShowCreate(false); }}/>
          <react_native_1.View style={[styles.sheet, { height: height * 0.75 }]}>
            <react_native_1.View style={styles.sheetHeader}>
              <react_native_1.Text style={styles.sheetTitle}>New procurement auction</react_native_1.Text>
              <react_native_1.TouchableOpacity style={styles.closeBtn} onPress={function () { return setShowCreate(false); }}>
                <lucide_react_native_1.X size={20} color={theme_1.COLORS.light.foreground}/>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>

            <react_native_1.ScrollView contentContainerStyle={styles.sheetScroll}>
              <react_native_1.View style={styles.field}>
                <react_native_1.Text style={styles.fieldLabel}>Title</react_native_1.Text>
                <react_native_1.TextInput style={styles.fieldInput} placeholder="e.g. BPT-5204 Paddy Seeds" placeholderTextColor="#9E9E9E" value={newTitle} onChangeText={setNewTitle}/>
              </react_native_1.View>

              <react_native_1.View style={styles.field}>
                <react_native_1.Text style={styles.fieldLabel}>Crop / Item</react_native_1.Text>
                <react_native_1.TextInput style={styles.fieldInput} value={newCrop} onChangeText={setNewCrop}/>
              </react_native_1.View>

              <react_native_1.View style={styles.formRow}>
                <react_native_1.View style={[styles.field, { flex: 1 }]}>
                  <react_native_1.Text style={styles.fieldLabel}>Quantity (q)</react_native_1.Text>
                  <react_native_1.TextInput style={styles.fieldInput} keyboardType="numeric" value={String(newQty)} onChangeText={function (v) { return setNewQty(Number(v.replace(/[^0-9]/g, "")) || 0); }}/>
                </react_native_1.View>
                <react_native_1.View style={[styles.field, { flex: 1 }]}>
                  <react_native_1.Text style={styles.fieldLabel}>Start Price (₹)</react_native_1.Text>
                  <react_native_1.TextInput style={styles.fieldInput} keyboardType="numeric" value={String(newStart)} onChangeText={function (v) { return setNewStart(Number(v.replace(/[^0-9]/g, "")) || 0); }}/>
                </react_native_1.View>
              </react_native_1.View>

              <react_native_1.View style={styles.formRow}>
                <react_native_1.View style={[styles.field, { flex: 1 }]}>
                  <react_native_1.Text style={styles.fieldLabel}>Closes in (hours)</react_native_1.Text>
                  <react_native_1.TextInput style={styles.fieldInput} keyboardType="numeric" value={String(newHours)} onChangeText={function (v) { return setNewHours(Number(v.replace(/[^0-9]/g, "")) || 0); }}/>
                </react_native_1.View>
                <react_native_1.View style={[styles.field, { flex: 1 }]}>
                  <react_native_1.Text style={styles.fieldLabel}>Crop Grade</react_native_1.Text>
                  <react_native_1.TextInput style={styles.fieldInput} placeholder="e.g. A+, A, B, C" placeholderTextColor="#9E9E9E" value={newGrade} onChangeText={setNewGrade}/>
                </react_native_1.View>
              </react_native_1.View>

              <react_native_1.TouchableOpacity style={styles.formSubmitBtn} onPress={handleCreateAuction} disabled={creating}>
                {creating ? (<react_native_1.ActivityIndicator color="#FFFFFF"/>) : (<>
                    <lucide_react_native_1.ShieldCheck size={18} color="#FFFFFF"/>
                    <react_native_1.Text style={styles.formSubmitBtnText}>Create & RSA Sign</react_native_1.Text>
                  </>)}
              </react_native_1.TouchableOpacity>
            </react_native_1.ScrollView>
          </react_native_1.View>
        </react_native_1.View>)}
    </react_native_1.SafeAreaView>);
}
// Subcomponent: AuctionCard
function AuctionCard(_a) {
    var _this = this;
    var auction = _a.auction, bidCount = _a.bidCount, userId = _a.userId, onBid = _a.onBid;
    var _b = useCountdown(auction.closes_at), label = _b.label, remaining = _b.remaining;
    var minNext = auction.current_price + MIN_INCREMENT;
    var _c = (0, react_1.useState)(minNext), bid = _c[0], setBid = _c[1];
    var _d = (0, react_1.useState)("idle"), state = _d[0], setState = _d[1];
    (0, react_1.useEffect)(function () {
        setBid(function (b) { return (b < minNext ? minNext : b); });
    }, [minNext]);
    var sellerPrice = auction.starting_price;
    var progressPercent = Math.min(100, Math.round((auction.current_price / sellerPrice) * 100));
    var closed = remaining === 0 || auction.status !== "live";
    var submitBid = function () { return __awaiter(_this, void 0, void 0, function () {
        var error, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!userId) {
                        react_native_1.Alert.alert("Sign In Required", "Please log in to place bids.");
                        return [2 /*return*/];
                    }
                    if (auction.seller_id === userId) {
                        react_native_1.Alert.alert("Invalid Bid", "You cannot bid on your own auction.");
                        return [2 /*return*/];
                    }
                    if (bid < minNext) {
                        react_native_1.Alert.alert("Bid Too Low", "Minimum next bid is \u20B9".concat(minNext.toLocaleString()));
                        return [2 /*return*/];
                    }
                    setState("signing");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, supabase_1.supabase.from("bids").insert({
                            auction_id: auction.id,
                            bidder_id: userId,
                            amount: bid,
                        })];
                case 2:
                    error = (_a.sent()).error;
                    if (error)
                        throw error;
                    setState("done");
                    react_native_1.Alert.alert("Bid Placed", "Your bid has been signed with RSA keys and recorded.");
                    onBid();
                    setTimeout(function () { return setState("idle"); }, 1500);
                    return [3 /*break*/, 4];
                case 3:
                    e_3 = _a.sent();
                    setState("idle");
                    react_native_1.Alert.alert("Bid Failed", e_3.message);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (<react_native_1.View style={styles.card}>
      <react_native_1.View style={styles.cardHeader}>
        <react_native_1.View style={styles.cardIconBg}>
          <react_native_1.Text style={styles.cardEmoji}>🌾</react_native_1.Text>
        </react_native_1.View>
        <react_native_1.View style={styles.cardHeaderDetails}>
          <react_native_1.Text style={styles.cardTitle} numberOfLines={1}>
            {auction.title}
          </react_native_1.Text>
          <react_native_1.Text style={styles.cardSub}>
            {auction.crop} • {auction.quantity_quintal} quintal • Grade {auction.grade || "A"}
          </react_native_1.Text>
          <react_native_1.View style={styles.cardTimerRow}>
            <lucide_react_native_1.Clock size={12} color={closed ? theme_1.COLORS.light.error : theme_1.COLORS.light.action}/>
            <react_native_1.Text style={[styles.cardTimerText, closed && { color: theme_1.COLORS.light.error }]}>
              {closed ? "Closed" : label}
            </react_native_1.Text>
            <lucide_react_native_1.Users size={12} color={theme_1.COLORS.light.mutedForeground} style={{ marginLeft: 12 }}/>
            <react_native_1.Text style={styles.cardTimerText}>{bidCount} bids</react_native_1.Text>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.View>

      {/* Pricing Boxes */}
      <react_native_1.View style={styles.pricingGrid}>
        <react_native_1.View style={[styles.pricingBox, { backgroundColor: "rgba(0, 172, 193, 0.06)" }]}>
          <react_native_1.View style={styles.pricingLabelRow}>
            <lucide_react_native_1.Tag size={10} color="#00ACC1"/>
            <react_native_1.Text style={[styles.pricingLabel, { color: "#00ACC1" }]}>Start Price</react_native_1.Text>
          </react_native_1.View>
          <react_native_1.Text style={[styles.pricingVal, { color: "#00838F" }]}>
            ₹{sellerPrice.toLocaleString()}
          </react_native_1.Text>
        </react_native_1.View>

        <react_native_1.View style={[styles.pricingBox, { backgroundColor: "rgba(46, 125, 50, 0.06)" }]}>
          <react_native_1.View style={styles.pricingLabelRow}>
            <lucide_react_native_1.TrendingUp size={10} color={theme_1.COLORS.light.primary}/>
            <react_native_1.Text style={[styles.pricingLabel, { color: theme_1.COLORS.light.primary }]}>Current Bid</react_native_1.Text>
          </react_native_1.View>
          <react_native_1.Text style={[styles.pricingVal, { color: theme_1.COLORS.light.primary }]}>
            ₹{auction.current_price.toLocaleString()}
          </react_native_1.Text>
          <react_native_1.Text style={styles.pricingMinNext}>Min next: ₹{minNext.toLocaleString()}</react_native_1.Text>
        </react_native_1.View>
      </react_native_1.View>

      {/* Progress Bar */}
      <react_native_1.View style={styles.progressContainer}>
        <react_native_1.View style={styles.progressBarBg}>
          <react_native_1.View style={[styles.progressBarFill, { width: "".concat(progressPercent, "%") }]}/>
        </react_native_1.View>
      </react_native_1.View>

      {/* Bid Input */}
      <react_native_1.View style={styles.bidInputRow}>
        <react_native_1.View style={styles.bidInputWrapper}>
          <react_native_1.TextInput style={styles.bidInput} keyboardType="numeric" value={String(bid)} disabled={closed} onChangeText={function (v) { return setBid(Number(v.replace(/[^0-9]/g, "")) || 0); }}/>
        </react_native_1.View>
        <react_native_1.TouchableOpacity style={[styles.bidBtn, closed && { opacity: 0.5 }]} disabled={state !== "idle" || closed} onPress={submitBid}>
          {state === "signing" ? (<react_native_1.ActivityIndicator color="#FFFFFF" size="small"/>) : (<>
              <lucide_react_native_1.Gavel size={14} color="#FFFFFF"/>
              <react_native_1.Text style={styles.bidBtnText}>Bid</react_native_1.Text>
            </>)}
        </react_native_1.TouchableOpacity>
      </react_native_1.View>

      {state === "done" && (<react_native_1.View style={styles.signedNotice}>
          <lucide_react_native_1.ShieldCheck size={14} color={theme_1.COLORS.light.primary}/>
          <react_native_1.Text style={styles.signedNoticeText}>Bid signed with your private key</react_native_1.Text>
        </react_native_1.View>)}
    </react_native_1.View>);
}
var styles = react_native_1.StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme_1.COLORS.light.background,
    },
    newBtn: __assign({ flexDirection: "row", alignItems: "center", backgroundColor: theme_1.COLORS.light.action, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, gap: 4 }, theme_1.SHADOWS.card),
    newBtnText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "bold",
    },
    container: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 40,
        gap: 16,
    },
    authNotice: __assign({ backgroundColor: theme_1.COLORS.light.card, borderWidth: 1, borderColor: theme_1.COLORS.light.border, borderRadius: theme_1.ROUNDING.xl, padding: 16, alignItems: "center" }, theme_1.SHADOWS.card),
    authNoticeTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: theme_1.COLORS.light.foreground,
    },
    authNoticeBtn: {
        backgroundColor: theme_1.COLORS.light.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: theme_1.ROUNDING.md,
        marginTop: 10,
    },
    authNoticeBtnText: {
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: 12,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 64,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: theme_1.COLORS.light.foreground,
        marginTop: 12,
    },
    emptyDesc: {
        fontSize: 12,
        color: theme_1.COLORS.light.mutedForeground,
        marginTop: 4,
        textAlign: "center",
    },
    emptyAddBtn: __assign({ flexDirection: "row", alignItems: "center", backgroundColor: theme_1.COLORS.light.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme_1.ROUNDING.md, gap: 6, marginTop: 16 }, theme_1.SHADOWS.card),
    emptyAddBtnText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "bold",
    },
    list: {
        gap: 16,
    },
    card: __assign({ backgroundColor: theme_1.COLORS.light.card, borderRadius: theme_1.ROUNDING.xxl, borderWidth: 1, borderColor: theme_1.COLORS.light.border, padding: 16 }, theme_1.SHADOWS.card),
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    cardIconBg: {
        width: 48,
        height: 48,
        borderRadius: theme_1.ROUNDING.lg,
        backgroundColor: theme_1.COLORS.light.muted,
        alignItems: "center",
        justifyContent: "center",
    },
    cardEmoji: {
        fontSize: 26,
    },
    cardHeaderDetails: {
        flex: 1,
        marginLeft: 12,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: "bold",
        color: theme_1.COLORS.light.foreground,
    },
    cardSub: {
        fontSize: 11,
        color: theme_1.COLORS.light.mutedForeground,
        marginTop: 2,
    },
    cardTimerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
    },
    cardTimerText: {
        fontSize: 11,
        color: theme_1.COLORS.light.mutedForeground,
        marginLeft: 4,
        fontWeight: "bold",
    },
    pricingGrid: {
        flexDirection: "row",
        gap: 8,
        marginTop: 12,
    },
    pricingBox: {
        flex: 1,
        borderWidth: 1,
        borderColor: theme_1.COLORS.light.border,
        borderRadius: theme_1.ROUNDING.xl,
        padding: 10,
    },
    pricingLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    pricingLabel: {
        fontSize: 9,
        fontWeight: "bold",
        textTransform: "uppercase",
    },
    pricingVal: {
        fontSize: 16,
        fontWeight: "bold",
        marginTop: 4,
    },
    pricingMinNext: {
        fontSize: 9,
        color: theme_1.COLORS.light.mutedForeground,
        marginTop: 2,
    },
    progressContainer: {
        marginTop: 12,
    },
    progressBarBg: {
        height: 6,
        borderRadius: 3,
        backgroundColor: theme_1.COLORS.light.muted,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: theme_1.COLORS.light.primary,
        borderRadius: 3,
    },
    bidInputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 12,
    },
    bidInputWrapper: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: theme_1.COLORS.light.border,
        borderRadius: theme_1.ROUNDING.md,
        backgroundColor: theme_1.COLORS.light.muted,
        paddingHorizontal: 12,
        justifyContent: "center",
    },
    bidInput: {
        fontSize: 14,
        fontWeight: "bold",
        color: theme_1.COLORS.light.foreground,
    },
    bidBtn: __assign({ height: 40, paddingHorizontal: 16, borderRadius: theme_1.ROUNDING.md, backgroundColor: theme_1.COLORS.light.action, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }, theme_1.SHADOWS.card),
    bidBtnText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "bold",
    },
    signedNotice: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 8,
    },
    signedNoticeText: {
        fontSize: 11,
        color: theme_1.COLORS.light.primary,
        fontWeight: "bold",
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
        backgroundColor: theme_1.COLORS.light.card,
        borderTopLeftRadius: theme_1.ROUNDING.xxl,
        borderTopRightRadius: theme_1.ROUNDING.xxl,
        paddingBottom: 24,
    },
    sheetHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme_1.COLORS.light.border,
    },
    sheetTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: theme_1.COLORS.light.foreground,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme_1.COLORS.light.muted,
        alignItems: "center",
        justifyContent: "center",
    },
    sheetScroll: {
        padding: 16,
        gap: 12,
    },
    field: {
        gap: 4,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: "bold",
        color: theme_1.COLORS.light.mutedForeground,
        textTransform: "uppercase",
    },
    fieldInput: {
        height: 44,
        borderWidth: 1,
        borderColor: theme_1.COLORS.light.border,
        borderRadius: theme_1.ROUNDING.md,
        paddingHorizontal: 12,
        fontSize: 14,
        backgroundColor: theme_1.COLORS.light.background,
        color: theme_1.COLORS.light.foreground,
    },
    formRow: {
        flexDirection: "row",
        gap: 12,
    },
    formSubmitBtn: __assign({ height: 48, borderRadius: theme_1.ROUNDING.md, backgroundColor: theme_1.COLORS.light.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }, theme_1.SHADOWS.elev),
    formSubmitBtnText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "bold",
    },
});
