import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// ── Auto-Detect Target Paths
let bpDir = path.join(rootDir, 'scratch/current_server_bp');
let rpDir = path.join(rootDir, 'scratch/current_server_rp');

if (process.argv[2]) bpDir = path.resolve(process.argv[2]);
if (process.argv[3]) rpDir = path.resolve(process.argv[3]);

let targetConfigShop = path.join(bpDir, 'KiwEssentBP/scripts/menu_member/config_shop.js');
if (!fs.existsSync(targetConfigShop)) {
  targetConfigShop = path.join(bpDir, 'KiwBP/scripts/menu_member/config_shop.js');
}

console.log(`================================================================`);
console.log(`🌾🍰🎒⚔️🛡️ MASTER KIWESSENTIALS & ADDONS SHOP AUTO-INJECTOR`);
console.log(`BP Directory: ${bpDir}`);
console.log(`RP Directory: ${rpDir}`);
console.log(`Target Shop : ${targetConfigShop}`);
console.log(`================================================================\n`);

// 1. Language Parser
const langMap = new Map();
if (fs.existsSync(rpDir)) {
  for (const rp of fs.readdirSync(rpDir)) {
    const p = path.join(rpDir, rp, 'texts/en_US.lang');
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.substring(0, eqIdx).trim().toLowerCase();
          let val = trimmed.substring(eqIdx + 1).trim();
          val = val.replace(/§[0-9a-fk-or]/gi, '').replace(/\\n/g, ' ').trim();
          if (key && val) {
            langMap.set(key, val);
          }
        }
      }
    }
  }
}
console.log(`✓ Loaded ${langMap.size} English language strings from Resource Packs.`);

// 2. Texture Parser
const textureMap = new Map();
if (fs.existsSync(rpDir)) {
  for (const rp of fs.readdirSync(rpDir)) {
    const texPath = path.join(rpDir, rp, 'textures/item_texture.json');
    if (fs.existsSync(texPath)) {
      try {
        const json = JSON.parse(fs.readFileSync(texPath, 'utf8'));
        const textureData = json.texture_data || {};
        for (const [key, val] of Object.entries(textureData)) {
          let tex = typeof val.textures === 'string' ? val.textures : (Array.isArray(val.textures) ? val.textures[0] : (val.textures?.path || ''));
          if (tex) {
            tex = tex.replace(/\.png$/, '');
            textureMap.set(key.toLowerCase(), tex);
          }
        }
      } catch (e) {}
    }
  }
}
console.log(`✓ Loaded ${textureMap.size} item textures from item_texture.json definitions.`);

function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function cleanDisplayName(identifier, rawNameHint) {
  const cleanId = identifier.toLowerCase();
  
  const knownNameMap = {
    'sgs_cake:baguette': 'Fresh Artisan Baguette',
    'sgs_cake:3d_bread_bag': 'Fresh Artisan Baguette',
    'sgs_cake:banana_bread': 'Banana Bread',
    'sgs_cake:3d_bread_loaf_banana': 'Banana Bread Loaf',
    'sgs_cake:farmhouse_loaf': 'Farmhouse Bread Loaf',
    'sgs_cake:3d_bread_loaf_farm': 'Farmhouse Bread Loaf',
    'sgs_cake:seeded_loaf': 'Seeded Bread Loaf',
    'sgs_cake:3d_bread_loaf_seed': 'Seeded Bread Loaf',
    'sgs_cake:tiger_loaf': 'Tiger Bread Loaf',
    'sgs_cake:3d_bread_loaf_tiger': 'Tiger Bread Loaf',
    'sgs_cake:wholemeal_loaf': 'Wholemeal Bread Loaf',
    'sgs_cake:3d_bread_loaf_whole': 'Wholemeal Bread Loaf',
    'sgs_cake:sour_bread': 'Sourdough Bread',
    'sgs_cake:3d_bread_sour': 'Sourdough Bread Loaf',
    'sgs_cake:plain_swirl_bread': 'Plain Swirl Bread',
    'sgs_cake:3d_bread_swirl': 'Plain Swirl Bread',
    'sgs_cake:glazed_swirl_bread': 'Glazed Swirl Bread',
    'sgs_cake:3d_bread_swirl_glaze': 'Glazed Swirl Bread',
    'sgs_cake:bread_slice': 'Fresh Bread Slice',
    'sgs_cake:bread_slice_with_strawberry_jam': 'Strawberry Jam Toast',
    'ntk:arcane_staff': 'Arcane Magic Staff',
    'ntk:blazing_staff': 'Blazing Fire Staff',
    'ntk:amethyst_apple': 'Enchanted Amethyst Apple',
    'ntk:blazing_apple': 'Blazing Golden Apple',
    'ntk:arcazure_pearl': 'Arcazure Warp Pearl',
    'ntk:blazing_pearl': 'Blazing Ender Pearl',
    'ntk:book_of_biomes': 'Ancient Book of Biomes',
    'ntk:bamboo_cup_with_chocolate': 'Hot Chocolate Bamboo Cup',
    'ntk:bamboo_cup_with_glow_berry_juice': 'Glow Berry Juice Cup',
    'ntk:bamboo_cup_with_sweet_berry_juice': 'Sweet Berry Juice Cup',
    'ntk:bamboo_cup_with_milk': 'Fresh Milk Bamboo Cup',
    'ntk:bamboo_cup_with_water': 'Pure Spring Water Cup'
  };

  if (knownNameMap[cleanId]) return knownNameMap[cleanId];

  const langKeys = [
    `item.${cleanId}.name`,
    `item.${cleanId}`,
    `tile.${cleanId}.name`,
    `tile.${cleanId}`,
    `entity.${cleanId}.name`,
    `entity.${cleanId}`,
    cleanId
  ];

  for (const k of langKeys) {
    if (langMap.has(k)) {
      let val = langMap.get(k);
      if (val && !val.includes('%') && val.length > 1) {
        return val;
      }
    }
  }

  const noNs = cleanId.includes(':') ? cleanId.split(':')[1] : cleanId;
  const noNsKeys = [
    `item.${noNs}.name`,
    `item.${noNs}`,
    `tile.${noNs}.name`,
    `tile.${noNs}`,
    noNs
  ];

  for (const k of noNsKeys) {
    if (langMap.has(k)) {
      let val = langMap.get(k);
      if (val && !val.includes('%') && val.length > 1) {
        return val;
      }
    }
  }

  let clean = noNs
    .replace(/^3d_/, '')
    .replace(/^item_/, '')
    .replace(/^tile_/, '')
    .replace(/^block_/, '')
    .replace(/^custom_/, '')
    .replace(/^ntk_/, '')
    .replace(/^nie_/, '')
    .replace(/^sgs_/, '')
    .replace(/^sgs_cake_/, '')
    .replace(/^sgs_farm_/, '')
    .replace(/_mb$/, '')
    .replace(/_item$/, '')
    .replace(/_block$/, '');

  return toTitleCase(clean);
}

