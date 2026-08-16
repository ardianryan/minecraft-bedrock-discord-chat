import { pgTable, serial, varchar, text, integer, bigint, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

/**
 * 1. Users Table (Discord & Minecraft Accounts)
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  discord_id: varchar('discord_id', { length: 64 }).unique().notNull(),
  discord_username: varchar('discord_username', { length: 128 }).notNull(),
  discord_avatar: text('discord_avatar'),
  minecraft_username: varchar('minecraft_username', { length: 64 }),
  role: varchar('role', { length: 32 }).default('user').notNull(),
  message_count: integer('message_count').default(0).notNull(),
  last_active: timestamp('last_active', { withTimezone: true }).defaultNow().notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  // KiwEssentials Scoreboard Stats (synced every 3 min from Bedrock BP)
  kw_kills:       integer('kw_kills').default(0).notNull(),
  kw_deaths:      integer('kw_deaths').default(0).notNull(),
  kw_money:       bigint('kw_money', { mode: 'number' }).default(0).notNull(),
  kw_coin:        integer('kw_coin').default(0).notNull(),
  kw_playtime:    integer('kw_playtime').default(0).notNull(),
  kw_last_synced: timestamp('kw_last_synced', { withTimezone: true }),
}, (table) => [
  index('idx_users_minecraft_username').on(table.minecraft_username),
  index('idx_users_discord_id').on(table.discord_id),
]);

/**
 * 2. Link Codes Table (Temporary in-game verification codes)
 */
export const linkCodes = pgTable('link_codes', {
  code: varchar('code', { length: 16 }).primaryKey(),
  discord_id: varchar('discord_id', { length: 64 }).notNull(),
  discord_username: varchar('discord_username', { length: 128 }).notNull(),
  discord_avatar: text('discord_avatar'),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 3. System Settings Table (Dynamic Webhook, Bot Token, API Key)
 */
export const systemSettings = pgTable('system_settings', {
  key: varchar('key', { length: 128 }).primaryKey(),
  value: text('value').notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 4. Banned Players Table (Blacklist / Server Moderation)
 */
export const bannedPlayers = pgTable('banned_players', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 64 }).unique().notNull(),
  reason: text('reason').default('Banned by Administrator').notNull(),
  banned_by: varchar('banned_by', { length: 128 }).default('Admin').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 5. Chat Logs Table (Persistent 50-message rolling history)
 */
export const chatLogs = pgTable('chat_logs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  source: varchar('source', { length: 32 }).notNull(),
  sender: varchar('sender', { length: 128 }).notNull(),
  message: text('message').notNull(),
  discord_user: jsonb('discord_user').$type<{ id: string; username: string; avatar?: string } | null>(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 6. Known Server Players Table (14-Day rolling activity directory)
 */
export const knownPlayers = pgTable('known_players', {
  username: varchar('username', { length: 64 }).primaryKey(),
  first_seen: timestamp('first_seen', { withTimezone: true }).defaultNow().notNull(),
  last_seen: timestamp('last_seen', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 7. Player Scores Table (KiwEssentials stats for ALL players incl. unlinked)
 *    Synced from Bedrock Behavior Pack every 3 minutes
 */
export const playerScores = pgTable('player_scores', {
  username:    varchar('username', { length: 64 }).primaryKey(),
  kills:       integer('kills').default(0).notNull(),
  deaths:      integer('deaths').default(0).notNull(),
  money:       bigint('money', { mode: 'number' }).default(0).notNull(),
  coin:        integer('coin').default(0).notNull(),
  playtime:    integer('playtime').default(0).notNull(),
  online:      integer('online').default(0).notNull(),   // 1 = currently online
  last_synced: timestamp('last_synced', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_player_scores_kills').on(table.kills),
  index('idx_player_scores_money').on(table.money),
]);

// Infer TypeScript Models
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type LinkCode = InferSelectModel<typeof linkCodes>;
export type NewLinkCode = InferInsertModel<typeof linkCodes>;

export type SystemSetting = InferSelectModel<typeof systemSettings>;
export type NewSystemSetting = InferInsertModel<typeof systemSettings>;

export type BannedPlayer = InferSelectModel<typeof bannedPlayers>;
export type NewBannedPlayer = InferInsertModel<typeof bannedPlayers>;

export type ChatLog = InferSelectModel<typeof chatLogs>;
export type NewChatLog = InferInsertModel<typeof chatLogs>;

export type KnownPlayer = InferSelectModel<typeof knownPlayers>;
export type NewKnownPlayer = InferInsertModel<typeof knownPlayers>;

export type PlayerScore = InferSelectModel<typeof playerScores>;
export type NewPlayerScore = InferInsertModel<typeof playerScores>;
