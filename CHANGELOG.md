# 📝 Changelog

All notable changes to the **Magical Gaming Crew — Bedrock Bridge** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.12.0] - 2026-08-29

### 🚀 Minecraft Bedrock 1.26.45.1 Engine & KiwEssentials 33.2.1 Major Update
- **⚡ Minecraft Bedrock 1.26.45.1 Engine Compatibility**:
  - Updated behavior pack manifests across all addons to `min_engine_version: [1, 26, 0]`.
  - Added official BDS server script network configuration template [`permissions.json`](./permissions.json) (`@minecraft/server-net`, `@minecraft/server-admin`) to permanently resolve network privilege rejections on Bedrock Dedicated Server.
- **🌾 KiwEssentials 33.2.1 Full Auto-Integration**:
  - Integrated 1,950 custom addon items across 16 categories into KiwEssentials 33.2.1 (`KiwBP_33.2.1_MGC_Integrated.mcpack`).
  - Embedded MGC Live Chat Relay directly into `board/chat.js` for instant bidirectional Discord/Web communication.
  - Zero-disk-write LevelDB protection with 5-minute RAM caching to prevent 45MB–59MB server startup log warnings.
- **⏱️ Playtime & Scoreboard Telemetry Fix**:
  - Fixed cumulative playtime tracking by prioritizing the native `playtime` objective over session markers.
- **🛠️ Server Bundle & Particle Physics Overhaul**:
  - Eliminated all shadow `__MACOSX` folders and duplicate manifests to prevent `Multiple manifests found` startup errors.
  - Fixed instant expiration and extreme gravity on Crops & Farms water sprinkler and watering can particles.

---

## [2.11.3] - 2026-08-28

### 🩹 Hotfix & Performance Improvements
- **⏱️ Accurate Cumulative Playtime Synchronization**:
  - Fixed a critical bug in `MGC_Bridge[BP]/scripts/main.js` where the 3-second live telemetry loop (`collectPlayerInventory`) read the temporary boolean objective `online_time` (value `1`) instead of the true cumulative seconds objective `playtime`.
  - Refactored `readPlaytime(player)` to prioritize the native `playtime` scoreboard objective and dynamic property storage over session markers, preventing the web leaderboard from incorrectly resetting active players to `0m`.
- **🛠️ Server Stability & Particle Physics Fixes**:
  - Cleaned up duplicate legacy addon folders on server deployment to eliminate module UUID conflicts.
  - Fixed extreme gravity and instant expiration bugs on Crops & Farms water sprinkler and watering can particles (`sprinkler_action.particle.json` and `water_splash_instant.particle.json`), restoring fluid water splashing visuals.
  - In-memory cache optimizations for shop databases to eliminate dynamic property disk warnings.
- **🗺️ System Architecture & Roadmap**:
  - Added comprehensive [`ROADMAP.md`](./ROADMAP.md) specifying multi-server inventory synchronization, anti-duplication protocols, and technical architecture adhering to modern engineering standards.

---

## [2.11.2] - 2026-08-20

### 🟢 KiwEssentials 33.1.9+ Compatibility, Addon Shop & Real-Time Sync
- **🌾🍰 KiwEssentials 33.1.9+ & Addon Shop Integration (1,743 Items)**:
  - Added full support for **KiwEssentials 33.1.9** (`[33, 1, 9]`).
  - Extracted and categorized **1,743 custom items** from **Cakes & Bakes 1.0** and **Crops & Farms 1.21** into 10 modular shop categories (`cf_farm_vehicles`, `cb_bakers_machinery`, `cf_farm_tools`, `cb_kitchen_utensils`, `cb_cakes_pastries`, `cf_fresh_crops`, `cf_seeds_spores`, `cb_baking_ingredients`, `cb_drinks_desserts`, `cf_farm_products`).
  - Applied balanced economic pricing (expensive tractors & industrial bakeries, accessible crop seeds & fresh produce).
  - Created standalone external database `mcaddon/addon-items/` with automated injection script `inject_to_kiw.mjs` for future KiwEssentials version upgrades.
- **⚡ Fixed Admin Command Dispatch from Web**:
  - Cleaned slash command syntax builder in `src/routes/office.ts` to adhere to modern Bedrock 1.21+ formats (removed legacy data value `0` from `/give`).
  - Added clean leading slash trimming in `MGC_Bridge[BP]/scripts/main.js` to ensure commands pass Bedrock's `runCommandAsync` without syntax rejections.
  - Implemented direct Script API native actions for `ItemStack` give, `setGameMode`, `teleport`, `clearAll`, and `setCurrentValue`.
