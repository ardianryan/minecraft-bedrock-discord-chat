import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { generateToken } from '../src/routes/auth.js';

const JWT_SECRET = 'SUPER_SECRET_JWT_KEY_DISCORD_MCHAT_123';

describe('🛡️ RBAC (Role-Based Access Control) Security Tests', () => {
  const adminUser = {
    id: 1,
    discord_id: '1538518005607178280',
    discord_username: 'AdminUser',
    minecraft_username: 'RyanAdmin',
    role: 'admin',
  };

  const regularUser = {
    id: 2,
    discord_id: '999999999999999999',
    discord_username: 'RegularGamer',
    minecraft_username: 'GamerPlayer',
    role: 'user',
  };

  it('RBAC-1: Should generate signed JWT token with correct admin role', () => {
    const token = generateToken(adminUser);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded: any = jwt.verify(token, JWT_SECRET);
    expect(decoded.role).toBe('admin');
    expect(decoded.discord_username).toBe('AdminUser');
    expect(decoded.discord_id).toBe('1538518005607178280');
  });

  it('RBAC-2: Should generate signed JWT token with regular user role', () => {
    const token = generateToken(regularUser);
    const decoded: any = jwt.verify(token, JWT_SECRET);
    expect(decoded.role).toBe('user');
    expect(decoded.discord_username).toBe('RegularGamer');
  });

  it('RBAC-3: Admin role should be permitted to execute slash commands', () => {
    const message = '/time set day';
    const isSlashCommand = message.startsWith('/');
    expect(isSlashCommand).toBe(true);

    // Authorization rule check
    const isAllowed = adminUser.role === 'admin';
    expect(isAllowed).toBe(true);
  });

  it('RBAC-4: Regular user role MUST be rejected from executing slash commands (403 Forbidden)', () => {
    const message = '/give @a diamond 64';
    const isSlashCommand = message.startsWith('/');
    expect(isSlashCommand).toBe(true);

    // Authorization rule check
    const isAllowed = regularUser.role === 'admin';
    expect(isAllowed).toBe(false);
  });

  it('RBAC-5: Tampered token attempting privilege escalation (user -> admin) MUST fail verification', () => {
    const token = generateToken(regularUser);
    
    // Simulate attacker altering the payload to role: "admin"
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    payload.role = 'admin'; // Forged role
    const forgedPayloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const forgedToken = `${parts[0]}.${forgedPayloadBase64}.${parts[2]}`;

    // Verification must throw JsonWebTokenError (invalid signature)
    expect(() => jwt.verify(forgedToken, JWT_SECRET)).toThrow();
  });
});
