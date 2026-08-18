import React, { useState } from 'react';
import { 
  Gamepad2, 
  ShieldAlert, 
  LogIn, 
  LogOut, 
  UserCheck, 
  Layers,
  Trophy
} from 'lucide-react';

export interface AuthUser {
  id: number;
  discord_id: string;
  discord_username: string;
  discord_avatar?: string;
  minecraft_username?: string;
  role: 'admin' | 'user';
}

interface NavbarProps {
  user: AuthUser | null;
  currentRoute: '/' | '/leaderboard' | '/office';
  onNavigate: (route: '/' | '/leaderboard' | '/office') => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  backendOnline: boolean;
  activePlayersCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentRoute,
  onNavigate,
  onOpenProfile,
  onLogout,
  backendOnline,
  activePlayersCount,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleDiscordLogin = () => {
    window.location.href = '/api/auth/discord/login';
  };

  return (
    <header className="header-glass">
      {/* Brand & Logo */}
      <div className="brand-group" onClick={() => onNavigate('/')} style={{ cursor: 'pointer' }}>
        <img 
          src="/logo.png" 
          alt="Magical Gaming Crew Logo" 
          className="brand-logo-img"
        />
        <div className="brand-text">
          <div className="brand-title-row">
            <span className="brand-name">Magical Gaming Crew</span>
            <span className="brand-pill-v2">v2.11</span>
          </div>
          <span className="brand-caption">Minecraft Bedrock ↔ Discord ↔ Web</span>
        </div>
      </div>

      {/* Main Nav Tabs */}
      {user && (
        <nav className="nav-segmented">
          <button 
            className={`nav-seg-item ${currentRoute === '/' ? 'active' : ''}`}
            onClick={() => onNavigate('/')}
            title="Live Chat"
          >
            <Gamepad2 size={16} />
            <span className="nav-label-desktop">Live Chat</span>
            <span className="nav-label-mobile">Chat</span>
            {activePlayersCount > 0 && (
              <span className="online-counter-dot">{activePlayersCount}</span>
            )}
          </button>

          <button 
            className={`nav-seg-item ${currentRoute === '/leaderboard' ? 'active' : ''}`}
            onClick={() => onNavigate('/leaderboard')}
            title="Leaderboard"
          >
            <Trophy size={16} />
            <span className="nav-label-desktop">Leaderboard</span>
            <span className="nav-label-mobile">Ranks</span>
          </button>

          {user.role === 'admin' && (
            <button 
              className={`nav-seg-item admin-tab ${currentRoute === '/office' ? 'active' : ''}`}
              onClick={() => onNavigate('/office')}
              title="Admin Office"
            >
              <ShieldAlert size={16} />
              <span className="nav-label-desktop">Admin Office</span>
              <span className="nav-label-mobile">Office</span>
              <span className="admin-chip-mini hide-on-mobile">Admin</span>
            </button>
          )}
        </nav>
      )}

      {/* Status & Auth Area */}
      <div className="header-actions">
        {/* Heartbeat Status */}
        <div className={`status-pill-glass ${backendOnline ? 'online' : 'offline'}`} title="Bridge Server Connection Status">
          <span className="pulse-dot" />
          <span className="status-label">{backendOnline ? 'Bridge Online' : 'Offline'}</span>
        </div>

        {/* User Profile / Login */}
        {user ? (
          <div className="user-dropdown-container">
            <button 
              className="user-pill-btn" 
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <img 
                src={user.discord_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                alt={user.discord_username}
                className="user-avatar-img"
              />
              <div className="user-pill-info">
                <div className="user-name-line">
                  <span className="user-name-text">{user.discord_username}</span>
                  {user.role === 'admin' ? (
                    <span className="badge-role-admin">
                      <ShieldAlert size={11} style={{ display: 'inline', marginRight: '3px' }} />
                      Admin
                    </span>
                  ) : (
                    <span className="badge-role-member">
                      <UserCheck size={11} style={{ display: 'inline', marginRight: '3px' }} />
                      Member
                    </span>
                  )}
                </div>
                <div className="user-ign-line">
                  IGN: <span className={user.minecraft_username ? 'ign-active' : 'ign-missing'}>
                    {user.minecraft_username || 'Not Linked'}
                  </span>
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <>
                <div className="dropdown-overlay" onClick={() => setDropdownOpen(false)} />
                <div className="user-dropdown-card">
                  <div className="dropdown-user-header">
                    <img 
                      src={user.discord_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                      alt="" 
                      className="dropdown-avatar-large"
                    />
                    <div>
                      <div className="dropdown-username">{user.discord_username}</div>
                      <div className="dropdown-discord-id">ID: {user.discord_id}</div>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <button 
                    className="dropdown-item-btn"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenProfile();
                    }}
                  >
                    <UserCheck size={16} color="#818cf8" />
                    <span>Link / Change Minecraft IGN</span>
                  </button>

                  {user.role === 'admin' && (
                    <button 
                      className="dropdown-item-btn"
                      onClick={() => {
                        setDropdownOpen(false);
                        onNavigate('/office');
                      }}
                    >
                      <Layers size={16} color="#f43f5e" />
                      <span>Admin Control Panel (/office)</span>
                    </button>
                  )}

                  <div className="dropdown-divider" />

                  <button 
                    className="dropdown-item-btn logout"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button className="discord-primary-btn" onClick={handleDiscordLogin}>
            <LogIn size={16} />
            <span>Login with Discord</span>
          </button>
        )}
      </div>
    </header>
  );
};