- **⏱️ Real-Time Playtime & Scoreboard Sync (`readPlaytime`)**:
  - Enhanced score readers to read KiwEssentials 33.1.9 dynamic properties (`online_time`, `money_balance_string`) and scoreboard participant display names.
  - Added a 1-second delay (20 ticks) on `playerSpawn` join events so KiwEssentials has registered objectives before transmitting data to the backend.
- **🎨 Glassmorphic Online Player Roster Card & Action Buttons**:
  - Refined `PlayerList.tsx` layout with structured vertical player names and status badges.
  - Styled `btn-mod-kick` (Amber Gold Glass) and `btn-mod-ban` (Rose Red Glass) with smooth interactive glow and inline style fallbacks.

---

## [2.11.1] - 2026-08-19

### 🟢 KiwEssentials 33.1.8+ Compatibility & Script API Polish
- **🟢 KiwEssentials 33.1.8+ Multi-Objective Telemetry Sync**:
  - Enhanced scoreboard objective reader in `MGC_Bridge[BP]/scripts/main.js` to automatically support KiwEssentials 33.1.8+ objectives and naming aliases (`kill`/`kills`, `death`/`deaths`, `money`/`balance`, `coin`/`coins`, `playtime`/`online_time`).
  - Added robust fallback returning 0 when custom scoreboard objectives have not been initialized by KiwEssentials.
- **⚡ Native Script API `ItemStack` Direct Injection**:
  - Integrated direct `new ItemStack(itemIdentifier, amount)` and `inv.container.addItem(itemStack)` handling in the Behavior Pack loop, enabling 100% reliable instant item delivery to players without BDS slash command syntax limitations.
  - Implemented direct `health.setCurrentValue(health.defaultValue)` for instant heal and `inv.container.clearAll()` for wipe inventory operations.
- **🔧 Multi-Version `player.runCommandAsync` Execution Fallback**:
  - Corrected Script API command execution fallback from `player.dimension.runCommandAsync` to `player.runCommandAsync`, resolving `(not a function)` exceptions across Bedrock engine versions.
  - Attached structured `actionPayload` to pending game action queue in `office.ts`.
- **📦 Behavior Pack Release v2.11.1**:
  - Bumped `MGC_Bridge[BP]` manifest version to `[2, 11, 1]` for direct in-game server updates.

---

## [2.11.0] - 2026-08-18

### 🎒 Live Player Inventory, Server Panels & Architecture Polish
- **🎒 Live Player Inventory & HUD Inspector (`PlayerInventorySheet.tsx`)**:
  - **Strict `Sheet` UI Standard**: Interactive slide-over sheet (Right on Desktop $\ge 768\text{px}$, Bottom drawer on Mobile) with zero centered dialog boxes.
  - **Live Player HUD**: Displays real-time Hearts/Health bar (`<Heart />`), Level & XP progress (`<Zap />`), Dimension (`<Compass />`), XYZ Coordinates (`<Navigation />`), and Gamemode switcher (`<Sword />`).
  - **Equipped Armor & Hands**: Displays Helmet, Chestplate, Leggings, Boots, Mainhand, and Offhand (Shield/Totem) items with stack counts.
  - **Interactive 36-Slot Inventory Grid**: Authentic Minecraft inventory slots with item type IDs, stack badges, and 1-click slot item removal.
  - **Admin Action Toolbox**: Added Give Item toolbox with quick-pick chips (Diamonds, Netherite, Elytra, G-Apple, etc.), stack slider (1–64), 1-click Instant Max Heal & Feed, and 1-click Wipe All Inventory tool with Sheet confirmation.
  - **High-Frequency 3-Second Telemetry Sync**: Upgraded Behavior Pack telemetry cycle in `MGC_Bridge[BP]/scripts/main.js` from 20s to **3s (`60 ticks`)** with automatic instant push on admin actions.
- **🖥️ Server Management Panel Integrations (Pterodactyl & Crafty Controller)**:
  - **Universal Panel Adapter**: Built `src/services/panel.ts` supporting **Pterodactyl Panel** (Client API / Wings) and **Crafty Controller** (v4 REST API).
  - **Live Hardware Resource Gauges**: Real-time CPU Utilization (%), Memory/RAM (MB/GB), Storage Disk, and Power state telemetry.
  - **Server Power Controls**: 1-click Start (`<Play />`), Restart (`<RotateCw />`), Graceful Stop (`<Square />`), and Force Kill (`<Power />`) with animated Sheet confirmations.
  - **Interactive BDS Server Console**: Real-time log terminal with direct command dispatch input bar (`/say`, `/time set`, etc.).
  - **Interactive Setup Tutorial Guide**: Added `PanelSetupGuideSheet.tsx` providing step-by-step instructions to create API keys and configure Pterodactyl or Crafty Controller.
