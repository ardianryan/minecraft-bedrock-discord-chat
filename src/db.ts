import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { eq, sql, desc, asc, and, gt, count } from 'drizzle-orm';
import dotenv from 'dotenv';
import * as schema from './schema.js';
import { 
  users, 
  linkCodes, 
  systemSettings, 
  bannedPlayers, 
  chatLogs, 
  knownPlayers,
  playerScores,
  type User,
  type NewUser,
  type BannedPlayer,
  type ChatLog,
  type KnownPlayer,
  type PlayerScore
} from './schema.js';

dotenv.config();

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/discordmchat';

export const pool = new Pool({
  connectionString: DATABASE_URL,
});

export const db = drizzle(pool, { schema });
export let isDbConnected = false;

/**
 * Automatically create target database if it does not exist on the PostgreSQL server
 */
async function ensureDatabaseExists() {
  try {
    const parsed = new URL(DATABASE_URL);
    const targetDb = parsed.pathname.replace(/^\//, '') || 'discordmchat';
    if (targetDb === 'postgres') return;

    const adminUrl = new URL(DATABASE_URL);
    adminUrl.pathname = '/postgres';

    const adminPool = new Pool({ connectionString: adminUrl.toString(), connectionTimeoutMillis: 5000 });
    try {
      const client = await adminPool.connect();
      const checkRes = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDb]);
      if (checkRes.rowCount === 0) {
        console.log(`🔨 Database "${targetDb}" not found. Creating database automatically...`);
        await client.query(`CREATE DATABASE "${targetDb}"`);
        console.log(`✅ Database "${targetDb}" created successfully!`);
      }
      client.release();
    } catch (e: any) {
      console.log('ℹ️ Database pre-check:', e.message);
    } finally {
      await adminPool.end().catch(() => {});
    }
  } catch (err: any) {
    // Ignore URL parse errors
  }
}

/**
 * Initialize Database Tables, Automatic Drizzle Migrations & Connections
 */
