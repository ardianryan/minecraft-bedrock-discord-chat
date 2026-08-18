import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { 
  Client, 
  GatewayIntentBits, 
  WebhookClient, 
  Events, 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
  REST,
  Routes,
  SlashCommandBuilder
} from 'discord.js';
import dotenv from 'dotenv';

import { 
  initDb, 
  getUserByDiscordId,
  getUserByMinecraftUsername, 
  generateLinkCode,
  upsertUser,
  getAllUsers, 
  getLeaderboard,
  incrementUserMessageCount,
  isPlayerBanned,
  saveChatMessage,
  getChatLogs,
  recordKnownPlayer,
  getKnownPlayers,
  getSetting, 
  setSetting,
  isDbConnected,
  upsertPlayerScores,
  getPlayerScoreboard,
  getSinglePlayerScore,
  type PlayerStatPayload,
  type ScoreboardSortKey
} from './db.js';
import { authRouter } from './routes/auth.js';
import { officeRouter } from './routes/office.js';

dotenv.config();

const app = new Hono();
const PORT = Number(process.env.PORT) || 3000;

// Data Types
export interface ChatMessage {
  id: string;
  source: 'Game' | 'Web' | 'Discord' | 'System';
  sender: string;
  message: string;
  timestamp: string;
  discordUser?: {
    id: string;
    username: string;
    avatar?: string;
  } | null;
}

// In-Memory State Management
export const activePlayers = new Set<string>();
export const pendingGameMessages: Array<{ source: string; sender: string; message: string; isCommand?: boolean }> = [];
export const chatHistory: ChatMessage[] = [];
const MAX_HISTORY = 50;

export function addChatMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>) {
  const newMsg: ChatMessage = {
    ...msg,
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      timeZone: 'Asia/Jakarta',
      hour12: false
    }),
  };
  chatHistory.push(newMsg);
  if (chatHistory.length > MAX_HISTORY) {
    chatHistory.shift();
  }

  // Persist into PostgreSQL with automatic 50-message retention
  saveChatMessage({
    source: msg.source,
    sender: msg.sender,
    message: msg.message,
    discord_user: msg.discordUser || null,
  }).catch((e) => console.error('Failed to persist chat log:', e.message));

  return newMsg;
}

// Enable CORS for frontend web client
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Helper to get Discord Webhook Client from Dynamic Settings (PostgreSQL / Env)
export async function getActiveWebhookClient(): Promise<WebhookClient | null> {
  const webhookUrl = await getSetting('discord_webhook_url', process.env.DISCORD_WEBHOOK_URL || '');
  if (webhookUrl && webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    try {
      return new WebhookClient({ url: webhookUrl });
    } catch {
      return null;
    }
  }
  return null;
}

// Helper to get Auth Token for Bedrock Script API
async function getActiveApiKey(): Promise<string> {
  return await getSetting('api_key', process.env.API_KEY || 'SECRET_BEARER_TOKEN');
}

// Middleware Auth untuk Minecraft Bedrock Script API
const bedrockAuthMiddleware = async (c: any, next: any) => {
  const validKey = await getActiveApiKey();
  const auth = c.req.header('Authorization');
  if (auth !== `Bearer ${validKey}`) {
    return c.json({ error: 'Unauthorized: Invalid or missing Bearer token' }, 401);
  }
  await next();
};

// ==========================================
// 🤖 DISCORD BOT CLIENT (INTERACTIVE BUTTONS & MODALS)
// ==========================================
export const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let isBotReady = false;
let areBotListenersRegistered = false;

// Helper: Create Interactive Control Panel Buttons
export function createControlPanelComponents(frontendUrl: string) {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_join_server')
      .setLabel('🎮 Server IP & Join')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('btn_link_account')
      .setLabel('🔗 Link IGN')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('btn_check_status')
      .setLabel('📊 Status')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_leaderboard')
      .setLabel('🏆 Leaderboard')
      .setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_my_account')
      .setLabel('👤 My Profile')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_unlink_account')
      .setLabel('🔓 Unlink')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setLabel('🌐 Open Web Dashboard')
      .setStyle(ButtonStyle.Link)
      .setURL(frontendUrl)
  );

  return [row1, row2];
}