- **📁 Dedicated Left Sidebar Navigation Layout for `/office`**:
  - Re-architected `/office` from top tab buttons to a modern dedicated management layout with a collapsible left sidebar.
  - Categorized management into 4 distinct portals: Users & Roles, Player Roster & Inventory, Server Controls & Panels, and System & SEO Settings.
- **⚡ BDS Target Selector Command Execution Engine**:
  - Re-engineered backend command builder (`src/routes/office.ts`) to use strict Bedrock selector syntax `@a[name="${ign}"]` for `/give`, `/clear`, `/effect`, `/gamemode`, `/tp`, preventing syntax parsing failures in BDS.
  - Added multi-dimension execution fallback in `main.js` (`world.getDimension("overworld")` with player dimension fallback).
- **🛡️ 100% Strict Slide-Over Sheet UI Standard (Zero Browser Dialogs)**:
  - Eliminated all native browser dialogs (`window.confirm`) across server power controls in `ServerPanelTab.tsx` and player inventory wipes in `PlayerInventorySheet.tsx`.
- **📐 Full-Width Responsive Form Input Expansion**:
  - Expanded all search fields, webhook URLs, bot tokens, panel configuration inputs, and console command bars to **100% full width** with modern focus rings.
  - Form action buttons on mobile screens automatically stretch full-width for effortless touch ergonomics.
- **📱 Mobile Header & Navigation Layout Overhaul**:
  - Resolved mobile header wrapping by organizing brand logo + user avatar into the top row and full-width segmented switcher tabs below.
  - Removed duplicate username and avatar from the `/office` status bar.
  - Condensed metric cards into a responsive 3-column compact grid on mobile screens.
- **📦 Behavior Pack Release v2.11.0**:
  - Bumped `MGC_Bridge[BP]` manifest version to `[2, 11, 0]` for direct in-game server updates.

---

## [2.10.0] - 2026-08-18

### ✨ Added
- **🌐 Dynamic SEO, GEO, AEO & LLMs Knowledge Standard (`/llms.txt` & `/llms-full.txt`)**:
  - **llmstxt.org Standard Integration**: Added dynamic `/llms.txt` and `/llms-full.txt` providing structured, machine-readable server knowledge, connection guides, top leaderboard highlights, and Discord bot commands for AI Answer Engines (ChatGPT, Claude, Perplexity, Gemini).
  - **Dynamic `/robots.txt` & `/sitemap.xml`**: Automatically generated search engine and AI crawler policies with standard sitemap indexing.
  - **Dynamic SSR Meta Tag & JSON-LD Injection**: Injected real-time OpenGraph (`og:title`, `og:description`, `og:image`, `og:url`), Twitter Cards, GEO location tags (`geo.region`, `geo.placename`, `geo.position`), and `schema.org` Structured Data (`WebSite`, `VideoGame`, `GameServer`).
  - **Admin Master Indexing Toggle (`/office`)**: Added master switch to allow public indexing or completely block all search bots and AI scrapers via HTTP `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` and `Disallow: /` in `robots.txt`.
- **🎮 2-Column Split Desktop & Mobile-First Gaming Login Portal**:
  - Re-architected public landing page (`LoginPage.tsx`) into a modern 2-column split layout (Left: Server Showcase & 1-Click Bedrock Connect; Right: Elevated Discord Auth Card).
  - Mobile-first layout priority (`< 960px`) placing the sign-in card and 1-tap launcher at the top for frictionless mobile entry.
- **🎮 1-Click Join Minecraft Server & Direct Connect Integration**:
  - Added configurable `server_ip` (Hostname/Domain) and `server_port` (default `19132`) in `/office` Admin Settings.
  - **Web Live Chat & Landing Page**: Prominent glassmorphic **"Join Minecraft Server"** Card with 1-Click Launch button (`minecraft://?addExternalServer=...`) and 1-Click Copy IP button with instant clipboard checkmark animation.
  - **Discord Bot Interactive Integration**: Added `Server IP & Join` button in `!panel` / `!menu` and new text commands `!ip`, `!join`, `!server`, `!connect` with rich embed detailing server address, port, and 1-click connect URL.
