import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/discordmchat';

export const pool = new Pool({
  connectionString: DATABASE_URL,
});

export let isDbConnected = false;

export async function initDb() {
  try {
    const client = await pool.connect();
    console.log('🐘 Berhasil terhubung ke database PostgreSQL (discordmchat).');
    isDbConnected = true;

    // Inisialisasi tabel users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        discord_id VARCHAR(64) UNIQUE NOT NULL,
        discord_username VARCHAR(100) NOT NULL,
        discord_avatar TEXT,
        minecraft_username VARCHAR(64),
        role VARCHAR(20) DEFAULT 'user',
        message_count INT DEFAULT 0,
        last_active TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS message_count INT DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT NOW();
    `);

    // Inisialisasi tabel temporary link_codes (OTP 6-Digit)
    await client.query(`
      CREATE TABLE IF NOT EXISTS link_codes (
        code VARCHAR(6) PRIMARY KEY,
        minecraft_username VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '15 minutes')
      );
    `);

    // Inisialisasi tabel system_settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT
      );
    `);

    // Inisialisasi tabel banned_players
    await client.query(`
      CREATE TABLE IF NOT EXISTS banned_players (
        id SERIAL PRIMARY KEY,
        username VARCHAR(64) UNIQUE NOT NULL,
        reason TEXT,
        banned_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Inisialisasi tabel chat_logs untuk retensi 50 pesan persisten
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_logs (
        id SERIAL PRIMARY KEY,
        source VARCHAR(32) NOT NULL,
        sender VARCHAR(64) NOT NULL,
        message TEXT NOT NULL,
        discord_user JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON chat_logs(created_at DESC);
    `);

    // Inisialisasi tabel known_players (riwayat player dengan retensi 14 hari)
    await client.query(`
      CREATE TABLE IF NOT EXISTS known_players (
        username VARCHAR(64) PRIMARY KEY,
        first_seen TIMESTAMP DEFAULT NOW(),
        last_seen TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_known_players_last_seen ON known_players(last_seen DESC);
    `);

    // Inisialisasi default settings jika ada di .env
    const defaultWebhook = process.env.DISCORD_WEBHOOK_URL || '';
    if (defaultWebhook) {
      await client.query(`
        INSERT INTO system_settings (key, value)
        VALUES ('discord_webhook_url', $1)
        ON CONFLICT (key) DO NOTHING;
      `, [defaultWebhook]);
    }

    client.release();
    console.log('✅ Skema tabel PostgreSQL (users, link_codes, system_settings) siap digunakan.');
  } catch (err: any) {
    console.error('❌ Gagal inisialisasi tabel PostgreSQL:', err.message);
    isDbConnected = false;
    throw err;
  }
}

// User Queries
export async function getUserByDiscordId(discordId: string) {
  const res = await pool.query('SELECT * FROM users WHERE discord_id = $1 LIMIT 1', [discordId]);
  return res.rows[0] || null;
}

export async function getUserByMinecraftUsername(ign: string) {
  if (!ign) return null;
  const res = await pool.query('SELECT * FROM users WHERE LOWER(minecraft_username) = LOWER($1) LIMIT 1', [ign]);
  return res.rows[0] || null;
}

export async function getAllUsers() {
  const res = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
  return res.rows;
}

export async function getLeaderboard(limit = 20) {
  const res = await pool.query(`
    SELECT id, discord_id, discord_username, discord_avatar, minecraft_username, role, message_count, last_active, created_at
    FROM users
    ORDER BY message_count DESC, created_at ASC
    LIMIT $1
  `, [limit]);
  return res.rows;
}

export async function incrementUserMessageCount(identifier: { discord_id?: string; minecraft_username?: string }) {
  try {
    if (identifier.discord_id) {
      await pool.query(`
        UPDATE users 
        SET message_count = COALESCE(message_count, 0) + 1, last_active = NOW(), updated_at = NOW()
        WHERE discord_id = $1
      `, [identifier.discord_id]);
    } else if (identifier.minecraft_username) {
      await pool.query(`
        UPDATE users 
        SET message_count = COALESCE(message_count, 0) + 1, last_active = NOW(), updated_at = NOW()
        WHERE LOWER(minecraft_username) = LOWER($1)
      `, [identifier.minecraft_username]);
    }
  } catch (e: any) {
    console.error('Error incrementing message count:', e.message);
  }
}

