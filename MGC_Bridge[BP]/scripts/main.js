import { world, system, ItemStack } from "@minecraft/server";
import { http, HttpRequest, HttpRequestMethod, HttpHeader } from "@minecraft/server-net";

// ── Startup Diagnostic (visible in BDS console logs)
system.run(() => {
  console.warn("[MGC-BRIDGE] v2.12.1 loaded (KiwEssentials 33.2.x & Bedrock 1.26.45.1+) — checking event availability:");
  console.warn("[MGC-BRIDGE]  beforeEvents.chatSend:", !!world.beforeEvents?.chatSend);
  console.warn("[MGC-BRIDGE]  afterEvents.chatSend :", !!world.afterEvents?.chatSend);
  console.warn("[MGC-BRIDGE]  afterEvents.playerSpawn:", !!world.afterEvents?.playerSpawn);
});

/**
 * Hono Backend Configuration
 */
const HONO_BACKEND_URL = "https://mgc.ppti.me/api/game";
const API_KEY = "Yamli2026@";

/**
 * Helper to dispatch HTTP requests to Hono Backend
 */
async function sendRequest(endpoint, method, payload = null) {
  try {
    const request = new HttpRequest(`${HONO_BACKEND_URL}${endpoint}`);
    request.setMethod(method);
    request.setHeaders([
      new HttpHeader("Content-Type", "application/json"),
      new HttpHeader("Authorization", `Bearer ${API_KEY}`)
    ]);

    if (payload) {
      request.setBody(JSON.stringify(payload));
    }

    return await http.request(request);
  } catch (err) {
    return null;
  }
}