export async function initDiscordBot() {
  const botToken = (await getSetting('discord_bot_token', process.env.DISCORD_BOT_TOKEN || '')).trim();

  if (!botToken) {
    console.log('ℹ️ DISCORD_BOT_TOKEN not configured in /office or .env. Bot Listener mode inactive.');
    isBotReady = false;
    return;
  }

  if (!areBotListenersRegistered) {
    areBotListenersRegistered = true;

    discordClient.on(Events.ClientReady, async (c) => {
      console.log(`🤖 Discord Bot logged in successfully as: ${c.user.tag}`);
      isBotReady = true;

      // Register Slash Commands globally
      try {
        const rest = new REST({ version: '10' }).setToken(botToken);
        const commands = [
          new SlashCommandBuilder().setName('panel').setDescription('Display interactive Minecraft bridge control panel'),
          new SlashCommandBuilder().setName('status').setDescription('View Minecraft server status and online players'),
          new SlashCommandBuilder().setName('top').setDescription('View community activity leaderboard'),
          new SlashCommandBuilder().setName('me').setDescription('View your linked Minecraft character profile'),
          new SlashCommandBuilder().setName('unlink').setDescription('Unlink your Minecraft In-Game Name'),
          new SlashCommandBuilder()
            .setName('link')
            .setDescription('Link your Minecraft Bedrock IGN to Discord')
            .addStringOption(opt => opt.setName('ign').setDescription('Your Minecraft Character IGN').setRequired(true)),
        ];

        await rest.put(Routes.applicationCommands(c.user.id), { body: commands.map(cmd => cmd.toJSON()) });
        console.log('✅ Global Slash Commands registered (/panel, /status, /top, /me, /link, /unlink)!');
      } catch (err: any) {
        console.error('Failed to register Discord Slash Commands:', err.message);
      }
    });

  // ========================================================
  // 1. DISCORD BUTTONS, SLASH COMMANDS & MODALS LISTENER
  // ========================================================
  discordClient.on(Events.InteractionCreate, async (interaction) => {
    try {
      const frontendUrl = await getSetting('frontend_url', process.env.FRONTEND_URL || 'http://localhost:3000');

      // A. Handle Slash Commands (/panel, /status, /top, /me, /link, /unlink)
      if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;
        const discordId = interaction.user.id;
        const discordUsername = interaction.user.globalName || interaction.user.username;

        if (commandName === 'panel') {
          const serverName = await getSetting('server_name', 'Minecraft Bedrock Server');
          const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(`🎮 ${serverName} — Control Panel`)
            .setDescription('Click the buttons below to link your account, check server status, or view leaderboards!')
            .addFields(
              { name: '🟢 Online Players', value: `${activePlayers.size} Players`, inline: true },
              { name: '🌐 Web Console', value: `[Open Dashboard](${frontendUrl})`, inline: true }
            );
          await interaction.reply({ embeds: [embed], components: createControlPanelComponents(frontendUrl) });
          return;
        }

        if (commandName === 'status') {
          const serverName = await getSetting('server_name', 'Minecraft Bedrock Server');
          const playerList = Array.from(activePlayers);
          const embed = new EmbedBuilder()
            .setColor(0x10b981)
            .setTitle(`🎮 Server Status: ${serverName}`)
            .addFields(
              { name: '🟢 Bridge Status', value: 'Online & Connected', inline: true },
              { name: '👥 Online Players', value: `${activePlayers.size} Players`, inline: true },
              { 
                name: '📋 Current Player Roster', 
                value: playerList.length > 0 ? playerList.map(p => `• **${p}**`).join('\n') : '_No players online at the moment._' 
              }
            );
          await interaction.reply({ embeds: [embed] });
          return;
        }

        if (commandName === 'top') {
          const leaderboard = await getLeaderboard(10);
          const topList = leaderboard.length > 0
            ? leaderboard.map((u, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**#${i + 1}**`;
                const ign = u.minecraft_username ? `🎮 **${u.minecraft_username}**` : `@${u.discord_username}`;
                return `${medal} ${ign} — \`${u.message_count} msgs\``;
              }).join('\n')
            : '_No activity recorded yet._';

          const embed = new EmbedBuilder()
            .setColor(0xf59e0b)
            .setTitle('🏆 Community Activity Leaderboard')
            .setDescription(topList);
          await interaction.reply({ embeds: [embed] });
          return;
        }

        if (commandName === 'me') {
          const user = await getUserByDiscordId(discordId);
          const embed = new EmbedBuilder()
            .setColor(user?.minecraft_username ? 0x10b981 : 0xf43f5e)
            .setTitle(`👤 Player Profile: @${discordUsername}`)
            .addFields(
              { name: '🎮 Linked IGN', value: user?.minecraft_username ? `**${user.minecraft_username}**` : '_Not linked yet._', inline: true },
              { name: '💬 Total Messages', value: `\`${user?.message_count || 0}\``, inline: true }
            );
          await interaction.reply({ embeds: [embed], ephemeral: true });
          return;
        }

        if (commandName === 'link') {
          const ign = interaction.options.getString('ign', true).trim();
          await upsertUser({
            discord_id: discordId,
            discord_username: discordUsername,
            discord_avatar: interaction.user.displayAvatarURL(),
            minecraft_username: ign,
          });
          await interaction.reply({ content: `✅ Successfully linked your Discord account to Minecraft IGN: **${ign}**!`, ephemeral: true });
          return;
        }

        if (commandName === 'unlink') {
          await upsertUser({
            discord_id: discordId,
            discord_username: discordUsername,
            minecraft_username: '',
          });
          await interaction.reply({ content: '🔓 Your Minecraft IGN has been unlinked from this Discord account.', ephemeral: true });
          return;
        }
      }

      // B. Handle Button Clicks
      if (interaction.isButton()) {
        const discordId = interaction.user.id;
        const discordUsername = interaction.user.globalName || interaction.user.username;

        // Button 1: Link Account -> Display Modal Popup Form
        if (interaction.customId === 'btn_link_account') {
          const modal = new ModalBuilder()
            .setCustomId('modal_link_ign')
            .setTitle('Link Minecraft In-Game Name');

          const ignInput = new TextInputBuilder()
            .setCustomId('input_minecraft_ign')
            .setLabel('Enter your Minecraft In-Game Name (IGN):')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g. Steve_99, Alex, RyanBuilder')
            .setMinLength(3)
            .setMaxLength(32)
            .setRequired(true);

          const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(ignInput);
          modal.addComponents(actionRow);

          await interaction.showModal(modal);
          return;
        }

        // Button: Join Server / IP
        if (interaction.customId === 'btn_join_server') {
          const serverName = await getSetting('server_name', 'Minecraft Bedrock Server');
          const serverIp = await getSetting('server_ip', process.env.SERVER_IP || '');
          const serverPort = await getSetting('server_port', process.env.SERVER_PORT || '19132');
          const frontendUrl = (await getSetting('frontend_url', process.env.FRONTEND_URL || 'http://localhost:5173')).trim();
          const joinUrl = `${frontendUrl}/join`;

          const joinEmbed = new EmbedBuilder()
            .setColor(0x10b981)
            .setTitle(`🎮 Join ${serverName}`)
            .setDescription('Connect directly to our Minecraft Bedrock server on Mobile (Android/iOS), Windows 10/11, or Console!')
            .addFields(
              { name: '🌐 Server Address', value: serverIp ? `\`${serverIp}\`` : '_Not configured in /office_', inline: true },
              { name: '🔌 Port', value: `\`${serverPort}\``, inline: true },
              { name: '👥 Online Players', value: `**${activePlayers.size}** players online`, inline: true }
            );

          if (serverIp) {
            joinEmbed.addFields({
              name: '🚀 1-Click Direct Connect',
              value: `Click the green **Launch Minecraft** button below or use [**▶️ This Direct Link**](${joinUrl}) to connect automatically!`,
              inline: false
            });
          }

          joinEmbed.setFooter({ text: 'Magical Gaming Crew • Bedrock Server' });

          const joinRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel('▶️ Launch Minecraft')
              .setStyle(ButtonStyle.Link)
              .setURL(joinUrl),
            new ButtonBuilder()
              .setLabel('🌐 Web Live Chat')
              .setStyle(ButtonStyle.Link)
              .setURL(frontendUrl)
          );

          await interaction.reply({ embeds: [joinEmbed], components: [joinRow], ephemeral: true });
          return;
        }

        // Button 2: Check Server Status & Online Players
        if (interaction.customId === 'btn_check_status') {
          const serverName = await getSetting('server_name', 'Minecraft Bedrock Server');
          const serverIp = await getSetting('server_ip', process.env.SERVER_IP || '');
          const serverPort = await getSetting('server_port', process.env.SERVER_PORT || '19132');
          const playerList = Array.from(activePlayers);

          const statusEmbed = new EmbedBuilder()
            .setColor(0x10b981)
            .setTitle(`🎮 Server Status: ${serverName}`)
            .addFields(
              { name: '🟢 Bridge Status', value: 'Online & Connected', inline: true },
              { name: '👥 Online Players', value: `${activePlayers.size} Players`, inline: true },
              { name: '🌐 Server Address', value: serverIp ? `\`${serverIp}:${serverPort}\`` : '_Configured in /office_', inline: true },
              { 
                name: '📋 Current Player Roster', 
                value: playerList.length > 0 
                  ? playerList.map(p => `• **${p}**`).join('\n') 
                  : '_No players online at the moment._',
                inline: false 
              }
            )
            .setFooter({ text: 'Real-time Minecraft Bedrock Bridge' });

          await interaction.reply({ embeds: [statusEmbed], ephemeral: true });
          return;
        }

        // Button: Check Leaderboard
        if (interaction.customId === 'btn_leaderboard') {
          const topUsers = await getLeaderboard(5);
          const leaderboardList = topUsers.length > 0
            ? topUsers.map((u, i) => {
                const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                const badge = medals[i] || '🎖️';
                const ign = u.minecraft_username ? `🎮 \`${u.minecraft_username}\`` : `💬 @${u.discord_username}`;
                return `${badge} **${ign}** — **${u.message_count || 0}** messages`;
              }).join('\n')
            : '_No messages recorded yet._';

          const embed = new EmbedBuilder()
            .setColor(0xf59e0b)
            .setTitle('🏆 Top Active Community Leaderboard')
            .setDescription(leaderboardList)
            .setFooter({ text: 'Live Community Ranking • Magical Gaming Crew' });

          await interaction.reply({ embeds: [embed], ephemeral: true });
          return;
        }

        // Button 3: Check My Profile
        if (interaction.customId === 'btn_my_account') {
          const user = await getUserByDiscordId(discordId);
          const embed = new EmbedBuilder()
            .setColor(user?.minecraft_username ? 0x10b981 : 0xf43f5e)
            .setTitle('👤 Discord & Minecraft Profile')
            .addFields(
              { name: 'Discord User', value: `<@${discordId}> (${discordUsername})`, inline: true },
              { name: 'Role', value: user?.role === 'admin' ? '🛡️ Administrator' : '⚔️ Member', inline: true },
              { 
                name: 'Minecraft IGN', 
                value: user?.minecraft_username ? `**\`${user.minecraft_username}\`** (Connected)` : '❌ _Not Linked_', 
                inline: false 
              },
              {
                name: 'Total Messages',
                value: `🔥 **${user?.message_count || 0}** sent`,
                inline: true
              }
            );

          await interaction.reply({ embeds: [embed], ephemeral: true });
          return;
        }

        // Button 4: Unlink Account
        if (interaction.customId === 'btn_unlink_account') {
          await upsertUser({
            discord_id: discordId,
            discord_username: discordUsername,
            minecraft_username: '',
          });

          await interaction.reply({
            content: '🔓 Your Minecraft IGN has been unlinked from this Discord account.',
            ephemeral: true,
          });
          return;
        }
      }
    } catch (e: any) {
      console.error('Interaction error:', e);
    }
  });

  // ========================================================
  // 2. DISCORD MESSAGE CREATE LISTENER
  // ========================================================
  discordClient.on(Events.MessageCreate, async (msg) => {
    // Ignore messages from bots or webhooks to prevent loops
    if (msg.author.bot || msg.webhookId) return;

    // Channel filter if targetChannelId is set in /office
    const targetChannelId = (await getSetting('discord_channel_id', process.env.DISCORD_CHANNEL_ID || '')).trim();
    if (targetChannelId && msg.channelId !== targetChannelId) {
      return;
    }

    const discordId = msg.author.id;
    const discordUsername = msg.author.globalName || msg.author.username;
    const rawContent = msg.content.trim();
    if (!rawContent) return;

    const lowerContent = rawContent.toLowerCase();

    // Command to summon Interactive Panel with Buttons: !panel / !menu / !tombol
    if (['!panel', '!menu', '!tombol', '!bridge', '!bot'].includes(lowerContent)) {
      const serverName = await getSetting('server_name', 'Minecraft Bedrock Server');
      const frontendUrl = (await getSetting('frontend_url', process.env.FRONTEND_URL || 'http://localhost:5173')).trim();

      const panelEmbed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🎮 Minecraft Bedrock Bridge Panel`)
        .setDescription(`Welcome to the **${serverName}** integration control panel!\n\nClick the buttons below to link your Minecraft account, check online player status, or open the Web Dashboard.`)
        .setFooter({ text: 'Click buttons below to interact in real-time' });

      const components = createControlPanelComponents(frontendUrl);
      msg.reply({ embeds: [panelEmbed], components }).catch(() => {});
      return;
    }

    // Server IP & Join Command: !ip, !join, !server
    if (lowerContent === '!ip' || lowerContent === '!join' || lowerContent === '!server' || lowerContent === '!connect') {
      const serverName = await getSetting('server_name', 'Minecraft Bedrock Server');
      const serverIp = await getSetting('server_ip', process.env.SERVER_IP || '');
      const serverPort = await getSetting('server_port', process.env.SERVER_PORT || '19132');
      const frontendUrl = (await getSetting('frontend_url', process.env.FRONTEND_URL || 'http://localhost:5173')).trim();
      const joinUrl = `${frontendUrl}/join`;

      const joinEmbed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle(`🎮 Join ${serverName}`)
        .setDescription('Connect directly to our Minecraft Bedrock server on Mobile (Android/iOS), Windows 10/11, or Console!')
        .addFields(
          { name: '🌐 Server Address', value: serverIp ? `\`${serverIp}\`` : '_Not configured in /office_', inline: true },
          { name: '🔌 Port', value: `\`${serverPort}\``, inline: true },
          { name: '👥 Online Players', value: `**${activePlayers.size}** players online`, inline: true }
        );

      if (serverIp) {
        joinEmbed.addFields({
          name: '🚀 1-Click Direct Connect',
          value: `Click the green **Launch Minecraft** button below or use [**▶️ This Direct Link**](${joinUrl}) to connect automatically!`,
          inline: false
        });
      }

      joinEmbed.setFooter({ text: 'Magical Gaming Crew • Bedrock Server' });

      const joinRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('▶️ Launch Minecraft')
          .setStyle(ButtonStyle.Link)
          .setURL(joinUrl),
        new ButtonBuilder()
          .setLabel('🌐 Web Live Chat')
          .setStyle(ButtonStyle.Link)
          .setURL(frontendUrl)
      );

      msg.reply({ embeds: [joinEmbed], components: [joinRow] }).catch(() => {});
      return;
    }

    // Help Command: !help
    if (lowerContent === '!help' || lowerContent === '.help') {
      const frontendUrl = (await getSetting('frontend_url', process.env.FRONTEND_URL || 'http://localhost:5173')).trim();
      const helpEmbed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle('📖 Minecraft Bridge Bot Commands & Menus')
        .setDescription('You can use the **Interactive Buttons** or text commands below:')
        .addFields(
          { name: '`!join` or `!ip`', value: 'View Minecraft server IP, Port & 1-Click direct connect link.' },
          { name: '`!panel` or `!menu`', value: 'Summons the **Interactive Button Panel** (Link IGN, Check Status, etc).' },
          { name: '`!link <IGN>`', value: 'Manually link your Discord account to a Minecraft IGN.' },
          { name: '`!status`', value: 'View live server status & online player count.' },
          { name: '`/command` *(Admin)*', value: 'Execute in-game Minecraft commands directly from Discord.' }
        );

      const components = createControlPanelComponents(frontendUrl);
      msg.reply({ embeds: [helpEmbed], components }).catch(() => {});
      return;
    }

    // In-Game Command from Discord (Admin Only)
    const linkedUser = await getUserByDiscordId(discordId);
    const ignDisplay = linkedUser?.minecraft_username || discordUsername;
    const isCommand = rawContent.startsWith('/');

    if (isCommand) {
      if (linkedUser && linkedUser.role === 'admin') {
        pendingGameMessages.push({
          source: 'Discord-Command',
          sender: ignDisplay,
          message: rawContent,
          isCommand: true,
        });

        addChatMessage({
          source: 'System',
          sender: `Discord [${discordUsername}]`,
          message: `⚡ Executing command: ${rawContent}`,
          discordUser: {
            id: discordId,
            username: discordUsername,
            avatar: msg.author.displayAvatarURL(),
          },
        });

        msg.reply(`⚡ **Command Forwarded to Game:** \`${rawContent}\``).catch(() => {});
        console.log(`[DISCORD CMD] @${discordUsername}: ${rawContent}`);
      } else {
        msg.reply('⛔ **Access Denied:** Only Discord accounts with **Administrator** role in `/office` are authorized to execute in-game slash commands.').catch(() => {});
      }
      return;
    }

    // Forward Normal Chat (Discord -> Minecraft Bedrock & Web)
    pendingGameMessages.push({
      source: 'Discord',
      sender: ignDisplay,
      message: rawContent,
    });

    addChatMessage({
      source: 'Discord',
      sender: ignDisplay,
      message: rawContent,
      discordUser: {
        id: discordId,
        username: discordUsername,
        avatar: msg.author.displayAvatarURL(),
      },
    });

    // Increment message stats
    incrementUserMessageCount({ discord_id: discordId });

    console.log(`[DISCORD CHAT] @${discordUsername} (${ignDisplay}): ${rawContent}`);
  });
  }

  try {
    if (!discordClient.isReady()) {
      await discordClient.login(botToken);
    }
  } catch (err: any) {
    console.error('❌ Failed to login Discord Bot Client:', err.message);
  }
}

