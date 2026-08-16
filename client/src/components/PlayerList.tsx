import React, { useState } from 'react';
import { 
  Users, 
  Radio, 
  Gamepad2, 
  ShieldCheck, 
  Database, 
  Bot, 
  UserCheck,
  UserX,
  Ban,
  AlertTriangle
} from 'lucide-react';
import { AuthUser } from './Navbar.tsx';
import { Sheet } from './Sheet.tsx';

interface PlayerListProps {
  players: string[];
  user: AuthUser;
  onOpenProfile: () => void;
  botOnline?: boolean;
  discordInviteUrl?: string;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  user,
  onOpenProfile,
  discordInviteUrl,
}) => {
  const [modTarget, setModTarget] = useState<{ username: string; action: 'kick' | 'ban' } | null>(null);
  const [modReason, setModReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleOpenModSheet = (username: string, action: 'kick' | 'ban') => {
    setModTarget({ username, action });
    setModReason(action === 'kick' ? 'Kicked by Administrator' : 'Violating Server Rules');
  };

  const handleExecuteModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modTarget) return;
    setSubmitting(true);
    try {
      const endpoint = modTarget.action === 'kick' ? '/api/office/players/kick' : '/api/office/players/ban';
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: modTarget.username,
          reason: modReason.trim(),
        }),
      });
      setModTarget(null);
    } catch (err) {
      console.error('Moderation error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const quickReasons = modTarget?.action === 'kick' 
    ? ['AFK', 'Spamming Chat', 'Command Abuse', 'Kicked by Admin']
    : ['Toxicity / Harassment', 'Hacking / X-Ray', 'Griefing Server', 'Severe Rule Violation'];

  return (
    <div className="sidebar-roster-group">
      {/* Join Discord Channel Community Card */}
      {discordInviteUrl && (
        <a 
          href={discordInviteUrl} 
          target="_blank" 
          rel="noreferrer"
          className="discord-invite-banner"
          title="Click to join our Community Discord Server"
        >
          <div className="discord-invite-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </div>
          <div className="discord-invite-text">
            <span className="discord-invite-title">Join Our Discord Server</span>
            <span className="discord-invite-sub">Join community channels & chat</span>
          </div>
          <span className="discord-join-badge">Join ↗</span>
        </a>
      )}

      {/* Active Minecraft Players Card */}
      <div className="sidebar-card">
        <div className="sidebar-card-header">
          <div className="sidebar-header-left">
            <div className="sidebar-icon-wrap emerald">
              <Users size={18} />
            </div>
            <div>
              <h4 className="sidebar-card-title">Online In-Game</h4>
              <span className="sidebar-card-caption">Bedrock Server Live</span>
            </div>
          </div>
          <span className="badge-online-count">{players.length} Online</span>
        </div>

        {/* Players List */}
        <div className="players-scroll-container">
          {players.length === 0 ? (
            <div className="roster-empty-state">
              <span>No players currently online in Bedrock</span>
            </div>
          ) : (
            players.map((player, idx) => (
              <div key={idx} className="player-roster-item">
                <img 
                  src={`https://mc-heads.net/avatar/${encodeURIComponent(player)}/28`} 
                  alt={player}
                  className="player-skin-head"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="player-roster-name">{player}</span>
                <span className="player-online-badge">ONLINE</span>

                {/* Admin Quick Kick / Ban Action Buttons */}
                {user.role === 'admin' && (
                  <div className="roster-admin-actions" style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                    <button
                      type="button"
                      className="btn-roster-kick"
                      title={`Kick ${player} from server`}
                      onClick={() => handleOpenModSheet(player, 'kick')}
                    >
                      👢
                    </button>
                    <button
                      type="button"
                      className="btn-roster-ban"
                      title={`Permanently BAN ${player}`}
                      onClick={() => handleOpenModSheet(player, 'ban')}
                    >
                      🚫
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Responsive Sheet for Moderation Actions */}
      <Sheet
        isOpen={!!modTarget}
        onClose={() => setModTarget(null)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {modTarget?.action === 'kick' ? (
              <UserX size={20} color="#f59e0b" />
            ) : (
              <Ban size={20} color="#f43f5e" />
            )}
            <span>
              {modTarget?.action === 'kick' ? 'Kick Player from Server' : 'Permanently BAN Player'}
            </span>
          </div>
        }
        description={
          modTarget?.action === 'kick'
            ? `Disconnect ${modTarget.username} from the Minecraft Bedrock world.`
            : `Add ${modTarget?.username} to the permanent blacklist in PostgreSQL and kick from the server.`
        }
        footer={
          <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn-modal-cancel" 
              onClick={() => setModTarget(null)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn-primary-save"
              style={{
                background: modTarget?.action === 'kick' ? '#d97706' : '#e11d48',
                borderColor: modTarget?.action === 'kick' ? '#b45309' : '#be123c',
              }}
              onClick={handleExecuteModeration}
              disabled={submitting || !modReason.trim()}
            >
              {submitting ? 'Executing...' : modTarget?.action === 'kick' ? '👢 Confirm Kick' : '🚫 Confirm Permanent Ban'}
            </button>
          </div>
        }
      >
        {modTarget && (
          <form onSubmit={handleExecuteModeration} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Player Target Info Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}>
              <img 
                src={`https://mc-heads.net/avatar/${encodeURIComponent(modTarget.username)}/44`} 
                alt=""
                style={{ width: '44px', height: '44px', borderRadius: '8px', imageRendering: 'pixelated' }}
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Player IGN</span>
                <h4 style={{ color: '#f8fafc', fontSize: '1.05rem', margin: 0 }}>{modTarget.username}</h4>
              </div>
            </div>

            {/* Reason Field */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '6px' }}>
                Reason for {modTarget.action === 'kick' ? 'Kick' : 'Ban'}:
              </label>
              <input 
                type="text" 
                className="settings-text-field"
                placeholder="Enter specific reason..."
                value={modReason}
                onChange={(e) => setModReason(e.target.value)}
                required
                autoFocus
              />

              {/* Quick Chip Suggestions */}
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Quick Suggestions:</span>
                <div className="quick-reason-chips">
                  {quickReasons.map((r, i) => (
                    <button 
                      key={i}
                      type="button" 
                      className="quick-reason-chip"
                      onClick={() => setModReason(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {modTarget.action === 'ban' && (
              <div className="office-alert-pill error" style={{ margin: 0 }}>
                <AlertTriangle size={16} />
                <span style={{ fontSize: '0.78rem' }}>
                  This player will be added to the database blacklist and blocked from reconnecting until unbanned.
                </span>
              </div>
            )}
          </form>
        )}
      </Sheet>

      {/* System & Account Status Card */}
      <div className="sidebar-card">
        <div className="sidebar-card-header">
          <div className="sidebar-header-left">
            <div className="sidebar-icon-wrap indigo">
              <Radio size={18} />
            </div>
            <div>
              <h4 className="sidebar-card-title">Integration Status</h4>
              <span className="sidebar-card-caption">3-Way Architecture</span>
            </div>
          </div>
        </div>

        <div className="system-status-list">
          <div className="system-status-row">
            <div className="system-status-left">
              <Database size={15} color="#38bdf8" />
              <span>Database</span>
            </div>
            <span className="status-code-chip pg">PostgreSQL (Local)</span>
          </div>

          <div className="system-status-row">
            <div className="system-status-left">
              <Bot size={15} color="#818cf8" />
              <span>Discord Bot</span>
            </div>
            <span className="status-code-chip bot">2-Way Active</span>
          </div>

          <div className="system-status-row">
            <div className="system-status-left">
              <Gamepad2 size={15} color="#34d399" />
              <span>Script API</span>
            </div>
            <span className="status-code-chip bedrock">@minecraft/server-net</span>
          </div>

          <div className="system-status-row">
            <div className="system-status-left">
              <ShieldCheck size={15} color="#f59e0b" />
              <span>Discord User</span>
            </div>
            <span className="status-code-chip user">@{user.discord_username}</span>
          </div>
        </div>

        {/* Action Link IGN */}
        <div className="link-ign-action-box">
          <div className="link-ign-info-text">
            <span className="link-ign-heading">Your Minecraft IGN:</span>
            <span className="link-ign-value">
              {user.minecraft_username ? `🎮 ${user.minecraft_username}` : '❌ Not Linked'}
            </span>
          </div>
          <button 
            type="button" 
            className="btn-secondary-link"
            onClick={onOpenProfile}
          >
            <UserCheck size={14} />
            <span>{user.minecraft_username ? 'Change IGN' : 'Link IGN'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