// ========================================================
// Helper: Read KiwEssentials Scoreboard Objective safely
// Supports KiwEssentials 33.1.9+ dynamic properties & objectives
// ========================================================
function readMoney(player) {
  try {
    const prop = player.getDynamicProperty("money_balance_string") ?? player.getDynamicProperty("money");
    if (prop !== undefined && prop !== null) {
      const parsed = parseInt(String(prop), 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch {}
  return readScore(player, "money", "balance");
}

function readPlaytime(player) {
  try {
    const prop = player.getDynamicProperty("playtime") ?? player.getDynamicProperty("online_time");
    if (prop !== undefined && prop !== null) {
      const parsed = parseInt(String(prop), 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {}
  return readScore(player, "playtime", "time", "online_hours", "play_time");
}

function readScore(player, ...objectives) {
  try {
    for (const objective of objectives) {
      const obj = world.scoreboard.getObjective(objective);
      if (obj) {
        // 1. Try scoreboardIdentity
        try {
          if (player.scoreboardIdentity) {
            const score = obj.getScore(player.scoreboardIdentity);
            if (typeof score === "number") return Math.max(0, score);
          }
        } catch {}

        // 2. Try direct player entity
        try {
          const score = obj.getScore(player);
          if (typeof score === "number") return Math.max(0, score);
        } catch {}

        // 3. Search participants by name/displayName
        try {
          const participants = obj.getParticipants();
          for (const part of participants) {
            if (part.displayName && part.displayName.toLowerCase() === player.name.toLowerCase()) {
              const score = obj.getScore(part);
              if (typeof score === "number") return Math.max(0, score);
            }
          }
        } catch {}
      }
    }
    return 0;
  } catch {
    return 0;
  }
}

function collectAllPlayerScores() {
  const stats = [];
  try {
    for (const player of world.getPlayers()) {
      try {
        stats.push({
          username: player.name,
          kills:    readScore(player, "kill", "kills"),
          deaths:   readScore(player, "death", "deaths"),
          money:    readMoney(player),
          coin:     readScore(player, "coin", "coins"),
          playtime: readPlaytime(player),
          online:   true,
        });
      } catch {}
    }
  } catch {}
  return stats;
}

// Sync KiwEssentials stats to backend frequently (every 200 ticks ≈ 10s)
let isSyncingScores = false;
async function pushScoresSync() {
  if (isSyncingScores) return;
  isSyncingScores = true;
  try {
    const stats = collectAllPlayerScores();
    if (stats.length > 0) {
      await sendRequest("/scoreboard", HttpRequestMethod.Post, { players: stats });
    }
  } catch {} finally {
    isSyncingScores = false;
  }
}
system.runInterval(pushScoresSync, 200);
// Trigger immediate initial score sync
system.runTimeout(pushScoresSync, 40);

// ========================================================
// Helper: Collect Player Live Inventory, Health & Telemetry
// ========================================================
function extractSlotItem(itemStack, slotIndex) {
  if (!itemStack) return null;
  try {
    return {
      slot: slotIndex,
      typeId: itemStack.typeId || "minecraft:air",
      amount: itemStack.amount || 1,
      nameTag: itemStack.nameTag || undefined,
      damage: typeof itemStack.damage === "number" ? itemStack.damage : undefined,
      maxDamage: typeof itemStack.maxDamage === "number" ? itemStack.maxDamage : undefined,
    };
  } catch {
    return null;
  }
}

function getEquippedItem(equipComp, slotName) {
  if (!equipComp) return null;
  try {
    let item = null;
    if (typeof equipComp.getEquipment === "function") {
      item = equipComp.getEquipment(slotName) || 
             equipComp.getEquipment(slotName.toLowerCase()) || 
             equipComp.getEquipment(slotName.charAt(0).toUpperCase() + slotName.slice(1).toLowerCase());
    }
    return item;
  } catch {
    return null;
  }
}

function collectPlayerInventory(player) {
  try {
    const healthComp = player.getComponent("minecraft:health") || player.getComponent("health");
    const health = {
      current: healthComp ? Math.round(healthComp.currentValue * 10) / 10 : 20,
      max: healthComp ? Math.round(healthComp.defaultValue * 10) / 10 : 20,
    };

    const loc = player.location || { x: 0, y: 0, z: 0 };
    const location = {
      x: Math.round(loc.x * 10) / 10,
      y: Math.round(loc.y * 10) / 10,
      z: Math.round(loc.z * 10) / 10,
      dimension: player.dimension?.id?.replace("minecraft:", "") || "overworld",
    };

    // Equippable (Armor & Hands)
    const equipComp = player.getComponent("minecraft:equippable") || player.getComponent("equippable");
    const armor = {
      head: extractSlotItem(getEquippedItem(equipComp, "Head"), 0),
      chest: extractSlotItem(getEquippedItem(equipComp, "Chest"), 1),
      legs: extractSlotItem(getEquippedItem(equipComp, "Legs"), 2),
      feet: extractSlotItem(getEquippedItem(equipComp, "Feet"), 3),
      offhand: extractSlotItem(getEquippedItem(equipComp, "Offhand"), 4),
      mainhand: extractSlotItem(getEquippedItem(equipComp, "Mainhand"), 5),
    };

    // 36 Main Inventory Slots
    const invComp = player.getComponent("minecraft:inventory") || player.getComponent("inventory");
    const mainInventory = [];
    if (invComp && invComp.container) {
      const container = invComp.container;
      for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (item) {
          const extracted = extractSlotItem(item, i);
          if (extracted) mainInventory.push(extracted);
        }
      }
    }

    return {
      username: player.name,
      health,
      level: player.level || 0,
      xpProgress: Math.round((player.xpEarnedAtCurrentLevel || 0) * 100) / 100,
      location,
      gameMode: (player.getGameMode && player.getGameMode()) ? String(player.getGameMode()).toLowerCase() : "survival",
      armor,
      mainInventory,
      scores: {
        kills:    readScore(player, "kill", "kills"),
        deaths:   readScore(player, "death", "deaths"),
        money:    readMoney(player),
        coin:     readScore(player, "coin", "coins"),
        playtime: readPlaytime(player),
      },
    };
  } catch (e) {
    return null;
  }
}

// Global helper for fast live inventory syncing
async function syncAllInventories() {
  try {
    const list = [];
    for (const player of world.getPlayers()) {
      const inv = collectPlayerInventory(player);
      if (inv) list.push(inv);
    }
    if (list.length > 0) {
      await sendRequest("/inventory-sync", HttpRequestMethod.Post, { inventories: list });
    }
  } catch {}
}

// Sync Player Inventories every 3s (60 ticks) for near real-time live telemetry
let isSyncingInventories = false;
system.runInterval(async () => {
  if (isSyncingInventories) return;
  isSyncingInventories = true;
  try {
    await syncAllInventories();
  } catch {} finally {
    isSyncingInventories = false;
  }
}, 60);

// ========================================================
// 1. CHAT RELAY — KiwEssentials Compatible Queue Pattern
//
// WHY THIS PATTERN:
//   KiwEssentials sets data.cancel = true in beforeEvents.chatSend.
//   In some Bedrock versions, system.run(async) called from WITHIN
//   a before-event handler may not execute reliably.
//
//   SOLUTION: Use a synchronous push queue inside beforeEvents
//   (zero async, zero system.run), then drain the queue from a
//   dedicated system.runInterval that always runs safely.
// ========================================================

/** @type {Array<{sender: string, message: string, ts: number}>} */
const chatQueue = [];

// Subscribe to beforeEvents — fires even when KiwEssentials cancels the chat
// This handler is 100% SYNCHRONOUS: just push to array, nothing else.
if (world.beforeEvents?.chatSend?.subscribe) {
  world.beforeEvents.chatSend.subscribe((event) => {
    try {
      const senderName = event.sender?.name || "";
      const messageText = event.message || "";
      // Skip empty, KiwEssentials rank commands (+cmd), or slash commands
      if (!senderName || !messageText) return;
      if (messageText.startsWith("+") || messageText.startsWith("/")) return;
      chatQueue.push({ sender: senderName, message: messageText, ts: Date.now() });
      console.warn(`[MGC-BRIDGE] Chat captured: ${senderName}: ${messageText}`);
    } catch {}
  });
}

// afterEvents fallback — fires ONLY when no addon sets cancel=true
if (world.afterEvents?.chatSend?.subscribe) {
  world.afterEvents.chatSend.subscribe((event) => {
    try {
      const senderName = event.sender?.name || "";
      const messageText = event.message || "";
      if (!senderName || !messageText) return;
      if (messageText.startsWith("+") || messageText.startsWith("/")) return;
      const now = Date.now();
      const alreadyCaptured = chatQueue.some(
        q => q.sender === senderName && q.message === messageText && (now - q.ts) < 3000
      );
      if (!alreadyCaptured) {
        chatQueue.push({ sender: senderName, message: messageText, ts: now });
      }
    } catch {}
  });
}

// 3. CROSS-PACK BRIDGE: ScriptEvent Receiver (mgc:chat)
// Guarantees chat delivery even when KiwEssentials or other addons cancel native chat
if (system.afterEvents?.scriptEventReceive?.subscribe) {
  system.afterEvents.scriptEventReceive.subscribe((event) => {
    try {
      if (event.id === "mgc:sync" || event.id === "mgc:sync_zones") {
        syncWorldZonesAndChunks(true);
      }
      if (event.id === "mgc:debug" || event.id === "mgc:debug_props") {
        try {
          const allProps = (typeof world.getDynamicPropertyIds === "function") ? (world.getDynamicPropertyIds() || []) : [];
          console.warn("[MGC-BRIDGE DEBUG] Total world dynamic properties: " + allProps.length);
          for (const pid of allProps) {
            const raw = world.getDynamicProperty(pid);
            console.warn("[MGC-BRIDGE DEBUG WORLD PROP] Key: " + pid + " => " + String(raw).slice(0, 150));
          }

          // Test specific known keys
          const testKeys = ["warps", "warps_meta", "pwarp_index", "land_player_names", "land_claims", "land_claim_counter", "lobby_protected_regions", "protectedRegions", "isDbMigrated", "whitelist_enabled"];
          for (const k of testKeys) {
            const val = world.getDynamicProperty(k);
            console.warn("[MGC-BRIDGE PROBE WORLD] " + k + " = " + (val ? String(val).slice(0, 100) : "<null>"));
          }

          // Check online players
          const players = (typeof world.getAllPlayers === "function") ? world.getAllPlayers() : (world.getPlayers ? world.getPlayers() : []);
          console.warn("[MGC-BRIDGE DEBUG] Online Players: " + players.length);
          for (const p of players) {
            console.warn("[MGC-BRIDGE PROBE PLAYER] Name: " + p.name + " | ID: " + p.id);
            const pKeys = [
              "land_claims_" + p.id,
              "land_claims_" + p.name,
              "land_claims_safe_" + p.id,
              "land_claims_safe_" + p.name,
              "sethome:" + p.id,
              "sethome:" + p.name
            ];
            for (const pk of pKeys) {
              const pv = world.getDynamicProperty(pk);
              console.warn("[MGC-BRIDGE PROBE WORLD FOR PLAYER] " + pk + " = " + (pv ? String(pv).slice(0, 100) : "<null>"));
            }
            if (typeof p.getDynamicPropertyIds === "function") {
              const pProps = p.getDynamicPropertyIds() || [];
              console.warn("[MGC-BRIDGE PLAYER PROPS] " + p.name + " entity props: " + pProps.join(", "));
              for (const ep of pProps) {
                const epv = p.getDynamicProperty(ep);
                console.warn("[MGC-BRIDGE ENTITY PROP] " + ep + " = " + String(epv).slice(0, 80));
              }
            }
          }
        } catch(err) {
          console.warn("[MGC-BRIDGE DEBUG] Error in debug command:", err);
        }
      }
      if (event.id === "mgc:chat") {
        const payload = JSON.parse(event.message);
        if (payload?.sender && payload?.message) {
          const now = Date.now();
          const alreadyCaptured = chatQueue.some(
            q => q.sender === payload.sender && q.message === payload.message && (now - q.ts) < 3000
          );
          if (!alreadyCaptured) {
            chatQueue.push({ sender: payload.sender, message: payload.message, ts: now });
            console.warn(`[MGC-BRIDGE] Chat received via ScriptEvent: ${payload.sender}: ${payload.message}`);
          }
        }
      }
    } catch (err) {
      console.warn(`[MGC-BRIDGE] Failed to parse scriptEvent payload:`, err);
    }
  }, { namespaces: ["mgc"] });
}

// Drain chat queue every 5 ticks (~250ms) — safe async context, always reliable
let isProcessingChat = false;
system.runInterval(async () => {
  if (isProcessingChat || chatQueue.length === 0) return;
  isProcessingChat = true;
  try {
    // Dedup: remove duplicate sender+message combos within 3s window
    const now = Date.now();
    const seen = new Set();
    const unique = chatQueue.filter(q => {
      const key = `${q.sender}:${q.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    chatQueue.length = 0; // clear original queue

    for (const { sender, message } of unique) {
      try {
        const res = await sendRequest("/chat", HttpRequestMethod.Post, { sender, message });
        if (res && res.status === 200) {
          try {
            const data = JSON.parse(res.body);
            if (data.isLinked === false) {
              // Notify player they're not linked — do in system.run for safety
              const player = world.getPlayers().find(p => p.name === sender);
              if (player) {
                system.run(() => {
                  try {
                    player.sendMessage(
                      `§e[Bridge] §fAkun kamu belum terhubung ke Discord. Kunjungi Web Dashboard untuk link IGN!`
                    );
                  } catch {}
                });
              }
            }
          } catch {}
        }
      } catch {}
    }
  } catch {} finally {
    isProcessingChat = false;
  }
}, 5); // every 5 game ticks ≈ 250ms

// 2. EVENT: Player Spawn / Join & Account Status Check
// ========================================================
if (world.afterEvents?.playerSpawn?.subscribe) {
  world.afterEvents.playerSpawn.subscribe((event) => {
    try {
      if (event.initialSpawn) {
        const player = event.player;
        const username = player.name;

        // Delay 20 ticks (1s) so KiwEssentials has registered objectives
        system.runTimeout(async () => {
          try {
            const joinStats = {
              username: username,
              kills:    readScore(player, "kill", "kills"),
              deaths:   readScore(player, "death", "deaths"),
              money:    readMoney(player),
              coin:     readScore(player, "coin", "coins"),
              playtime: readPlaytime(player),
            };
            const res = await sendRequest("/join", HttpRequestMethod.Post, joinStats);

            if (res) {
              if (res.status === 403) {
                // Player is banned
                system.run(async () => {
                  try {
                    const overworld = world.getDimension("overworld");
                    await overworld.runCommandAsync(`kick "${username}" You are banned from this server.`);
                  } catch {}
                });
                return;
              }

              if (res.status === 200) {
                try {
                  const data = JSON.parse(res.body);
                  system.run(() => {
                    if (data.isLinked && data.discordUser) {
                      player.sendMessage(
                        `§a[Discord Bridge] §fWelcome, §b${username}§f! Linked with Discord §e@${data.discordUser.username}§f.`
                      );
                    } else {
                      player.sendMessage(
                        `§6[Server Info] §fHello §e${username}§f! Your account is not linked to Discord. Link at: §bhttp://localhost:3000`
                      );
                    }
                  });
                } catch {}
              }
            }
          } catch (joinErr) {}
        }, 20);
      }
    } catch (e) {}
  });
}

