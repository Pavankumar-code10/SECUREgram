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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProvider = void 0;
exports.useNotifications = useNotifications;
var react_1 = require("react");
var react_native_1 = require("react-native");
var async_storage_1 = require("@react-native-async-storage/async-storage");
var expo_router_1 = require("expo-router");
var supabase_1 = require("../lib/supabase");
var user_1 = require("../lib/user");
var NotificationContext = (0, react_1.createContext)(undefined);
var NotificationProvider = function (_a) {
    var children = _a.children;
    var user = (0, user_1.useUser)();
    var _b = (0, react_1.useState)([]), notifications = _b[0], setNotifications = _b[1];
    var _c = (0, react_1.useState)(false), loading = _c[0], setLoading = _c[1];
    var _d = (0, react_1.useState)(false), isOpen = _d[0], setIsOpen = _d[1];
    var unreadCount = notifications.filter(function (n) { return !n.is_read; }).length;
    var fetchNotifications = function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        var localNotifKey, local, localStr, e_1, _a, data, error, remote, merged_1, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setLoading(true);
                    localNotifKey = "sg_notifications_".concat(userId);
                    local = [];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, async_storage_1.default.getItem(localNotifKey)];
                case 2:
                    localStr = _b.sent();
                    local = localStr ? JSON.parse(localStr) : [];
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _b.sent();
                    console.warn("Error reading local notifications:", e_1);
                    return [3 /*break*/, 4];
                case 4:
                    _b.trys.push([4, 7, 8, 9]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from("notifications")
                            .select("*")
                            .eq("user_id", userId)
                            .order("created_at", { ascending: false })];
                case 5:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        if (error.message.includes("does not exist")) {
                            console.warn("Notifications table does not exist yet. Using local cache.");
                            setNotifications(local);
                            return [2 /*return*/];
                        }
                        throw error;
                    }
                    remote = data || [];
                    merged_1 = __spreadArray([], local, true);
                    remote.forEach(function (rt) {
                        if (!merged_1.some(function (lt) { return lt.id === rt.id; })) {
                            merged_1.push(rt);
                        }
                    });
                    merged_1.sort(function (a, b) { return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); });
                    setNotifications(merged_1);
                    return [4 /*yield*/, async_storage_1.default.setItem(localNotifKey, JSON.stringify(merged_1))];
                case 6:
                    _b.sent();
                    return [3 /*break*/, 9];
                case 7:
                    err_1 = _b.sent();
                    console.error("Error loading notifications:", err_1.message);
                    setNotifications(local);
                    return [3 /*break*/, 9];
                case 8:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        if (!user) {
            setNotifications([]);
            return;
        }
        fetchNotifications(user.id);
        // Subscribe to real-time notifications
        var channel = supabase_1.supabase
            .channel("user-notifications-".concat(user.id))
            .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: "user_id=eq.".concat(user.id),
        }, function (payload) { return __awaiter(void 0, void 0, void 0, function () {
            var newNotif_1, updated_1, deleted_1;
            return __generator(this, function (_a) {
                if (payload.eventType === "INSERT") {
                    newNotif_1 = payload.new;
                    setNotifications(function (prev) {
                        var updated = __spreadArray([newNotif_1], prev, true);
                        var localNotifKey = "sg_notifications_".concat(user.id);
                        async_storage_1.default.setItem(localNotifKey, JSON.stringify(updated)).catch(function (e) {
                            return console.warn(e);
                        });
                        return updated;
                    });
                    // Show native alert in Expo app
                    react_native_1.Alert.alert(newNotif_1.title, newNotif_1.message, __spreadArray([
                        {
                            text: "Dismiss",
                            style: "cancel",
                        }
                    ], (newNotif_1.link
                        ? [
                            {
                                text: "View",
                                onPress: function () { return navigateToNotification(newNotif_1); },
                            },
                        ]
                        : []), true));
                }
                else if (payload.eventType === "UPDATE") {
                    updated_1 = payload.new;
                    setNotifications(function (prev) {
                        var next = prev.map(function (n) { return (n.id === updated_1.id ? updated_1 : n); });
                        var localNotifKey = "sg_notifications_".concat(user.id);
                        async_storage_1.default.setItem(localNotifKey, JSON.stringify(next)).catch(function (e) {
                            return console.warn(e);
                        });
                        return next;
                    });
                }
                else if (payload.eventType === "DELETE") {
                    deleted_1 = payload.old;
                    setNotifications(function (prev) {
                        var next = prev.filter(function (n) { return n.id !== deleted_1.id; });
                        var localNotifKey = "sg_notifications_".concat(user.id);
                        async_storage_1.default.setItem(localNotifKey, JSON.stringify(next)).catch(function (e) {
                            return console.warn(e);
                        });
                        return next;
                    });
                }
                return [2 /*return*/];
            });
        }); })
            .subscribe();
        return function () {
            supabase_1.supabase.removeChannel(channel);
        };
    }, [user === null || user === void 0 ? void 0 : user.id]);
    var markAsRead = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var localNotifKey, localStr, local, updated, e_2, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setNotifications(function (prev) { return prev.map(function (n) { return (n.id === id ? __assign(__assign({}, n), { is_read: true }) : n); }); });
                    if (!user) return [3 /*break*/, 5];
                    localNotifKey = "sg_notifications_".concat(user.id);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, async_storage_1.default.getItem(localNotifKey)];
                case 2:
                    localStr = _a.sent();
                    local = localStr ? JSON.parse(localStr) : [];
                    updated = local.map(function (n) { return (n.id === id ? __assign(__assign({}, n), { is_read: true }) : n); });
                    return [4 /*yield*/, async_storage_1.default.setItem(localNotifKey, JSON.stringify(updated))];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    e_2 = _a.sent();
                    console.warn(e_2);
                    return [3 /*break*/, 5];
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from("notifications")
                            .update({ is_read: true })
                            .eq("id", id)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    err_2 = _a.sent();
                    console.warn("Failed to mark notification as read in database:", err_2.message);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var markAllAsRead = function () { return __awaiter(void 0, void 0, void 0, function () {
        var localNotifKey, localStr, local, updated, e_3, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!user || unreadCount === 0)
                        return [2 /*return*/];
                    setNotifications(function (prev) { return prev.map(function (n) { return (__assign(__assign({}, n), { is_read: true })); }); });
                    localNotifKey = "sg_notifications_".concat(user.id);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, async_storage_1.default.getItem(localNotifKey)];
                case 2:
                    localStr = _a.sent();
                    local = localStr ? JSON.parse(localStr) : [];
                    updated = local.map(function (n) { return (__assign(__assign({}, n), { is_read: true })); });
                    return [4 /*yield*/, async_storage_1.default.setItem(localNotifKey, JSON.stringify(updated))];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    e_3 = _a.sent();
                    console.warn(e_3);
                    return [3 /*break*/, 5];
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from("notifications")
                            .update({ is_read: true })
                            .eq("user_id", user.id)
                            .eq("is_read", false)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    err_3 = _a.sent();
                    console.warn("Failed to mark all as read in database:", err_3.message);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var deleteNotification = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var localNotifKey, localStr, local, updated, e_4, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setNotifications(function (prev) { return prev.filter(function (n) { return n.id !== id; }); });
                    if (!user) return [3 /*break*/, 5];
                    localNotifKey = "sg_notifications_".concat(user.id);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, async_storage_1.default.getItem(localNotifKey)];
                case 2:
                    localStr = _a.sent();
                    local = localStr ? JSON.parse(localStr) : [];
                    updated = local.filter(function (n) { return n.id !== id; });
                    return [4 /*yield*/, async_storage_1.default.setItem(localNotifKey, JSON.stringify(updated))];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    e_4 = _a.sent();
                    console.warn(e_4);
                    return [3 /*break*/, 5];
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from("notifications")
                            .delete()
                            .eq("id", id)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    err_4 = _a.sent();
                    console.warn("Failed to delete notification in database:", err_4.message);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var navigateToNotification = function (notification) {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        setIsOpen(false);
        if (!notification.link)
            return;
        if (notification.link.startsWith("/chat?to=")) {
            var to = notification.link.split("/chat?to=")[1];
            expo_router_1.router.push({ pathname: "/chat-thread", params: { partnerId: to } });
        }
        else if (notification.link.startsWith("/chat")) {
            expo_router_1.router.push("/chat");
        }
        else if (notification.link.startsWith("/transactions")) {
            expo_router_1.router.push("/transactions");
        }
        else if (notification.link.startsWith("/dashboard")) {
            expo_router_1.router.push("/dashboard");
        }
        else if (notification.link.startsWith("/marketplace")) {
            expo_router_1.router.push("/marketplace");
        }
        else {
            // General path routing
            var cleanPath = notification.link.replace(/^\//, "");
            expo_router_1.router.push("/".concat(cleanPath));
        }
    };
    return react_1.default.createElement(NotificationContext.Provider, {
        value: {
            notifications: notifications,
            unreadCount: unreadCount,
            loading: loading,
            isOpen: isOpen,
            setIsOpen: setIsOpen,
            markAsRead: markAsRead,
            markAllAsRead: markAllAsRead,
            deleteNotification: deleteNotification,
            navigateToNotification: navigateToNotification,
        },
    }, children);
};
exports.NotificationProvider = NotificationProvider;
function useNotifications() {
    var context = (0, react_1.useContext)(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
