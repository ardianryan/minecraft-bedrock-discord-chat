import React from 'react';
import { 
  Gamepad2, 
  Bot, 
  ShieldCheck, 
  Terminal, 
  Sparkles,
  Database,
  ArrowRight
} from 'lucide-react';

interface LoginPageProps {
  authError?: string | null;
  onDirectLogin?: () => void;
  discordInviteUrl?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ authError, discordInviteUrl }) => {
  const handleDiscordLogin = () => {
    window.location.href = '/api/auth/discord/login';
  };

  const featureCards = [
    {
      icon: <Gamepad2 size={20} color="#34d399" />,
      title: 'Minecraft Bedrock Live',
      desc: 'Native @minecraft/server-net Script API with sub-second real-time chat sync.',
    },
    {
      icon: <Bot size={20} color="#818cf8" />,
      title: '2-Way Discord Bot & Webhooks',
      desc: 'Send messages and execute in-game slash commands directly from Discord channels.',
    },
    {
      icon: <Database size={20} color="#38bdf8" />,
      title: 'PostgreSQL Relational DB',
      desc: 'Persistent relational storage for Discord account and Minecraft IGN mappings.',
    },
    {
      icon: <Terminal size={20} color="#f59e0b" />,
      title: 'Office Admin Dashboard',
      desc: 'Complete control panel at /office to manage users, roles, and server tokens.',
    },
  ];

  return (
    <div className="login-landing-container">
      {/* Background Ambient Glows */}
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />
      <div className="ambient-glow glow-3" />

      <div className="login-content-wrapper">
        {/* Main Hero Card */}
        <div className="login-hero-card">
          {/* Brand Icon */}
          <img 
            src="/logo.png" 
            alt="Magical Gaming Crew" 
            className="login-hero-logo-img"
          />

          <div className="login-badge-pill">
            <Sparkles size={14} color="#f59e0b" />
            <span>Minecraft Bedrock ↔ Discord ↔ Web</span>
          </div>

          <h1 className="login-hero-title">
            Magical Gaming Crew
          </h1>

          <p className="login-hero-subtitle">
            Interactive bridge platform connecting your Minecraft Bedrock server with your Discord community and Web Dashboard.
          </p>

          {/* Auth Error Banner */}
          {authError && (
            <div className="login-error-pill">
              <span>❌ {authError}</span>
            </div>
          )}

          {/* Discord Login Button */}
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

          {/* Join Discord Server Link */}
          {discordInviteUrl && (
            <a 
              href={discordInviteUrl}
              target="_blank" 
              rel="noreferrer" 
              className="login-invite-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#a5b4fc', textDecoration: 'none', marginBottom: '14px', fontWeight: 600 }}
            >
              <span>Not in our Discord server yet? Click here to join ↗</span>
              <ArrowRight size={14} />
            </a>
          )}

          <span className="login-security-notice">
            <ShieldCheck size={14} color="#34d399" />
            Official Discord OAuth2 Authentication • No password required
          </span>
        </div>

        {/* Feature Grid */}
        <div className="login-feature-grid">
          {featureCards.map((f, idx) => (
            <div key={idx} className="feature-item-card">
              <div className="feature-item-icon">
                {f.icon}
              </div>
              <div>
                <h4 className="feature-item-title">{f.title}</h4>
                <p className="feature-item-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
