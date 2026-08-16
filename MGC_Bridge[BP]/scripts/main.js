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
// ========================================================
world.afterEvents.chatSend.subscribe(async (event) => {
  const senderName = event.sender.name;
  const messageText = event.message;

  const res = await sendRequest("/chat", HttpRequestMethod.Post, {
    sender: senderName,
    message: messageText
  });

  // If player account is not linked, send a gentle reminder whisper
  if (res && res.status === 200) {
    try {
      const data = JSON.parse(res.body);
      if (data.isLinked === false) {
        system.run(() => {
          try {
            event.sender.sendMessage(
              `§e[Info] §fYour account is not linked to Discord. Visit Web Dashboard to link your IGN!`
            );
          } catch {}
        });
      }
    } catch {}
  }
});

// ========================================================
// 2. EVENT: Player Spawn / Join & Account Status Check
// ========================================================
world.afterEvents.playerSpawn.subscribe(async (event) => {
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
});

// ========================================================
// 3. EVENT: Player Leave
// ========================================================
world.afterEvents.playerLeave.subscribe((event) => {
  sendRequest("/leave", HttpRequestMethod.Post, {
    username: event.playerName
  });
});

// ========================================================
// 3.1. EVENT: Player Death (In-Game Death Notification)
// ========================================================
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