- **🔗 Real-Time Discord ↔ Web Account Link & Unlink Synchronization**:
  - **Discord Modal Submission Handler**: Implemented `interaction.isModalSubmit()` listener for `modal_link_ign` so players clicking the `Link Account` button in Discord can input their Minecraft IGN and immediately sync to PostgreSQL and the Web Live Chat.
  - **Discord Unlink Handler**: Fixed unlinking bug where nullish coalescing prevented clearing the IGN. Added explicit `unlinkUserByDiscordId` to cleanly detach Minecraft characters from Discord accounts.
  - **Discord Text Commands**: Added `!link <IGN>` (or `.link`), `!unlink` (or `.unlink`), and `!me`/`!profile`/`!akun` commands with Minecraft skin head avatar embeds.
  - **Web Profile Modal Unlink Action**: Added `Unlink IGN` action in `ProfileModal.tsx` via `DELETE /api/auth/profile/ign` allowing players to unlink directly from the web interface.
- **🔒 Privacy & Role-Based UI Sanitization**:
  - Cleaned all internal database/admin architecture mentions (`/office`, PostgreSQL, developer Script APIs) from the public login page.
  - Restricted internal "Integration Status" telemetry in the live chat sidebar strictly to Admins (`user.role === 'admin'`). Regular community members now see a clean Player Profile card with verified Minecraft IGN.
- **🎨 Complete Frontend Emoji-Free Icon Overhaul**:
  - Replaced all raw unicode emojis across the web frontend (`client/src/`) with crisp, accessible SVG icons from `lucide-react`.
- **🏆 Olympic Leaderboard Desktop & Mobile Split Refinement**:
  - Restored 3-column Olympic podium on desktop ($\ge 768\text{px}$).
  - Mobile split layout: #1 Champion on top with gold glow + #2 & #3 in a clean 2-column grid.

---

## [2.9.0] - 2026-08-18

### 🕒 Timezone & Timestamps
- **Enforced Asia/Jakarta (WIB / UTC+7) Timezone**: Resolved timestamp discrepancy where chats and server events showed `01:xx` (UTC). Timezone is now explicitly set to `timeZone: 'Asia/Jakarta'` with 24-hour format (`hour12: false`) across both backend (`src/index.ts`, `src/db.ts`) and client-side parser (`formatTimeWIB`).

### 📜 Smart Scroll & Standby Mode
- **Intelligent Chat Auto-Scroll**: Eliminated the issue where chat forcefully scrolled to the bottom on every poll cycle. The chat feed now intelligently monitors user scroll position (`isNearBottom`).
- **Scroll Standby**: Users can scroll up to read earlier chats undisturbed without being snapped back down.
- **Floating "↓ Ke Bawah" Button**: Added an animated floating scroll-down pill with an unread message counter (`+N`) that appears when scrolled up and smoothly jumps to the latest message on click.

### 📱 Mobile UI/UX Overhaul
- **100dvh Dynamic Viewport Layout**: Optimized mobile layout (`< 768px`) for modern mobile browsers, preventing content clipping when the virtual keyboard opens.
- **Touch-Optimized Sticky Chat Input**: Compact sender IGN badge, maximized message input width, and touch-friendly icon send button ($\ge 44\text{px}$).
- **Horizontal Quick Commands Carousel**: Admin Quick Commands now use a smooth horizontal momentum-scroll carousel that does not clutter vertical screen space.
- **Responsive Typography & Avatars**: Re-scaled avatars (32px), message source chips (`🎮 MC`, `💬 Discord`, `🌐 Web`), and timestamps for mobile readability.

---

## [2.8.0] - 2026-08-18

### ✨ Added
- **🚀 Cross-Pack ScriptEvent Chat Relay (`mgc:chat`)**: Added `system.afterEvents.scriptEventReceive` listener to MGC Bridge BP (v1.7.0). Allows native Bedrock cross-pack communication to bypass event cancellations (`data.cancel = true`) from 3rd-party addons.
- **📖 Self-Hosted KiwEssentials Integration Guide in README**: Step-by-step instructions on configuring server-side KiwEssentials (`manifest.json` and `scripts/board/chat.js`) to relay rank-formatted chat directly to MGC Bridge without redistributing proprietary files.