// Sub-routers
app.route('/api/auth', authRouter);
app.route('/api/office', officeRouter);

// Leaderboard API Check
app.get('/api/leaderboard', async (c) => {
  try {
    const leaderboard = await getLeaderboard(20);
    return c.json({ leaderboard });
  } catch (err) {
    return c.json({ error: 'Failed to fetch leaderboard' }, 500);
  }
});

// System Status API Check
app.get('/api/status', async (c) => {
  const totalUsers = (await getAllUsers()).length;
  const inviteUrl = await getSetting('discord_invite_url', process.env.DISCORD_INVITE_URL || '');
  const serverName = await getSetting('server_name', 'Minecraft Bedrock Server');
  const serverIp = await getSetting('server_ip', process.env.SERVER_IP || '');
  const serverPort = await getSetting('server_port', process.env.SERVER_PORT || '19132');

  return c.json({
    service: 'Minecraft Bedrock <-> Discord 2-Way <-> Office Bridge',
    status: 'online',
    version: '2.10.0',
    serverName,
    serverIp,
    serverPort,
    discordInviteUrl: inviteUrl,
    database: isDbConnected ? 'PostgreSQL (Local)' : 'In-Memory Fallback',
    botOnline: isBotReady,
    activePlayerCount: activePlayers.size,
    registeredUsersCount: totalUsers,
  });
});

