import React, { useState } from 'react';
import { 
  Gamepad2, 
  MessageSquare,
  Trophy,
  ShieldCheck, 
  ArrowRight, 
  Copy, 
  Check,
  AlertCircle,
  Radio,
  Sparkles
} from 'lucide-react';

interface LoginPageProps {
  authError?: string | null;
  onLoginSuccess?: () => void;
  onDirectLogin?: () => void;
  discordInviteUrl?: string;
  serverIp?: string;
  serverPort?: string;
  serverName?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  authError, 
  discordInviteUrl,
  serverIp,
  serverPort = '19132',
  serverName = 'Minecraft Bedrock Server'
}) => {
  const [copiedIp, setCopiedIp] = useState(false);

  const handleDiscordLogin = () => {
    window.location.href = '/api/auth/discord/login';
  };

  const handleCopyServerIp = () => {
    if (!serverIp) return;
    const textToCopy = `${serverIp}:${serverPort || '19132'}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedIp(true);
      setTimeout(() => setCopiedIp(false), 2000);
    });
  };

  const directConnectUri = serverIp 
    ? `minecraft://?addExternalServer=${encodeURIComponent(serverName)}|${serverIp}:${serverPort || '19132'}`
    : '';

  const featureCards = [
    {
      icon: <MessageSquare size={18} color="#38bdf8" />,
      title: 'Live In-Game Chat',
      desc: 'Real-time 2-way chat synchronization between Bedrock in-game and Discord community.',
    },
    {
      icon: <Gamepad2 size={18} color="#34d399" />,
      title: '1-Click Server Connect',
      desc: 'Instant direct connection to our Bedrock world on Android, iOS, and Windows 10/11.',
    },
    {
      icon: <Trophy size={18} color="#fbbf24" />,
      title: 'Ranks & Leaderboard',
      desc: 'Compete in top kills, playtime, coins, and Discord community message activity.',
    },
    {
      icon: <ShieldCheck size={18} color="#a855f7" />,
      title: 'Verified Gamer Profile',
      desc: 'Link your Discord identity to your Minecraft IGN for unified player verification.',
    },
  ];

  return (
    <div className="login-landing-container">
      {/* Background Ambient Glows */}
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />
      <div className="ambient-glow glow-3" />

      <div className="login-split-layout">
        {/* ========================================================
            LEFT COLUMN: SHOWCASE, COMMUNITY & SERVER QUICK-CONNECT
            ======================================================== */}
        <div className="login-showcase-panel">
          <div className="showcase-brand-header">
            <div className="showcase-logo-ring">
              <img 
                src="/logo.png" 
                alt={serverName} 
                className="showcase-logo-img"
              />
            </div>
            <div>
              <div className="showcase-badge-pill">
                <span className="live-pulse-dot" />
                <span>Bedrock Community Portal</span>
              </div>
              <h1 className="showcase-title">{serverName}</h1>
              <p className="showcase-tagline">
                Interactive real-time bridge connecting Minecraft Bedrock players with our Discord community.
              </p>
            </div>
          </div>

          {/* Quick Connect Minecraft Banner */}
          {serverIp && (
            <div className="showcase-connect-card">
              <div className="showcase-connect-info">
                <div className="connect-info-icon">
                  <Gamepad2 size={20} color="#4ade80" />
                </div>
                <div className="connect-info-text">
                  <span className="connect-label">Bedrock Server Address</span>
                  <div className="connect-ip-row">
                    <code className="connect-ip-code">{serverIp}</code>
                    <span className="connect-port-chip">:{serverPort}</span>
                  </div>
                </div>
              </div>

              <div className="showcase-connect-actions">
                <a 
                  href={directConnectUri}
                  className="btn-showcase-launch"
                  title="Launch Minecraft Bedrock and connect directly"
                >
                  <Gamepad2 size={15} />
                  <span>1-Click Launch</span>
                </a>
                <button 
                  type="button"
                  onClick={handleCopyServerIp}
                  className="btn-showcase-copy"
                  title="Copy IP and Port"
                >
                  {copiedIp ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  <span>{copiedIp ? 'Copied' : 'Copy IP'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Feature Highlights Grid */}
          <div className="showcase-features-grid">
            {featureCards.map((f, idx) => (
              <div key={idx} className="showcase-feature-card">
                <div className="showcase-feature-icon">
                  {f.icon}
                </div>
                <div className="showcase-feature-text">
                  <h4 className="showcase-feature-title">{f.title}</h4>
                  <p className="showcase-feature-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: AUTH & ONBOARDING CARD
            ======================================================== */}
        <div className="login-auth-panel">
          <div className="login-auth-card">
            <div className="auth-card-header">
              <div className="auth-icon-circle">
                <Radio size={22} color="#818cf8" />
              </div>
              <h2 className="auth-card-title">Sign In to Live Chat</h2>
              <p className="auth-card-desc">
                Log in with your Discord account to chat with in-game players, link your Minecraft IGN, and view leaderboards.
              </p>
            </div>

            {/* Auth Error Banner */}
            {authError && (
              <div className="login-error-pill">
                <AlertCircle size={15} />
                <span>{authError}</span>
              </div>
            )}

            {/* Discord OAuth2 Login Button */}
            <button 
              type="button" 
              className="btn-discord-hero"
              onClick={handleDiscordLogin}
            >
              <div className="discord-logo-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </div>
              <span>Log In with Discord</span>
              <ArrowRight size={18} className="btn-arrow-icon" />
            </button>

            {/* Join Discord Community Box */}
            {discordInviteUrl && (
              <a 
                href={discordInviteUrl}
                target="_blank" 
                rel="noreferrer" 
                className="auth-discord-invite-box"
              >
                <div className="invite-box-left">
                  <span className="invite-box-title">Need a Discord Account?</span>
                  <span className="invite-box-sub">Join our community server & meet players</span>
                </div>
                <div className="invite-box-btn">
                  <span>Join Discord</span>
                  <ArrowRight size={13} />
                </div>
              </a>
            )}

            {/* Security Trust Notice */}
            <div className="login-security-notice">
              <ShieldCheck size={14} color="#34d399" />
              <span>Official Discord OAuth2 Authentication • No password required</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#64748b' }}>
              <Sparkles size={14} color="#38bdf8" />
              <span>{serverName} • Bedrock Bridge v2.11.2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
