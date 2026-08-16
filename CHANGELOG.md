# 📝 Changelog

All notable changes to the **Magical Gaming Crew — Bedrock Bridge** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
