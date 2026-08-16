<div align="center">

<img src="./assets/logo.png" alt="Magical Gaming Crew Logo" width="160" height="160" style="border-radius: 50%; box-shadow: 0 0 35px rgba(99, 102, 241, 0.4);" />

# 🎮 Magical Gaming Crew — Bedrock Bridge

**High-Performance Real-Time 3-Way Bridge & Console for Minecraft Bedrock, Discord, and Web Dashboard.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Hono.js](https://img.shields.io/badge/Hono.js-4.0+-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45+-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![Minecraft Bedrock](https://img.shields.io/badge/Bedrock%20Engine-1.20%20--%201.26+-2C7A32?style=for-the-badge&logo=minecraft&logoColor=white)](https://minecraft.net/)

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-key-features">Key Features</a> •
  <a href="#-quick-docker-deployment-1-command">Docker Deployment</a> •
  <a href="#-complete-installation-guide">Manual Installation</a> •
  <a href="#-behavior-pack-setup--usage">Behavior Pack</a> •
  <a href="./CONTRIBUTING.md">Contributing</a> •
  <a href="./SECURITY.md">Security</a> •
  <a href="./CODE_OF_CONDUCT.md">Code of Conduct</a> •
  <a href="./CHANGELOG.md">Changelog</a>
</p>

</div>

---

## ⚡ Quick Docker Deployment (1-Command)

The fastest and easiest way to deploy **Bedrock Bridge** with a pre-configured PostgreSQL database:

```bash
# 1. Clone repository
git clone https://github.com/ardianryan/discordmchat.git
cd discordmchat

# 2. Copy and configure your environment variables
cp .env.example .env

# 3. Launch full stack (App + PostgreSQL)
docker compose up -d --build
```

That's it! Your entire stack is now running at **[http://localhost:3000](http://localhost:3000)**.

To view logs:
```bash
docker compose logs -f app
```

To stop the services:
```bash
docker compose down
```

---

## 🌟 Overview

**Magical Gaming Crew — Bedrock Bridge** is a complete, unified bridge system that connects a **Minecraft Bedrock Edition server** (v1.20, v1.21+, through v1.26+) with a **Discord Community Server** and a **Modern Web Management Dashboard**.

> [!IMPORTANT]
> **👨‍💻 Intended for Developers & Self-Hosters:**
> This repository is a **self-hosted open-source framework**, not a hosted public bot service. **A pre-hosted bot is NOT provided** for privacy, security, and full data autonomy. Each server administrator/developer sets up their own Discord Application and Bot in the [Discord Developer Portal](https://discord.com/developers/applications) with 100% control over their database and credentials.

Built on **Hono.js**, **React (Vite)**, **PostgreSQL**, and the **Minecraft Bedrock Script API (`@minecraft/server` & `@minecraft/server-net`)**, it delivers sub-second bidirectional message relay, in-game slash command execution, account linking, interactive Discord controls, and dedicated admin operations over a single, deployment-ready port (**Port 3000**).

---

## ✨ Key Features

### ⚡ 1. Real-Time 3-Way Communication
- **Minecraft → Discord & Web**: Chat messages, player joins, player leaves, and server events are relayed instantly with rich embeds, player avatars, and linked Discord usernames.
- **Discord → Minecraft & Web**: Messages typed inside the designated Discord channel are broadcasted live to in-game chat and the web console.
- **Web → Minecraft & Discord**: Web console users can send chat messages or broadcast directly into the game.

### 🎮 2. In-Game Slash Command Execution
- Administrators can execute any native Minecraft command (e.g., `/time set day`, `/weather clear`, `/give`, `/tp`, `/gamemode`) directly from the **Web Dashboard** or **Discord Chat**.
- Guarded by role-based authorization in PostgreSQL with automatic audit logging to Discord.

### 🔗 3. Discord ↔ Minecraft Account Linking
- Strict 1-to-1 mapping between Discord user profiles and Minecraft In-Game Names (IGN).
- Link easily through the **Web Dashboard**, or interactively in Discord via popup modal dialogs.
- Friendly in-game reminder messages for unlinked players without disrupting their gameplay.

### 🤖 4. Interactive Discord Bot & UI Controls
- **Interactive Buttons & Modals**: Type `!panel` or `!menu` to summon a Discord control panel with interactive buttons (`🔗 Link IGN`, `📊 Server Status`, `👤 My Profile`, `🔓 Unlink`).
- Instant popup modal input form for linking Minecraft IGN directly inside Discord.

### 👔 5. Dedicated Office Admin Dashboard (`/office`)
- **Executive Metrics**: Total registered users, linked IGN percentage, active player count, and PostgreSQL connection health.
- **User Management**: Searchable data table with inline IGN editing, role toggling (`👑 Administrator` ↔ `⚔️ Member`), and deletion.
- **System Settings**: Live Webhook tester, Discord Bot token visibility toggle, dynamic Secret Bearer Token generator, and one-click script snippet copier.

### 📦 6. Single-Port Unified Deployment (Port 3000)
- Optimized for VPS and container environments. Both the React SPA frontend and Hono REST APIs run smoothly on **Port 3000** without requiring separate proxy services.

---

## 🏛️ Architecture

```
+-------------------------------------------------------------------------------+
|                            MAGICAL GAMING CREW                                |
|                        Real-Time 3-Way Bridge System                          |
+-------------------------------------------------------------------------------+
|                                                                               |
|   +-------------------+        +--------------------+        +-------------+  |
|   | Minecraft Bedrock | <----> | Hono Backend (3000)| <----> | Discord Bot |  |
|   | (Script API Net)  |  HTTP  |   & PostgreSQL DB  |  WS/API|  & Webhooks |  |
|   +-------------------+        +--------------------+        +-------------+  |
|                                          ^                                    |
|                                          | HTTP / Static                      |
|                                          v                                    |
|                               +----------------------+                        |
|                               | React Web Dashboard  |                        |
|                               |  & Office (/office)  |                        |
|                               +----------------------+                        |
|                                                                               |
+-------------------------------------------------------------------------------+
```

---

## 🚀 Complete Installation Guide

Follow this step-by-step tutorial to get your full bridge up and running from scratch.

### 📋 Prerequisites
- **Node.js** (v18.0.0 or higher) & **npm**
- **PostgreSQL** (v14 or higher) running locally or hosted
- **Minecraft Bedrock Edition** (Client or Bedrock Dedicated Server)
- **Discord Account** with permissions to create applications

---

### Step 1: Clone and Install Dependencies

```bash
# 1. Clone repository
git clone https://github.com/ardianryan/discordmchat.git
cd discordmchat

# 2. Install backend dependencies
npm install

# 3. Install frontend dependencies
npm --prefix client install
```

---

### Step 2: Database Setup (PostgreSQL)

Ensure PostgreSQL is running, then create the database:

```sql
CREATE DATABASE discordmchat;
```

*(Note: The server will automatically initialize all required tables — `users`, `link_codes`, and `system_settings` — on its first boot).*

---

### Step 3: Discord Application & Bot Setup (Self-Hosted)

Because this is a self-hosted developer bridge, you will create your own Discord Application & Bot instance:

1. **Create Application**:
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**. Give it a name (e.g. `My Minecraft Bridge`).
2. **OAuth2 Configuration (For Web Dashboard Login)**:
   - Go to the **OAuth2** tab.
   - Under **Redirects**, click **Add Redirect** and add:
     ```text
     http://localhost:3000/api/auth/discord/callback
     ```
     *(Or your production domain: `https://your-domain.com/api/auth/discord/callback`)*.
   - Copy your **Client ID** and **Client Secret** (save for `.env`).
3. **Create & Configure Bot (2-Way Listener)**:
   - Go to the **Bot** tab on the left sidebar.
   - Click **Reset Token** → Confirm → **Copy Token** *(This is your `DISCORD_BOT_TOKEN`)*.
   - Scroll down to **Privileged Gateway Intents** and enable:
     - ✅ **PRESENCE INTENT**
     - ✅ **SERVER MEMBERS INTENT**
     - ✅ **MESSAGE CONTENT INTENT** *(Mandatory: enables the bot to read in-game chat & commands)*.
   - Click **Save Changes**.
4. **Invite Bot to Your Discord Server**:
   - Go to **OAuth2 → URL Generator** (or **Installation**).
   - Scopes: Select `bot` and `applications.commands`.
   - Permissions: Select `Send Messages`, `Embed Links`, `Read Message History`, `View Channels` (or `Administrator`).
   - Open the generated invite URL in your browser and authorize the bot to join your Discord server.
5. **Get Channel ID**:
   - In Discord, enable **Developer Mode** (*User Settings → Advanced → Developer Mode*).
   - Right-click your `#ingame-chat` channel → Click **Copy Channel ID**.

---

### Step 4: Configure `.env` File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your configuration:

```ini
# Server Port
PORT=3000

# Security Key for Behavior Pack Authentication
API_KEY=SECRET_BEARER_TOKEN
JWT_SECRET=SUPER_SECRET_JWT_KEY_DISCORD_MCHAT_123

# PostgreSQL Database Connection URL
DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/discordmchat

# Discord OAuth2 Application Credentials
DISCORD_CLIENT_ID=YOUR_DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET=YOUR_DISCORD_CLIENT_SECRET
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback

# Initial Administrator (Your Discord User ID or Username)
INITIAL_ADMIN_DISCORD_ID=YOUR_DISCORD_USER_ID

# Discord Webhook, Bot Token & Channel (Can also be managed dynamically via /office)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
DISCORD_CHANNEL_ID=YOUR_DISCORD_CHANNEL_ID
DISCORD_INVITE_URL=https://discord.gg/your_invite_code

# Public Frontend URL
FRONTEND_URL=http://localhost:3000
```

---

### Step 5: Build and Run

#### 🚀 Production / Single-Port Deployment (Recommended)
```bash
# Build React frontend & TypeScript backend
npm run build

# Start the unified server on Port 3000
npm start
```

Open your browser and visit:
* **Web Live Chat**: [http://localhost:3000](http://localhost:3000)
* **Office Admin Dashboard**: [http://localhost:3000/office](http://localhost:3000/office)

#### 💻 Development Mode (Hot-Reload)
```bash
npm run dev
```

---

## 🧩 Behavior Pack Setup & Usage Tutorial

The Behavior Pack is located in the [`MGC_Bridge[BP]`](./MGC_Bridge[BP]) directory and is built to support Minecraft Bedrock **1.20, 1.21+, through 1.26+**.

```
MGC_Bridge[BP]/
├── manifest.json       # Behavior Pack metadata & Script API dependencies
├── pack_icon.png       # Official Magical Gaming Crew in-game icon
└── scripts/
    └── main.js         # HTTP network listener & command executor
```

---

### 📥 1. Installing the Pack into Minecraft

#### Option A: Windows 10/11 (Local Client / Host)
1. Press `Win + R`, paste the following path, and press Enter:
   ```text
   %localappdata%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\development_behavior_packs
   ```
2. Copy the entire `MGC_Bridge[BP]` folder into this directory.

#### Option B: Bedrock Dedicated Server (BDS / Linux / VPS)
1. Copy the `MGC_Bridge[BP]` folder into your server's `behavior_packs/` directory:
   ```text
   /path/to/bedrock-server/behavior_packs/MGC_Bridge[BP]
   ```
2. Open `worlds/<world_name>/world_behavior_packs.json` and add the pack UUID:
   ```json
   [
     {
       "pack_id": "a5d8b724-4f51-4c31-89a3-5c218683f120",
       "version": [1, 0, 0]
     }
   ]
   ```

---

### ⚙️ 2. Configuring Server URL & API Key in `scripts/main.js`

Open [`MGC_Bridge[BP]/scripts/main.js`](./MGC_Bridge[BP]/scripts/main.js) and configure lines 7–8:

```javascript
/**
 * Configuration: Point to your running Hono backend
 */
const HONO_BACKEND_URL = "http://YOUR_SERVER_IP_OR_DOMAIN:3000/api/game";
const API_KEY = "YOUR_API_KEY_OR_SECRET_BEARER_TOKEN";
```

> 💡 **Tip:** You can generate a cryptographically secure token and click **"Copy Snippet"** directly from the **[http://localhost:3000/office](http://localhost:3000/office)** dashboard (*Tab: Settings*).

---

### 🎮 3. Activating the Pack in Your World

1. Launch Minecraft and open your World Settings (or server configuration).
2. Go to **Behavior Packs** → Under *Available*, select **MGC Discord & Web Live Chat Bridge** → Click **Activate**.
3. Go to **Experiments** → Toggle **ON** **Beta APIs** *(Required for `@minecraft/server-net` HTTP requests)*.
4. Start your World / Server!

---

### ✅ 4. Verifying In-Game Connection

1. When joining the server, players will see a bridge welcome notification in their chat:
   - **Linked Players:** `§a[Discord Bridge] Selamat datang, PlayerName! Akun Anda terhubung dengan Discord @Username.`
   - **Unlinked Players:** `§6[Info Server] Halo PlayerName! Akun Anda belum terhubung Discord. Tautkan di Web: http://localhost:3000`
2. Messages sent in Minecraft will appear immediately on the **Web Live Chat** and in the **Discord Channel**.
3. Messages and commands sent from Discord or Web will execute in real-time inside Minecraft!

---

## 🤖 Bot Controls & Commands

You can interact with the bridge in your Discord channel using both **interactive UI buttons** and standard text commands:

| Discord Command | Type | Description |
| :--- | :--- | :--- |
| **`!panel`** or **`!menu`** | `Interactive` | Summons the full interactive UI panel with clickable buttons and modals. |
| **`!link <IGN>`** | `Text` | Manually links your Discord account to your Minecraft In-Game Name. |
| **`!unlink`** | `Text` | Unlinks your Minecraft In-Game Name from your Discord account. |
| **`!status`** or **`!players`** | `Text` | Displays live bridge status, online player count, and roster. |
| **`!help`** | `Text` | Shows all available bridge commands. |
| **`/command`** *(Admin Only)* | `In-Game` | Executes in-game Minecraft commands (e.g. `/time set day`, `/weather clear`, `/give`). |

---

## 📁 Project Structure

```
discordmchat/
├── assets/
│   └── logo.png                   # Official Magical Gaming Crew Logo
├── MGC_Bridge[BP]/                # Minecraft Bedrock Behavior Pack
│   ├── manifest.json              # Pack manifest (1.21+ / 1.26+ Script API)
│   ├── pack_icon.png              # Official in-game pack icon
│   └── scripts/
│       └── main.js                # @minecraft/server & server-net listener
├── client/                        # React (Vite) Frontend Application
│   ├── public/
│   │   ├── logo.png               # Web Favicon & Brand Icon
│   │   └── favicon.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx         # Modern Glassmorphic Navigation
│   │   │   ├── ChatFeed.tsx       # Live 3-Way Chat & Command Timeline
│   │   │   ├── PlayerList.tsx     # Active In-Game Player Roster
│   │   │   ├── OfficeDashboard.tsx# Admin Management & Config Suite
│   │   │   ├── ProfileModal.tsx   # Minecraft IGN Account Linking Modal
│   │   │   └── LoginPage.tsx      # Ambient Glassmorphism Hero Landing
│   │   ├── App.tsx                # Root Application Component
│   │   └── index.css              # Custom Vanilla CSS Design System Tokens
│   └── index.html
├── src/                           # Hono.js Backend Server
│   ├── routes/
│   │   ├── auth.ts                # Discord OAuth2 & User Profile API
│   │   └── office.ts              # Office Admin & Settings Management
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

## 🛡️ Security & Access Control

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