function isUnusableItem(identifier, name) {
  const s = `${identifier} ${name}`.toLowerCase();
  if (s.includes('_batter') || s.includes(' batter')) return true;
  if (s.includes('_dough') || s.includes(' dough')) return true;
  if (s.includes('_raw_') || s.startsWith('raw_') || s.includes(' raw ') || s.includes('raw bread') || s.includes('raw pie')) return true;
  if (s.includes('unbaked') || s.includes('_unbaked')) return true;
  if (s.includes('flour') || s.includes('powder') && !s.includes('blaze')) return true;
  if (s.includes('_mixture') || s.includes('mix')) return true;
  if (s.includes('_mb') || s.includes('_dummy') || s.includes('_seat') || s.includes('_collision')) return true;
  if (s.includes('_engine') || s.includes('invisible_') || s.includes('temp_')) return true;
  if (s.includes('raw_beef') || s.includes('raw_chicken') || s.includes('raw_pork') || s.includes('raw_mutton')) return true;
  return false;
}

function resolveTexture(identifier) {
  const cleanId = identifier.toLowerCase();
  const noNs = cleanId.includes(':') ? cleanId.split(':')[1] : cleanId;

  if (textureMap.has(cleanId)) return textureMap.get(cleanId);
  if (textureMap.has(noNs)) return textureMap.get(noNs);
  if (textureMap.has(`item_${noNs}`)) return textureMap.get(`item_${noNs}`);
  if (textureMap.has(`sgs_cake_${noNs}`)) return textureMap.get(`sgs_cake_${noNs}`);
  if (textureMap.has(`sgs_farm_${noNs}`)) return textureMap.get(`sgs_farm_${noNs}`);
  if (textureMap.has(`ntk_${noNs}`)) return textureMap.get(`ntk_${noNs}`);

  for (const [key, tex] of textureMap.entries()) {
    if (key.includes(noNs) || noNs.includes(key)) {
      return tex;
    }
  }

  if (cleanId.includes('sword') || cleanId.includes('blade') || cleanId.includes('dagger') || cleanId.includes('spear')) return 'textures/items/diamond_sword';
  if (cleanId.includes('shield')) return 'textures/items/shield';
  if (cleanId.includes('drill')) return 'textures/items/diamond_pickaxe';
  if (cleanId.includes('spell') || cleanId.includes('wand') || cleanId.includes('magic') || cleanId.includes('tome') || cleanId.includes('staff')) return 'textures/items/enchanted_book';
  if (cleanId.includes('cake') || cleanId.includes('bread') || cleanId.includes('food') || cleanId.includes('pie') || cleanId.includes('loaf') || cleanId.includes('baguette')) return 'textures/items/bread';
  if (cleanId.includes('potion') || cleanId.includes('elixir') || cleanId.includes('stew') || cleanId.includes('juice')) return 'textures/items/potion_bottle_heal';

  return 'textures/items/apple';
}

