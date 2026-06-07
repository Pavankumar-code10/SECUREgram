"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
var async_storage_1 = require("@react-native-async-storage/async-storage");
var supabase_js_1 = require("@supabase/supabase-js");
var SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
var SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase credentials missing from mobile environment variables!");
}
exports.supabase = (0, supabase_js_1.createClient)(SUPABASE_URL || "", SUPABASE_ANON_KEY || "", {
    auth: {
        storage: async_storage_1.default,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