// ========================================================
// 3. EVENT: Player Leave Tracking
// ========================================================
if (world.afterEvents?.playerLeave?.subscribe) {
  world.afterEvents.playerLeave.subscribe(async (event) => {
    try {
      const username = event.playerName;
      if (username) {
        await sendRequest("/leave", HttpRequestMethod.Post, { username });
      }
    } catch (err) {}
  });
}

// ========================================================
// 4. EVENT: Entity / Player Death
// ========================================================
if (world.afterEvents?.entityDie?.subscribe) {
  world.afterEvents.entityDie.subscribe(async (event) => {
    try {
      const deadEntity = event.deadEntity;
      if (deadEntity && deadEntity.typeId === "minecraft:player") {
        const playerName = deadEntity.nameTag || deadEntity.name || "Player";
        const damageSource = event.damageSource;
        const cause = damageSource?.cause || "died";
        const damagingEntity = damageSource?.damagingEntity;
        const killerName = damagingEntity?.nameTag || damagingEntity?.name || null;

        await sendRequest("/death", HttpRequestMethod.Post, {
          player: playerName,
          killer: killerName,
          cause: cause,
        });

        // Trigger immediate inventory telemetry sync on death
        system.runTimeout(() => {
          syncAllInventories();
        }, 20);
      }
    } catch (err) {}
  });
}