// Generate OTP Link Code 6-digit untuk pemain di Minecraft
export async function generateLinkCode(minecraft_username: string): Promise<string> {
  // Hapus kode lama untuk username ini
  await pool.query('DELETE FROM link_codes WHERE LOWER(minecraft_username) = LOWER($1) OR expires_at < NOW()', [minecraft_username]);

  // Generate 6 digit code acak
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await pool.query(`
    INSERT INTO link_codes (code, minecraft_username, expires_at)
    VALUES ($1, $2, NOW() + INTERVAL '15 minutes')
    ON CONFLICT (code) DO UPDATE SET minecraft_username = $2, expires_at = NOW() + INTERVAL '15 minutes';
  `, [code, minecraft_username]);

  return code;
}

// Verifikasi dan konsumsi OTP Link Code dari Web
export async function consumeLinkCode(code: string, discord_id: string, discord_username: string) {
  const resCode = await pool.query(`
    SELECT * FROM link_codes WHERE code = $1 AND expires_at > NOW() LIMIT 1
  `, [code.trim()]);

  if (resCode.rows.length === 0) {
    return { error: 'Kode verifikasi tidak valid atau telah kedaluwarsa (15 menit).' };
  }

  const { minecraft_username } = resCode.rows[0];

  // Periksa apakah IGN sudah dipakai akun Discord lain
  const existingWithIgn = await getUserByMinecraftUsername(minecraft_username);
  if (existingWithIgn && existingWithIgn.discord_id !== discord_id) {
    return { error: `Minecraft IGN ${minecraft_username} sudah ditautkan ke akun Discord lain (@${existingWithIgn.discord_username}).` };
  }

  // Tautkan user
  const updatedUser = await upsertUser({
    discord_id,
    discord_username,
    minecraft_username,
  });

  // Hapus kode yang sudah dipakai
  await pool.query('DELETE FROM link_codes WHERE code = $1', [code.trim()]);

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

  // Cek apakah user sudah ada
  const existing = await getUserByDiscordId(userData.discord_id);
  
  // Cek duplikasi Minecraft IGN jika ada input baru
  if (userData.minecraft_username) {
    const existingWithIgn = await getUserByMinecraftUsername(userData.minecraft_username);
    if (existingWithIgn && existingWithIgn.discord_id !== userData.discord_id) {
      throw new Error(`Minecraft IGN "${userData.minecraft_username}" sudah ditautkan ke akun Discord @${existingWithIgn.discord_username}.`);
    }
  }

  // Jika user pertama di database atau cocok dengan initial admin, jadikan admin
  let role = existing?.role || userData.role || 'user';
  if (isInitialAdmin) {
    role = 'admin';
  } else if (!existing) {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(totalUsers.rows[0].count, 10) === 0) {
      role = 'admin'; // User pertama otomatis admin
    }
  }

  const ign = userData.minecraft_username !== undefined 
    ? (userData.minecraft_username ? userData.minecraft_username.trim() : null)
    : (existing?.minecraft_username || null);

  const res = await pool.query(`
    INSERT INTO users (discord_id, discord_username, discord_avatar, minecraft_username, role, updated_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT (discord_id) DO UPDATE SET
      discord_username = EXCLUDED.discord_username,
      discord_avatar = COALESCE(EXCLUDED.discord_avatar, users.discord_avatar),
      minecraft_username = COALESCE($4, users.minecraft_username),
      updated_at = NOW()
    RETURNING *;
  `, [userData.discord_id, userData.discord_username, userData.discord_avatar || null, ign, role]);
  
  return res.rows[0];
}

export async function updateUserByAdmin(id: number, data: { minecraft_username?: string | null; role?: string }) {
  // Cek duplikasi IGN jika diubah
  if (data.minecraft_username) {
    const existingWithIgn = await getUserByMinecraftUsername(data.minecraft_username);
    if (existingWithIgn && existingWithIgn.id !== id) {
      throw new Error(`Minecraft IGN "${data.minecraft_username}" sudah dipakai oleh user lain.`);
    }
  }

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.minecraft_username !== undefined) {
    fields.push(`minecraft_username = $${idx++}`);
    values.push(data.minecraft_username ? data.minecraft_username.trim() : null);
  }
  if (data.role !== undefined) {
    fields.push(`role = $${idx++}`);
    values.push(data.role);
  }
  fields.push(`updated_at = NOW()`);
  values.push(id);

  const res = await pool.query(`
    UPDATE users SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING *;
  `, values);
  return res.rows[0] || null;
}

export async function deleteUserById(id: number) {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return true;
}