const categoryConfigs = [
  {
    id: 'nico_magic_spells',
    name: '§l§0(§5§lMAGIC SPELLS§l§0)',
    icon: 'textures/items/enchanted_book',
    filter: (id, name, bp) => bp.includes('Magic Spells') || id.includes('spell') || id.includes('tome') || id.includes('wand') || id.includes('staff'),
    pricing: { buyMin: 2500, buyMax: 8500, sellRate: 0.18 }
  },
  {
    id: 'nico_cave_expansion',
    name: '§l§0(§9§lCAVE GEAR§l§0)',
    icon: 'textures/items/iron_pickaxe',
    filter: (id, name, bp) => bp.includes('Cave Expansion') || id.includes('spear') || id.includes('olivine'),
    pricing: { buyMin: 1800, buyMax: 5500, sellRate: 0.20 }
  },
  {
    id: 'nico_item_expansion',
    name: '§l§0(§6§lSPECIAL ITEMS§l§0)',
    icon: 'textures/items/totem',
    filter: (id, name, bp) => bp.includes('Item Expansion'),
    pricing: { buyMin: 2200, buyMax: 7000, sellRate: 0.18 }
  },
  {
    id: 'nico_mobs_dungeon',
    name: '§l§0(§4§lDUNGEON RELICS§l§0)',
    icon: 'textures/items/emerald',
    filter: (id, name, bp) => bp.includes('Mobs') || bp.includes('More Dungeon') || id.includes('jellyfish') || id.includes('dungeon'),
    pricing: { buyMin: 2000, buyMax: 7500, sellRate: 0.18 }
  },
  {
    id: 'cakes_sweets',
    name: '§l§0(§d§lCAKES & SWEETS§l§0)',
    icon: 'textures/items/cake',
    filter: (id, name, bp) => bp.includes('Cakes Bakes') && !id.includes('oven') && !id.includes('blender') && !id.includes('mixer') && !id.includes('table') && !id.includes('counter'),
    pricing: { buyMin: 450, buyMax: 1600, sellRate: 0.20 }
  },
  {
    id: 'cakes_machinery',
    name: '§l§0(§e§lBAKERY MACHINES§l§0)',
    icon: 'textures/items/cauldron',
    filter: (id, name, bp) => bp.includes('Cakes Bakes') && (id.includes('oven') || id.includes('blender') || id.includes('mixer') || id.includes('table') || id.includes('counter') || id.includes('stand') || id.includes('whisk')),
    pricing: { buyMin: 1200, buyMax: 4500, sellRate: 0.20 }
  },
  {
    id: 'crops_fresh',
    name: '§l§0(§a§lFRESH CROPS§l§0)',
    icon: 'textures/items/carrot',
    filter: (id, name, bp) => bp.includes('Crops') && !id.includes('tractor') && !id.includes('sprinkler') && !id.includes('harvester') && !id.includes('planter') && !id.includes('plow'),
    pricing: { buyMin: 250, buyMax: 800, sellRate: 0.22 }
  },
  {
    id: 'crops_machinery',
    name: '§l§0(§2§lFARM VEHICLES§l§0)',
    icon: 'textures/items/minecart',
    filter: (id, name, bp) => bp.includes('Crops') && (id.includes('tractor') || id.includes('sprinkler') || id.includes('harvester') || id.includes('planter') || id.includes('plow') || id.includes('irrigation') || id.includes('guidebook')),
    pricing: { buyMin: 2000, buyMax: 8000, sellRate: 0.18 }
  },
  {
    id: 'ultimate_drills',
    name: '§l§0(§b§lMINING DRILLS§l§0)',
    icon: 'textures/items/netherite_pickaxe',
    filter: (id, name, bp) => bp.includes('drills') || id.includes('drill'),
    pricing: { buyMin: 3500, buyMax: 12000, sellRate: 0.18 }
  },
  {
    id: 'armored_elytras',
    name: '§l§0(§3§lARMORED ELYTRA§l§0)',
    icon: 'textures/items/elytra',
    filter: (id, name, bp) => bp.includes('Elytras') || id.includes('colytra') || id.includes('elytra'),
    pricing: { buyMin: 5000, buyMax: 15000, sellRate: 0.15 }
  },
  {
    id: 'unique_shields',
    name: '§l§0(§7§lMORE SHIELDS§l§0)',
    icon: 'textures/items/shield',
    filter: (id, name, bp) => bp.includes('Shields') || id.includes('shield'),
    pricing: { buyMin: 1800, buyMax: 6500, sellRate: 0.20 }
  },
  {
    id: 'raiyon_tools',
    name: '§l§0(§c§lMORE TOOLS§l§0)',
    icon: 'textures/items/netherite_sword',
    filter: (id, name, bp) => bp.includes('Tools') || id.includes('dragonforge') || id.includes('sculkite') || id.includes('breeze') || id.includes('shulkite'),
    pricing: { buyMin: 2800, buyMax: 9500, sellRate: 0.18 }
  },
  {
    id: 'more_enchantments',
    name: '§l§0(§d§lMORE ENCHANTS§l§0)',
    icon: 'textures/items/enchanted_book',
    filter: (id, name, bp) => bp.includes('MoreEnchan') || id.includes('enchant'),
    pricing: { buyMin: 3000, buyMax: 8500, sellRate: 0.18 }
  },
  {
    id: 'improved_backpacks',
    name: '§l§0(§g§lBACKPACKS§l§0)',
    icon: 'textures/items/bundle',
    filter: (id, name, bp) => bp.includes('Backpack') || id.includes('backpack'),
    pricing: { buyMin: 2000, buyMax: 7000, sellRate: 0.20 }
  },
  {
    id: 'civilizations_addon',
    name: '§l§0(§6§lCIVILIZATIONS§l§0)',
    icon: 'textures/items/gold_ingot',
    filter: (id, name, bp) => bp.includes('Civilizations') || id.includes('mythicus') || id.includes('artisan') || id.includes('alchemist'),
    pricing: { buyMin: 1500, buyMax: 6000, sellRate: 0.20 }
  }
];