// 1-Click Minecraft Bedrock Web Launcher (/join & /connect)
app.get('/join', async (c) => {
  const serverName = await getSetting('server_name', 'Minecraft Bedrock Server');
  const serverIp = await getSetting('server_ip', process.env.SERVER_IP || '');
  const serverPort = await getSetting('server_port', process.env.SERVER_PORT || '19132');

  const connectUri = serverIp 
    ? `minecraft://?addExternalServer=${encodeURIComponent(serverName)}|${serverIp}:${serverPort}`
    : '/';

  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Launching ${serverName}...</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url=${connectUri}">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: radial-gradient(circle at top, #1e293b 0%, #0f172a 100%);
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      text-align: center;
    }
    .launcher-card {
      background: rgba(30, 41, 59, 0.85);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 24px;
      padding: 36px 28px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(34, 197, 94, 0.15);
    }
    .icon-badge {
      font-size: 3rem;
      margin-bottom: 12px;
      display: inline-block;
      animation: float 2s ease-in-out infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    h2 { font-size: 1.35rem; color: #4ade80; margin-bottom: 8px; font-weight: 800; }
    p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; margin-bottom: 20px; }
    .server-info-pill {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 10px 14px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.85rem;
    }
    .server-info-pill code { color: #4ade80; font-weight: 700; font-family: monospace; }
    .btn-launch {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px 20px;
      border-radius: 12px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: #ffffff;
      font-weight: 700;
      font-size: 1rem;
      text-decoration: none;
      box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
      transition: all 0.2s ease;
    }
    .btn-launch:hover {
      background: linear-gradient(135deg, #16a34a, #15803d);
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(34, 197, 94, 0.55);
    }
    .hint-text {
      margin-top: 18px;
      font-size: 0.75rem;
      color: #64748b;
    }
  </style>
  <script>
    setTimeout(function() {
      window.location.href = "${connectUri}";
    }, 100);
  </script>
</head>
<body>
  <div class="launcher-card">
    <div class="icon-badge">🎮</div>
    <h2>Launching Minecraft...</h2>
    <p>Opening Minecraft Bedrock Edition to connect directly to <strong>${serverName}</strong>.</p>
    
    <div class="server-info-pill">
      <span>Server Address</span>
      <code>${serverIp || 'Not Set'}:${serverPort}</code>
    </div>

    <a href="${connectUri}" class="btn-launch">▶️ Click Here If Not Opening</a>
    <div class="hint-text">Supported on Android, iOS, iPadOS, and Windows 10/11 Bedrock</div>
  </div>
</body>
</html>`);
});

app.get('/connect', (c) => c.redirect('/join'));

// ==========================================
// MINECRAFT BEDROCK GAME ENDPOINTS
// ==========================================

// Chat from Game -> Forward to Discord Webhook & Web History
app.post('/api/game/chat', bedrockAuthMiddleware, async (c) => {
  try {
    const { sender, message } = await c.req.json();
    if (!sender || !message) {
      return c.json({ error: 'Invalid payload: sender and message are required' }, 400);
    }

    // Lookup discord user from PostgreSQL by Minecraft IGN
    const linkedUser = await getUserByMinecraftUsername(sender);
    const isLinked = !!linkedUser;

    // Record in web chat history
    addChatMessage({
      source: 'Game',
      sender,
      message,
      discordUser: linkedUser ? {
        id: linkedUser.discord_id,
        username: linkedUser.discord_username,
        avatar: linkedUser.discord_avatar || undefined,
      } : null,
    });

    // Increment message stats for Minecraft player
    incrementUserMessageCount({ minecraft_username: sender });
    recordKnownPlayer(sender);

    // Forward to Discord Webhook
    const webhook = await getActiveWebhookClient();
    if (webhook) {
      const usernameDisplay = linkedUser 
        ? `${sender} (@${linkedUser.discord_username})` 
        : `${sender} [Unlinked]`;

      webhook.send({
        username: usernameDisplay,
        avatarURL: linkedUser?.discord_avatar || undefined,
        content: message,
      }).catch((err) => console.error('Failed to send to Discord Webhook:', err));
    }

    console.log(`[GAME CHAT] ${sender}${linkedUser ? ` (@${linkedUser.discord_username})` : ' [Unlinked]'}: ${message}`);
    return c.json({ 
      status: 'success', 
      isLinked,
      discordUser: linkedUser ? {
        username: linkedUser.discord_username,
        id: linkedUser.discord_id,
      } : null
    });
  } catch (err) {
    return c.json({ error: 'Failed to process game chat' }, 500);
  }
});

// Player Join Event
app.post('/api/game/join', bedrockAuthMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { username, kills = 0, deaths = 0, money = 0, coin = 0, playtime = 0 } = body;
    if (!username) return c.json({ error: 'Username required' }, 400);

    // Track in 14-day directory & upsert KiwEssentials stats
    recordKnownPlayer(username);
    upsertPlayerScores([{ username, kills, deaths, money, coin, playtime, online: true }]);

    // Check if player is on the banlist
    const banInfo = await isPlayerBanned(username);
    if (banInfo.isBanned) {
      pendingGameMessages.push({
        source: 'Moderation',
        sender: 'SecurityBot',
        message: `/kick "${username}" Banned: ${banInfo.reason || 'Banned by Administrator'}`,
        isCommand: true,
      });
      addChatMessage({
        source: 'System',
        sender: 'Security',
        message: `🚫 Banned player ${username} attempted to join and was kicked (${banInfo.reason || 'Banned'}).`,
      });
      return c.json({ 
        status: 'banned', isBanned: true, 
        reason: banInfo.reason || 'Banned by Administrator',
        activeCount: activePlayers.size
      }, 403);
    }

    activePlayers.add(username);
    const linkedUser = await getUserByMinecraftUsername(username);
    const isLinked = !!linkedUser;
    const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
    const playtimeHrs = (playtime / 3600).toFixed(1);

    addChatMessage({
      source: 'System',
      sender: 'Server',
      message: linkedUser 
        ? `🟢 ${username} (@${linkedUser.discord_username}) joined the game.`
        : `🟢 ${username} [Unlinked] joined the game.`,
    });

    const webhook = await getActiveWebhookClient();
    if (webhook) {
      const embed = new EmbedBuilder()
        .setColor(0x22c55e)
        .setAuthor({ 
          name: `${username} joined the server`,
          iconURL: `https://mc-heads.net/avatar/${encodeURIComponent(username)}/64`
        })
        .addFields(
          { name: '⚔️ Kills', value: `${kills}`, inline: true },
          { name: '💀 Deaths', value: `${deaths}`, inline: true },
          { name: '📊 K/D', value: kd, inline: true },
          { name: '💰 Money', value: `$${money.toLocaleString()}`, inline: true },
          { name: '🪙 Coin', value: `${coin.toLocaleString()}`, inline: true },
          { name: '⏱️ Playtime', value: `${playtimeHrs}h`, inline: true },
        )
        .setFooter({ text: isLinked ? `Linked: @${linkedUser!.discord_username}` : 'Account not linked to Discord' })
        .setTimestamp();
      webhook.send({ embeds: [embed] }).catch(() => {});
    }

    console.log(`[PLAYER JOIN] ${username} K:${kills} D:${deaths} $${money} (Linked: ${isLinked})`);
    return c.json({ 
      status: 'success', activeCount: activePlayers.size,
      isLinked,
      discordUser: linkedUser ? { username: linkedUser.discord_username, id: linkedUser.discord_id } : null,
    });
  } catch (err) {
    return c.json({ error: 'Failed to process join event' }, 500);
  }
});


