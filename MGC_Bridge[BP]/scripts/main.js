import { world, system } from "@minecraft/server";
import { http, HttpRequest, HttpRequestMethod, HttpHeader } from "@minecraft/server-net";

// ── Startup Diagnostic (visible in BDS console logs)
system.run(() => {
  console.warn("[MGC-BRIDGE] v1.6.0 loaded — checking event availability:");
  console.warn("[MGC-BRIDGE]  beforeEvents.chatSend:", !!world.beforeEvents?.chatSend);
  console.warn("[MGC-BRIDGE]  afterEvents.chatSend :", !!world.afterEvents?.chatSend);
  console.warn("[MGC-BRIDGE]  afterEvents.playerSpawn:", !!world.afterEvents?.playerSpawn);
});

/**
 * Hono Backend Configuration
 */
const HONO_BACKEND_URL = "https://mgc.ppti.me/api/game";
const API_KEY = "SECRET_BEARER_TOKEN";

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
// Returns 0 if objective doesn't exist (safe no-crash fallback)
// KiwEssentials objectives: kill, death, money, coin, playtime
// ========================================================
function readScore(player, objective) {
  try {
    const obj = world.scoreboard.getObjective(objective);
    if (!obj) return 0;
    const score = obj.getScore(player.scoreboardIdentity);
    return typeof score === "number" ? Math.max(0, score) : 0;
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
          kills:    readScore(player, "kill"),
          deaths:   readScore(player, "death"),
          money:    readScore(player, "money"),
          coin:     readScore(player, "coin"),
          playtime: readScore(player, "playtime"),
          online:   true,
        });
      } catch {}
    }
  } catch {}
  return stats;
}

// Sync KiwEssentials stats to backend every 3 min (3600 ticks ≈ 180s)
let isSyncingScores = false;
system.runInterval(async () => {
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
}, 3600);

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
  world.afterEvents.playerSpawn.subscribe(async (event) => {
    try {
      if (event.initialSpawn) {
        const player = event.player;
        const username = player.name;

        // Send KiwEssentials stats alongside join event
        const joinStats = {
          username: username,
          kills:    readScore(player, "kill"),
          deaths:   readScore(player, "death"),
          money:    readScore(player, "money"),
          coin:     readScore(player, "coin"),
          playtime: readScore(player, "playtime"),
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
      }
    } catch (e) {}
  });
}

// ========================================================
// 3. EVENT: Player Leave
// ========================================================
if (world.afterEvents?.playerLeave?.subscribe) {
  world.afterEvents.playerLeave.subscribe((event) => {
    try {
      sendRequest("/leave", HttpRequestMethod.Post, {
        username: event.playerName
      });
    } catch (e) {}
  });
}

// ========================================================
// 3.1. EVENT: Player Death (In-Game Death Notification)
// ========================================================
if (world.afterEvents?.entityDie?.subscribe) {
  world.afterEvents.entityDie.subscribe((event) => {
    try {
      const deadEntity = event.deadEntity;
      if (deadEntity && deadEntity.typeId === "minecraft:player") {
        const playerName = deadEntity.name || "Player";
        const killer = event.damageSource?.damagingEntity?.name || event.damageSource?.damagingEntity?.typeId?.replace("minecraft:", "") || null;
        const cause = event.damageSource?.cause || "died";

        sendRequest("/death", HttpRequestMethod.Post, {
          player: playerName,
          killer: killer,
          cause: cause
        });
      }
    } catch (err) {}
  });
}

// ========================================================
// 4. INTERVAL: Poll Pending Messages & Execute Commands
// Non-blocking async with concurrency guard (zero TPS lag)
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
            // If message is an In-Game Slash Command
            if (msg.isCommand || (msg.message && msg.message.startsWith("/"))) {
              const cleanCommand = msg.message.startsWith("/") ? msg.message.substring(1) : msg.message;
              try {
                await overworld.runCommandAsync(cleanCommand);
                world.sendMessage(`§6[Admin Command] §e${msg.sender}§f: §a/${cleanCommand}`);
              } catch (cmdErr) {
                world.sendMessage(`§c[Command Error] §f/${cleanCommand} (Execution failed)`);
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
    // Network or fetch error silently caught
  } finally {
    isPolling = false;
  }
}, 20);