function getFilesRecursively(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(getFilesRecursively(full));
    } else if (f.endsWith('.json')) {
      results.push(full);
    }
  }
  return results;
}

const categorizedItems = new Map();
for (const cat of categoryConfigs) {
  categorizedItems.set(cat.id, []);
}

const seenIdentifiers = new Set();
let totalExtracted = 0;

if (fs.existsSync(bpDir)) {
  for (const bp of fs.readdirSync(bpDir)) {
    const itemsPath = path.join(bpDir, bp, 'items');
    const blocksPath = path.join(bpDir, bp, 'blocks');

    const allFiles = [...getFilesRecursively(itemsPath), ...getFilesRecursively(blocksPath)];

    for (const fullPath of allFiles) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const json = JSON.parse(content);
        const identifier = json['minecraft:item']?.description?.identifier || json['minecraft:block']?.description?.identifier;

        if (!identifier || seenIdentifiers.has(identifier)) continue;

        const displayName = cleanDisplayName(identifier, fullPath);

        if (isUnusableItem(identifier, displayName)) {
          continue;
        }

        let matchedCat = null;
        for (const cat of categoryConfigs) {
          if (cat.filter(identifier, displayName, bp)) {
            matchedCat = cat;
            break;
          }
        }

        if (!matchedCat) continue;

        seenIdentifiers.add(identifier);
        const texture = resolveTexture(identifier);

        const priceSpread = matchedCat.pricing.buyMax - matchedCat.pricing.buyMin;
        let hash = 0;
        for (let i = 0; i < identifier.length; i++) hash = (hash * 31 + identifier.charCodeAt(i)) & 0xffffffff;
        const normalizedHash = Math.abs(hash) % 1000 / 1000;

        const buyCost = Math.round((matchedCat.pricing.buyMin + priceSpread * normalizedHash) / 10) * 10;
        const sellCost = Math.max(10, Math.round(buyCost * matchedCat.pricing.sellRate / 5) * 5);

        categorizedItems.get(matchedCat.id).push({
          item: identifier,
          name: displayName,
          textures: texture,
          cost: buyCost,
          sell: sellCost
        });

        totalExtracted++;
      } catch (err) {}
    }
  }
}

console.log(`\n✅ Extraction Complete! Total Pure Playable Items: ${totalExtracted}`);
for (const cat of categoryConfigs) {
  console.log(`  • ${cat.name} (${cat.id}): ${categorizedItems.get(cat.id).length} items`);
}

