import { world, system } from "@minecraft/server";
import { http, HttpRequest, HttpRequestMethod, HttpHeader } from "@minecraft/server-net";

/**
 * Hono Backend Configuration
 */
const HONO_BACKEND_URL = "http://localhost:3000/api/game";
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
// 1. EVENT: In-Game Chat -> Forward to Hono Backend
//
// COMPATIBILITY NOTE — KiwEssentials Integration:
//   KiwEssentials (board/chat.js & chatGames.js) always sets
//   data.cancel = true in beforeEvents.chatSend, which means
//   afterEvents.chatSend NEVER fires when KiwEssentials is active.
//
//   Fix: Subscribe to beforeEvents.chatSend, capture sender &
//   message immediately (sync), then defer the HTTP call via
//   system.run() to avoid before-event async restrictions.
//   A dedup guard prevents double-send in case both events fire.
// ========================================================
let lastChatKey = "";
let lastChatTs = 0;
const CHAT_DEDUP_MS = 2000;

// Subscribe to beforeEvents.chatSend — fires before KiwEssentials cancels it
if (world.beforeEvents?.chatSend?.subscribe) {
  world.beforeEvents.chatSend.subscribe((event) => {
    try {
      // Capture data synchronously (before-event context — no async allowed)
      const senderName = event.sender?.name || "Player";
      const messageText = event.message || "";

      // Skip empty messages or KiwEssentials rank commands (+cmd)
      if (!messageText || messageText.startsWith("+")) return;

      // Deduplication: same sender+message within 2 seconds = skip
      const chatKey = `${senderName}:${messageText}`;
      const now = Date.now();
      if (chatKey === lastChatKey && now - lastChatTs < CHAT_DEDUP_MS) return;
      lastChatKey = chatKey;
      lastChatTs = now;

      // Defer HTTP call to next tick (required: before-events are synchronous)
      const senderRef = event.sender;
      system.run(async () => {
        try {
          const res = await sendRequest("/chat", HttpRequestMethod.Post, {
            sender: senderName,
            message: messageText
          });

          if (res && res.status === 200) {
            try {
              const data = JSON.parse(res.body);
              if (data.isLinked === false && senderRef) {
                try {
                  senderRef.sendMessage(
                    `§e[Bridge Info] §fAkun kamu belum terhubung ke Discord. Kunjungi Web Dashboard untuk link IGN!`
                  );
                } catch {}
              }
            } catch {}
          }
        } catch {}
      });
    } catch {}
  });
}

// Fallback: afterEvents.chatSend (fires only if no addon sets cancel=true)
// Dedup guard above ensures no double-send when beforeEvents already handled it.
if (world.afterEvents?.chatSend?.subscribe) {
  world.afterEvents.chatSend.subscribe(async (event) => {
    try {
      const senderName = event.sender?.name || "Player";
      const messageText = event.message || "";
      if (!messageText || messageText.startsWith("+")) return;

      const chatKey = `${senderName}:${messageText}`;
      const now = Date.now();
      if (chatKey === lastChatKey && now - lastChatTs < CHAT_DEDUP_MS) return;
      lastChatKey = chatKey;
      lastChatTs = now;

      await sendRequest("/chat", HttpRequestMethod.Post, {
        sender: senderName,
        message: messageText
      });
    } catch {}
  });
}

// ========================================================
// 2. EVENT: Player Spawn / Join & Account Status Check
// ========================================================
if (world.afterEvents?.playerSpawn?.subscribe) {
  world.afterEvents.playerSpawn.subscribe(async (event) => {
    try {
      if (event.initialSpawn) {
        const player = event.player;
        const username = player.name;

        const res = await sendRequest("/join", HttpRequestMethod.Post, {
          username: username
        });

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