// Player Leave Event
app.post('/api/game/leave', bedrockAuthMiddleware, async (c) => {
  try {
    const { username } = await c.req.json();
    if (!username) return c.json({ error: 'Username required' }, 400);

    activePlayers.delete(username);
    recordKnownPlayer(username);
    const linkedUser = await getUserByMinecraftUsername(username);

    addChatMessage({
      source: 'System',
      sender: 'Server',
      message: `🔴 ${username}${linkedUser ? ` (@${linkedUser.discord_username})` : ''} left the game.`,
    });

    const webhook = await getActiveWebhookClient();
    if (webhook) {
      webhook.send({ content: `🔴 **${username}** left the server.` }).catch(() => {});
    }

    console.log(`[PLAYER LEAVE] ${username}`);
    return c.json({ status: 'success', activeCount: activePlayers.size });
  } catch (err) {
    return c.json({ error: 'Failed to process leave event' }, 500);
  }
});

// Player Death Event (In-game Player Death Notification)
app.post('/api/game/death', bedrockAuthMiddleware, async (c) => {
  try {
    const { player, killer, cause } = await c.req.json();
    if (player) recordKnownPlayer(player);
    if (killer) recordKnownPlayer(killer);

    const deathDescription = killer 
      ? `☠️ ${player} was slain by ${killer} (${cause})` 
      : `💀 ${player} died (${cause})`;

    addChatMessage({
      source: 'Game',
      sender: 'DeathAlert',
      message: deathDescription,
    });

    const webhook = await getActiveWebhookClient();
    if (webhook) {
      webhook.send({
        username: 'Bedrock Death Alert',
        avatarURL: `https://mc-heads.net/avatar/${encodeURIComponent(player || 'Steve')}/64`,
        content: `💀 **${player}** ${killer ? `was slain by **${killer}**` : `died`} *(${cause})*`,
      }).catch(() => {});
    }

    return c.json({ status: 'success' });
  } catch (err) {
    return c.json({ error: 'Failed to process death event' }, 500);
  }
});

