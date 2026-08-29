# 📖 Developer & IDE Master Guide (`Guide-for-ide.md`)

Welcome to the **Magical Gaming Crew (MGC) Bedrock Bridge** developer and IDE master manual.  
This document is the **definitive, all-inclusive source of truth** for developers, AI coding agents, and server engineers. It details the complete architecture, directory workflows (`mcaddon/`, `scratch/`, `releases/`), KiwEssentials integration protocols, BDS server security, and release standards.

---

## 🧭 Table of Contents
1. [Core Directory Roles & Workflow Architecture](#1-core-directory-roles--workflow-architecture)
2. [Managing `mcaddon/` & Automated KiwEssentials Upgrades](#2-managing-mcaddon--automated-kiwessentials-upgrades)
3. [Connecting KiwEssentials to MGC Bridge (Step-by-Step Code)](#3-connecting-kiwessentials-to-mgc-bridge-step-by-step-code)
4. [Managing `scratch/` & Active Server Pack Bundling](#4-managing-scratch--active-server-pack-bundling)
5. [Managing `releases/` & Release Protocol](#5-managing-releases--release-protocol)
6. [Minecraft Bedrock Engine & Script API Rules](#6-minecraft-bedrock-engine--script-api-rules)
7. [BDS Configuration & `permissions.json`](#7-bds-configuration--permissionsjson)
8. [ClearLag Whitelist & Addon Protection](#8-clearlag-whitelist--addon-protection)
9. [Common Pitfalls & Troubleshooting Matrix](#9-common-pitfalls--troubleshooting-matrix)

---

## 1. Core Directory Roles & Workflow Architecture

The codebase is organized into modular directories with clear boundaries:

```
discordmchat/
├── MGC_Bridge[BP]/                 # 🎮 Active MGC Bridge Behavior Pack Source (v2.12.0)
│   ├── manifest.json              # Pack Manifest (min_engine_version: [1, 26, 0])
│   ├── pack_icon.png              # Official pack icon
│   └── scripts/
│       └── main.js                # Core telemetry (3s loop), player inventory, & chat listener
├── mcaddon/                       # 🌾 Modular Addon Catalog & Injection Tools (Local - gitignored)
│   ├── addon-items/               # 1,954 items database + categories/
│   │   ├── categories/            # 16 per-category JSON definition files
│   │   ├── items.json             # Master compiled item catalog
│   │   ├── inject_to_kiw.mjs      # 1-Command master auto-injector script
│   │   └── README.md              # Addon item pricing and injection guide
│   └── KiwEssentials/             # KiwEssentials BP & RP source workspace
│       ├── KiwBP/                 # Behavior Pack being patched
│       ├── KiwRP/                 # Resource Pack
│       └── KiwBP_33.2.1_MGC_Integrated.zip # Compiled integrated package
├── scratch/                       # 🛠️ Active Server Staging & Live Addon Management
│   ├── current_server_bp/         # 12 Active Server Behavior Packs (Live Server Mirror)
│   ├── current_server_rp/         # 10 Active Server Resource Packs (Live Server Mirror)
│   ├── behavior_packs.zip         # Ready-to-deploy server behavior pack bundle
│   └── resource_packs.zip         # Ready-to-deploy server resource pack bundle
├── releases/                      # 📦 Permanent Master Archive for all MGC Bridge Releases
│   ├── MGC_Bridge_v2.12.0.mcpack
│   ├── MGC_Bridge_v2.12.0.zip
│   └── (All historical versions v2.3.0 - v2.11.3)
├── src/                           # ⚡ Hono.js Backend (:2000), Game API, SSE & Discord Bot
├── client/                        # 🎨 React 19 + Vite 6 Glassmorphic Web Dashboard
├── permissions.json               # BDS Module Permissions template (@minecraft/server-net)
├── PRD.md                         # Product Requirements Document
├── ROADMAP.md                     # Engineering Tech Tree & Future Milestones
├── CHANGELOG.md                   # Chronological version history
└── README.md                      # Community Landing Page & Tutorial
```

---

## 2. Managing `mcaddon/` & Automated KiwEssentials Upgrades

The [`mcaddon/`](./mcaddon/) directory is an independent toolchain and database used to customize, price, and inject custom addon content into **KiwEssentials**.

### 2.1 Directory Structure
- **`mcaddon/addon-items/categories/`**: 16 JSON files containing categorized item definitions (`item`, `name`, `textures`, `cost`, `sell`, `addon`).
- **`mcaddon/addon-items/items.json`**: Master compiled catalog of all **1,954 items**.
- **`mcaddon/addon-items/inject_to_kiw.mjs`**: The master injection engine.
- **`mcaddon/KiwEssentials/KiwBP/`**: Active KiwEssentials Behavior Pack.
- **`mcaddon/KiwEssentials/KiwRP/`**: Active KiwEssentials Resource Pack.

### 2.2 Adding New Items to the Shop (e.g. Kelp, Blaze Rod)
1. Open the relevant category JSON file in `mcaddon/addon-items/categories/` (e.g., `cf_fresh_crops.json` or `mo_enchantments.json`).
2. Add the item entry:
   ```json
   {
     "textures": "textures/items/kelp",
     "name": "Kelp",
     "cost": 60,
     "sell": 15,
     "data": 0,
     "item": "minecraft:kelp",
     "addon": "Vanilla"
   }
   ```
3. Re-compile `items.json` and run the injector:
   ```bash
   node mcaddon/addon-items/inject_to_kiw.mjs
   ```

### 2.3 SOP: Handling a New KiwEssentials Release
Whenever a new version of KiwEssentials is released (e.g., `33.2.1`, `34.0.0`):
1. **Extract New Files**:
   Extract the new release files into `mcaddon/KiwEssentials/KiwBP/` and `mcaddon/KiwEssentials/KiwRP/`.
2. **Execute Auto-Injector**:
   ```bash
   node mcaddon/addon-items/inject_to_kiw.mjs
   ```
3. **What the Injector Automatically Does**:
   - **Injects 1,954 Items**: Populates `scripts/menu_member/config_shop.js`.
   - **Zero-Disk-Write RAM Cache**: Injects `SHOP_CONFIG_CACHE_MS = 300000` (5 minutes) into `scripts/admin_menu/shopConfig.js` to eliminate 45MB–59MB LevelDB startup write warnings.
   - **Injects MGC Live Chat Relay**: Hooks `relayChatToMGC` into `scripts/board/chat.js`.
   - **Configures `manifest.json`**: Adds `@minecraft/server-net` (`1.0.0-beta`) and `script_eval` capability.
   - **Injects Locales**: Writes clean category titles into `scripts/lib/locales.js`.
   - **Auto-Packages Output**: Builds `KiwBP_<version>_MGC_Integrated.mcpack` & `.zip`.

---

## 3. Connecting KiwEssentials to MGC Bridge (Step-by-Step Code)

To connect KiwEssentials chat directly to Discord and Web Live Chat without duplicate transmissions, follow these 3 steps:

### Step 1: Ensure `@minecraft/server-net` in BDS `permissions.json`
In your Bedrock Dedicated Server root (`config/default/permissions.json` or `worlds/CloudCPE/permissions.json`):
```json
{
  "allowed_modules": [
    "@minecraft/server-gametest",
    "@minecraft/server",
    "@minecraft/server-ui",
    "@minecraft/server-admin",
    "@minecraft/server-editor",
    "@minecraft/debug-utilities",
    "@minecraft/server-net"
  ]
}
```

### Step 2: Add `@minecraft/server-net` to `KiwBP/manifest.json`
```json
"dependencies": [
  { "module_name": "@minecraft/server", "version": "beta" },
  { "module_name": "@minecraft/server-ui", "version": "beta" },
  { "module_name": "@minecraft/server-net", "version": "1.0.0-beta" }
],
"capabilities": [
  "script_eval"
]
```

### Step 3: Add Relay Helper to `KiwBP/scripts/board/chat.js`
At the top of `KiwBP/scripts/board/chat.js`:
```javascript
// ── MGC Discord & Web Live Chat Bridge Relay ──
function relayChatToMGC(senderName, messageText) {
  try {
    const rawMsg = String(messageText || "").trim();
    if (!rawMsg || rawMsg.startsWith("!") || rawMsg.startsWith("/") || rawMsg.startsWith("+")) return;
    system.sendScriptEvent("mgc:chat", JSON.stringify({
      sender: senderName || "Player",
      message: rawMsg
    }));
  } catch {}
}
```

Inside the chat send handler (right after `ensurePlayerHasRank(player);`), call:
```javascript
relayChatToMGC(player.name, message);
```

> [!NOTE]
> `MGC_Bridge[BP]` captures the `mgc:chat` ScriptEvent, performs deduplication, and sends a single secure HTTP request to the backend via `@minecraft/server-net`.

---

## 4. Managing `scratch/` & Active Server Pack Bundling

The [`scratch/`](./scratch/) directory is the **active server staging environment** used to test, patch, and bundle all behavior and resource packs running on the live server.

### 4.1 Active Server Folders:
- **`scratch/current_server_bp/`**: Contains the full stack of 12 active behavior packs:
  1. `KiwEssentBP` (KiwEssentials with 1,954 items + MGC Bridge Relay)
  2. `mgc-brigde` (MGC Bridge v2.12.0)
  3. `Crops  Farms Add-On BP`
  4. `Cakes Bakes 1.0 BP`
  5. `Civilizations Add-On BP`
  6. `Ultimate Drills BP`
  7. `Improved Backpacks Behavior Pack V4.1 STABLE`
  8. `Armored Elytras (ElytrasBE)`
  9. `More Enchantments (MoreEnchanBE)`
  10. `More Shields (Raiyon'sMo ShieldsBE)`
  11. `More Tools (Raiyon'sToolsBe)`
  12. `Lynx Ultimate EssentialPlusV1.1`
- **`scratch/current_server_rp/`**: Contains the matching 10 active resource packs.

### 4.2 Compatibility Patches Maintained in `scratch/`:
- **Particle Physics Fixes**: Water sprinkler and watering can particles in Crops & Farms RP fixed (`gravity: -12.0`, `lifetime: 1.2s`, `expire_on_contact: false`).
- **Engine Version Typo Fixes**: Corrected invalid manifests (e.g. `min_engine_version: [1, 21, 120]` in Cakes & Bakes corrected to `[1, 21, 20]`).
- **ClearLag Whitelist**: `bps:`, `myw:`, `sgs:`, `civ:`, `raiyon:` protected in `KiwEssentBP/scripts/plugins/clear-lag/clearlag.js`.

### 4.3 SOP: Compiling Server Deployment ZIPs
To generate clean server ZIP bundles ready for Crafty Controller / Pterodactyl:
```bash
# 1. Clean shadow files and macOS artifacts
find scratch/current_server_bp scratch/current_server_rp -name "__MACOSX" -exec rm -rf {} +
find scratch/current_server_bp scratch/current_server_rp -name ".DS_Store" -exec rm -rf {} +

# 2. Compile deployment zip bundles
cd scratch/current_server_bp && zip -q -r "../behavior_packs.zip" * && cd ../..
cd scratch/current_server_rp && zip -q -r "../resource_packs.zip" * && cd ../..
```

---

## 5. Managing `releases/` & Release Protocol

The [`releases/`](./releases/) directory is the **permanent repository archive** where all compiled `.mcpack` and `.zip` distribution packages are stored.

### 5.1 Rules:
- All published release files (`MGC_Bridge_v*.mcpack` and `MGC_Bridge_v*.zip`) are stored in `releases/`.
- Never delete historical release files from `releases/`.

### 5.2 Release Protocol Checklist:
1. Bump version numbers across:
   - `package.json`
   - `client/package.json`
   - `MGC_Bridge[BP]/manifest.json`
   - `MGC_Bridge[BP]/scripts/main.js`
   - `Navbar.tsx`, `OfficeDashboard.tsx`, `LoginPage.tsx`
   - `README.md` & `CHANGELOG.md`
2. Build frontend and run automated tests:
   ```bash
   npm run build:client && npm test
   ```
3. Compile release packages into `releases/`:
   ```bash
   cd "MGC_Bridge[BP]"
   zip -q -r "../releases/MGC_Bridge_v<VERSION>.mcpack" *
   zip -q -r "../releases/MGC_Bridge_v<VERSION>.zip" *
   cd ..
   ```
4. Git commit, tag, and publish to GitHub Releases (Specify explicit files, never use `git add .` blindly):
   ```bash
   git add package.json client/package.json MGC_Bridge[BP]/ client/src/ README.md CHANGELOG.md PRD.md Guide-for-ide.md permissions.json
   git commit -m "release: v<VERSION> - <Title>"
   git push origin main
   git tag -a v<VERSION> -m "Release v<VERSION>"
   git push origin v<VERSION>
   gh release create v<VERSION> "releases/MGC_Bridge_v<VERSION>.mcpack" "releases/MGC_Bridge_v<VERSION>.zip" --title "MagicalCraft MGC Bridge v<VERSION>" --notes "<Release Notes>" --latest
   ```

> [!IMPORTANT]
> **Strict Staging Rule**: Never run `git add .` blindly during release packaging. Always specify the explicit list of target release files above to prevent accidentally staging gitignored folders (`mcaddon/`), scratch scripts, or local testing files.

---

## 6. Minecraft Bedrock Engine & Script API Rules

- **Target Engine Version**: Minecraft Bedrock **1.26.45.1+** (`min_engine_version: [1, 26, 0]`).
- **Dependencies in `manifest.json`**:
  - `@minecraft/server`: `"beta"`
  - `@minecraft/server-net`: `"1.0.0-beta"`
  - Capabilities: `["script_eval"]`
- **Safe Player Iteration**:
  ```javascript
  const players = world.getAllPlayers ? world.getAllPlayers() : world.getPlayers();
  ```
- **Cumulative Playtime Reading**:
  - **CRITICAL**: Never read `online_time` before `playtime`. `online_time` is a binary active flag (value `1`). True cumulative seconds reside in the `playtime` scoreboard objective.

---

## 7. BDS Configuration & `permissions.json`

Bedrock Dedicated Server (BDS) strictly blocks `@minecraft/server-net` unless authorized in `permissions.json`.

### Required Location:
`<Server_Root>/config/default/permissions.json` (or `worlds/CloudCPE/permissions.json`).

### Configuration:
```json
{
  "allowed_modules": [
    "@minecraft/server-gametest",
    "@minecraft/server",
    "@minecraft/server-ui",
    "@minecraft/server-admin",
    "@minecraft/server-editor",
    "@minecraft/debug-utilities",
    "@minecraft/server-net"
  ]
}
```

---

## 8. ClearLag Whitelist & Addon Protection

Addons like **Improved Backpacks** (`bps:`), **Ultimate Drills** (`myw:`), and **Crops & Farms** (`sgs:`) store runtime data inside invisible dummy entities.  
ClearLag must be configured with protected type IDs and prefixes in `KiwEssentBP/scripts/plugins/clear-lag/clearlag.js`:

```javascript
const PROTECTED_TYPE_IDS = new Set([
  "minecraft:player",
  "minecraft:npc",
  "kiwo:npc",
  "add:floating_text",
  "qidb:storage",
  "bps:container_entity",
  "bps:container_entity_temp",
]);

const PROTECTED_TYPE_PREFIXES = [
  "enchanted:", 
  "sr:", 
  "r4isen1920_invsee:", 
  "bps:", 
  "myw:", 
  "sgs:", 
  "civ:", 
  "raiyon:", 
  "kor:"
];
```

---

## 9. Common Pitfalls & Troubleshooting Matrix

| Issue | Root Cause | Solution |
|---|---|---|
| `Multiple manifests found at the same directory level` | Hidden `__MACOSX` folders or `.zip` files inside `behavior_packs/` | Delete all `__MACOSX` folders and unextracted `.zip` files from `behavior_packs/` |
| `module [@minecraft/server-net] but it is not configured to use it` | Missing permission in BDS configuration | Add `"@minecraft/server-net"` to `config/default/permissions.json` |
| `In-game chat sent twice to Discord/Web` | Both direct HTTP in KiwBP and ScriptEvent in MGC Bridge firing | Use `system.sendScriptEvent("mgc:chat")` in KiwBP + 1.5s deduplication in backend |
| `Leaderboard playtime resets to 0m` | Reading `online_time` (value `1`) instead of `playtime` | Prioritize `playtime` objective in `readPlaytime()` |
| `[Backpack+] Unable to retrieve backpack items` | ClearLag deleting `bps:container_entity` dummy storage | Add `bps:` to `PROTECTED_TYPE_PREFIXES` in `clearlag.js` |
| `Sprinkler water particles vanish instantly` | Extreme gravity (`-410.0`) and `expire_on_contact: true` | Set gravity to `-12.0`, lifetime to `1.2s`, `expire_on_contact: false` in RP particles |
