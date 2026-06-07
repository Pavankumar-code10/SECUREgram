# 🌾 SecureGram — Agri-Commerce Platform for Farmers

> A full-stack digital marketplace connecting farmers and buyers across Karnataka, with live mandi price tracking, crop auctions, smart matchmaking, and AI-powered crop advisory.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Web App Setup](#web-app-setup)
  - [Mobile App Setup](#mobile-app-setup)
  - [Environment Variables](#environment-variables)
- [Database & Migrations](#-database--migrations)
- [Running the Apps](#-running-the-apps)
- [Key Modules](#-key-modules)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## 🌟 Overview

SecureGram is a bilingual (English + Kannada) agri-commerce platform built for the Karnataka farming ecosystem. It bridges the gap between farmers and buyers by:

- Providing **real-time Mandi price data** from `data.gov.in` (Agmarknet API)
- Running **live crop auctions** with automated bidding simulation
- Offering a **marketplace** for produce listings with chat between buyers & sellers
- Delivering **AI-powered crop advisory** (ACRE AI)
- Matching farmers to the most suitable buyers via **Smart Match**

The platform ships as both a **web application** (TanStack Start + Vite) and a **React Native mobile app** (Expo SDK 51).

---

## ✨ Features

### For Farmers
| Feature | Description |
|---|---|
| 🌾 **Sell Produce** | List crops with photos, price, quantity, location |
| 🏷️ **Live Auctions** | Create timed auctions; buyers bid in real time |
| 📊 **Mandi Prices** | Real-time ₹/quintal rates from Agmarknet API (6-hour cache) |
| 💡 **Crop Advisory** | ACRE AI recommends crops based on season & soil |
| 🤝 **Smart Match** | Discover verified buyers near your district |
| 💬 **Chat** | In-app messaging with buyers |
| 🔔 **Notifications** | Real-time alerts for bids, orders, messages |

### For Buyers
| Feature | Description |
|---|---|
| 🛒 **Marketplace** | Browse & filter produce by crop, district, price |
| ⚡ **Live Auctions** | Place bids on bulk crop lots |
| 💬 **Chat with Farmers** | Direct messaging with produce sellers |
| 📦 **Order Tracking** | View transaction history and order status |
| 📈 **Price Trends** | 7/30/90-day sparkline charts on dashboard |

### Platform-wide
- 🔐 **Supabase Auth** — Email/password + Google OAuth
- 🛡️ **Trust Badges** — Verified & RSA certified user badges
- 📱 **Bilingual UI** — English + ಕನ್ನಡ (Kannada)
- 🌙 **Auto dark/light mode**

---

## 🛠️ Tech Stack

### Web Application
| Layer | Technology |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) + [Vite 7](https://vitejs.dev/) |
| Routing | [TanStack Router](https://tanstack.com/router) |
| State / Data | [TanStack Query](https://tanstack.com/query) |
| UI Components | [Radix UI](https://www.radix-ui.com/) primitives |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Forms | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Charts | [Recharts](https://recharts.org/) |
| Toast | [Sonner](https://sonner.emilkowal.ski/) |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) |
| Edge/Deploy | Cloudflare (via `@cloudflare/vite-plugin`) |

### Mobile Application
| Layer | Technology |
|---|---|
| Framework | [Expo SDK 51](https://expo.dev/) |
| Navigation | [Expo Router v3](https://expo.github.io/router/) |
| Language | TypeScript |
| Backend | Supabase JS `@supabase/supabase-js` |
| Storage | `@react-native-async-storage/async-storage` |
| Icons | `lucide-react-native` |

### Backend / Infrastructure
| Service | Purpose |
|---|---|
| [Supabase](https://supabase.com/) | Postgres DB, Auth, Storage, Row-Level Security |
| [Agmarknet API](https://data.gov.in/) | Live mandi crop prices |
| [data.gov.in MSP API](https://data.gov.in/) | Government Minimum Support Prices |
| Cloudflare Workers | Edge deployment for web app |

---

## 📁 Project Structure

```
secure-gram-design/
│
├── src/                          # Web application source
│   ├── routes/                   # TanStack Router pages
│   │   ├── __root.tsx            # Root layout (auth guard, notifications)
│   │   ├── index.tsx             # Landing / redirect
│   │   ├── login.tsx             # Auth — login & register
│   │   ├── onboarding.tsx        # New user role selection
│   │   ├── dashboard.tsx         # Home dashboard (charts, quick actions)
│   │   ├── marketplace.tsx       # Produce marketplace + seller chat
│   │   ├── sell.tsx              # Create produce listing
│   │   ├── auctions.tsx          # Live auction room
│   │   ├── transactions.tsx      # Order / transaction history
│   │   ├── match.tsx             # Smart buyer-farmer matchmaking
│   │   ├── recommend.tsx         # ACRE AI crop advisory
│   │   ├── chat.tsx              # Messaging center
│   │   ├── profile.tsx           # User profile & settings
│   │   └── google-signin.tsx     # Google OAuth callback
│   │
│   ├── components/
│   │   ├── sg/                   # SecureGram custom components
│   │   │   ├── TopBar.tsx        # App top bar
│   │   │   ├── BottomNav.tsx     # Bottom navigation
│   │   │   └── Badge.tsx         # Trust / RSA badges
│   │   └── ui/                   # Radix-based shadcn/ui components
│   │
│   ├── lib/
│   │   ├── mandi.functions.ts    # Server functions: Agmarknet, MSP, auctions
│   │   ├── sg/
│   │   │   └── user.ts           # useUser hook, getInitials helper
│   │   └── utils.ts              # cn() utility
│   │
│   ├── hooks/
│   │   └── useNotifications.ts   # Real-time notification hook
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts         # Browser Supabase client
│   │       └── client.server.ts  # Server-side admin client
│   │
│   ├── styles.css                # Global Tailwind + design tokens
│   ├── router.tsx                # Router configuration
│   └── server.ts                 # Nitro server entry
│
├── mobile/                       # React Native / Expo app
│   ├── app/
│   │   ├── _layout.tsx           # Root layout (auth state)
│   │   ├── index.tsx             # Entry redirect
│   │   ├── login.tsx             # Mobile login/register screen
│   │   ├── onboarding.tsx        # Role selection screen
│   │   ├── auctions.tsx          # Auctions screen
│   │   ├── chat-thread.tsx       # Individual chat thread
│   │   ├── match.tsx             # Smart match screen
│   │   ├── transactions.tsx      # Transactions screen
│   │   └── (tabs)/               # Bottom tab navigator
│   │       ├── _layout.tsx       # Tab bar config
│   │       ├── dashboard.tsx     # Home tab
│   │       ├── marketplace.tsx   # Marketplace tab
│   │       ├── sell.tsx          # Sell tab
│   │       ├── chat.tsx          # Chat tab
│   │       └── profile.tsx       # Profile tab
│   │
│   ├── components/               # Mobile-specific components
│   ├── hooks/                    # Mobile hooks
│   ├── lib/                      # Shared logic (Supabase client, etc.)
│   ├── app.json                  # Expo config
│   └── package.json              # Mobile dependencies
│
├── supabase/
│   ├── config.toml               # Supabase project config
│   └── migrations/               # Postgres migration files
│       ├── ..._initial_schema    # Core tables: profiles, listings, etc.
│       ├── ..._notifications     # Notifications system
│       ├── ..._relax_rls         # RLS policy updates
│       └── ..._add_auction_grade # Auction grade field
│
├── package.json                  # Web app dependencies
├── vite.config.ts                # Vite + Cloudflare config
├── tsconfig.json                 # TypeScript config
└── .env                          # Environment variables (not committed)
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 18.x | [nodejs.org](https://nodejs.org/) |
| pnpm *(recommended)* | latest | `npm install -g pnpm` |
| Expo CLI | via npx | `npm install -g expo-cli` |
| Supabase account | — | [supabase.com](https://supabase.com/) |
| data.gov.in API key | — | [data.gov.in](https://data.gov.in/user/register) |

---

### Environment Variables

Create a `.env` file in the **root** (`secure-gram-design/`) directory:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# data.gov.in Agmarknet API
DATA_GOV_IN_API_KEY=your-api-key
```

Create a `.env` file in the **mobile/** directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> ⚠️ **Never commit `.env` files.** They are already in `.gitignore`.

---

### Web App Setup

```powershell
# 1. Navigate to root
cd secure-gram-design

# 2. Install dependencies (use pnpm for speed)
pnpm install
# or: npm install

# 3. Start development server
pnpm dev
# or: npm run dev
```

The web app runs at: **http://localhost:3000**

---

### Mobile App Setup

```powershell
# 1. Navigate to mobile directory
cd secure-gram-design\mobile

# 2. Install dependencies (pnpm is strongly recommended — much faster)
pnpm install
# or: npm install  ⚠️ this can take 30-45 min on first run

# 3. Start Expo development server
pnpm expo start
# or: npx expo start
```

Then press:
- **`a`** — Open on Android emulator
- **`i`** — Open on iOS simulator (Mac only)
- **`w`** — Open in web browser
- **Scan QR** — Open in Expo Go app on physical device

> 💡 **Windows tip:** If npm install is slow, add a Windows Defender exclusion for node_modules:
> ```powershell
> # Run as Administrator
> Add-MpPreference -ExclusionPath "D:\secure-gram-design\mobile\node_modules"
> ```

---

## 🗄️ Database & Migrations

The project uses **Supabase** (hosted Postgres) with manual SQL migrations in `supabase/migrations/`.

### Key Tables

| Table | Purpose |
|---|---|
| `profiles` | User profiles — name, role (farmer/buyer), phone, district, state, avatar |
| `listings` | Produce listings created by farmers |
| `auctions` | Live auction entries with status, current_price, end_time |
| `bids` | Bid records per auction per user |
| `messages` | Chat messages between users |
| `notifications` | In-app notification records |
| `mandi_prices` | Cached Agmarknet mandi price records (6-hour TTL) |
| `transactions` | Order/transaction records |

### Row-Level Security (RLS)

All tables have RLS enabled. Key policies:
- Users can only read/write their **own profile**
- Listings are **publicly readable**, but only writable by the owner
- Bids are **publicly readable**, insertable by authenticated users (non-owners)
- Messages are readable only by **sender or receiver**

### Applying Migrations

Migrations are applied directly in the Supabase dashboard SQL editor, or via the Supabase CLI:

```bash
supabase db push
```

---

## ▶️ Running the Apps

### Web App

```powershell
# Development
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint
pnpm lint

# Format
pnpm format
```

### Mobile App

```powershell
# Start dev server (choose platform interactively)
pnpm expo start

# Specific platform
pnpm expo start --android
pnpm expo start --ios
pnpm expo start --web

# TypeScript type check
pnpm ts:check
```

---

## 🔑 Key Modules

### `src/lib/mandi.functions.ts` — Server Functions

| Function | Description |
|---|---|
| `getMandiPrice` | Fetches live crop prices from Agmarknet API; caches in Supabase for 6 hours |
| `getMSPPrice` | Returns government Minimum Support Price for a commodity; falls back to local DB |
| `simulateBidding` | Places automated bids on live auctions (70% chance per auction per tick) |
| `ensureStorageConfigured` | Creates/updates the `avatars` Supabase Storage bucket |

### `src/routes/auctions.tsx` — Live Auctions

- Farmers create auction lots with grade, quantity, start price, and end time
- Buyers place bids; current highest bid is tracked in real-time
- Automated bid simulation can be triggered from the UI

### `src/routes/marketplace.tsx` — Marketplace

- Browse produce listings with filters (crop, district, price range)
- Opens a chat with the seller directly from listing cards
- Buyers can express interest; creates a chat session automatically

### `src/routes/recommend.tsx` — ACRE AI

- AI-powered crop advisory based on season, soil type, district
- Recommends best crops to plant with expected yields and market outlook

### `src/routes/match.tsx` — Smart Match

- Connects farmers to verified buyers based on location and crop type
- Shows trust score, rating, and distance for each match

---

## ☁️ Deployment

### Web App — Cloudflare Workers

The web app is configured for **Cloudflare** deployment via `wrangler.jsonc` and `@cloudflare/vite-plugin`.

```powershell
# Build for production
pnpm build

# Deploy to Cloudflare (requires wrangler login)
npx wrangler deploy
```

### Mobile App — Expo EAS

```powershell
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Submit to stores
eas submit
```

---

## 🐛 Troubleshooting

### `expo` module not found when running `npx expo start`

```powershell
# Install dependencies first
cd mobile
pnpm install   # or: npm install
pnpm expo start
```

### `npm install` takes very long (30+ min) on Windows

This is caused by Windows Defender scanning each file. Fix:
```powershell
# Run PowerShell as Administrator
Add-MpPreference -ExclusionPath "D:\secure-gram-design\mobile\node_modules"
# Then switch to pnpm for future installs — it's 3-5x faster
npm install -g pnpm
```

### `ConfigError: Cannot determine the project's Expo SDK version`

The `expo` package is not installed yet. Run `pnpm install` in the `mobile/` directory first.

### Supabase auth: "Invalid login credentials" after registration

Email confirmation may be enabled. Disable it in:  
**Supabase Dashboard → Authentication → Email → Disable "Confirm email"**

### Google Sign-In not working

Ensure your Google OAuth redirect URI is configured in:
- **Supabase Dashboard → Auth → Providers → Google**
- Add: `https://your-project.supabase.co/auth/v1/callback`
- And your local: `http://localhost:3000/google-signin`

### Mandi prices not loading

Check that `DATA_GOV_IN_API_KEY` is set in `.env`. Get a free key at [data.gov.in](https://data.gov.in/user/register).

### `node_modules` deletion is slow on Windows

Use the native Windows `rmdir` instead of PowerShell's `Remove-Item`:
```powershell
cmd /c "rmdir /s /q node_modules"
```

---

## 📄 License

Private repository — © 2026 SecureGram. All rights reserved.
