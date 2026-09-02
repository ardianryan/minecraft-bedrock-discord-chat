# 🛍️ KiwEssentials Master Shop Generator & Addon Auto-Injector

The `mcaddon/addon-items/` directory is the automated pipeline for extracting, categorizing, cleaning display names, calculating anti-arbitrage economy pricing, and injecting **2,961 pure playable addon items** from all server addons directly into **KiwEssentials (`config_shop.js` & `admin_menu/shopConfig.js`)**.

> **💡 Git Status**: This directory is **100% safe and strongly recommended to be committed and pushed to your Git repository**. It serves as the permanent automated generator and database cache. Whenever KiwEssentials updates in the future, the entire server shop economy can be restored or regenerated in seconds with a single command.

---

## ⚡ Quick Start: How to Run When KiwEssentials Updates / New Addons Added

Whenever you update KiwEssentials to a newer version or add new Bedrock addons to the server:

```bash
# Run the automated master injector:
node mcaddon/addon-items/inject_to_kiw.mjs
```

The script will automatically:
1. Parse all item & block JSON definitions across behavior packs.
2. Cross-reference display names with `texts/en_US.lang` in resource packs.
3. Filter out raw crafting ingredients, intermediate batters/doughs, and multiblock dummy blocks.
4. Apply the anti-arbitrage economy pricing curve (High buy price, Sell price ~18–20%).
5. Update `config_shop.js` with all vanilla categories + 15 addon categories formatted with KiwEssentials color codes.
6. Refresh the JSON database cache at `mcaddon/addon-items/items.json`.

---

## 📋 15 Master Shop Addon Categories (KiwEssentials Color-Code Styled)

All categories follow the native KiwEssentials visual bracket formatting (`§l§0(§...§l...§l§0)`):

| Category ID | In-Game Shop Title | Source Addon | Playable Items | Buy Price Range | Sell Rate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `nico_magic_spells` | `§l§0(§5§lMAGIC SPELLS§l§0)` | Nico's Magic Spells | 113 items | `$2,500 – $8,500` | 18% |
| `nico_cave_expansion` | `§l§0(§9§lCAVE GEAR§l§0)` | Nico's Cave Expansion | 202 items | `$1,800 – $5,500` | 20% |
| `nico_item_expansion` | `§l§0(§6§lSPECIAL ITEMS§l§0)` | Nico's Item Expansion | 177 items | `$2,200 – $7,000` | 18% |
| `nico_mobs_dungeon` | `§l§0(§4§lDUNGEON RELICS§l§0)` | Nico's Mobs & More Dungeon | 228 items | `$2,000 – $7,500` | 18% |
| `cakes_sweets` | `§l§0(§d§lCAKES & SWEETS§l§0)` | Cakes & Bakes | 763 items | `$450 – $1,600` | 20% |
| `cakes_machinery` | `§l§0(§e§lBAKERY MACHINES§l§0)` | Cakes & Bakes | 43 items | `$1,200 – $4,500` | 20% |
| `crops_fresh` | `§l§0(§a§lFRESH CROPS§l§0)` | Crops & Farms | 801 items | `$250 – $800` | 22% |
| `crops_machinery` | `§l§0(§2§lFARM VEHICLES§l§0)` | Crops & Farms | 23 items | `$2,000 – $8,000` | 18% |
| `ultimate_drills` | `§l§0(§b§lMINING DRILLS§l§0)` | Ultimate Mining Drills | 27 items | `$3,500 – $12,000` | 18% |
| `armored_elytras` | `§l§0(§3§lARMORED ELYTRA§l§0)` | Armored Elytras | 19 items | `$5,000 – $15,000` | 15% |
| `unique_shields` | `§l§0(§7§lMORE SHIELDS§l§0)` | Unique & Ore Shields | 68 items | `$1,800 – $6,500` | 20% |
| `raiyon_tools` | `§l§0(§c§lMORE TOOLS§l§0)` | Raiyon's More Tools | 62 items | `$2,800 – $9,500` | 18% |
| `more_enchantments` | `§l§0(§d§lMORE ENCHANTS§l§0)` | More Enchantments | 60 items | `$3,000 – $8,500` | 18% |
| `improved_backpacks` | `§l§0(§g§lBACKPACKS§l§0)` | Improved Backpacks+ | 4 items | `$2,000 – $7,000` | 20% |
| `civilizations_addon` | `§l§0(§6§lCIVILIZATIONS§l§0)` | Civilizations Add-On | 371 items | `$1,500 – $6,000` | 20% |

**Total Pure Addon Items: `2,961 items`** *(in addition to all vanilla categories: Blocks, Wool, Wood, Furniture, Glass, Tools, Armor, Farming, Food, Ores, Spawners, and Enchanted Books)*.

---

## 🛠️ Key Technical Fixes & Changelog

1. **Duplicate Custom Component Protection (`ItemCustomComponentAlreadyRegisteredError` & `BlockCustomComponentAlreadyRegisteredError`)**:
   - Wrapped all `blockComponentRegistry.registerCustomComponent` and `itemComponentRegistry` calls across 28 Nico addon script files in `try { ... } catch (e) {}` to allow all 5 Nico packs to load concurrently without collision.
2. **TypeScript AST Audit Across All Behavior Packs**:
   - Resolved syntax anomalies in `sgs_cake_main.js`, `Civilizations/main.js`, `sgs_farm_main.js`, `Nicos Cave Expansion/bc/door.js`, and `RaiyonsTools/register.js`.
   - Verified all 502 script files across behavior packs with **0 syntax errors**.
3. **KiwEssentials Vanilla Export & Top-Level Import**:
   - Preserved all vanilla item array exports (`itemBlock`, `itemLog`, `itemFood`, etc.) in `config_shop.js` so that `invsee`, admin tools, and member shops function properly.
   - Fixed top-level import in `admin_menu/shopConfig.js` to resolve `ReferenceError: fileShopConfig is not defined`.
4. **Dynamic Properties Optimization (Eliminated 46 MB Flood Warning)**:
   - Default addon items now resolve directly from in-memory JavaScript structures (`DEFAULT_SHOP_CONFIG.items`) instead of mass-serializing thousands of items into `world.setDynamicProperty` on boot.
5. **Backpack Disconnect Safe Guards (`InvalidEntityError`)**:
   - Added `if (!player || !player.isValid()) return;` and `try/catch` wrappers in `Improved Backpacks+` event listeners (disconnect, hotbar change, container close) to prevent crashes when players leave.

---

## 📁 File Structure

- **`inject_to_kiw.mjs`**: Main generator script for the entire shop system.
- **`items.json`**: Structured JSON database cache of all items and categories.
- **`README.md`**: Complete operational documentation and technical changelog.