// ========================================================
// 5. POLL PENDING WEB & DISCORD COMMANDS & CHAT
// Drains outgoing web/Discord queue every 20 ticks (1s)
// ========================================================
let isPolling = false;

system.runInterval(async () => {
  if (isPolling) return;
  isPolling = true;

  try {
    const res = await sendRequest("/pending", HttpRequestMethod.Get);
    if (res && res.status === 200) {
      try {
        const messages = JSON.parse(res.body);
        if (Array.isArray(messages) && messages.length > 0) {
          const overworld = world.getDimension("overworld");

          for (const msg of messages) {
            // 1. Direct Script API Action Dispatch (Give, Heal, Clear, Wipe, Gamemode, Teleport)
            if (msg.actionPayload) {
              const { action, itemId, amount = 1, target, gamemode, coords } = msg.actionPayload;
              const targetPlayer = world.getPlayers().find(
                p => p.name.toLowerCase() === String(target).toLowerCase()
              );

              if (targetPlayer) {
                if (action === 'give') {
                  try {
                    const cleanType = String(itemId).includes(":") ? String(itemId) : `minecraft:${itemId}`;
                    const count = Math.max(1, Math.min(Number(amount) || 1, 64));
                    const itemStack = new ItemStack(cleanType, count);
                    const inv = targetPlayer.getComponent("minecraft:inventory") || targetPlayer.getComponent("inventory");
                    if (inv && inv.container) {
                      inv.container.addItem(itemStack);
                      world.sendMessage(`§6[Admin Action] §eGave ${count}x ${itemId} to §a${targetPlayer.name}`);
                      system.runTimeout(() => { syncAllInventories(); }, 10);
                      continue;
                    }
                  } catch (itemErr) {}
                } else if (action === 'wipe_inventory') {
                  try {
                    const inv = targetPlayer.getComponent("minecraft:inventory") || targetPlayer.getComponent("inventory");
                    if (inv && inv.container) {
                      inv.container.clearAll();
                      world.sendMessage(`§6[Admin Action] §cWiped inventory of §e${targetPlayer.name}`);
                      system.runTimeout(() => { syncAllInventories(); }, 10);
                      continue;
                    }
                  } catch (e) {}
                } else if (action === 'heal') {
                  try {
                    const health = targetPlayer.getComponent("minecraft:health") || targetPlayer.getComponent("health");
                    if (health) {
                      health.setCurrentValue(health.defaultValue);
                      world.sendMessage(`§6[Admin Action] §aHealed §e${targetPlayer.name} §ato full`);
                      system.runTimeout(() => { syncAllInventories(); }, 10);
                      continue;
                    }
                  } catch (e) {}
                } else if (action === 'gamemode' && gamemode) {
                  try {
                    if (typeof targetPlayer.setGameMode === 'function') {
                      targetPlayer.setGameMode(gamemode);
                    }
                    world.sendMessage(`§6[Admin Action] §eSet gamemode of §a${targetPlayer.name} §eto §b${gamemode}`);
                    system.runTimeout(() => { syncAllInventories(); }, 10);
                    continue;
                  } catch (e) {}
                } else if (action === 'teleport' && coords) {
                  try {
                    targetPlayer.teleport({ x: coords.x, y: coords.y, z: coords.z });
                    world.sendMessage(`§6[Admin Action] §eTeleported §a${targetPlayer.name} §eto §b(${coords.x}, ${coords.y}, ${coords.z})`);
                    system.runTimeout(() => { syncAllInventories(); }, 10);
                    continue;
                  } catch (e) {}
                }
              }
            }

            // 2. Standard In-Game Slash Command Execution
            const rawText = String(msg.message || "").trim();
            const isCmd = msg.isCommand || rawText.startsWith("/");
            if (isCmd) {
              const cleanCommand = rawText.replace(/^\/+/, "").trim();
              if (!cleanCommand) continue;
              let executed = false;
              let errorReason = "";

              try {
                const overworld = world.getDimension("overworld");
                await overworld.runCommandAsync(cleanCommand);
                executed = true;
              } catch (cmdErr) {
                errorReason = cmdErr?.message || "Command failed";
                // Fallback: execute via player entity itself (player.runCommandAsync)
                for (const p of world.getPlayers()) {
                  try {
                    await p.runCommandAsync(cleanCommand);
                    executed = true;
                    break;
                  } catch (pErr) {
                    errorReason = pErr?.message || errorReason;
                  }
                }
              }

              if (executed) {
                world.sendMessage(`§6[Admin Command] §e${msg.sender}§f: §a/${cleanCommand}`);
                system.runTimeout(() => {
                  syncAllInventories();
                }, 10);
              } else {
                world.sendMessage(`§c[Command Error] §f/${cleanCommand} §7(${errorReason})`);
              }
            } else {
              // Display normal chat message in game
              world.sendMessage(`§b[${msg.source || "Bridge"}] §e${msg.sender}§f: ${msg.message}`);
            }
          }
        }
      } catch (parseErr) {}
    }
  } catch (err) {
  } finally {
    isPolling = false;
  }
}, 20);

