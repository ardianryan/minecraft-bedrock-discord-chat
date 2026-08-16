import { describe, it, expect } from 'vitest';

describe('🔗 Account Linking & Database Integrity Tests', () => {
  // Mock In-Memory Database State for isolated unit testing
  const mockUsers = [
    {
      id: 1,
      discord_id: '1001',
      discord_username: 'PlayerOne',
      minecraft_username: 'StevePro',
      role: 'user',
    },
    {
      id: 2,
      discord_id: '1002',
      discord_username: 'PlayerTwo',
      minecraft_username: 'AlexBuilder',
      role: 'user',
    },
  ];

  function findUserByMinecraftUsername(ign: string) {
    if (!ign) return null;
    return mockUsers.find(u => u.minecraft_username?.toLowerCase() === ign.trim().toLowerCase()) || null;
  }

  function validateLinkIgn(discordId: string, newIgn: string) {
    const existingWithIgn = findUserByMinecraftUsername(newIgn);
    if (existingWithIgn && existingWithIgn.discord_id !== discordId) {
      throw new Error(`Minecraft IGN "${newIgn}" is already claimed by @${existingWithIgn.discord_username}`);
    }
    return true;
  }

  it('LINK-1: Should find linked user case-insensitively', () => {
    const userLower = findUserByMinecraftUsername('stevepro');
    const userUpper = findUserByMinecraftUsername('STEVEPRO');
    const userExact = findUserByMinecraftUsername('StevePro');

    expect(userLower).toBeDefined();
    expect(userLower?.discord_username).toBe('PlayerOne');
    expect(userUpper?.discord_id).toBe('1001');
    expect(userExact?.id).toBe(1);
  });

  it('LINK-2: Should permit owner to update their own IGN', () => {
    const isAllowed = validateLinkIgn('1001', 'StevePro');
    expect(isAllowed).toBe(true);
  });

  it('LINK-3: Should reject another Discord user attempting to claim an already-linked IGN', () => {
    // PlayerTwo (id: 1002) tries to claim 'StevePro' which belongs to PlayerOne (id: 1001)
    expect(() => validateLinkIgn('1002', 'StevePro')).toThrowError(/already claimed/);
    expect(() => validateLinkIgn('1002', 'stevepro')).toThrowError(/already claimed/);
  });

  it('LINK-4: Should allow claiming an unclaimed IGN', () => {
    const isAllowed = validateLinkIgn('1002', 'NewAwesomeGamer');
    expect(isAllowed).toBe(true);
  });
});