// Poll Pending Messages (Discord & Web) -> Pulled by Bedrock Script API
app.get('/api/game/pending', bedrockAuthMiddleware, (c) => {
  const messages = [...pendingGameMessages];
  pendingGameMessages.length = 0;
  return c.json(messages);
});

// KiwEssentials Scoreboard Sync (from Bedrock BP every 3 minutes)
app.post('/api/game/scoreboard', bedrockAuthMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const players: PlayerStatPayload[] = Array.isArray(body.players) ? body.players : [];
    if (players.length === 0) return c.json({ error: 'No players provided' }, 400);

    await upsertPlayerScores(players);
    console.log(`[SCOREBOARD] Synced stats for ${players.length} players`);
    return c.json({ status: 'ok', synced: players.length });
  } catch (err) {
    return c.json({ error: 'Failed to sync scoreboard' }, 500);
  }
});

// ==========================================
// FRONTEND WEBSITE DASHBOARD ENDPOINTS
// ==========================================

// Get Server Status & Active Players List
app.get('/api/web/players', (c) => {
  return c.json({
    count: activePlayers.size,
    players: Array.from(activePlayers),
  });
});

// KiwEssentials Scoreboard Leaderboard
// ?sort=kills|deaths|money|coin|playtime  (default: kills)
// ?limit=N (default: 100)
app.get('/api/web/scoreboard', async (c) => {
  try {
    const sortParam = (c.req.query('sort') || 'kills') as ScoreboardSortKey;
    const limitParam = Math.min(parseInt(c.req.query('limit') || '100', 10), 200);
    const validSorts: ScoreboardSortKey[] = ['kills', 'deaths', 'money', 'coin', 'playtime'];
    const sortBy = validSorts.includes(sortParam) ? sortParam : 'kills';

    const rows = await getPlayerScoreboard(sortBy, limitParam);
    return c.json({ scoreboard: rows, sortBy, total: rows.length });
  } catch (err) {
    return c.json({ error: 'Failed to get scoreboard' }, 500);
  }
});


