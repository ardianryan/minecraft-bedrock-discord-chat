# 📝 Changelog

All notable changes to the **Magical Gaming Crew — Bedrock Bridge** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