// System Settings Queries
export async function getSetting(key: string, defaultValue = ''): Promise<string> {
  try {
    const res = await pool.query('SELECT value FROM system_settings WHERE key = $1 LIMIT 1', [key]);
    if (res.rows.length > 0 && res.rows[0].value !== null) {
      return res.rows[0].value;
    }
  } catch (e: any) {
    console.error('Error getSetting PostgreSQL:', e.message);
  }
  return defaultValue;
}

export async function setSetting(key: string, value: string): Promise<boolean> {
  await pool.query(`
    INSERT INTO system_settings (key, value)
    VALUES ($1, $2)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
  `, [key, value]);
  return true;
}

// Banned Players Moderation Queries
export async function getBannedPlayers() {
  const res = await pool.query('SELECT * FROM banned_players ORDER BY created_at DESC');
  return res.rows;
}

export async function isPlayerBanned(username: string): Promise<{ isBanned: boolean; reason?: string; banned_by?: string }> {
  if (!username) return { isBanned: false };
  const res = await pool.query('SELECT * FROM banned_players WHERE LOWER(username) = LOWER($1) LIMIT 1', [username.trim()]);
  if (res.rows.length > 0) {
    return { isBanned: true, reason: res.rows[0].reason, banned_by: res.rows[0].banned_by };
  }
  return { isBanned: false };
}

export async function banPlayer(username: string, reason = 'Banned by Administrator', bannedBy = 'Admin') {
  const cleanUsername = username.trim();
  const res = await pool.query(`
    INSERT INTO banned_players (username, reason, banned_by, created_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (username) DO UPDATE SET reason = $2, banned_by = $3, created_at = NOW()
    RETURNING *;
  `, [cleanUsername, reason, bannedBy]);
  return res.rows[0];
}

export async function unbanPlayer(username: string) {
  const cleanUsername = username.trim();
  await pool.query('DELETE FROM banned_players WHERE LOWER(username) = LOWER($1)', [cleanUsername]);
  return true;
}

// Persistent Chat History Queries (50-Message Retention)
export async function saveChatMessage(msg: {
  source: string;
  sender: string;
  message: string;
  discord_user?: any;
}) {
  try {
    const res = await pool.query(`
      INSERT INTO chat_logs (source, sender, message, discord_user, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *;
    `, [msg.source, msg.sender, msg.message, msg.discord_user ? JSON.stringify(msg.discord_user) : null]);

    // Retain only latest 50 messages in database
    await pool.query(`
      DELETE FROM chat_logs
      WHERE id NOT IN (
        SELECT id FROM chat_logs
        ORDER BY created_at DESC, id DESC
        LIMIT 50
      );
    `);

    return res.rows[0];
  } catch (err: any) {
    console.error('Failed to persist chat message:', err.message);
    return null;
  }
}

export async function getChatLogs(limit = 50) {
  try {
    const res = await pool.query(`
      SELECT * FROM (
        SELECT id, source, sender, message, discord_user, created_at
        FROM chat_logs
        ORDER BY created_at DESC, id DESC
        LIMIT $1
      ) AS recent_logs
      ORDER BY created_at ASC, id ASC;
    `, [limit]);

    return res.rows.map((row: any) => ({
      id: String(row.id),
      source: row.source,
      sender: row.sender,
      message: row.message,
      timestamp: new Date(row.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      discordUser: typeof row.discord_user === 'string' ? JSON.parse(row.discord_user) : (row.discord_user || null),
    }));
  } catch (err: any) {
    console.error('Failed to get chat logs from DB:', err.message);
    return [];
  }
}

// Known Server Players Tracking (14-Day Retention Policy)
export async function recordKnownPlayer(username: string) {
  if (!username || typeof username !== 'string') return;
  const cleanUsername = username.trim();
  if (!cleanUsername) return;

  try {
    await pool.query(`
      INSERT INTO known_players (username, first_seen, last_seen)
      VALUES ($1, NOW(), NOW())
      ON CONFLICT (username) DO UPDATE SET last_seen = NOW();
    `, [cleanUsername]);
  } catch (err: any) {
    console.error('Failed to record known player:', err.message);
  }
}

export async function getKnownPlayers(retentionDays = 14) {
  try {
    // 1. Purge records older than retentionDays (14 days)
    await pool.query(`
      DELETE FROM known_players
      WHERE last_seen < NOW() - ($1 || ' days')::INTERVAL;
    `, [retentionDays]);

    // 2. Fetch active directory
    const res = await pool.query(`
      SELECT username, first_seen, last_seen
      FROM known_players
      ORDER BY last_seen DESC;
    `);

    return res.rows;
  } catch (err: any) {
    console.error('Failed to fetch known players:', err.message);
    return [];
  }
}