// Get Live Chat Feed History (Persistent 50-Message Retention)
app.get('/api/web/messages', async (c) => {
  try {
    const logs = await getChatLogs(50);
    return c.json({
      messages: logs.length > 0 ? logs : chatHistory,
    });
  } catch {
    return c.json({
      messages: chatHistory,
    });
  }
});

// Send Chat from Web -> Queue to Game & Record History
app.post('/api/web/chat', async (c) => {
  try {
    const { sender, message, discordUser } = await c.req.json();
    if (!sender || !message) {
      return c.json({ error: 'Sender and message are required' }, 400);
    }

    const cleanSender = String(sender).trim().substring(0, 32);
    const cleanMessage = String(message).trim().substring(0, 250);
    const isSlashCommand = cleanMessage.startsWith('/');

    // Protection: Only users with admin role can execute slash commands
    if (isSlashCommand) {
      const user = discordUser ? await getUserByDiscordId(discordUser.id) : null;
      if (!user || user.role !== 'admin') {
        return c.json({ 
          error: '⛔ Access Denied: Only Administrators are allowed to execute Minecraft in-game slash commands.' 
        }, 403);
      }
    }

    // Append to pending game queue
    pendingGameMessages.push({
      source: isSlashCommand ? 'Command' : 'Web',
      sender: cleanSender,
      message: cleanMessage,
    });

    // Record in web chat history
    addChatMessage({
      source: (isSlashCommand ? 'System' : 'Web') as any,
      sender: cleanSender,
      message: isSlashCommand ? `⚡ Executing command: ${cleanMessage}` : cleanMessage,
      discordUser: discordUser || null,
    });

    if (discordUser?.id) {
      incrementUserMessageCount({ discord_id: discordUser.id });
    }

    // Forward to Discord Webhook
    const webhook = await getActiveWebhookClient();
    if (webhook) {
      if (isSlashCommand) {
        webhook.send({
          username: `[Command] ${cleanSender}`,
          avatarURL: discordUser?.avatar || undefined,
          content: `⚡ **Admin Command Executed:** \`${cleanMessage}\``,
        }).catch(() => {});
      } else {
        webhook.send({
          username: `[Web] ${cleanSender}`,
          avatarURL: discordUser?.avatar || undefined,
          content: cleanMessage,
        }).catch(() => {});
      }
    }

    console.log(`[${isSlashCommand ? 'CMD' : 'WEB CHAT'}] ${cleanSender}: ${cleanMessage}`);
    return c.json({ 
      status: 'queued', 
      isCommand: isSlashCommand,
      message: isSlashCommand ? 'Command dispatched to Minecraft server!' : 'Message forwarded to game' 
    });
  } catch (err) {
    return c.json({ error: 'Failed to send web chat' }, 500);
  }
});

