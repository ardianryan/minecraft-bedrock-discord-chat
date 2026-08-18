import { Hono } from 'hono';
import { WebhookClient } from 'discord.js';
import { 
  getAllUsers, 
  updateUserByAdmin, 
  deleteUserById, 
  getSetting, 
  setSetting 
} from '../db.js';
import { officeAdminMiddleware } from './auth.js';

export const officeRouter = new Hono();

// Apply Admin Middleware to all /api/office/* routes
officeRouter.use('*', officeAdminMiddleware);

// 1. Get All Registered Users
officeRouter.get('/users', async (c) => {
  try {
    const users = await getAllUsers();
    return c.json({ users });
  } catch (err) {
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// 2. Update User (Minecraft IGN, Role)
officeRouter.patch('/users/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    const { minecraft_username, role } = body;

    const updated = await updateUserByAdmin(id, {
      minecraft_username: minecraft_username !== undefined ? (minecraft_username || null) : undefined,
      role: role ? (role === 'admin' ? 'admin' : 'user') : undefined,
    });

    if (!updated) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ status: 'success', user: updated });
  } catch (err) {
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// 3. Delete User
officeRouter.delete('/users/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    await deleteUserById(id);
    return c.json({ status: 'success', message: 'User deleted' });
  } catch (err) {
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// 4. Get System Settings
officeRouter.get('/settings', async (c) => {
  try {
    const webhookUrl = await getSetting('discord_webhook_url', process.env.DISCORD_WEBHOOK_URL || '');
    const botToken = await getSetting('discord_bot_token', process.env.DISCORD_BOT_TOKEN || '');
    const channelId = await getSetting('discord_channel_id', process.env.DISCORD_CHANNEL_ID || '');
    const inviteUrl = await getSetting('discord_invite_url', process.env.DISCORD_INVITE_URL || '');
    const apiKey = await getSetting('api_key', process.env.API_KEY || 'SECRET_BEARER_TOKEN');
    const serverName = await getSetting('server_name', 'Minecraft Bedrock Server');
    const serverIp = await getSetting('server_ip', process.env.SERVER_IP || '');
    const serverPort = await getSetting('server_port', process.env.SERVER_PORT || '19132');
    
    // SEO & Search / AI Bot Indexing
    const allowIndexing = await getSetting('allow_indexing', 'true');
    const seoTitle = await getSetting('seo_title', `${serverName} • Bedrock Community Portal & Live Chat`);
    const seoDescription = await getSetting('seo_description', `Official Minecraft Bedrock server live portal for ${serverName}. Real-time chat sync with Discord, active player leaderboard, and instant 1-click connect.`);
    const seoKeywords = await getSetting('seo_keywords', 'minecraft bedrock, minecraft server indonesia, magicalcraft, discord minecraft bridge, bedrock live chat, kiwessentials leaderboard, mcpe server');
    const seoGeoRegion = await getSetting('seo_geo_region', 'ID-JK');
    const seoGeoPlacename = await getSetting('seo_geo_placename', 'Jakarta, Indonesia');
    const seoGeoPosition = await getSetting('seo_geo_position', '-6.2088;106.8456');

    return c.json({
      settings: {
        discord_webhook_url: webhookUrl,
        discord_bot_token: botToken,
        discord_channel_id: channelId,
        discord_invite_url: inviteUrl,
        api_key: apiKey,
        server_name: serverName,
        server_ip: serverIp,
        server_port: serverPort,
        allow_indexing: allowIndexing,
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_keywords: seoKeywords,
        seo_geo_region: seoGeoRegion,
        seo_geo_placename: seoGeoPlacename,
        seo_geo_position: seoGeoPosition,
      },
    });
  } catch (err) {
    return c.json({ error: 'Failed to fetch settings' }, 500);
  }
});

// 5. Update System Settings
officeRouter.post('/settings', async (c) => {
  try {
    const { 
      discord_webhook_url, 
      discord_bot_token, 
      discord_channel_id, 
      discord_invite_url, 
      api_key, 
      server_name,
      server_ip,
      server_port,
      allow_indexing,
      seo_title,
      seo_description,
      seo_keywords,
      seo_geo_region,
      seo_geo_placename,
      seo_geo_position
    } = await c.req.json();

    if (discord_webhook_url !== undefined) {
      await setSetting('discord_webhook_url', String(discord_webhook_url).trim());
    }
    if (discord_bot_token !== undefined) {
      await setSetting('discord_bot_token', String(discord_bot_token).trim());
    }
    if (discord_channel_id !== undefined) {
      await setSetting('discord_channel_id', String(discord_channel_id).trim());
    }
    if (discord_invite_url !== undefined) {
      await setSetting('discord_invite_url', String(discord_invite_url).trim());
    }
    if (api_key !== undefined) {
      await setSetting('api_key', String(api_key).trim());
    }
    if (server_name !== undefined) {
      await setSetting('server_name', String(server_name).trim());
    }
    if (server_ip !== undefined) {
      await setSetting('server_ip', String(server_ip).trim());
    }
    if (server_port !== undefined) {
      await setSetting('server_port', String(server_port).trim());
    }
    if (allow_indexing !== undefined) {
      await setSetting('allow_indexing', String(allow_indexing) === 'true' ? 'true' : 'false');
    }
    if (seo_title !== undefined) {
      await setSetting('seo_title', String(seo_title).trim());
    }
    if (seo_description !== undefined) {
      await setSetting('seo_description', String(seo_description).trim());
    }
    if (seo_keywords !== undefined) {
      await setSetting('seo_keywords', String(seo_keywords).trim());
    }
    if (seo_geo_region !== undefined) {
      await setSetting('seo_geo_region', String(seo_geo_region).trim());
    }
    if (seo_geo_placename !== undefined) {
      await setSetting('seo_geo_placename', String(seo_geo_placename).trim());
    }
    if (seo_geo_position !== undefined) {
      await setSetting('seo_geo_position', String(seo_geo_position).trim());
    }

    // Hot-reload / re-initialize Discord Bot if token was updated
    try {
      const { initDiscordBot } = await import('../index.js');
      initDiscordBot().catch((e) => console.error('Bot reload error:', e.message));
    } catch {}

    return c.json({ status: 'success', message: 'Settings updated in PostgreSQL database successfully' });
  } catch (err) {
    return c.json({ error: 'Failed to save settings' }, 500);
  }
});

// 6. Test Discord Webhook
officeRouter.post('/test-webhook', async (c) => {
  try {
    const { url } = await c.req.json();
    const targetUrl = url || await getSetting('discord_webhook_url', process.env.DISCORD_WEBHOOK_URL || '');

    if (!targetUrl) {
      return c.json({ error: 'Discord Webhook URL has not been configured' }, 400);
    }

    const testWebhook = new WebhookClient({ url: targetUrl });
    await testWebhook.send({
      username: 'Discord Bedrock Bridge [Test]',
      content: '✅ **Webhook Test Successful!** Minecraft Bedrock ↔ Discord ↔ Office Dashboard bridge connected.',
    });

    return c.json({ status: 'success', message: 'Test message sent to Discord channel successfully!' });
  } catch (err: any) {
    return c.json({ error: `Failed to dispatch webhook: ${err.message}` }, 400);
  }
});

// 6b. Test Discord Bot Token
officeRouter.post('/test-bot', async (c) => {
  try {
    const { token } = await c.req.json();
    const botToken = (token || await getSetting('discord_bot_token', process.env.DISCORD_BOT_TOKEN || '')).trim();

    if (!botToken) {
      return c.json({ error: 'Discord Bot Token is empty. Please enter your bot token.' }, 400);
    }

    const { Client, GatewayIntentBits } = await import('discord.js');
    const testClient = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
    });

    const botUser = await new Promise<{ tag: string; id: string }>((resolve, reject) => {
      const timeout = setTimeout(() => {
        testClient.destroy();
        reject(new Error('Bot connection timed out after 7s. Please check token or network.'));
      }, 7000);

      testClient.once('ready', (client) => {
        clearTimeout(timeout);
        const res = { tag: client.user.tag, id: client.user.id };
        testClient.destroy();
        resolve(res);
      });

      testClient.login(botToken).catch((err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    return c.json({ 
      status: 'success', 
      message: `✅ Bot successfully verified & connected as @${botUser.tag} (ID: ${botUser.id})!` 
    });
  } catch (err: any) {
    return c.json({ error: `Bot login failed: ${err.message}` }, 400);
  }
});

// 7. Moderation: Kick Player
officeRouter.post('/players/kick', async (c) => {
  try {
    const { username, reason } = await c.req.json();
    if (!username) {
      return c.json({ error: 'Player username is required' }, 400);
    }

    const cleanUser = String(username).trim();
    const cleanReason = String(reason || 'Kicked by Administrator').trim();

    // Import from index.ts
    const { pendingGameMessages, addChatMessage, getActiveWebhookClient, activePlayers } = await import('../index.js');

    pendingGameMessages.push({
      source: 'Moderation',
      sender: 'Admin',
      message: `/kick "${cleanUser}" ${cleanReason}`,
      isCommand: true,
    });

    activePlayers.delete(cleanUser);

    addChatMessage({
      source: 'System',
      sender: 'Admin',
      message: `👢 Player ${cleanUser} was kicked by Admin (Reason: ${cleanReason})`,
    });

    const webhook = await getActiveWebhookClient();
    if (webhook) {
      webhook.send({
        username: 'Admin Moderation',
        content: `👢 **Player Kicked:** **${cleanUser}** was kicked by Administrator *(Reason: ${cleanReason})*`,
      }).catch(() => {});
    }

    return c.json({ status: 'success', message: `Player ${cleanUser} has been kicked.` });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to kick player' }, 500);
  }
});

// 8. Moderation: Ban Player
officeRouter.post('/players/ban', async (c) => {
  try {
    const { username, reason } = await c.req.json();
    if (!username) {
      return c.json({ error: 'Player username is required' }, 400);
    }

    const user: any = (c as any).get('user');
    const adminName = user?.discord_username || 'Admin';
    const cleanUser = String(username).trim();
    const cleanReason = String(reason || 'Banned by Administrator').trim();

    const { banPlayer } = await import('../db.js');
    const { pendingGameMessages, addChatMessage, getActiveWebhookClient, activePlayers } = await import('../index.js');

    // Save ban to PostgreSQL
    await banPlayer(cleanUser, cleanReason, adminName);

    // Disconnect player from game immediately
    pendingGameMessages.push({
      source: 'Moderation',
      sender: 'Admin',
      message: `/kick "${cleanUser}" Banned: ${cleanReason}`,
      isCommand: true,
    });

    activePlayers.delete(cleanUser);

    addChatMessage({
      source: 'System',
      sender: 'Admin',
      message: `🚫 Player ${cleanUser} was permanently BANNED by Admin ${adminName} (Reason: ${cleanReason})`,
    });

    const webhook = await getActiveWebhookClient();
    if (webhook) {
      webhook.send({
        username: 'Admin Moderation',
        content: `🚫 **Player Banned:** **${cleanUser}** was permanently banned by **${adminName}** *(Reason: ${cleanReason})*`,
      }).catch(() => {});
    }

    return c.json({ status: 'success', message: `Player ${cleanUser} has been banned.` });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to ban player' }, 500);
  }
});

// 9. Moderation: Get Banned Players List
officeRouter.get('/players/banned', async (c) => {
  try {
    const { getBannedPlayers } = await import('../db.js');
    const banned = await getBannedPlayers();
    return c.json({ banned });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch banlist' }, 500);
  }
});

// 10. Moderation: Unban Player
officeRouter.post('/players/unban', async (c) => {
  try {
    const { username } = await c.req.json();
    if (!username) {
      return c.json({ error: 'Username is required' }, 400);
    }

    const cleanUser = String(username).trim();
    const { unbanPlayer } = await import('../db.js');
    const { addChatMessage } = await import('../index.js');

    await unbanPlayer(cleanUser);

    addChatMessage({
      source: 'System',
      sender: 'Admin',
      message: `✨ Player ${cleanUser} was UNBANNED by Administrator.`,
    });

    return c.json({ status: 'success', message: `Player ${cleanUser} has been unbanned.` });
  } catch (err: any) {
    return c.json({ error: 'Failed to unban player' }, 500);
  }
});

// 10. Get Known Server Players Directory (Active within 14 Days)
officeRouter.get('/players/known', async (c) => {
  try {
    const { getKnownPlayers } = await import('../db.js');
    const { activePlayers } = await import('../index.js');
    const players = await getKnownPlayers(14);

    const result = players.map((p: any) => ({
      username: p.username,
      first_seen: p.first_seen,
      last_seen: p.last_seen,
      isOnline: activePlayers.has(p.username),
    }));

    return c.json({ players: result });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch known players directory' }, 500);
  }
});


