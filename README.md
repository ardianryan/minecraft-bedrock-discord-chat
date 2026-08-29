<div align="center">

<img src="./assets/logo.png" alt="Magical Gaming Crew Logo" width="160" height="160" style="border-radius: 50%; box-shadow: 0 0 35px rgba(99, 102, 241, 0.4);" />

# 🎮 Magical Gaming Crew — Bedrock Bridge `v2.12.0`

**High-Performance Real-Time 3-Way Bridge, Live Player HUD Inspector & Server Panel for Minecraft Bedrock, Discord, and Web Dashboard.**

[![Version](https://img.shields.io/badge/Release-v2.12.0-38BDF8?style=for-the-badge&logo=git&logoColor=white)](./CHANGELOG.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Hono.js](https://img.shields.io/badge/Hono.js-4.0+-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev/)
[![React](https://img.shields.io/badge/React-19+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45+-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![Minecraft Bedrock](https://img.shields.io/badge/Bedrock%20Engine-1.20%20--%201.26+-2C7A32?style=for-the-badge&logo=minecraft&logoColor=white)](https://minecraft.net/)
[![KiwEssentials](https://img.shields.io/badge/KiwEssentials-33.x%20Compatible-10B981?style=for-the-badge&logo=minecraft&logoColor=white)](https://kiwstudio.com/)

<p align="center">
  <a href="#-1-overview--architecture">Overview & Architecture</a> •
  <a href="#-2-key-features">Key Features</a> •
  <a href="#-3-installation--deployment-tutorials">Installation Tutorials</a> •
  <a href="#-4-minecraft-behavior-pack-setup-tutorial">Behavior Pack Setup</a> •
  <a href="#-5-kiwessentials-addon-integration-tutorial">KiwEssentials Integration</a> •
  <a href="#-6-discord-bot-commands--setup-guide">Discord Commands</a> •
  <a href="#-7-admin-office-dashboard-guide--tutorials">Admin Office Guide</a> •
  <a href="#-8-project-structure">Project Structure</a> •
  <a href="#-9-security--access-control">Security</a> •
  <a href="./CHANGELOG.md">Changelog</a>
</p>

</div>

---

## 📖 1. Overview & Architecture

**Magical Gaming Crew (MGC) Bedrock Bridge** is a full-stack, enterprise-grade integration suite engineered to unite **Minecraft Bedrock Edition Servers (BDS)**, **Discord Communities**, and **Web Management Portals** into one unified, real-time ecosystem.

Built with ultra-fast **Hono.js**, **React 19**, **PostgreSQL** via **Drizzle ORM**, and the native **Minecraft Bedrock Script API (`@minecraft/server` & `@minecraft/server-net`)**, MGC Bridge delivers sub-second bidirectional synchronization with zero TPS lag.

```
                     ┌──────────────────────────────────────┐
                     │         Minecraft Bedrock BDS        │
                     │  (MGC_Bridge[BP] / KiwEssentials)    │
                     └──────────────────┬───────────────────┘
                                        │  REST / HTTP (Bearer API Key)
                                        ▼
                     ┌──────────────────────────────────────┐
                     │          Hono.js Full-Stack          │
                     │         High-Performance Core        │
                     │  ┌────────────────────────────────┐  │
                     │  │   Drizzle ORM + PostgreSQL     │  │
                     │  │   (Users, Chats, Banned, SEO)  │  │
                     │  └────────────────────────────────┘  │
                     └──────────┬────────────────┬──────────┘
                                │                │
      Discord Gateway WebSocket │                │ SSE / React 19 Client
                                ▼                ▼
         ┌────────────────────────────┐    ┌────────────────────────────┐
         │     Discord Community      │    │    Web Live Chat Portal    │
         │  (Webhooks, Slash & Text)  │    │ (HUD, Inventory & Office)  │
         └────────────────────────────┘    └────────────────────────────┘
```

---

## ✨ 2. Key Features

- 💬 **3-Way Real-Time Chat & Command Channel**: In-game chats, Discord channel messages, and Web Live Chat sync instantly with avatar head badges and verified role chips.
- 🎒 **Live Player Inventory & Vitals HUD Inspector (`PlayerInventorySheet.tsx`)**:
  - Slide-over `Sheet` (Right on desktop $\ge 768\text{px}$, Bottom drawer on mobile $< 768\text{px}$).
  - Real-time Hearts / Health Bar ❤️, Level & XP progress ⚡, Dimension 🧭, and $(X, Y, Z)$ Coordinates 📍.
  - 36-slot interactive inventory grid with item stack indicators and 1-click slot item removal.
  - Admin Item Toolbox: Give Item (Diamond, Netherite, Elytra, G-Apple, etc.), Instant Max Heal & Feed, Gamemode switcher, and Wipe All Inventory with confirmation Sheet.
  - High-frequency 3-second live telemetry cycle.
- 🖥️ **Server Management Panel Integrations (`ServerPanelTab.tsx`)**:
  - Universal REST adapter for **Pterodactyl Panel** and **Crafty Controller**.
  - Live hardware telemetry gauges: CPU Utilization (%), RAM Usage (MB/GB), Storage Disk, and Power Status (`RUNNING`, `STARTING`, `OFFLINE`).
  - Power controls: Start Server ▶️, Restart Server 🔄, Graceful Stop ⏹️, and Force Kill ⚡ with animated Sheet confirmations.
  - Interactive BDS Server Console with real-time log stream and command dispatch bar.
- 🏆 **Olympic Podium Leaderboards**: Real-time server rankings for Kills, Deaths, Money, Coins, and Playtime synchronized from KiwEssentials scoreboards.
- 📁 **Dedicated Admin Office Portal (`/office`)**: Categorized left sidebar navigation (Users & Roles, Player Roster & Inventory, Server Controls, System & SEO).
- 🌐 **Dynamic SEO, GEO, AEO & LLMs Knowledge Standard (`/llms.txt` & `/llms-full.txt`)**: Dynamic AI engine integration for ChatGPT, Perplexity, Gemini, and Claude with master indexing toggle.
- 🔗 **Discord ↔ Minecraft Account Linking**: One-click link/unlink via Discord modal or web profile with Minecraft skin avatar synchronization.

---

## 🚀 3. Installation & Deployment Tutorials

### Tutorial A: Quick 1-Command Docker Deployment (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/ardianryan/minecraft-bedrock-discord-chat.git
   cd minecraft-bedrock-discord-chat
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` variables:
   ```ini
   PORT=3000
   DATABASE_URL=postgres://postgres:postgres@postgres:5432/discordmchat
   DISCORD_CLIENT_ID=your_discord_client_id
   DISCORD_CLIENT_SECRET=your_discord_client_secret
   DISCORD_BOT_TOKEN=your_secret_bot_token
   DISCORD_REDIRECT_URI=https://yourdomain.com/api/auth/discord/callback
   API_KEY=your_super_secret_bridge_api_key
   ```

4. Launch with Docker Compose:
   ```bash
   docker compose up -d --build
   ```

5. Open `http://localhost:3000` in your browser.

---

### Tutorial B: Manual Node.js & PostgreSQL Installation

1. Install dependencies:
   ```bash
   npm install
   npm --prefix client install
   ```

2. Set up your PostgreSQL database and run Drizzle schema push:
   ```bash
   npm run db:push
   ```

3. Build production bundle:
   ```bash
   npm run build
   ```

4. Start the unified production server:
   ```bash
   npm start
   ```

---

## 🎮 4. Minecraft Behavior Pack Setup Tutorial

Follow these steps to install the `v2.11.0` Behavior Pack onto your Minecraft Bedrock Server:

1. **Copy the Pack**: Copy the `MGC_Bridge[BP]` folder into your server's `behavior_packs/` directory:
   ```text
   bedrock_server/
   └── behavior_packs/
       └── MGC_Bridge[BP]/
           ├── manifest.json
           └── scripts/
               └── main.js
   ```

2. **Configure Connection URL & API Key**:
   Open `MGC_Bridge[BP]/scripts/main.js` and set your web server URL and API Key:
   ```javascript
   const HONO_BACKEND_URL = "https://yourdomain.com/api/game";
   const API_KEY = "your_super_secret_bridge_api_key";
   ```

3. **Activate in `world_behavior_packs.json`**:
   Open `bedrock_server/worlds/<world_name>/world_behavior_packs.json` and add:
   ```json
   [
     {
       "pack_id": "a5d8b724-4f51-4c31-89a3-5c218683f120",
       "version": [2, 11, 1]
     }
   ]
   ```

4. **Enable Beta APIs & Script Execution**:
   In `server.properties`, ensure custom scripting and beta APIs are enabled.

---

## 🟢 5. KiwEssentials Addon Integration Tutorial

If your server uses **[KiwEssentials](https://kiwstudio.com/)** for ranks and economy, connect it to MGC Bridge in 2 steps:

### Step 1: Add `@minecraft/server-net` to `KiwBP/manifest.json`
Open your server's `KiwBP/manifest.json` and add `@minecraft/server-net` under `"dependencies"`:
```json
{
  "dependencies": [
    {
      "module_name": "@minecraft/server",
      "version": "beta"
    },
    {
      "module_name": "@minecraft/server-ui",
      "version": "beta"
    },
    {
      "module_name": "@minecraft/server-net",
      "version": "1.0.0-beta"
    }
  ],
  "capabilities": [
    "script_eval"
  ]
}
```

### Step 2: Add Relay Function to `KiwBP/scripts/board/chat.js`
Open `KiwBP/scripts/board/chat.js` and add this relay helper at the top:
```javascript
// ── MGC DISCORD & WEB BRIDGE ──────────────────────────
import { http, HttpRequest, HttpRequestMethod, HttpHeader } from "@minecraft/server-net";

const MGC_BRIDGE_URL = "https://YOUR_DOMAIN/api/game/chat";
const MGC_API_KEY = "YOUR_API_KEY";

function relayChatToMGC(senderName, messageText) {
  if (!senderName || !messageText) return;
  if (messageText.startsWith("+") || messageText.startsWith("/")) return;
  try {
    system.run(async () => {
      try {
        const req = new HttpRequest(MGC_BRIDGE_URL);
        req.setMethod(HttpRequestMethod.Post);
        req.setHeaders([
          new HttpHeader("Content-Type", "application/json"),
          new HttpHeader("Authorization", "Bearer " + MGC_API_KEY)
        ]);
        req.setBody(JSON.stringify({ sender: senderName, message: messageText }));
        await http.request(req);
      } catch {}
    });
  } catch {}
}
```

Inside the chat send handler, call:
```javascript
relayChatToMGC(sender.name, message);
```

---

## 🤖 6. Discord Bot Commands & Setup Guide

### Slash Commands
| Command | Description |
| :--- | :--- |
| `/panel` / `/menu` | Opens the interactive community control menu |
| `/status` | Displays real-time server health and online player count |
| `/top` | Displays the Olympic leaderboard for Kills, Money, Playtime |
| `/me` / `/profile` | Displays your linked Minecraft character profile and avatar |
| `/link <ign>` | Links your Discord account to your Minecraft Bedrock IGN |
| `/unlink` | Unlinks your Minecraft character from your Discord account |

### Text Commands (Prefix: `!` or `.`)
- `!ip` / `!join` / `!connect` — Displays Server IP, Port, and 1-Click Join URL.
- `!link <IGN>` — Instant account linking.
- `!unlink` — Unlink Minecraft character.
- `!top` — Scoreboard leaderboard rankings.

---

## 📁 7. Admin Office Dashboard Guide & Tutorials

Access the dedicated admin portal at `/office` (Admin role required). The portal features a left-sidebar navigation categorized into 4 sections:

### 1. 👥 Users & Roles Management
- Manage all registered Discord community members in one table.
- Promote or demote users between `admin` and `user` roles.
- Inspect and manually link/unlink Minecraft IGNs mapped to Discord IDs.

### 2. 📋 Player Roster & Live Inventory Inspector
- View all online players with live status indicator and 14-day history.
- **🎒 Inspect Live Inventory & HUD**:
  - Click the **Inspect** button next to any player to open the slide-over `Sheet` (Right on desktop, Bottom drawer on mobile).
  - View real-time **Hearts/Health bar** ❤️, **Level & XP** ⚡, **Dimension** 🧭, **Coordinates $(X, Y, Z)$** 📍, and equipped **Armor / Hands**.
  - **Give Item Toolbox**: Enter any Minecraft item ID (e.g. `diamond`, `netherite_sword`, `golden_apple`), adjust stack count (1–64), and click **Give**.
  - **Instant Heal & Feed**: Instantly gives max health and saturation buffs in 1 click.
  - **Gamemode Switcher**: Instantly switch player between Survival, Creative, Adventure, and Spectator.
  - **Wipe All Inventory**: Clear all items with an animated confirmation Sheet.

### 3. 🖥️ Server Management Panel Setup Tutorial (Crafty Controller & Pterodactyl)
Connect your game server panel for hardware telemetry and power operations:

#### A. Connecting Crafty Controller v4:
1. Open your Crafty Controller Web UI (e.g. `https://mcserver.ppti.me`).
2. Go to **Server Details** for your Bedrock server.
3. Copy the **Server UUID** displayed at the top or in the URL (e.g. `56bf8304-d76f-428c-8c9b-6b87fe197330`).
4. Go to **User Profile / API Keys** in Crafty and generate an API Token.
5. In MGC Admin Office → **Server Controls** → **Panel Provider & API Configuration**:
   - Provider: `Crafty Controller`
   - Crafty Panel URL: `https://your-crafty-domain.com` (or IP:Port)
   - Server ID: `56bf8304-d76f-428c-8c9b-6b87fe197330`
   - API Token: `crafty_xxxxxxxxxxxxxxxxxxxx`
6. Click **Test Connection** then **Save Panel Configuration**.

#### B. Connecting Pterodactyl Panel:
1. Open your Pterodactyl Panel (e.g. `https://panel.yourdomain.com`).
2. Go to **Account Settings** → **API Credentials** → Create API Key (Client Key starting with `ptlc_`).
3. Copy the short Server UUID from your server URL (e.g. `c74fa092`).
4. In MGC Admin Office → **Server Controls**:
   - Provider: `Pterodactyl Panel`
   - Base URL: `https://panel.yourdomain.com`
   - Server ID: `c74fa092`
   - API Key: `ptlc_xxxxxxxxxxxxxxxxxxxx`
5. Click **Test Connection** then **Save Panel Configuration**.

#### C. Live Server Console & Power Controls:
- **Telemetry Gauges**: Real-time CPU Utilization (%), RAM Usage (MB/GB), Storage Disk, and Power state.
- **Power Operations**: Start ▶️, Restart 🔄, Graceful Stop ⏹️, Force Kill ⚡ (with confirmation Sheets).
- **Interactive Console**: Real-time terminal log feed with instant command dispatch bar (`/say`, `/time set day`, `/weather clear`, etc.).

### 4. ⚙️ System, Webhooks & SEO / LLMs Configuration
- **Discord Webhook URL**: Channel webhook URL for automated chat and event relays.
- **Discord Bot Token**: Secret token from Discord Developer Portal enabling 2-way Discord → Game chat.
- **Public Indexing Master Switch**: Enable public search indexing (`robots.txt`, `sitemap.xml`) or block all crawlers with 1 click.
- **AEO / LLM Standards**: Dynamic `/llms.txt` and `/llms-full.txt` context generator for ChatGPT, Claude, and Perplexity.

---

## 📁 8. Project Structure

```
discordmchat/
├── assets/
│   └── logo.png                   # Official Magical Gaming Crew Logo
├── MGC_Bridge[BP]/                # Minecraft Bedrock Behavior Pack (v2.12.0)
│   ├── manifest.json              # Pack manifest (1.21+ / 1.26+ Script API)
│   ├── pack_icon.png              # Official in-game pack icon
│   └── scripts/
│       └── main.js                # @minecraft/server & server-net listener (3s telemetry)
├── client/                        # React 19 (Vite) Frontend Application
│   ├── public/
│   │   ├── logo.png               # Web Favicon & Brand Icon
│   │   └── favicon.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx         # Responsive Glassmorphic Navigation
│   │   │   ├── ChatFeed.tsx       # Live 3-Way Chat & Command Timeline
│   │   │   ├── PlayerList.tsx     # Active In-Game Player Roster
│   │   │   ├── OfficeDashboard.tsx# Dedicated Admin Sidebar Portal
│   │   │   ├── PlayerInventorySheet.tsx # Live HUD & 36-Slot Inventory Inspector
│   │   │   ├── ServerPanelTab.tsx # Hardware Telemetry, Power & Console
│   │   │   ├── PanelSetupGuideSheet.tsx # Crafty & Pterodactyl Setup Guide
│   │   │   ├── ProfileModal.tsx   # Minecraft IGN Account Linking Modal
│   │   │   ├── Sheet.tsx          # Universal Slide-Over Sheet Component
│   │   │   └── LoginPage.tsx      # 2-Column Split Hero Landing Portal
│   │   ├── App.tsx                # Root Application Component
│   │   └── index.css              # Vanilla CSS Design System Tokens
│   └── index.html
├── src/                           # Hono.js Backend Server
│   ├── routes/
│   │   ├── auth.ts                # Discord OAuth2 & User Profile API
│   │   └── office.ts              # Office Admin & Server Panel API
│   ├── services/
│   │   └── panel.ts               # Universal Pterodactyl & Crafty Client Adapter
│   ├── db.ts                      # Drizzle ORM Database Query Layer
│   ├── schema.ts                  # Type-Safe PostgreSQL Table Schemas
│   └── index.ts                   # Main Server Entry & Discord.js 2-Way Bot
├── drizzle.config.ts              # Drizzle Kit Migration Configuration
├── drizzle/                       # Generated SQL Schema Migrations
├── package.json
├── tsconfig.json
├── docker-compose.yml             # Full Stack Docker Compose Orchestration
├── Dockerfile                     # Multi-Stage Lightweight Production Image
├── .env.example
├── CONTRIBUTING.md                # Conventional Commits & Development Guide
├── SECURITY.md                    # Threat Model & Vulnerability Policy
├── CODE_OF_CONDUCT.md             # Contributor Covenant v2.1
├── CHANGELOG.md                   # Chronological Semantic Releases
└── README.md
```

---

## 🛡️ 9. Security & Access Control

- **JWT Session Tokens**: Stored securely in `HttpOnly` cookies.
- **Role Verification**: Admin-exclusive endpoints (`/api/office/*`) and command triggers are strictly verified against PostgreSQL records.
- **Script API Bearer Authentication**: Bedrock communication endpoints (`/api/game/*`) require an authorized Bearer token header.
- **SQL Sanitization**: All database operations use type-safe parameterized query builders via **Drizzle ORM** (`drizzle-orm`) to guarantee SQL injection prevention.
- **Vulnerability Reporting**: See our comprehensive [Security Policy](SECURITY.md) for disclosure guidelines and incident SLA.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">

**Built with ❤️ for the Magical Gaming Crew Community**

</div>
