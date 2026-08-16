import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Flame, 
  Crown, 
  Medal, 
  Search, 
  RefreshCw, 
  Sparkles 
} from 'lucide-react';
import { AuthUser } from './Navbar.tsx';

export interface LeaderboardEntry {
  id: number;
  discord_id: string;
  discord_username: string;
  discord_avatar?: string;
  minecraft_username?: string;
  role: 'admin' | 'user';
  message_count: number;
  last_active: string;
  created_at: string;
}

interface LeaderboardViewProps {
  currentUser: AuthUser;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ currentUser }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = leaderboard.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.discord_username.toLowerCase().includes(q) ||
      (item.minecraft_username && item.minecraft_username.toLowerCase().includes(q))
    );
  });

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  return (
    <div className="leaderboard-view-container">
      {/* Header Banner */}
      <div className="leaderboard-header-glass">
        <div className="leaderboard-header-title">
          <div className="leaderboard-icon-badge">
            <Trophy size={24} color="#f59e0b" />
          </div>
          <div>
            <h2 className="leaderboard-title">Community Activity Leaderboard</h2>
            <span className="leaderboard-subtitle">
              Rankings of most active chatters across Minecraft Bedrock & Discord
            </span>
          </div>
        </div>

        <div className="leaderboard-controls">
          <div className="search-input-wrapper">
            <Search size={15} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Search player or IGN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-text-field"
            />
          </div>

          <button 
            type="button" 
            className="btn-icon-refresh"
            onClick={fetchLeaderboard}
            disabled={loading}
            title="Refresh Leaderboard"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Top 3 Podium Section */}
      {leaderboard.length > 0 && (
        <div className="podium-grid">
          {/* Rank 2 (Silver) */}
          {top2 && (
            <div className="podium-card rank-2">
              <div className="podium-rank-badge silver">
                <Medal size={16} />
                <span>#2 Silver</span>
              </div>
              <div className="podium-avatar-wrapper">
                <img 
                  src={top2.minecraft_username 
                    ? `https://mc-heads.net/avatar/${encodeURIComponent(top2.minecraft_username)}/64`
                    : (top2.discord_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png')
                  } 
                  alt={top2.discord_username}
                  className="podium-avatar-img"
                  onError={(e) => {
                    if (top2.discord_avatar) (e.target as HTMLImageElement).src = top2.discord_avatar;
                  }}
                />
              </div>
              <div className="podium-name-block">
                <h4 className="podium-player-name">{top2.minecraft_username || top2.discord_username}</h4>
                <span className="podium-discord-tag">@{top2.discord_username}</span>
              </div>
              <div className="podium-score-pill">
                <Flame size={14} color="#f59e0b" />
                <span>{top2.message_count || 0} Messages</span>
              </div>
            </div>
          )}

          {/* Rank 1 (Gold Champion) */}
          {top1 && (
            <div className="podium-card rank-1 champion">
              <div className="champion-crown-wrap">
                <Crown size={28} color="#fbbf24" className="crown-glow" />
              </div>
              <div className="podium-rank-badge gold">
                <Trophy size={16} />
                <span>#1 Champion</span>
              </div>
              <div className="podium-avatar-wrapper gold-ring">
                <img 
                  src={top1.minecraft_username 
                    ? `https://mc-heads.net/avatar/${encodeURIComponent(top1.minecraft_username)}/80`
                    : (top1.discord_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png')
                  } 
                  alt={top1.discord_username}
                  className="podium-avatar-img large"
                  onError={(e) => {
                    if (top1.discord_avatar) (e.target as HTMLImageElement).src = top1.discord_avatar;
                  }}
                />
              </div>
              <div className="podium-name-block">
                <h4 className="podium-player-name champion-text">{top1.minecraft_username || top1.discord_username}</h4>
                <span className="podium-discord-tag">@{top1.discord_username}</span>
              </div>
              <div className="podium-score-pill gold-pill">
                <Flame size={15} color="#fbbf24" />
                <span>{top1.message_count || 0} Messages</span>
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {top3 && (
            <div className="podium-card rank-3">
              <div className="podium-rank-badge bronze">
                <Medal size={16} />
                <span>#3 Bronze</span>
              </div>
              <div className="podium-avatar-wrapper">
                <img 
                  src={top3.minecraft_username 
                    ? `https://mc-heads.net/avatar/${encodeURIComponent(top3.minecraft_username)}/64`
                    : (top3.discord_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png')
                  } 
                  alt={top3.discord_username}
                  className="podium-avatar-img"
                  onError={(e) => {
                    if (top3.discord_avatar) (e.target as HTMLImageElement).src = top3.discord_avatar;
                  }}
                />
              </div>
              <div className="podium-name-block">
                <h4 className="podium-player-name">{top3.minecraft_username || top3.discord_username}</h4>
                <span className="podium-discord-tag">@{top3.discord_username}</span>
              </div>
              <div className="podium-score-pill">
                <Flame size={14} color="#f59e0b" />
                <span>{top3.message_count || 0} Messages</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="office-panel-card">
        <div className="office-panel-header">
          <div className="panel-title-group">
            <Sparkles size={18} color="#818cf8" />
            <h3 className="panel-title-heading">All Ranked Members</h3>
          </div>
          <span className="messages-count-pill">
            {leaderboard.length} Players Ranked
          </span>
        </div>

        <div className="table-container-responsive">
          <table className="office-data-table">
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                <th>Player / Discord</th>
                <th>Minecraft IGN</th>
                <th>Role</th>
                <th style={{ textAlign: 'right' }}>Total Messages</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty-row">
                    {loading ? 'Loading leaderboard...' : 'No activity records found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((entry, idx) => {
                  const isCurrent = entry.discord_id === currentUser.discord_id;
                  const rank = idx + 1;

                  return (
                    <tr key={entry.id} className={isCurrent ? 'current-user-row' : ''}>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`rank-number-badge ${rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : ''}`}>
                          {rank === 1 ? '🥇 1' : rank === 2 ? '🥈 2' : rank === 3 ? '🥉 3' : `#${rank}`}
                        </span>
                      </td>
                      <td>
                        <div className="user-avatar-cell">
                          <img 
                            src={entry.discord_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                            alt={entry.discord_username}
                            className="table-avatar-img"
                          />
                          <div>
                            <div className="table-user-name">
                              {entry.discord_username}
                              {isCurrent && <span className="current-user-chip" style={{ marginLeft: '6px' }}>You</span>}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {entry.discord_id}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {entry.minecraft_username ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img 
                              src={`https://mc-heads.net/avatar/${encodeURIComponent(entry.minecraft_username)}/24`}
                              alt=""
                              style={{ width: '24px', height: '24px', borderRadius: '4px', imageRendering: 'pixelated' }}
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                            <code className="ign-active" style={{ fontSize: '0.85rem' }}>{entry.minecraft_username}</code>
                          </div>
                        ) : (
                          <span className="ign-missing">Not Linked</span>
                        )}
                      </td>
                      <td>
                        {entry.role === 'admin' ? (
                          <span className="badge-role-admin">👑 Admin</span>
                        ) : (
                          <span className="badge-role-member">⚔️ Member</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="leaderboard-score-badge">
                          <Flame size={13} color="#f59e0b" />
                          <strong>{entry.message_count || 0}</strong>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