// ─────────────────────────────────────────────────────────────
// 8. GENERATE MASTER config_shop.js (PRESERVES VANILLA EXPORTS)
// ─────────────────────────────────────────────────────────────
let shopJs = `// ========================================================
// ── KIWESSENTIALS MASTER SHOP CONFIGURATION ──
// Auto-generated with Full Vanilla Item Compatibility & 15 Addon Categories
// Total Addon Categories: ${categoryConfigs.length}
// Total Pure Playable Items: ${totalExtracted}
// Anti-Arbitrage Guard: Buy Price > Sell Price (15% - 25% Sell Rate)
// ========================================================

export const configshop = {
  gui: {
    name: {
      title: "§6SHOP UI",
    },
  },
};

export function createItem(texture, name, cost, sell, data = 0, item = "", notsold = false, enchantments = null) {
  return {
    textures: texture,
    name: name,
    cost: cost,
    sell: sell,
    data: data,
    item: item,
    ...(notsold && { notsold: true }),
    ...(enchantments && { enchantments }),
  };
}

// ── 1. Vanilla Blocks & Building
export const itemBlock = [
  createItem("textures/blocks/grass_side_carried.png", "Grass", 80, 15, 0, "grass_block"),
  createItem("textures/blocks/moss_block.png", "Moss", 109, 20, 0, "moss_block"),
  createItem("textures/blocks/dirt_with_roots.png", "Rooted Dirt", 62, 15, 0, "dirt_with_roots"),
  createItem("textures/blocks/dirt.png", "Dirt", 62, 10, 0, "dirt"),
  createItem("textures/blocks/sand.png", "Sand", 62, 10, 0, "sand"),
  createItem("textures/blocks/red_sand.png", "Red Sand", 62, 10, 0, "red_sand"),
  createItem("textures/blocks/gravel.png", "Gravel", 62, 10, 0, "gravel"),
  createItem("textures/blocks/clay.png", "Clay", 62, 10, 0, "clay"),
  createItem("textures/blocks/cobblestone.png", "Cobblestone", 93, 15, 0, "cobblestone"),
  createItem("textures/blocks/stone.png", "Stone", 109, 20, 0, "stone"),
  createItem("textures/blocks/stone_granite.png", "Granite", 109, 20, 1, "granite"),
  createItem("textures/blocks/stone_granite_smooth.png", "Polished Granite", 109, 20, 2, "polished_granite"),
  createItem("textures/blocks/stone_diorite.png", "Diorite", 109, 20, 3, "diorite"),
  createItem("textures/blocks/stone_diorite_smooth.png", "Polished Diorite", 109, 20, 4, "polished_diorite"),
  createItem("textures/blocks/stone_andesite.png", "Andesite", 109, 20, 5, "andesite"),
  createItem("textures/blocks/stone_andesite_smooth.png", "Polished Andesite", 109, 20, 6, "polished_andesite"),
  createItem("textures/blocks/blackstone.png", "Blackstone", 109, 20, 0, "blackstone"),
  createItem("textures/blocks/polished_blackstone.png", "Polished Blackstone", 109, 20, 0, "polished_blackstone"),
  createItem("textures/blocks/deepslate/deepslate.png", "Deepslate", 109, 20, 0, "deepslate"),
  createItem("textures/blocks/deepslate/polished_deepslate.png", "Polished Deepslate", 109, 20, 0, "polished_deepslate"),
  createItem("textures/blocks/prismarine_rough.png", "Prismarine", 109, 20, 0, "prismarine"),
  createItem("textures/blocks/prismarine_bricks.png", "Prismarine Bricks", 109, 20, 2, "prismarine"),
  createItem("textures/blocks/prismarine_dark.png", "Prismarine Dark", 109, 20, 1, "prismarine"),
  createItem("textures/blocks/end_stone.png", "End Stone", 109, 20, 0, "end_stone"),
  createItem("textures/blocks/end_bricks.png", "End Bricks", 109, 20, 0, "end_bricks"),
  createItem("textures/blocks/sandstone_normal.png", "Sandstone", 109, 20, 0, "sandstone"),
];

export const itemBlockColor = Array.from({ length: 16 }, (_, i) => 
  createItem(\`textures/blocks/wool_colored_\${["white", "orange", "magenta", "light_blue", "yellow", "lime", "pink", "gray", "silver", "cyan", "purple", "blue", "brown", "green", "red", "black"][i]}.png\`, "Wool", 50, 7, i, "wool")
);

export const itemLog = [
  createItem("textures/blocks/log_oak.png", "Oak Log", 45, 5, 0, "oak_log"),
  createItem("textures/blocks/log_birch.png", "Birch Log", 45, 5, 0, "birch_log"),
  createItem("textures/blocks/log_spruce.png", "Spruce Log", 45, 5, 0, "spruce_log"),
  createItem("textures/blocks/log_jungle.png", "Jungle Log", 45, 5, 0, "jungle_log"),
  createItem("textures/blocks/log_acacia.png", "Acacia Log", 45, 5, 0, "acacia_log"),
  createItem("textures/blocks/log_big_oak.png", "Dark Oak Log", 45, 5, 0, "dark_oak_log"),
  createItem("textures/blocks/mangrove_log_side.png", "Mangrove Log", 45, 5, 0, "mangrove_log"),
  createItem("textures/blocks/cherry_log_side.png", "Cherry Log", 45, 5, 0, "cherry_log"),
];

export const itemFurniture = [
  createItem("textures/blocks/crafting_table_front.png", "Crafting Table", 60, 5, 0, "crafting_table"),
  createItem("textures/blocks/furnace_front_off.png", "Furnace", 156, 10, 0, "furnace"),
  createItem("textures/blocks/cauldron_side.png", "Cauldron", 7500, 250, 0, "cauldron"),
  createItem("textures/blocks/anvil_top_damaged_0.png", "Anvil", 32000, 500, 0, "anvil"),
  createItem("textures/blocks/bookshelf.png", "Bookshelf", 1500, 150, 0, "bookshelf"),
  createItem("textures/blocks/noteblock.png", "Noteblock", 156, 10, 0, "noteblock"),
  createItem("textures/blocks/enchanting_table_side.png", "Enchanting Table", 12000, 1200, 0, "enchanting_table"),
  createItem("textures/blocks/chest_front.png", "Chest", 200, 20, 0, "chest"),
  createItem("textures/blocks/shulker_top_white.png", "Shulker Box", 30000, 0, 0, "shulker_box", true),
  createItem("textures/blocks/torch_on.png", "Torch", 200, 5, 0, "torch"),
  createItem("textures/blocks/end_rod.png", "End Rod", 100, 5, 0, "end_rod"),
];

export const itemGlass = [
  createItem("textures/blocks/glass.png", "Glass", 100, 5, 0, "glass"),
  createItem("textures/blocks/glass_white.png", "White Stained Glass", 100, 5, 0, "white_stained_glass"),
  createItem("textures/blocks/glass_orange.png", "Orange Stained Glass", 100, 5, 0, "orange_stained_glass"),
  createItem("textures/blocks/glass_magenta.png", "Magenta Stained Glass", 100, 5, 0, "magenta_stained_glass"),
  createItem("textures/blocks/glass_light_blue.png", "Light Blue Stained Glass", 100, 5, 0, "light_blue_stained_glass"),
  createItem("textures/blocks/glass_yellow.png", "Yellow Stained Glass", 100, 5, 0, "yellow_stained_glass"),
  createItem("textures/blocks/glass_lime.png", "Lime Stained Glass", 100, 5, 0, "lime_stained_glass"),
  createItem("textures/blocks/glass_pink.png", "Pink Stained Glass", 100, 5, 0, "pink_stained_glass"),
  createItem("textures/blocks/glass_gray.png", "Gray Stained Glass", 100, 5, 0, "gray_stained_glass"),
  createItem("textures/blocks/glass_silver.png", "Light Gray Stained Glass", 100, 5, 0, "light_gray_stained_glass"),
  createItem("textures/blocks/glass_cyan.png", "Cyan Stained Glass", 100, 5, 0, "cyan_stained_glass"),
  createItem("textures/blocks/glass_purple.png", "Purple Stained Glass", 100, 5, 0, "purple_stained_glass"),
  createItem("textures/blocks/glass_blue.png", "Blue Stained Glass", 100, 5, 0, "blue_stained_glass"),
  createItem("textures/blocks/glass_brown.png", "Brown Stained Glass", 100, 5, 0, "brown_stained_glass"),
  createItem("textures/blocks/glass_green.png", "Green Stained Glass", 100, 5, 0, "green_stained_glass"),
  createItem("textures/blocks/glass_red.png", "Red Stained Glass", 100, 5, 0, "red_stained_glass"),
  createItem("textures/blocks/glass_black.png", "Black Stained Glass", 100, 5, 0, "black_stained_glass"),
];

export const itemSword = [
  createItem("textures/items/iron_sword.png", "Sword", 2000, 0, 0, "iron_sword", true),
  createItem("textures/items/gold_sword.png", "Sword", 4000, 0, 0, "gold_sword", true),
  createItem("textures/items/diamond_sword.png", "Sword", 6000, 0, 0, "diamond_sword", true)
];

export const itemAxe = [
  createItem("textures/items/iron_axe", "Iron Axe", 3000, 0, 0, "iron_axe", true),
  createItem("textures/items/gold_axe.png", "Gold Axe", 6000, 0, 0, "gold_axe", true),
  createItem("textures/items/diamond_axe.png", "Diamond Axe", 9000, 0, 0, "diamond_axe", true)
];

export const itemPickaxe = [
  createItem("textures/items/iron_pickaxe.png", "Iron Pickaxe", 3000, 0, 0, "iron_pickaxe", true),
  createItem("textures/items/gold_pickaxe.png", "Gold Pickaxe", 6000, 0, 0, "gold_pickaxe", true),
  createItem("textures/items/diamond_pickaxe.png", "Diamond Pickaxe", 9000, 0, 0, "diamond_pickaxe", true)
];

export const itemShovel = [
  createItem("textures/items/iron_shovel.png", "Iron Shovel", 1000, 0, 0, "iron_shovel", true),
  createItem("textures/items/gold_shovel.png", "Gold Shovel", 2000, 0, 0, "gold_shovel", true),
  createItem("textures/items/diamond_shovel.png", "Diamond Shovel", 3000, 0, 0, "diamond_shovel", true)
];

export const itemHelmet = [
  createItem("textures/items/leather_helmet.png", "Leather Helmet", 1000, 0, 0, "leather_helmet", true),
  createItem("textures/items/chainmail_helmet.png", "Chainmail Helmet", 2000, 0, 0, "chainmail_helmet", true),
  createItem("textures/items/iron_helmet.png", "Iron Helmet", 3000, 0, 0, "iron_helmet", true),
  createItem("textures/items/gold_helmet.png", "Gold Helmet", 4000, 0, 0, "golden_helmet", true),
  createItem("textures/items/diamond_helmet.png", "Diamond Helmet", 5000, 0, 0, "diamond_helmet", true),
  createItem("textures/items/netherite_helmet.png", "Netherite Helmet", 10000, 0, 0, "netherite_helmet", true),
];

export const itemChestplate = [
  createItem("textures/items/leather_chestplate.png", "Leather Chestplate", 1600, 0, 0, "leather_chestplate", true),
  createItem("textures/items/chainmail_chestplate.png", "Chainmail Chestplate", 3200, 0, 0, "chainmail_chestplate", true),
  createItem("textures/items/iron_chestplate.png", "Iron Chestplate", 4800, 0, 0, "iron_chestplate", true),
  createItem("textures/items/gold_chestplate.png", "Gold Chestplate", 6400, 0, 0, "golden_chestplate", true),
  createItem("textures/items/diamond_chestplate.png", "Diamond Chestplate", 8000, 0, 0, "diamond_chestplate", true),
  createItem("textures/items/netherite_chestplate.png", "Netherite Chestplate", 16000, 0, 0, "netherite_chestplate", true),
];

export const itemLeggings = [
  createItem("textures/items/leather_leggings.png", "Leather Leggings", 1400, 0, 0, "leather_leggings", true),
  createItem("textures/items/chainmail_leggings.png", "Chainmail Leggings", 2800, 0, 0, "chainmail_leggings", true),
  createItem("textures/items/iron_leggings.png", "Iron Leggings", 4200, 0, 0, "iron_leggings", true),
  createItem("textures/items/gold_leggings.png", "Gold Leggings", 5600, 0, 0, "golden_leggings", true),
  createItem("textures/items/diamond_leggings.png", "Diamond Leggings", 7000, 0, 0, "diamond_leggings", true),
  createItem("textures/items/netherite_leggings.png", "Netherite Leggings", 14000, 0, 0, "netherite_leggings", true),
];

export const itemBoots = [
  createItem("textures/items/leather_boots.png", "Leather Boots", 800, 0, 0, "leather_boots", true),
  createItem("textures/items/chainmail_boots.png", "Chainmail Boots", 1600, 0, 0, "chainmail_boots", true),
  createItem("textures/items/iron_boots.png", "Iron Boots", 2400, 0, 0, "iron_boots", true),
  createItem("textures/items/gold_boots.png", "Gold Boots", 3200, 0, 0, "golden_boots", true),
  createItem("textures/items/diamond_boots.png", "Diamond Boots", 4000, 0, 0, "diamond_boots", true),
  createItem("textures/items/netherite_boots.png", "Netherite Boots", 8000, 0, 0, "netherite_boots", true),
];

export const itemArmor = [...itemHelmet, ...itemChestplate, ...itemLeggings, ...itemBoots];

export const itemFarm = [
  createItem("textures/items/stone_hoe.png", "Stone Hoe", 500, 2, 0, "stone_hoe"),
  createItem("textures/items/seeds_wheat.png", "Wheat Seeds", 50, 2, 0, "wheat_seeds"),
  createItem("textures/items/seeds_melon.png", "Melon Seeds", 50, 2, 0, "melon_seeds"),
  createItem("textures/items/seeds_beetroot.png", "Beetroot Seeds", 50, 2, 0, "beetroot_seeds"),
  createItem("textures/items/wheat.png", "Wheat", 250, 5, 0, "wheat"),
  createItem("textures/items/beetroot.png", "Beetroot", 250, 5, 0, "beetroot"),
  createItem("textures/items/carrot.png", "Carrot", 250, 5, 0, "carrot"),
  createItem("textures/items/potato.png", "Potato", 250, 5, 0, "potato"),
  createItem("textures/items/reeds.png", "Sugar Cane", 400, 10, 0, "sugar_cane"),
  createItem("textures/items/dye_powder_white.png", "Bone Meal", 250, 5, 0, "bone_meal"),
];

export const itemFood = [
  createItem("textures/items/bread.png", "Bread", 100, 3, 0, "bread"),
  createItem("textures/items/beef_cooked.png", "Cooked Beef", 156, 5, 0, "cooked_beef"),
  createItem("textures/items/porkchop_cooked.png", "Cooked Porkchop", 156, 5, 0, "cooked_porkchop"),
  createItem("textures/items/chicken_cooked.png", "Cooked Chicken", 156, 5, 0, "cooked_chicken"),
  createItem("textures/items/mutton_cooked.png", "Cooked Mutton", 156, 5, 0, "cooked_mutton"),
  createItem("textures/items/apple.png", "Apple", 150, 3, 0, "apple"),
  createItem("textures/items/apple_golden.png", "Golden Apple", 15000, 500, 0, "golden_apple"),
  createItem("textures/items/apple_golden.png", "Enchanted Golden Apple", 100000, 5000, 0, "enchanted_golden_apple"),
];

export const itemOres = [
  createItem("textures/items/coal.png", "Coal", 50, 5, 0, "coal"),
  createItem("textures/items/copper_ingot.png", "Copper Ingot", 100, 10, 0, "copper_ingot"),
  createItem("textures/items/iron_ingot", "Iron Ingot", 1000, 50, 0, "iron_ingot"),
  createItem("textures/items/gold_ingot.png", "Gold Ingot", 2000, 75, 0, "gold_ingot"),
  createItem("textures/items/emerald.png", "Emerald", 5000, 150, 0, "emerald"),
  createItem("textures/items/diamond.png", "Diamond", 3000, 300, 0, "diamond"),
  createItem("textures/items/netherite_ingot.png", "Netherite", 50000, 2000, 0, "netherite_ingot"),
];

export const itemSpawner = [
  createItem("textures/blocks/mob_spawner.png", "Mob Spawner", 500000, 0, 0, "mob_spawner", true),
  createItem("textures/items/egg_zombie.png", "Zombie Spawn Egg", 1000000, 0, 0, "zombie_spawn_egg", true),
  createItem("textures/items/egg_skeleton.png", "Skeleton Spawn Egg", 1000000, 0, 0, "skeleton_spawn_egg", true),
  createItem("textures/items/egg_spider.png", "Spider Spawn Egg", 1000000, 0, 0, "spider_spawn_egg", true),
  createItem("textures/items/egg_creeper.png", "Creeper Spawn Egg", 1000000, 0, 0, "creeper_spawn_egg", true),
  createItem("textures/items/egg_enderman.png", "Enderman Spawn Egg", 1500000, 0, 0, "enderman_spawn_egg", true),
];

export const itemEnchantedBook = [
  createItem("textures/items/book_enchanted.png", "Sharpness V", 10000, 0, 0, "enchanted_book", true, "minecraft:sharpness:5"),
  createItem("textures/items/book_enchanted.png", "Protection IV", 8000, 0, 0, "enchanted_book", true, "minecraft:protection:4"),
  createItem("textures/items/book_enchanted.png", "Efficiency V", 10000, 0, 0, "enchanted_book", true, "minecraft:efficiency:5"),
  createItem("textures/items/book_enchanted.png", "Unbreaking III", 5000, 0, 0, "enchanted_book", true, "minecraft:unbreaking:3"),
  createItem("textures/items/book_enchanted.png", "Mending", 20000, 0, 0, "enchanted_book", true, "minecraft:mending:1"),
  createItem("textures/items/book_enchanted.png", "Fortune III", 15000, 0, 0, "enchanted_book", true, "minecraft:fortune:3"),
  createItem("textures/items/book_enchanted.png", "Silk Touch", 10000, 0, 0, "enchanted_book", true, "minecraft:silk_touch:1"),
];

// ── 2. Addon Items Master Arrays
`;