export async function initDb() {
  try {
    await ensureDatabaseExists();
    const client = await pool.connect();
    console.log('🐘 Connected to PostgreSQL database with Drizzle ORM (discordmchat).');
    isDbConnected = true;

    // Automatic Drizzle Schema Migration
    try {
      await migrate(db, { migrationsFolder: './drizzle' });
      console.log('✅ Drizzle schema auto-migrations applied successfully.');
    } catch (migErr: any) {
      console.log('ℹ️ Running idempotent schema bootstrap:', migErr.message);
    }

    // Idempotent schema initialization
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        discord_id VARCHAR(64) UNIQUE NOT NULL,
        discord_username VARCHAR(128) NOT NULL,
        discord_avatar TEXT,
        minecraft_username VARCHAR(64),
        role VARCHAR(32) DEFAULT 'user' NOT NULL,
        message_count INT DEFAULT 0 NOT NULL,
        last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS message_count INT DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      CREATE INDEX IF NOT EXISTS idx_users_minecraft_username ON users(minecraft_username);
      CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);

      CREATE TABLE IF NOT EXISTS link_codes (
        code VARCHAR(16) PRIMARY KEY,
        discord_id VARCHAR(64) NOT NULL,
        discord_username VARCHAR(128) NOT NULL,
        discord_avatar TEXT,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(128) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS banned_players (
        id SERIAL PRIMARY KEY,
        username VARCHAR(64) UNIQUE NOT NULL,
        reason TEXT DEFAULT 'Banned by Administrator' NOT NULL,
        banned_by VARCHAR(128) DEFAULT 'Admin' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chat_logs (
        id VARCHAR(64) PRIMARY KEY,
        source VARCHAR(32) NOT NULL,
        sender VARCHAR(128) NOT NULL,
        message TEXT NOT NULL,
        discord_user JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON chat_logs(created_at DESC);

      CREATE TABLE IF NOT EXISTS known_players (
        username VARCHAR(64) PRIMARY KEY,
        first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_known_players_last_seen ON known_players(last_seen DESC);

      -- KiwEssentials Scoreboard columns on users
      ALTER TABLE users ADD COLUMN IF NOT EXISTS kw_kills    INT DEFAULT 0 NOT NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS kw_deaths   INT DEFAULT 0 NOT NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS kw_money    BIGINT DEFAULT 0 NOT NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS kw_coin     INT DEFAULT 0 NOT NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS kw_playtime INT DEFAULT 0 NOT NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS kw_last_synced TIMESTAMP WITH TIME ZONE;

      -- KiwEssentials Scoreboard for all players (incl. unlinked)
      CREATE TABLE IF NOT EXISTS player_scores (
        username    VARCHAR(64) PRIMARY KEY,
        kills       INT DEFAULT 0 NOT NULL,
        deaths      INT DEFAULT 0 NOT NULL,
        money       BIGINT DEFAULT 0 NOT NULL,
        coin        INT DEFAULT 0 NOT NULL,
        playtime    INT DEFAULT 0 NOT NULL,
        online      INT DEFAULT 0 NOT NULL,
        last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_player_scores_kills ON player_scores(kills DESC);
      CREATE INDEX IF NOT EXISTS idx_player_scores_money ON player_scores(money DESC);
    `);

    // Initialize default Webhook if present in env
    const defaultWebhook = process.env.DISCORD_WEBHOOK_URL || '';
    if (defaultWebhook) {
      await client.query(`
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ('discord_webhook_url', $1, NOW())
        ON CONFLICT (key) DO NOTHING;
      `, [defaultWebhook]);
    }

    client.release();
    console.log('✅ Drizzle ORM tables ready & synchronized.');
  } catch (err: any) {
    console.error('❌ Failed to initialize PostgreSQL tables:', err.message);
    isDbConnected = false;
    throw err;
  }
}

// ========================================================
// USER QUERIES (Type-Safe with Drizzle ORM)
// ========================================================

export async function getUserByDiscordId(discordId: string): Promise<User | null> {
  const res = await db
    .select()
    .from(users)
    .where(eq(users.discord_id, discordId))
    .limit(1);
  return res[0] || null;
}

export async function getUserByMinecraftUsername(ign: string): Promise<User | null> {
  if (!ign) return null;
  const res = await db
    .select()
    .from(users)
    .where(sql`LOWER(${users.minecraft_username}) = LOWER(${ign})`)
    .limit(1);
  return res[0] || null;
}

export async function getAllUsers(): Promise<User[]> {
  return await db
    .select()
    .from(users)
    .orderBy(desc(users.created_at));
}

export async function getLeaderboard(limit = 20): Promise<User[]> {
  return await db
    .select()
    .from(users)
    .orderBy(desc(users.message_count), asc(users.created_at))
    .limit(limit);
}

export async function incrementUserMessageCount(identifier: { discord_id?: string; minecraft_username?: string }) {
  try {
    if (identifier.discord_id) {
      await db
        .update(users)
        .set({
          message_count: sql`COALESCE(${users.message_count}, 0) + 1`,
          last_active: sql`NOW()`,
          updated_at: sql`NOW()`,
        })
        .where(eq(users.discord_id, identifier.discord_id));
    } else if (identifier.minecraft_username) {
      await db
        .update(users)
        .set({
          message_count: sql`COALESCE(${users.message_count}, 0) + 1`,
          last_active: sql`NOW()`,
          updated_at: sql`NOW()`,
        })
        .where(sql`LOWER(${users.minecraft_username}) = LOWER(${identifier.minecraft_username})`);
    }
  } catch (e: any) {
    console.error('Error incrementing message count:', e.message);
  }
}

// Generate OTP Link Code 6-digit untuk pemain di Minecraft
export async function generateLinkCode(minecraft_username: string): Promise<string> {
  await db
    .delete(linkCodes)
    .where(sql`LOWER(${linkCodes.discord_username}) = LOWER(${minecraft_username}) OR ${linkCodes.expires_at} < NOW()`);

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db
    .insert(linkCodes)
    .values({
      code,
      discord_id: '',
      discord_username: minecraft_username,
      expires_at: expiresAt,
      created_at: sql`NOW()`,
    })
    .onConflictDoUpdate({
      target: linkCodes.code,
      set: {
        discord_username: minecraft_username,
        expires_at: expiresAt,
      },
    });

  return code;
}

// Verifikasi dan konsumsi OTP Link Code dari Web
export async function consumeLinkCode(code: string, discord_id: string, discord_username: string) {
  const resCode = await db
    .select()
    .from(linkCodes)
    .where(and(eq(linkCodes.code, code.trim()), gt(linkCodes.expires_at, sql`NOW()`)))
    .limit(1);

  if (resCode.length === 0) {
    return { error: 'Kode verifikasi tidak valid atau telah kedaluwarsa (15 menit).' };
  }

  const { discord_username: minecraft_username } = resCode[0];

  const existingWithIgn = await getUserByMinecraftUsername(minecraft_username);
  if (existingWithIgn && existingWithIgn.discord_id !== discord_id) {
    return { error: `Minecraft IGN ${minecraft_username} sudah ditautkan ke akun Discord lain (@${existingWithIgn.discord_username}).` };
  }

  const updatedUser = await upsertUser({
    discord_id,
    discord_username,
    minecraft_username,
  });

  await db.delete(linkCodes).where(eq(linkCodes.code, code.trim()));

  return { user: updatedUser, minecraft_username };
}

export async function upsertUser(userData: {
  discord_id: string;
  discord_username: string;
  discord_avatar?: string;
  minecraft_username?: string;
  role?: string;
}) {
  const initialAdmin = (process.env.INITIAL_ADMIN_DISCORD_ID || '').trim().toLowerCase();
  const isInitialAdmin = initialAdmin && (
    userData.discord_id.toLowerCase() === initialAdmin || 
    userData.discord_username.toLowerCase() === initialAdmin
  );

  const existing = await getUserByDiscordId(userData.discord_id);
  
  if (userData.minecraft_username) {
    const existingWithIgn = await getUserByMinecraftUsername(userData.minecraft_username);
    if (existingWithIgn && existingWithIgn.discord_id !== userData.discord_id) {
      throw new Error(`Minecraft IGN "${userData.minecraft_username}" sudah ditautkan ke akun Discord @${existingWithIgn.discord_username}.`);
    }
  }

  let role = existing?.role || userData.role || 'user';
  if (isInitialAdmin) {
    role = 'admin';
  } else if (!existing) {
    const totalUsers = await db.select({ count: count() }).from(users);
    if (Number(totalUsers[0]?.count || 0) === 0) {
      role = 'admin';
    }
  }

  const ign = userData.minecraft_username !== undefined 
    ? (userData.minecraft_username ? userData.minecraft_username.trim() : null)
    : (existing?.minecraft_username || null);

  const res = await db
    .insert(users)
    .values({
      discord_id: userData.discord_id,
      discord_username: userData.discord_username,
      discord_avatar: userData.discord_avatar || null,
      minecraft_username: ign,
      role,
      updated_at: sql`NOW()`,
      created_at: sql`NOW()`,
    })
    .onConflictDoUpdate({
      target: users.discord_id,
      set: {
        discord_username: userData.discord_username,
        discord_avatar: userData.discord_avatar || sql`${users.discord_avatar}`,
        minecraft_username: ign ?? sql`${users.minecraft_username}`,
        role: existing ? sql`${users.role}` : role,
        updated_at: sql`NOW()`,
      },
    })
    .returning();
  
  return res[0];
}

export async function updateUserByAdmin(id: number, data: { minecraft_username?: string | null; role?: string }) {
  if (data.minecraft_username) {
    const existingWithIgn = await getUserByMinecraftUsername(data.minecraft_username);
    if (existingWithIgn && existingWithIgn.id !== id) {
      throw new Error(`Minecraft IGN "${data.minecraft_username}" sudah dipakai oleh user lain.`);
    }
  }

  const updatePayload: Record<string, any> = {
    updated_at: sql`NOW()`,
  };

  if (data.minecraft_username !== undefined) {
    updatePayload.minecraft_username = data.minecraft_username ? data.minecraft_username.trim() : null;
  }
  if (data.role !== undefined) {
    updatePayload.role = data.role;
  }

  const res = await db
    .update(users)
    .set(updatePayload)
    .where(eq(users.id, id))
    .returning();

  return res[0] || null;
}

export async function deleteUserById(id: number) {
  await db.delete(users).where(eq(users.id, id));
  return true;
}

// ========================================================
// SYSTEM SETTINGS QUERIES
// ========================================================

export async function getSetting(key: string, defaultValue = ''): Promise<string> {
  try {
    const res = await db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    if (res.length > 0 && res[0].value !== null) {
      return res[0].value;
    }
  } catch (e: any) {
    console.error('Error getSetting PostgreSQL:', e.message);
  }
  return defaultValue;
}

export async function setSetting(key: string, value: string): Promise<boolean> {
  await db
    .insert(systemSettings)
    .values({
      key,
      value,
      updated_at: sql`NOW()`,
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        value,
        updated_at: sql`NOW()`,
      },
    });
  return true;
}

// ========================================================
// BANNED PLAYERS MODERATION QUERIES
// ========================================================

export async function getBannedPlayers(): Promise<BannedPlayer[]> {
  return await db
    .select()
    .from(bannedPlayers)
    .orderBy(desc(bannedPlayers.created_at));
}

export async function isPlayerBanned(username: string): Promise<{ isBanned: boolean; reason?: string; banned_by?: string }> {
  if (!username) return { isBanned: false };
  const res = await db
    .select()
    .from(bannedPlayers)
    .where(sql`LOWER(${bannedPlayers.username}) = LOWER(${username.trim()})`)
    .limit(1);

  if (res.length > 0) {
    return { isBanned: true, reason: res[0].reason, banned_by: res[0].banned_by };
  }
  return { isBanned: false };
}

export async function banPlayer(username: string, reason = 'Banned by Administrator', bannedBy = 'Admin') {
  const cleanUsername = username.trim();
  const res = await db
    .insert(bannedPlayers)
    .values({
      username: cleanUsername,
      reason,
      banned_by: bannedBy,
      created_at: sql`NOW()`,
    })
    .onConflictDoUpdate({
      target: bannedPlayers.username,
      set: {
        reason,
        banned_by: bannedBy,
        created_at: sql`NOW()`,
      },
    })
    .returning();

  return res[0];
}

export async function unbanPlayer(username: string) {
  const cleanUsername = username.trim();
  await db
    .delete(bannedPlayers)
    .where(sql`LOWER(${bannedPlayers.username}) = LOWER(${cleanUsername})`);
  return true;
}

// ========================================================
// PERSISTENT CHAT HISTORY (50-Message Retention)
// ========================================================

export async function saveChatMessage(msg: {
  source: string;
  sender: string;
  message: string;
  discord_user?: any;
}) {
  try {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const res = await db
      .insert(chatLogs)
      .values({
        id,
        source: msg.source,
        sender: msg.sender,
        message: msg.message,
        discord_user: msg.discord_user || null,
        created_at: sql`NOW()`,
      })
      .returning();

    // Retain only latest 50 messages in database
    await pool.query(`
      DELETE FROM chat_logs
      WHERE id NOT IN (
        SELECT id FROM chat_logs
        ORDER BY created_at DESC
        LIMIT 50
      );
    `);

    return res[0];
  } catch (err: any) {
    console.error('Failed to persist chat message:', err.message);
    return null;
  }
}

export async function getChatLogs(limit = 50) {
  try {
    const logs = await db
      .select()
      .from(chatLogs)
      .orderBy(desc(chatLogs.created_at))
      .limit(limit);

    // Return in ascending chronological order for the timeline
    return logs.reverse().map((row) => ({
      id: row.id,
      source: row.source as 'Game' | 'Web' | 'Discord' | 'System',
      sender: row.sender,
      message: row.message,
      timestamp: new Date(row.created_at).toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        timeZone: 'Asia/Jakarta',
        hour12: false
      }),
      discordUser: typeof row.discord_user === 'string' ? JSON.parse(row.discord_user) : (row.discord_user || null),
    }));
  } catch (err: any) {
    console.error('Failed to get chat logs from DB:', err.message);
    return [];
  }
}

// ========================================================
// KNOWN SERVER PLAYERS TRACKING (14-Day Retention Policy)
// ========================================================

export async function recordKnownPlayer(username: string) {
  if (!username || typeof username !== 'string') return;
  const cleanUsername = username.trim();
  if (!cleanUsername) return;

  try {
    await db
      .insert(knownPlayers)
      .values({
        username: cleanUsername,
        first_seen: sql`NOW()`,
        last_seen: sql`NOW()`,
      })
      .onConflictDoUpdate({
        target: knownPlayers.username,
        set: {
          last_seen: sql`NOW()`,
        },
      });
  } catch (err: any) {
    console.error('Failed to record known player:', err.message);
  }
}

export async function getKnownPlayers(retentionDays = 14): Promise<KnownPlayer[]> {
  try {
    await pool.query(`
      DELETE FROM known_players
      WHERE last_seen < NOW() - ($1 || ' days')::INTERVAL;
    `, [retentionDays]);
    return await db
      .select()
      .from(knownPlayers)
      .orderBy(desc(knownPlayers.last_seen));
  } catch (err: any) {
    console.error('Failed to fetch known players:', err.message);
    return [];
  }
}

// ========================================================
// KIWESSENTIALS SCOREBOARD FUNCTIONS
// ========================================================

export interface PlayerStatPayload {
  username: string;
  kills:    number;
  deaths:   number;
  money:    number;
  coin:     number;
  playtime: number;
  online?:  boolean;
}

/**
 * Upsert KiwEssentials stats for a batch of players.
 * Updates player_scores for all players, and kw_* on users if linked.
 */
export async function upsertPlayerScores(players: PlayerStatPayload[]): Promise<void> {
  if (!players || players.length === 0) return;
  try {
    for (const p of players) {
      // 1. Upsert into player_scores (works for ALL players)
      await db
        .insert(playerScores)
        .values({
          username:    p.username,
          kills:       p.kills,
          deaths:      p.deaths,
          money:       p.money,
          coin:        p.coin,
          playtime:    p.playtime,
          online:      p.online ? 1 : 0,
          last_synced: new Date(),
        })
        .onConflictDoUpdate({
          target: playerScores.username,
          set: {
            kills:       p.kills,
            deaths:      p.deaths,
            money:       p.money,
            coin:        p.coin,
            playtime:    p.playtime,
            online:      p.online ? 1 : 0,
            last_synced: new Date(),
          },
        });

      // 2. Update kw_* on linked user (if minecraft_username matches)
      await db
        .update(users)
        .set({
          kw_kills:       p.kills,
          kw_deaths:      p.deaths,
          kw_money:       p.money,
          kw_coin:        p.coin,
          kw_playtime:    p.playtime,
          kw_last_synced: new Date(),
        })
        .where(sql`LOWER(${users.minecraft_username}) = LOWER(${p.username})`);
    }
  } catch (err: any) {
    console.error('Failed to upsert player scores:', err.message);
  }
}

/** Sort options for the scoreboard leaderboard */
export type ScoreboardSortKey = 'kills' | 'deaths' | 'money' | 'coin' | 'playtime';

/**
 * Get sorted leaderboard from player_scores joined with users.
 * Returns enriched entries with Discord info for linked players.
 */
export async function getPlayerScoreboard(
  sortBy: ScoreboardSortKey = 'kills',
  limit = 100
): Promise<Array<PlayerScore & { discord_username?: string; discord_avatar?: string; discord_id?: string }>> {
  try {
    const validCols: Record<ScoreboardSortKey, any> = {
      kills:    playerScores.kills,
      deaths:   playerScores.deaths,
      money:    playerScores.money,
      coin:     playerScores.coin,
      playtime: playerScores.playtime,
    };
    const orderCol = validCols[sortBy] ?? playerScores.kills;

    const rows = await db
      .select({
        username:         playerScores.username,
        kills:            playerScores.kills,
        deaths:           playerScores.deaths,
        money:            playerScores.money,
        coin:             playerScores.coin,
        playtime:         playerScores.playtime,
        online:           playerScores.online,
        last_synced:      playerScores.last_synced,
        discord_username: users.discord_username,
        discord_avatar:   users.discord_avatar,
        discord_id:       users.discord_id,
      })
      .from(playerScores)
      .leftJoin(users, sql`LOWER(${users.minecraft_username}) = LOWER(${playerScores.username})`)
      .orderBy(desc(orderCol))
      .limit(limit);

    return rows as any;
  } catch (err: any) {
    console.error('Failed to get player scoreboard:', err.message);
    return [];
  }
}

/**
 * Get KiwEssentials stats for a single player by IGN
 */
export async function getSinglePlayerScore(username: string): Promise<PlayerScore | null> {
  try {
    const [row] = await db
      .select()
      .from(playerScores)
      .where(sql`LOWER(${playerScores.username}) = LOWER(${username})`);
    return row ?? null;
  } catch {
    return null;
  }
}