### 🛡️ License & Clean Repository
- **Proprietary Cleansing**: Removed all 3rd-party commercial pack binaries from Git tracking and GitHub releases.
- **Enhanced Ignore Rules**: Updated `.gitignore` and `.dockerignore` to ignore `KiwEssentials/`, `KiwBP/`, `KiwRP/`, `releases/`, and `*.mcpack`.

---

## [2.5.0] - 2026-08-16

### ✨ Added
- **🟢 KiwEssentials Scoreboard Integration**: Automatic reading and tracking of KiwEssentials objectives (`kill`, `death`, `money`, `coin`, and `playtime`).
- **📊 Dedicated Player Scores Database Table**: Created `player_scores` table in PostgreSQL and added `kw_*` tracking columns to `users`.
- **🏆 Multi-Tab Web Leaderboard (`LeaderboardView.tsx`)**:
  - 5 interactive tabs: ⚔️ Kills, 💀 Deaths, 💰 Money, 🪙 Coins, ⏱️ Playtime.
  - Top 3 Podium with player skin heads and real-time online indicator dots (🟢).
  - Dynamic K/D ratio color indicator (🟢 $\ge 2.0$, 🟡 $\ge 1.0$, 🔴 $< 1.0$).
  - Dual-mode toggle between KiwEssentials Scoreboard and Discord Activity modes.
- **💬 Discord Rich Join Embeds**: Player join notifications sent to Discord now feature rich embeds displaying player K/D, Money, Coins, and Playtime.
- **🔄 Automated Scoreboard Sync**: Ingests player stats every 3 minutes via `POST /api/game/scoreboard` and serves them via `GET /api/web/scoreboard`.

---

## [2.4.0] - 2026-08-16

### 🔧 Fixed & Improved
- **Bedrock Script API Compatibility**: Bumped `@minecraft/server` to `beta` to align with Bedrock Dedicated Server 1.26.x.
- **Startup Diagnostics**: Added `[MGC-BRIDGE]` diagnostic logs on server startup to verify event subscriber availability.

---

## [2.3.0] - 2026-08-16

