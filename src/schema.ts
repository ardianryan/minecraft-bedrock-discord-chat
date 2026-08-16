import { pgTable, serial, varchar, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
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
