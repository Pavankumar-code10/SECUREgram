"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshUser = refreshUser;
exports.setUser = setUser;
exports.getUser = getUser;
exports.useUser = useUser;
exports.getInitials = getInitials;
var react_1 = require("react");
var supabase_1 = require("./supabase");
var listeners = new Set();
var cached = null;
var inflight = null;
function emit(u) {
    cached = u;
    listeners.forEach(function (l) { return l(u); });
}
function loadProfile() {
    return __awaiter(this, void 0, void 0, function () {
        var auth, profile;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, supabase_1.supabase.auth.getUser()];
                case 1:
                    auth = (_e.sent()).data;
                    if (!(auth === null || auth === void 0 ? void 0 : auth.user))
                        return [2 /*return*/, null];
                    return [4 /*yield*/, supabase_1.supabase
                            .from("profiles")
                            .select("id,name,phone,role,district,state,avatar_url")
                            .eq("id", auth.user.id)
                            .maybeSingle()];
                case 2:
                    profile = (_e.sent()).data;
                    if (!profile) {
                        return [2 /*return*/, {
                                id: auth.user.id,
                                name: ((_a = auth.user.user_metadata) === null || _a === void 0 ? void 0 : _a.name) || ((_b = auth.user.email) === null || _b === void 0 ? void 0 : _b.split("@")[0]) || "User",
                                phone: ((_c = auth.user.user_metadata) === null || _c === void 0 ? void 0 : _c.phone) || "",
                                role: (((_d = auth.user.user_metadata) === null || _d === void 0 ? void 0 : _d.role) || "farmer"),
                            }];
                    }
                    return [2 /*return*/, profile];
            }
        });
    });
}
function refreshUser() {
    if (!inflight) {
        inflight = loadProfile()
            .then(function (u) {
            emit(u);
            return u;
        })
            .catch(function (err) {
            console.warn("loadProfile error:", err);
            return null;
        })
            .finally(function () {
            inflight = null;
        });
    }
    return inflight;
}
// Global auth subscription
supabase_1.supabase.auth.onAuthStateChange(function () {
    refreshUser();
});
// Initial load
refreshUser();
function setUser(u) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(u === null)) return [3 /*break*/, 2];
                    return [4 /*yield*/, supabase_1.supabase.auth.signOut()];
                case 1:
                    _a.sent();
                    emit(null);
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
function getUser() {
    return cached;
}
function useUser() {
    var _a = (0, react_1.useState)(cached), user = _a[0], setU = _a[1];
    (0, react_1.useEffect)(function () {
        var l = function (u) { return setU(u); };
        listeners.add(l);
        if (cached === null) {
            refreshUser();
        }
        return function () {
            listeners.delete(l);
        };
    }, []);
    return user;
}
function getInitials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map(function (n) { var _a; return (_a = n[0]) === null || _a === void 0 ? void 0 : _a.toUpperCase(); }).join("") || "U";
}