for (const cat of categoryConfigs) {
  const items = categorizedItems.get(cat.id);
  shopJs += `\nexport const item_${cat.id} = [\n`;
  for (const it of items) {
    const safeTex = JSON.stringify(it.textures);
    const safeName = JSON.stringify(it.name);
    const safeId = JSON.stringify(it.item);
    shopJs += `  createItem(${safeTex}, ${safeName}, ${it.cost}, ${it.sell}, 0, ${safeId}),\n`;
  }
  shopJs += `];\n`;
}

shopJs += `
export const shopSettings = {
  currency: "money",
  currencySymbol: "$",
  currencyName: "Money",
  currencyMode: "money",
};

export const shopConfig = {
  categories: [
    { id: "blocks", name: "§l§0(§1§lBLOCKS§l§0)", icon: "textures/blocks/cobblestone.png", enabled: true },
    { id: "wool", name: "§l§0(§2§lWOOL§l§0)", icon: "textures/blocks/wool_colored_white.png", enabled: true },
    { id: "wood", name: "§l§0(§3§lWOOD§l§0)", icon: "textures/blocks/log_oak.png", enabled: true },
    { id: "furniture", name: "§l§0(§4§lFURNITURE§l§0)", icon: "textures/blocks/crafting_table_front.png", enabled: true },
    { id: "glass", name: "§l§0(§6§lGLASS§l§0)", icon: "textures/blocks/glass_black.png", enabled: true },
    { id: "tools", name: "§l§0(§8§lTOOLS§l§0)", icon: "textures/items/diamond_sword.png", enabled: true },
    { id: "helmet", name: "§l§0(§a§lHELMET§l§0)", icon: "textures/items/diamond_helmet.png", enabled: true },
    { id: "chestplate", name: "§l§0(§a§lCHESTPLATE§l§0)", icon: "textures/items/diamond_chestplate.png", enabled: true },
    { id: "leggings", name: "§l§0(§a§lLEGGINGS§l§0)", icon: "textures/items/diamond_leggings.png", enabled: true },
    { id: "boots", name: "§l§0(§a§lBOOTS§l§0)", icon: "textures/items/diamond_boots.png", enabled: true },
    { id: "farming", name: "§l§0(§b§lFARMING§l§0)", icon: "textures/items/carrot.png", enabled: true },
    { id: "food", name: "§l§0(§e§lFOOD§l§0)", icon: "textures/items/beef_cooked.png", enabled: true },
    { id: "ores", name: "§l§0(§f§lORES§l§0)", icon: "textures/items/diamond.png", enabled: true },
    { id: "spawner", name: "§l§0(§g§lSPAWNER§l§0)", icon: "textures/blocks/mob_spawner.png", enabled: true },
    { id: "enchanted_books", name: "§l§0(§d§lENCHANTED BOOKS§l§0)", icon: "textures/items/book_enchanted.png", enabled: true },
`;

