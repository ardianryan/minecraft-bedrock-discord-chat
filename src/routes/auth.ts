import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { getUserByDiscordId, upsertUser, consumeLinkCode, unlinkUserByDiscordId } from '../db.js';

dotenv.config();

export const authRouter = new Hono();

function getAuthConfig() {
  const port = process.env.PORT || '3000';
  return {
    jwtSecret: process.env.JWT_SECRET || 'SUPER_SECRET_JWT_KEY_DISCORD_MCHAT_123',
    clientId: process.env.DISCORD_CLIENT_ID?.trim() || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET?.trim() || '',
    redirectUri: process.env.DISCORD_REDIRECT_URI?.trim() || `http://localhost:${port}/api/auth/discord/callback`,
    frontendUrl: process.env.FRONTEND_URL?.trim() || `http://localhost:${port}`,
  };
}

// Generate JWT token
export function generateToken(user: any) {
  const { jwtSecret } = getAuthConfig();
  return jwt.sign(
    {
      id: user.id,
      discord_id: user.discord_id,
      discord_username: user.discord_username,
      discord_avatar: user.discord_avatar,
      minecraft_username: user.minecraft_username,
      role: user.role || 'user',
    },
    jwtSecret,
    { expiresIn: '7d' }
  );
}

// Middleware to extract logged-in user
export async function authUserMiddleware(c: any, next: any) {
  const { jwtSecret } = getAuthConfig();
  const token = getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return c.json({ error: 'Unauthenticated' }, 401);
  }

  try {
    const decoded: any = jwt.verify(token, jwtSecret);
    const freshUser = await getUserByDiscordId(decoded.discord_id);
    c.set('user', freshUser || decoded);
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid or expired session token' }, 401);
  }
}

// Middleware for Admin only (/office)
export async function officeAdminMiddleware(c: any, next: any) {
  const { jwtSecret } = getAuthConfig();
  const token = getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return c.json({ error: 'Unauthorized: Admin login required' }, 401);
  }

  try {
    const decoded: any = jwt.verify(token, jwtSecret);
    const freshUser = await getUserByDiscordId(decoded.discord_id);
    const user = freshUser || decoded;
    if (user.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin role required for /office access' }, 403);
    }
    c.set('user', user);
    await next();
  } catch (err) {
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }
}

// 1. Redirect to Discord OAuth2
authRouter.get('/discord/login', (c) => {
  const { clientId, clientSecret, redirectUri, frontendUrl } = getAuthConfig();
  
  if (!clientId || !clientSecret) {
    console.warn('⚠️ DISCORD_CLIENT_ID atau DISCORD_CLIENT_SECRET belum diatur di .env');
    return c.redirect(`${frontendUrl}/?auth_error=missing_discord_credentials`);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify',
  });

  return c.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

// 2. Discord OAuth2 Callback
authRouter.get('/discord/callback', async (c) => {
  const { clientId, clientSecret, redirectUri, frontendUrl } = getAuthConfig();
  const code = c.req.query('code');

  if (!code) {
    return c.redirect(`${frontendUrl}/?auth_error=no_code_provided`);
  }

  try {
    // Exchange code for access token with Discord API
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'authorization_code');
    params.append('code', code.trim());
    params.append('redirect_uri', redirectUri.trim());

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('\n❌ [DISCORD OAUTH ERROR]: Gagal menukar authorization code!');
      console.error('Response Status:', tokenResponse.status);
      console.error('Response Body  :', errText);
      console.error('Client ID Digunakan    :', clientId);
      console.error('Redirect URI Digunakan :', redirectUri.trim(), '\n');
      return c.redirect(`${frontendUrl}/?auth_error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();

    // Fetch user profile from Discord API
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userResponse.ok) {
      return c.redirect(`${frontendUrl}/?auth_error=user_fetch_failed`);
    }

    const discordUser = await userResponse.json();
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${Number(discordUser.discriminator || 0) % 5}.png`;

    // Save/Update user to PostgreSQL
    const user = await upsertUser({
      discord_id: discordUser.id,
      discord_username: discordUser.global_name || discordUser.username,
      discord_avatar: avatarUrl,
    });

    // Generate JWT
    const token = generateToken(user);

    // Set cookie
    setCookie(c, 'auth_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    if (user.role === 'admin') {
      return c.redirect(`${frontendUrl}/office`);
    }
    return c.redirect(`${frontendUrl}/`);
  } catch (err: any) {
    console.error('OAuth Callback Error:', err);
    return c.redirect(`${frontendUrl}/?auth_error=oauth_internal_error`);
  }
});

// 3. Get Current User Info
authRouter.get('/me', async (c) => {
  const { jwtSecret } = getAuthConfig();
  const token = getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return c.json({ authenticated: false, user: null });
  }

  try {
    const decoded: any = jwt.verify(token, jwtSecret);
    const user = await getUserByDiscordId(decoded.discord_id);
    const resolvedUser = user || decoded;
    return c.json({ authenticated: true, user: resolvedUser });
  } catch (err) {
    return c.json({ authenticated: false, user: null });
  }
});

// 4. Update Current User Minecraft IGN (Direct input or 6-digit OTP code)
authRouter.post('/profile/ign', authUserMiddleware, async (c: any) => {
  try {
    const user: any = c.get('user');
    const { minecraft_username, code, unlink } = await c.req.json();

    // If explicit unlink requested
    if (unlink === true || minecraft_username === '') {
      const unlinked = await unlinkUserByDiscordId(user.discord_id);
      return c.json({ status: 'success', user: unlinked, message: 'Minecraft IGN successfully unlinked!' });
    }

    // If user inputs 6-digit OTP code from game
    if (code && String(code).trim() !== '') {
      const linkResult = await consumeLinkCode(String(code).trim(), user.discord_id, user.discord_username);
      if (linkResult.error) {
        return c.json({ error: linkResult.error }, 400);
      }
      return c.json({ status: 'success', user: linkResult.user, message: `Successfully linked IGN ${linkResult.minecraft_username}!` });
    }

    // If user inputs IGN directly
    const cleanIgn = String(minecraft_username || '').trim();
    if (!cleanIgn) {
      return c.json({ error: 'Minecraft IGN cannot be empty' }, 400);
    }

    const updated = await upsertUser({
      discord_id: user.discord_id,
      discord_username: user.discord_username,
      minecraft_username: cleanIgn,
    });

    return c.json({ status: 'success', user: updated, message: `Successfully linked IGN ${cleanIgn}!` });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to update Minecraft IGN' }, 400);
  }
});

// 5. Unlink Current User Minecraft IGN
authRouter.delete('/profile/ign', authUserMiddleware, async (c: any) => {
  try {
    const user: any = c.get('user');
    const unlinked = await unlinkUserByDiscordId(user.discord_id);
    return c.json({ status: 'success', user: unlinked, message: 'Minecraft IGN successfully unlinked!' });
  } catch (err: any) {
    return c.json({ error: 'Failed to unlink account' }, 500);
  }
});

// 6. Logout
authRouter.post('/logout', (c) => {
  deleteCookie(c, 'auth_token', { path: '/' });
  return c.json({ status: 'logged_out' });
});