### ✨ Added
- **⚡ Drizzle ORM Integration & Type-Safe Database Layer**: Migrated raw database access to **Drizzle ORM** (`drizzle-orm` & `drizzle-kit`) with declarative schema definitions (`src/schema.ts`), inferred TypeScript types, and automated migrations via `npm run db:push` and `npm run db:studio`.
- **💡 Floating Interactive Tooltips & Field Explanations**: Added custom floating interactive Tooltip components (`Tooltip.tsx`) across all 6 setting fields in `/office` (`Discord Webhook URL`, `Discord Bot Token`, `Target Channel ID`, `Invite URL`, `API Key`, and `Server Name`), providing instant contextual explanations on hover/tap.
- **📋 Server Player Directory & 14-Day Rolling Retention**: Automatically records every Minecraft Bedrock player who joins, chats, or dies into PostgreSQL (`known_players`). Displays an active player directory in the `/office` dashboard with skin avatars, online/offline status, first joined, and last active timestamp, with 1-click **👢 Kick** and **🚫 Ban** actions. Automatically prunes inactive player records older than 14 days to keep database footprint lean.
- **📱 Responsive Modern Sheet & Drawer System (Desktop: Right | Mobile: Bottom)**: Replaced default browser `window.confirm`/`window.prompt` dialog boxes with custom Shadcn-style slide-over Sheets (`Sheet.tsx`). Slides in smoothly from the **right side** on Desktop ($\ge 768\text{px}$) and from the **bottom drawer** with touch drag pill on Mobile ($< 768\text{px}$).
- **📖 Step-by-Step Discord Setup Tutorial Guide**: Added an interactive tutorial guide Sheet on the `/office` dashboard explaining how to create Webhooks, generate Bot Tokens, toggle **`MESSAGE CONTENT INTENT`**, invite bots, and fetch channel IDs with one-click portal links.
- **🤖 Live Discord Bot Tester & Instant Connection**: Added `POST /api/office/test-bot` and a dedicated **"Test Bot"** action button in the `/office` dashboard to verify Bot Token validity in real-time, report bot user tag/ID, and hot-reload bot listener without server restarts.
- **💾 Persistent PostgreSQL Chat History & 50-Message Retention**: All incoming chat messages from Minecraft Bedrock, Discord, and Web Console are saved in PostgreSQL (`chat_logs`). Messages persist across page reloads and server restarts, retaining the latest 50 rolling messages automatically.
- **👢 & 🚫 Web Dashboard Kick & Ban Player Moderation**: Administrators can instantly kick or permanently ban offending Minecraft players directly from the Web Live Chat roster or `/office` dashboard. Banned players are stored in PostgreSQL (`banned_players`) and automatically disconnected/blocked from rejoining, with full Unban management.
- **🏆 Community Activity Leaderboard**: Real-time activity ranking tracked in PostgreSQL (`message_count`, `last_active`) with a Top 3 Podium (🥇 Gold Champion, 🥈 Silver, 🥉 Bronze), player head skin avatars, full ranked roster table, and Discord bot `🏆 Leaderboard` button & `!top` command.
- **💀 In-Game Death Notification Relay**: Integrated `world.afterEvents.entityDie` in Bedrock Behavior Pack; relays real-time death alerts with killer and cause details to Discord (red embed) and Web Console (`☠️ DeathAlert`).
- **👤 Player Skin Head Avatars**: Real-time rendering of Minecraft player head skins (`mc-heads.net`) in the active player roster sidebar and chat timeline bubbles.
- **🔊 Web Audio Chime & Mute Toggle**: Soft, non-intrusive Web Audio API synthesizer chime on new incoming chat messages, accompanied by a quick **Sound ON / Mute** button.
- **🛡️ Chat Filter & Auto-Moderation**: Automatic profanity/toxic word filtering (`***`) across game, web, and Discord channels.
- **🔗 Join Our Discord Server Banner**: Sleek *Discord Blurple* community invite banner on Web Live Chat sidebar and login landing with dynamic admin configuration in `/office`.
- **🐳 1-Command Docker Easy Deployment**: Multi-stage `Dockerfile` (~120MB lightweight runtime) and `docker-compose.yml` with PostgreSQL 15, healthchecks, and persistent storage volumes.
- **🌐 Open-Source Governance Suite**: Comprehensive documentation including `SECURITY.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1), `CONTRIBUTING.md`, `LICENSE` (MIT), and GitHub Issue & PR templates.
- **🧪 Automated Unit & Security Audit Test Suite**: Vitest test suite covering RBAC firewall, OSI Layer Model (L4–L7), and 1-to-1 account mapping integrity (20/20 tests passed).

### 🔒 Security
- Sanitized default database configuration fallbacks and `.env.example` templates to generic placeholders.
- Enforced parameterized SQL queries and JWT HMAC-SHA256 signature verification.

---

## [2.2.0] - 2026-08-16

### ✨ Added
- **🤖 Discord Interactive Bot UI (`!panel` / `!menu`)**: Interactive clickable buttons (`🔗 Link IGN`, `📊 Server Status`, `👤 My Account`, `🔓 Unlink`) with instant popup modal input dialogs.
- **🔑 Secret Bearer Token Generator**: Dynamic Bearer API key generation in `/office` dashboard with one-click **"Copy Snippet"** for `MGC_Bridge[BP]/scripts/main.js`.
- **🎮 In-Game Slash Command Execution**: Administrator-only slash command runner (`/time set day`, `/weather clear`, `/give`, `/tp`) from Web Console and Discord chat.

### 🛡️ RBAC
- Role-based access control protecting administrative endpoints and in-game slash commands (`403 Forbidden` for non-admin accounts).

---

## [2.1.0] - 2026-08-16

### 🚀 Performance & Architecture
- **Unified Single-Port Deployment (Port 3000)**: Serves both compiled React SPA and Hono REST APIs over Port 3000 via `@hono/node-server/serve-static`.
- **🐘 Native PostgreSQL Integration**: Persistent relational storage for user profiles, linked IGN mappings, link codes, and system configurations.

### 🐛 Fixed
- Fixed Discord OAuth2 callback session cookie handling and `/api/auth/me` identity endpoint structure.

---

## [2.0.0] - 2026-08-16

### 🎨 UI/UX Redesign
- Complete design system overhaul with premium dark glassmorphism, tailored HSL color tokens, and smooth micro-animations.
- Modern typography pairing using Google Fonts (**Plus Jakarta Sans** and **JetBrains Mono**).
- Modular component architecture: `Navbar`, `ChatFeed`, `PlayerList`, `OfficeDashboard`, `ProfileModal`, and `LoginPage`.

---

## [1.0.0] - 2026-08-16

### 🚀 Initial Release
- Initial prototype of bidirectional bridge connecting Minecraft Bedrock Script API (`@minecraft/server-net`) to Discord Webhooks and Hono.js.
- Basic player spawn and leave tracking.