for (const cat of categoryConfigs) {
  shopJs += `    { id: "${cat.id}", name: "${cat.name}", icon: "${cat.icon}", enabled: true },\n`;
}

shopJs += `  ],
  items: {
    blocks: itemBlock,
    wool: itemBlockColor,
    wood: itemLog,
    furniture: itemFurniture,
    glass: itemGlass,
    tools: [...itemSword, ...itemAxe, ...itemPickaxe, ...itemShovel],
    helmet: itemHelmet,
    chestplate: itemChestplate,
    leggings: itemLeggings,
    boots: itemBoots,
    farming: itemFarm,
    food: itemFood,
    ores: itemOres,
    spawner: itemSpawner,
    enchanted_books: itemEnchantedBook,
`;

for (const cat of categoryConfigs) {
  shopJs += `    ${cat.id}: item_${cat.id},\n`;
}

shopJs += `  }
};

export function loadShopConfig() {
  return shopConfig;
}

export function getShopCurrency() {
  return shopSettings.currency;
}

export function getShopCurrencySymbol() {
  return shopSettings.currencySymbol;
}

export function getShopCurrencyName() {
  return shopSettings.currencyName;
}

export function getShopCurrencyMode() {
  return shopSettings.currencyMode;
}
`;

if (fs.existsSync(path.dirname(targetConfigShop))) {
  fs.writeFileSync(targetConfigShop, shopJs, 'utf8');
  console.log(`\n🎉 Successfully injected master shop into: ${targetConfigShop}`);
}

const cacheOut = {
  version: '33.2.2',
  updatedAt: new Date().toISOString(),
  totalCategories: categoryConfigs.length,
  totalItems: totalExtracted,
  categories: categoryConfigs.map(c => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    count: categorizedItems.get(c.id).length
  })),
  items: Object.fromEntries(categorizedItems)
};

const itemsJsonPath = path.join(__dirname, 'items.json');
fs.writeFileSync(itemsJsonPath, JSON.stringify(cacheOut, null, 2), 'utf8');
console.log(`✓ Updated cache database at: ${itemsJsonPath}\n`);