// Serve Static Frontend Assets (Vite React Build)
app.use('/assets/*', serveStatic({ root: './client/dist' }));
app.use('/*', serveStatic({ root: './client/dist' }));
app.get('*', serveStatic({ path: './client/dist/index.html' }));

// Initialize Database, Discord Bot & Start Server
async function start() {
  await initDb();
  await initDiscordBot();

  // Restore persistent chat history from PostgreSQL
  try {
    const initialLogs = await getChatLogs(50);
    if (initialLogs && initialLogs.length > 0) {
      chatHistory.push(...initialLogs);
      console.log(`📦 Restored ${initialLogs.length} persistent chat logs from PostgreSQL.`);
    }
  } catch (e: any) {
    console.error('Failed to load initial chat history:', e.message);
  }

  serve({
    fetch: app.fetch,
    port: PORT,
  }, (info) => {
    console.log(`\n======================================================`);
    console.log(`🚀 Unified Full-Stack Server running at http://localhost:${info.port}`);
    console.log(`🌐 Web Dashboard & Office : http://localhost:${info.port}`);
    console.log(`🎮 Game Bedrock API       : http://localhost:${info.port}/api/game`);
    console.log(`🔐 Discord Auth API       : http://localhost:${info.port}/api/auth`);
    console.log(`======================================================\n`);
  });
}

start();