// ========================================================
// ── SMART WORLD MAINTENANCE & PROTECTED CHUNKS TRACKER ──
// Automatically protects Spawn, Land Claims, Player Homes, 
// Warps, and Player-Modified build chunks.
// ========================================================
const modifiedChunks = new Map();

function getChunkCoord(blockPos) {
  return {
    x: Math.floor(blockPos.x / 16),
    z: Math.floor(blockPos.z / 16)
  };
}

// Track player block modifications in real-time
try {
  if (world.afterEvents?.playerPlaceBlock) {
    world.afterEvents.playerPlaceBlock.subscribe((ev) => {
      try {
        const c = getChunkCoord(ev.block.location);
        const dim = ev.dimension?.id?.replace("minecraft:", "") || "overworld";
        const key = `${dim}_${c.x}_${c.z}`;
        modifiedChunks.set(key, { x: c.x, z: c.z, dim, reason: `Placed by ${ev.player?.name || 'Player'}` });
      } catch {}
    });
  }

  if (world.afterEvents?.playerBreakBlock) {
    world.afterEvents.playerBreakBlock.subscribe((ev) => {
      try {
        const c = getChunkCoord(ev.block.location);
        const dim = ev.dimension?.id?.replace("minecraft:", "") || "overworld";
        const key = `${dim}_${c.x}_${c.z}`;
        modifiedChunks.set(key, { x: c.x, z: c.z, dim, reason: `Mined by ${ev.player?.name || 'Player'}` });
      } catch {}
    });
  }
} catch (e) {}

// ========================================================
// Comprehensive World Zones & Chunks Sync (Claims, Warps, PWarps, Lobbies, Homes)
// ========================================================
let lastZoneSyncTime = 0;

function safeParseKiw(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw !== "string") return null;
  // 1. Try direct JSON.parse
  try { return JSON.parse(raw); } catch {}
  // 2. Try KiwEssentials Database.js unescape (escaped double-quotes)
  try {
    const unescaped = raw.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    return JSON.parse(unescaped);
  } catch {}
  // 3. Try slicing substring between [ ] or { }
  try {
    const a = raw.indexOf("["), b = raw.lastIndexOf("]");
    if (a >= 0 && b > a) return JSON.parse(raw.slice(a, b + 1));
    const c = raw.indexOf("{"), d = raw.lastIndexOf("}");
    if (c >= 0 && d > c) return JSON.parse(raw.slice(c, d + 1));
  } catch {}
  return null;
}

export async function syncWorldZonesAndChunks(force = false) {
  const now = Date.now();
  if (!force && now - lastZoneSyncTime < 15000) return; // Debounce 15s
  lastZoneSyncTime = now;

  try {
    const zones = [];
    const chunks = (typeof modifiedChunks !== "undefined" && modifiedChunks) ? Array.from(modifiedChunks.values()) : [];
    const seenZoneIds = new Set();

    const addZone = (z) => {
      if (!z || !z.id || seenZoneIds.has(z.id)) return;
      seenZoneIds.add(z.id);
      zones.push(z);
    };

    const allPropIds = (typeof world.getDynamicPropertyIds === "function") ? (world.getDynamicPropertyIds() || []) : [];

    // 1. World Spawn Area
    try {
      const spawn = world.getDefaultSpawnLocation();
      if (spawn) {
        const sc = getChunkCoord(spawn);
        addZone({
          id: "spawn_zone",
          name: "World Spawn Protection Area",
          type: "spawn",
          dimension: "overworld",
          minChunkX: sc.x - 16,
          minChunkZ: sc.z - 16,
          maxChunkX: sc.x + 16,
          maxChunkZ: sc.z + 16,
          blockX: Math.round(spawn.x),
          blockY: Math.round(spawn.y),
          blockZ: Math.round(spawn.z),
          description: "Main World Spawn Point & Protection",
          owner: "Server World"
        });
      }
    } catch {}

    // 2. Server Warps (KiwEssentials warps, warps_chunk_*, warp\uE812*)
    let warpsCount = 0;
    try {
      const warpList = [];
      const rawWarps = world.getDynamicProperty("warps");
      if (rawWarps) {
        const parsed = safeParseKiw(rawWarps);
        if (Array.isArray(parsed)) warpList.push(...parsed);
        else if (parsed && typeof parsed === "object") warpList.push(...Object.values(parsed));
      }

      const rawMeta = world.getDynamicProperty("warps_meta");
      if (rawMeta) {
        const meta = safeParseKiw(rawMeta);
        const totalChunks = meta?.totalChunks || meta?.chunkCount || 0;
        for (let i = 0; i < totalChunks; i++) {
          const chunkStr = world.getDynamicProperty("warps_chunk_" + i);
          if (chunkStr) {
            const chunkWarps = safeParseKiw(chunkStr);
            if (Array.isArray(chunkWarps)) warpList.push(...chunkWarps);
            else if (chunkWarps && typeof chunkWarps === "object") warpList.push(...Object.values(chunkWarps));
          }
        }
      }

      for (const pid of allPropIds) {
        if (pid.startsWith("warps_chunk_") || pid.startsWith("warp\uE812")) {
          const chunkStr = world.getDynamicProperty(pid);
          if (chunkStr) {
            const parsed = safeParseKiw(chunkStr);
            if (Array.isArray(parsed)) warpList.push(...parsed);
            else if (parsed && typeof parsed === "object") {
              if (parsed.location || parsed.pos || parsed.x !== undefined) warpList.push(parsed);
              else warpList.push(...Object.values(parsed));
            }
          }
        }
      }

      for (const w of warpList) {
        if (!w || !w.name) continue;
        const loc = w.location || w.pos || w;
        if (loc && loc.x !== undefined && loc.z !== undefined) {
          const cx = Math.floor(loc.x / 16);
          const cz = Math.floor(loc.z / 16);
          const dim = (w.dimension || loc.dimension || "overworld").replace("minecraft:", "");
          addZone({
            id: "warp_" + w.name,
            name: "Warp: " + w.name,
            type: "warp",
            dimension: dim,
            minChunkX: cx - 2,
            minChunkZ: cz - 2,
            maxChunkX: cx + 2,
            maxChunkZ: cz + 2,
            blockX: Math.round(loc.x),
            blockY: Math.round(loc.y ?? 64),
            blockZ: Math.round(loc.z),
            description: w.description || "Server Fast Travel Warp",
            owner: w.createdBy || "Server Admin"
          });
          warpsCount++;
        }
      }
    } catch (err) {
      console.warn("[MGC-BRIDGE] Error parsing server warps:", err);
    }

    // 3. Player Warps (PWarp - supports Database('pwarp') with \uE812, pwarp_index, and pwarp_*)
    let pwarpsCount = 0;
    try {
      const pwarpList = [];

      for (const pid of allPropIds) {
        if (pid.startsWith("pwarp\uE812") || (pid.startsWith("pwarp_") && pid !== "pwarp_index" && !pid.includes("invite") && !pid.includes("cooldown") && !pid.includes("limit") && !pid.includes("cost") && !pid.includes("teleport"))) {
          const raw = world.getDynamicProperty(pid);
          if (raw) {
            const parsed = safeParseKiw(raw);
            if (parsed && typeof parsed === "object") {
              const pwName = parsed.name || (pid.startsWith("pwarp\uE812") ? pid.slice(7) : pid.slice(6));
              pwarpList.push({ ...parsed, name: pwName });
            }
          }
        }
      }

      const pwarpIndexRaw = world.getDynamicProperty("pwarp_index");
      if (pwarpIndexRaw) {
        const indexArr = safeParseKiw(pwarpIndexRaw);
        if (Array.isArray(indexArr)) {
          for (const name of indexArr) {
            const raw = world.getDynamicProperty("pwarp_" + name) || world.getDynamicProperty("pwarp\uE812" + name);
            if (raw) {
              const parsed = safeParseKiw(raw);
              if (parsed && typeof parsed === "object") {
                pwarpList.push({ ...parsed, name: parsed.name || name });
              }
            }
          }
        }
      }

      for (const pw of pwarpList) {
        if (!pw || !pw.name) continue;
        const loc = pw.location || pw.pos || pw;
        if (loc && loc.x !== undefined && loc.z !== undefined) {
          const cx = Math.floor(loc.x / 16);
          const cz = Math.floor(loc.z / 16);
          const dim = (pw.dimension || loc.dimension || "overworld").replace("minecraft:", "");
          const ownerName = pw.ownerName || pw.owner || "Player";
          addZone({
            id: "pwarp_" + pw.name,
            name: "PWarp: " + pw.name,
            type: "pwarp",
            dimension: dim,
            minChunkX: cx - 2,
            minChunkZ: cz - 2,
            maxChunkX: cx + 2,
            maxChunkZ: cz + 2,
            blockX: Math.round(loc.x),
            blockY: Math.round(loc.y ?? 64),
            blockZ: Math.round(loc.z),
            owner: ownerName,
            ownerName: ownerName,
            description: pw.description || (pw.isPublic ? "Public Player Warp" : "Private Player Warp"),
            isPublic: pw.isPublic ?? true
          });
          pwarpsCount++;
        }
      }
    } catch (err) {
      console.warn("[MGC-BRIDGE] Error parsing pwarps:", err);
    }

    // 4. Player Land Claims (KiwEssentials Land System - land_claims_*, land_claims_safe_*, land_player_names)
    let claimsCount = 0;
    try {
      let playerNamesMap = {};
      const rawNames = world.getDynamicProperty("land_player_names");
      if (rawNames) {
        playerNamesMap = safeParseKiw(rawNames) || {};
      }

      try {
        const pList = (typeof world.getAllPlayers === "function") ? world.getAllPlayers() : (world.getPlayers ? world.getPlayers() : []);
        for (const p of pList) {
          if (p?.id) playerNamesMap[p.id] = p.name || p.id;
          if (p?.name) playerNamesMap[p.name] = p.name;
        }
      } catch {}

      const candidateClaimKeys = new Set();
      for (const pid of Object.keys(playerNamesMap)) {
        candidateClaimKeys.add("land_claims_" + pid);
        candidateClaimKeys.add("land_claims_safe_" + pid);
      }
      for (const pid of allPropIds) {
        if (pid.startsWith("land_claims_") && !pid.includes("revision") && !pid.includes("counter") && !pid.includes("corrupt")) {
          candidateClaimKeys.add(pid);
        }
      }
      candidateClaimKeys.add("land_claims");

      const claimList = [];
      const seenClaimIds = new Set();

      for (const key of candidateClaimKeys) {
        const raw = world.getDynamicProperty(key);
        if (raw) {
          const parsed = safeParseKiw(raw);
          if (Array.isArray(parsed)) {
            for (const c of parsed) {
              const cid = c.claimId || c.id || JSON.stringify(c.pos1);
              if (cid && !seenClaimIds.has(cid)) {
                seenClaimIds.add(cid);
                claimList.push(c);
              }
            }
          } else if (parsed && typeof parsed === "object") {
            for (const [cid, c] of Object.entries(parsed)) {
              if (c && typeof c === "object" && !seenClaimIds.has(cid)) {
                seenClaimIds.add(cid);
                claimList.push({ ...c, claimId: c.claimId || cid });
              }
            }
          }
        }
      }

      for (const cl of claimList) {
        if (!cl) continue;
        const p1 = cl.pos1 || { x: cl.x1, y: cl.y1, z: cl.z1, dimension: cl.dimension };
        const p2 = cl.pos2 || { x: cl.x2, y: cl.y2, z: cl.z2, dimension: cl.dimension };
        if (p1 && p1.x !== undefined && p1.z !== undefined) {
          const x1 = Math.min(p1.x, (p2 && p2.x !== undefined) ? p2.x : p1.x);
          const z1 = Math.min(p1.z, (p2 && p2.z !== undefined) ? p2.z : p1.z);
          const x2 = Math.max(p1.x, (p2 && p2.x !== undefined) ? p2.x : p1.x);
          const z2 = Math.max(p1.z, (p2 && p2.z !== undefined) ? p2.z : p1.z);
          const dim = (p1.dimension || cl.dimension || cl._dim || "overworld").replace("minecraft:", "");
          const ownerDisplay = playerNamesMap[cl.owner] || cl.ownerName || cl.owner || "Unknown Player";
          const claimName = cl.name || (ownerDisplay + "'s Claim");
          const sizeW = Math.abs(x2 - x1) + 1;
          const sizeH = Math.abs(z2 - z1) + 1;
          
          addZone({
            id: "claim_" + (cl.claimId || cl.id || (x1 + "_" + z1)),
            name: "Land: " + claimName,
            type: "claim",
            dimension: dim,
            minChunkX: Math.floor(x1 / 16),
            minChunkZ: Math.floor(z1 / 16),
            maxChunkX: Math.floor(x2 / 16),
            maxChunkZ: Math.floor(z2 / 16),
            blockX: Math.round(x1),
            blockY: Math.round(p1.y ?? 64),
            blockZ: Math.round(z1),
            owner: ownerDisplay,
            ownerName: ownerDisplay,
            description: cl.description || ("Size: " + sizeW + "x" + sizeH + " blocks (" + (sizeW * sizeH).toLocaleString() + " blocks²)"),
            membersCount: Array.isArray(cl.members) ? cl.members.length : 0
          });
          claimsCount++;
        }
      }
    } catch (err) {
      console.warn("[MGC-BRIDGE] Error parsing land claims:", err);
    }

    // 5. Lobby & Admin Protected Regions (lobby_protected_regions, protectedRegions, lobby_regions)
    let lobbyCount = 0;
    try {
      const regionKeys = ["lobby_protected_regions", "protectedRegions", "lobby_regions"];
      for (const rk of regionKeys) {
        const rawRegions = world.getDynamicProperty(rk);
        if (rawRegions) {
          const regions = safeParseKiw(rawRegions);
          if (Array.isArray(regions)) {
            for (const reg of regions) {
              if (reg && reg.pos1 && reg.pos2) {
                const x1 = Math.min(reg.pos1.x, reg.pos2.x);
                const z1 = Math.min(reg.pos1.z, reg.pos2.z);
                const x2 = Math.max(reg.pos1.x, reg.pos2.x);
                const z2 = Math.max(reg.pos1.z, reg.pos2.z);
                const dim = (reg.dimension || "overworld").replace("minecraft:", "");
                addZone({
                  id: "lobby_" + (reg.id || reg.name),
                  name: "Lobby: " + reg.name,
                  type: "lobby",
                  dimension: dim,
                  minChunkX: Math.floor(x1 / 16),
                  minChunkZ: Math.floor(z1 / 16),
                  maxChunkX: Math.floor(x2 / 16),
                  maxChunkZ: Math.floor(z2 / 16),
                  blockX: Math.round(x1),
                  blockY: Math.round(reg.pos1.y ?? 64),
                  blockZ: Math.round(z1),
                  owner: reg.createdBy || "Server Admin",
                  description: "Mode: " + (reg.mode || "Protected Lobby")
                });
                lobbyCount++;
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn("[MGC-BRIDGE] Error parsing lobby regions:", err);
    }

    // Dispatch payload to Hono Backend
    if (zones.length > 0 || chunks.length > 0) {
      await sendRequest("/world/protected-chunks", HttpRequestMethod.Post, {
        zones,
        chunks: chunks.slice(0, 500)
      });
      console.warn("[MGC-BRIDGE] Synchronized " + zones.length + " world zones (" + claimsCount + " claims, " + warpsCount + " warps, " + pwarpsCount + " pwarps, " + lobbyCount + " lobbies/spawns) to backend!");
    }
  } catch (err) {
    console.warn("[MGC-BRIDGE] Zone sync error:", err);
  }
}

// Initial Sync at startup (after 5 seconds / 100 ticks)
system.runTimeout(() => {
  syncWorldZonesAndChunks(true);
}, 100);

// Recurring sync every 60 seconds (1200 ticks)
system.runInterval(() => {
  syncWorldZonesAndChunks(false);
}, 1200);

// Sync on player join
world.afterEvents.playerSpawn?.subscribe(({ initialSpawn }) => {
  if (initialSpawn) {
    system.runTimeout(() => {
      syncWorldZonesAndChunks(false);
    }, 60);
  }
});
