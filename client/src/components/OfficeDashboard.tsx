import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Settings, 
  Send, 
  Trash2, 
  Check, 
  Save, 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  Search, 
  Key, 
  Bot, 
  Hash, 
  Copy, 
  Sparkles, 
  FileCode, 
  Eye, 
  EyeOff, 
  UserCheck, 
  ShieldAlert,
  Ban,
  UserX,
  ShieldBan,
  BookOpen,
  ExternalLink,
  Info,
  CheckCircle2
} from 'lucide-react';
import { AuthUser } from './Navbar.tsx';
import { Sheet } from './Sheet.tsx';
import { Tooltip } from './Tooltip.tsx';

interface SystemSettings {
  discord_webhook_url: string;
  discord_bot_token: string;
  discord_channel_id: string;
  discord_invite_url: string;
  api_key: string;
  server_name: string;
}

interface BannedPlayer {
  id: number;
  username: string;
  reason: string;
  banned_by: string;
  created_at: string;
}

interface KnownPlayer {
  username: string;
  first_seen: string;
  last_seen: string;
  isOnline: boolean;
}

interface OfficeDashboardProps {
  currentUser: AuthUser | null;
}

export const OfficeDashboard: React.FC<OfficeDashboardProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'moderation' | 'settings'>('users');
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Moderation state
  const [bannedPlayers, setBannedPlayers] = useState<BannedPlayer[]>([]);
  const [loadingBanned, setLoadingBanned] = useState<boolean>(false);
  const [knownPlayers, setKnownPlayers] = useState<KnownPlayer[]>([]);
  const [loadingKnown, setLoadingKnown] = useState<boolean>(false);
  const [kickForm, setKickForm] = useState({ username: '', reason: '' });
  const [banForm, setBanForm] = useState({ username: '', reason: '' });
  const [submittingMod, setSubmittingMod] = useState<boolean>(false);

  // Modern Confirmation & Guide Sheet States
  const [showGuideSheet, setShowGuideSheet] = useState<boolean>(false);
  const [unbanTarget, setUnbanTarget] = useState<string | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<{ id: number; username: string } | null>(null);
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);
  
  // Settings State
  const [settings, setSettings] = useState<SystemSettings>({
    discord_webhook_url: '',
    discord_bot_token: '',
    discord_channel_id: '',
    discord_invite_url: '',
    api_key: '',
    server_name: '',
  });
  const [, setLoadingSettings] = useState<boolean>(false);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [testingWebhook, setTestingWebhook] = useState<boolean>(false);
  const [testingBot, setTestingBot] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);
  const [showBotToken, setShowBotToken] = useState<boolean>(false);
  
  // Feedback messages
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Edit in-progress mapping for IGN and Roles
  const [editingUsers, setEditingUsers] = useState<Record<number, { ign: string; role: 'admin' | 'user' }>>({});

  // Fetch Users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/office/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        
        // Populate edit state
        const editMap: Record<number, { ign: string; role: 'admin' | 'user' }> = {};
        (data.users || []).forEach((u: AuthUser) => {
          editMap[u.id] = { ign: u.minecraft_username || '', role: u.role };
        });
        setEditingUsers(editMap);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Settings
  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch('/api/office/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || { 
          discord_webhook_url: '', 
          discord_bot_token: '', 
          discord_channel_id: '', 
          discord_invite_url: '',
          api_key: '', 
          server_name: '' 
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Fetch Banned Players
  const fetchBannedPlayers = async () => {
    setLoadingBanned(true);
    try {
      const res = await fetch('/api/office/players/banned');
      if (res.ok) {
        const data = await res.json();
        setBannedPlayers(data.banned || []);
      }
    } catch (err) {
      console.error('Failed to fetch banlist:', err);
    } finally {
      setLoadingBanned(false);
    }
  };

  // Fetch Known Players (14-Day Directory)
  const fetchKnownPlayers = async () => {
    setLoadingKnown(true);
    try {
      const res = await fetch('/api/office/players/known');
      if (res.ok) {
        const data = await res.json();
        setKnownPlayers(data.players || []);
      }
    } catch (err) {
      console.error('Failed to fetch known players:', err);
    } finally {
      setLoadingKnown(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSettings();
    fetchBannedPlayers();
    fetchKnownPlayers();
  }, []);

  // Handle Kick Player
  const handleKickPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kickForm.username.trim()) return;
    setSubmittingMod(true);
    try {
      const res = await fetch('/api/office/players/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kickForm),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ text: data.message || `Player ${kickForm.username} kicked successfully!`, type: 'success' });
        setKickForm({ username: '', reason: '' });
      } else {
        setFeedback({ text: data.error || 'Failed to kick player.', type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Network error occurred while kicking player.', type: 'error' });
    } finally {
      setSubmittingMod(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Handle Ban Player
  const handleBanPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banForm.username.trim()) return;
    setSubmittingMod(true);
    try {
      const res = await fetch('/api/office/players/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(banForm),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ text: data.message || `Player ${banForm.username} permanently banned!`, type: 'success' });
        setBanForm({ username: '', reason: '' });
        fetchBannedPlayers();
      } else {
        setFeedback({ text: data.error || 'Failed to ban player.', type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Network error occurred while banning player.', type: 'error' });
    } finally {
      setSubmittingMod(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Handle Unban Player
  const handleUnbanPlayer = (username: string) => {
    setUnbanTarget(username);
  };

  const handleExecuteUnban = async () => {
    if (!unbanTarget) return;
    setSubmittingAction(true);
    try {
      const res = await fetch('/api/office/players/unban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: unbanTarget }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ text: data.message || `Player ${unbanTarget} unbanned successfully.`, type: 'success' });
        fetchBannedPlayers();
        setUnbanTarget(null);
      } else {
        setFeedback({ text: data.error || 'Failed to unban player.', type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Failed to unban player.', type: 'error' });
    } finally {
      setSubmittingAction(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Generate Random Secure Bearer Token
  const handleGenerateApiKey = () => {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const newKey = `mc_sec_${randomHex}`;
    setSettings(prev => ({ ...prev, api_key: newKey }));
    setFeedback({ text: 'New Secret Bearer Key generated! Click "Save Settings" to apply.', type: 'success' });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Copy Config snippet for MGC_Bridge[BP]/scripts/main.js
  const handleCopySnippet = () => {
    const snippet = `const HONO_BACKEND_URL = "${window.location.origin}/api/game";\nconst API_KEY = "${settings.api_key || 'SECRET_BEARER_TOKEN'}";`;
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  // Handle saving individual user edits
  const handleSaveUser = async (user: AuthUser) => {
    const editData = editingUsers[user.id];
    if (!editData) return;

    try {
      const res = await fetch(`/api/office/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minecraft_username: editData.ign.trim(),
          role: editData.role,
        }),
      });

      if (res.ok) {
        setFeedback({ text: `User ${user.discord_username} updated successfully.`, type: 'success' });
        fetchUsers();
      } else {
        const errData = await res.json().catch(() => ({}));
        setFeedback({ text: errData.error || 'Failed to save user changes.', type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Network error occurred.', type: 'error' });
    }
    setTimeout(() => setFeedback(null), 3500);
  };

  // Handle delete user
  const handleDeleteUser = (userId: number, username: string) => {
    setDeleteUserTarget({ id: userId, username });
  };

  const handleExecuteDeleteUser = async () => {
    if (!deleteUserTarget) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/office/users/${deleteUserTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setFeedback({ text: `User ${deleteUserTarget.username} deleted successfully.`, type: 'success' });
        fetchUsers();
        setDeleteUserTarget(null);
      } else {
        setFeedback({ text: 'Failed to delete user.', type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Failed to delete user.', type: 'error' });
    } finally {
      setSubmittingAction(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/office/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setFeedback({ text: 'Settings saved to PostgreSQL database successfully!', type: 'success' });
      } else {
        setFeedback({ text: 'Failed to save settings.', type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Network error while saving settings.', type: 'error' });
    } finally {
      setSavingSettings(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Handle Test Webhook
  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    try {
      const res = await fetch('/api/office/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: settings.discord_webhook_url }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ text: '✅ ' + data.message, type: 'success' });
      } else {
        setFeedback({ text: '❌ ' + (data.error || 'Webhook test failed'), type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Failed to connect to server for webhook test.', type: 'error' });
    } finally {
      setTestingWebhook(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  // Handle Test Bot Token Connection
  const handleTestBot = async () => {
    if (!settings.discord_bot_token.trim()) {
      setFeedback({ text: 'Please enter your Discord Bot Token first.', type: 'error' });
      setTimeout(() => setFeedback(null), 3500);
      return;
    }

    setTestingBot(true);
    try {
      const res = await fetch('/api/office/test-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: settings.discord_bot_token.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ text: data.message, type: 'success' });
      } else {
        setFeedback({ text: '❌ ' + (data.error || 'Bot login failed'), type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Failed to verify bot token with backend.', type: 'error' });
    } finally {
      setTestingBot(false);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.discord_username.toLowerCase().includes(q) ||
      (u.minecraft_username && u.minecraft_username.toLowerCase().includes(q)) ||
      u.discord_id.includes(q)
    );
  });

  const linkedCount = users.filter((u) => u.minecraft_username).length;

  return (
    <div className="office-page-layout">
      {/* Office Header */}
      <div className="office-header-glass">
        <div className="office-header-text">
          <div className="office-title-badge">
            <ShieldAlert size={22} color="#f43f5e" />
            <h2 className="office-title-text">Office Admin Dashboard</h2>
          </div>
          <p className="office-desc-text">
            Centralized management for Discord users, Minecraft IGN mappings, Bot configurations, and Webhooks.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="office-tab-switcher">
          <button 
            type="button"
            className={`office-switch-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} />
            <span>User Management ({users.length})</span>
          </button>
          <button 
            type="button"
            className={`office-switch-btn ${activeTab === 'moderation' ? 'active' : ''}`}
            onClick={() => setActiveTab('moderation')}
          >
            <ShieldBan size={16} />
            <span>Player Moderation ({bannedPlayers.length})</span>
          </button>
          <button 
            type="button"
            className={`office-switch-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={16} />
            <span>Webhook & Bot Settings</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div className={`office-alert-pill ${feedback.type}`}>
          {feedback.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Metric Stats Cards */}
      <div className="office-stats-row">
        <div className="metric-stat-card">
          <div className="metric-icon-wrap user-bg">
            <Users size={22} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Total Discord Users</span>
            <span className="metric-number">{users.length} Users</span>
          </div>
        </div>

        <div className="metric-stat-card">
          <div className="metric-icon-wrap ign-bg">
            <UserCheck size={22} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Linked Minecraft IGNs</span>
            <span className="metric-number">{linkedCount} / {users.length} Linked</span>
          </div>
        </div>

        <div className="metric-stat-card">
          <div className="metric-icon-wrap db-bg">
            <Database size={22} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Database Storage</span>
            <span className="metric-number">PostgreSQL (Local)</span>
          </div>
        </div>
      </div>

      {/* TAB 1: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="office-panel-card">
          <div className="office-panel-header">
            <div className="panel-title-group">
              <Users size={20} color="#818cf8" />
              <h3 className="panel-title-heading">Discord Users & Minecraft IGN Roster</h3>
            </div>

            <div className="panel-controls-group">
              <div className="search-input-wrapper">
                <Search size={15} color="#94a3b8" />
                <input 
                  type="text" 
                  placeholder="Search Discord username or IGN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-text-field"
                />
              </div>

              <button className="btn-icon-refresh" onClick={fetchUsers} disabled={loadingUsers} title="Refresh Data">
                <RefreshCw size={15} className={loadingUsers ? 'spin' : ''} />
              </button>
            </div>
          </div>

          <div className="table-container-responsive">
            <table className="office-data-table">
              <thead>
                <tr>
                  <th>Discord User</th>
                  <th>Discord ID</th>
                  <th>Minecraft In-Game Name (IGN)</th>
                  <th>Access Role</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-empty-row">
                      {loadingUsers ? 'Loading user data from PostgreSQL...' : 'No users match the search criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const currentEdit = editingUsers[u.id] || { ign: u.minecraft_username || '', role: u.role };
                    const isChanged = currentEdit.ign !== (u.minecraft_username || '') || currentEdit.role !== u.role;

                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="user-avatar-cell">
                            <img 
                              src={u.discord_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                              alt={u.discord_username}
                              className="table-avatar-img"
                            />
                            <div>
                              <div className="table-user-name">{u.discord_username}</div>
                              {u.id === currentUser?.id && <span className="current-user-chip">Your Account</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <code className="discord-id-tag">{u.discord_id}</code>
                        </td>
                        <td>
                          <div className="table-ign-cell">
                            <input 
                              type="text"
                              className="table-text-input"
                              placeholder="Enter Minecraft IGN"
                              value={currentEdit.ign}
                              onChange={(e) => {
                                setEditingUsers({
                                  ...editingUsers,
                                  [u.id]: { ...currentEdit, ign: e.target.value },
                                });
                              }}
                            />
                            {u.minecraft_username ? (
                              <span className="ign-status-pill linked" title="Account Linked">✓ Linked</span>
                            ) : (
                              <span className="ign-status-pill unlinked" title="Not Linked">Not Linked</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <select 
                            className="table-role-select"
                            value={currentEdit.role}
                            onChange={(e) => {
                              setEditingUsers({
                                ...editingUsers,
                                [u.id]: { ...currentEdit, role: e.target.value as 'admin' | 'user' },
                              });
                            }}
                          >
                            <option value="user">⚔️ Member</option>
                            <option value="admin">👑 Administrator</option>
                          </select>
                        </td>
                        <td>
                          <div className="table-actions-cell">
                            <button 
                              className={`btn-table-save ${isChanged ? 'highlight' : ''}`}
                              onClick={() => handleSaveUser(u)}
                              title="Save User Changes"
                            >
                              <Save size={14} />
                              <span>Save</span>
                            </button>

                            <button 
                              className="btn-table-delete"
                              onClick={() => handleDeleteUser(u.id, u.discord_username)}
                              title="Delete User Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PLAYER MODERATION (KICK & BAN) */}
      {activeTab === 'moderation' && (
        <div className="office-panel-card">
          <div className="office-panel-header">
            <div className="panel-title-group">
              <ShieldBan size={20} color="#f43f5e" />
              <h3 className="panel-title-heading">Player Moderation & Server Enforcement</h3>
            </div>
            <button className="btn-icon-refresh" onClick={fetchBannedPlayers} disabled={loadingBanned} title="Refresh Banlist">
              <RefreshCw size={15} className={loadingBanned ? 'spin' : ''} />
            </button>
          </div>

          {/* Quick Kick & Ban Action Cards */}
          <div className="moderation-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {/* Kick Card */}
            <form onSubmit={handleKickPlayer} className="form-field-card" style={{ background: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <UserX size={18} color="#f59e0b" />
                <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700 }}>Kick In-Game Player</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input 
                  type="text" 
                  className="settings-text-field"
                  placeholder="Minecraft Player IGN (e.g. Steve)"
                  value={kickForm.username}
                  onChange={(e) => setKickForm({ ...kickForm, username: e.target.value })}
                  required
                />
                <input 
                  type="text" 
                  className="settings-text-field"
                  placeholder="Reason (e.g. AFK, Spamming chat)"
                  value={kickForm.reason}
                  onChange={(e) => setKickForm({ ...kickForm, reason: e.target.value })}
                />
                <button 
                  type="submit" 
                  className="btn-primary-save" 
                  style={{ background: '#d97706', borderColor: '#b45309' }}
                  disabled={submittingMod || !kickForm.username.trim()}
                >
                  <UserX size={15} />
                  <span>{submittingMod ? 'Kicking...' : 'Kick Player From Server'}</span>
                </button>
              </div>
            </form>

            {/* Ban Card */}
            <form onSubmit={handleBanPlayer} className="form-field-card" style={{ background: 'rgba(244, 63, 94, 0.05)', borderColor: 'rgba(244, 63, 94, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Ban size={18} color="#f43f5e" />
                <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700 }}>Permanent Ban Player</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input 
                  type="text" 
                  className="settings-text-field"
                  placeholder="Minecraft Player IGN (e.g. Steve)"
                  value={banForm.username}
                  onChange={(e) => setBanForm({ ...banForm, username: e.target.value })}
                  required
                />
                <input 
                  type="text" 
                  className="settings-text-field"
                  placeholder="Ban Reason (e.g. Hacking, Toxicity)"
                  value={banForm.reason}
                  onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                  required
                />
                <button 
                  type="submit" 
                  className="btn-primary-save" 
                  style={{ background: '#e11d48', borderColor: '#be123c' }}
                  disabled={submittingMod || !banForm.username.trim()}
                >
                  <Ban size={15} />
                  <span>{submittingMod ? 'Banning...' : 'Ban Player Permanently'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Server Player Directory (Active within 14 Days) */}
          <div style={{ marginBottom: '32px' }}>
            <div className="office-panel-header" style={{ padding: '12px 0', borderBottom: '1px solid var(--border-subtle)', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={18} color="#38bdf8" />
                <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Server Player Directory</h4>
                <span className="badge-role-admin" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                  🛡️ 14-Day Auto-Retention
                </span>
              </div>
              <button 
                className="btn-icon-refresh" 
                onClick={fetchKnownPlayers} 
                disabled={loadingKnown} 
                title="Refresh Player Directory"
              >
                <RefreshCw size={15} className={loadingKnown ? 'spin' : ''} />
              </button>
            </div>

            <div className="table-container-responsive">
              <table className="office-data-table">
                <thead>
                  <tr>
                    <th>Player IGN</th>
                    <th>Live Status</th>
                    <th>First Joined</th>
                    <th>Last Active</th>
                    <th style={{ textAlign: 'center' }}>Quick Moderation</th>
                  </tr>
                </thead>
                <tbody>
                  {knownPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="table-empty-row">
                        {loadingKnown ? 'Loading player directory...' : 'No players recorded in the last 14 days.'}
                      </td>
                    </tr>
                  ) : (
                    knownPlayers.map((p, idx) => (
                      <tr key={idx}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img 
                              src={`https://mc-heads.net/avatar/${encodeURIComponent(p.username)}/24`}
                              alt=""
                              style={{ width: '24px', height: '24px', borderRadius: '4px', imageRendering: 'pixelated' }}
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                            <span style={{ fontWeight: 700, color: '#f8fafc' }}>{p.username}</span>
                          </div>
                        </td>
                        <td>
                          {p.isOnline ? (
                            <span className="badge-role-admin" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                              ● Online Now
                            </span>
                          ) : (
                            <span className="badge-role-user">
                              Offline
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {new Date(p.first_seen).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                            {new Date(p.last_seen).toLocaleString()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn-table-save"
                              style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b', padding: '4px 8px', fontSize: '0.75rem' }}
                              onClick={() => {
                                setKickForm({ ...kickForm, username: p.username });
                                setFeedback({ text: `Prefilled ${p.username} for Kick action.`, type: 'success' });
                                setTimeout(() => setFeedback(null), 3000);
                              }}
                              title={`Prefill ${p.username} for Kick`}
                            >
                              <UserX size={12} />
                              <span>Kick</span>
                            </button>
                            <button
                              type="button"
                              className="btn-table-save"
                              style={{ background: 'rgba(244, 63, 94, 0.15)', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '4px 8px', fontSize: '0.75rem' }}
                              onClick={() => {
                                setBanForm({ ...banForm, username: p.username });
                                setFeedback({ text: `Prefilled ${p.username} for Ban action.`, type: 'success' });
                                setTimeout(() => setFeedback(null), 3000);
                              }}
                              title={`Prefill ${p.username} for Ban`}
                            >
                              <Ban size={12} />
                              <span>Ban</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Banned Players Table */}
          <div className="panel-title-group" style={{ marginBottom: '12px' }}>
            <Ban size={18} color="#f43f5e" />
            <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700 }}>Active Blacklist / Banned Players</h4>
          </div>

          <div className="table-container-responsive">
            <table className="office-data-table">
              <thead>
                <tr>
                  <th>Player IGN</th>
                  <th>Ban Reason</th>
                  <th>Banned By</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {bannedPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-empty-row">
                      {loadingBanned ? 'Loading banlist...' : 'No players currently banned.'}
                    </td>
                  </tr>
                ) : (
                  bannedPlayers.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img 
                            src={`https://mc-heads.net/avatar/${encodeURIComponent(b.username)}/24`}
                            alt=""
                            style={{ width: '24px', height: '24px', borderRadius: '4px', imageRendering: 'pixelated' }}
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                          <span style={{ fontWeight: 700, color: '#fda4af' }}>{b.username}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>{b.reason || 'Banned by Admin'}</span>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{b.banned_by || 'Admin'}</code>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(b.created_at).toLocaleString()}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          type="button"
                          className="btn-table-save"
                          style={{ background: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
                          onClick={() => handleUnbanPlayer(b.username)}
                        >
                          <Check size={14} />
                          <span>Unban</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS & WEBHOOK */}
      {activeTab === 'settings' && (
        <div className="office-panel-card">
          <div className="office-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div className="panel-title-group">
              <Settings size={20} color="#818cf8" />
              <h3 className="panel-title-heading">Discord Webhook, 2-Way Bot & Bedrock API Settings</h3>
            </div>

            <button
              type="button"
              className="btn-action-test"
              style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.4)', color: '#a5b4fc', padding: '8px 14px' }}
              onClick={() => setShowGuideSheet(true)}
            >
              <BookOpen size={16} color="#818cf8" />
              <span>📖 Discord Setup Tutorial</span>
            </button>
          </div>

          <form onSubmit={handleSaveSettings} className="settings-form-layout">
            {/* Discord Webhook Configuration */}
            <div className="form-field-card">
              <label className="field-label-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="field-title">Discord Webhook URL</span>
                  <Tooltip content="Webhook URL from Discord (Channel Settings → Integrations → Webhooks). Automatically sends chat & game events to Discord." />
                </div>
                <span className="field-subtitle">Discord Channel Webhook URL to automatically forward chat and join/leave/death game events</span>
              </label>
              
              <div className="field-input-action-row">
                <input 
                  type="url"
                  className="settings-text-field"
                  placeholder="https://discord.com/api/webhooks/123456789/your_webhook_token"
                  value={settings.discord_webhook_url}
                  onChange={(e) => setSettings({ ...settings, discord_webhook_url: e.target.value })}
                />

                <button 
                  type="button" 
                  className="btn-action-test"
                  onClick={handleTestWebhook}
                  disabled={testingWebhook || !settings.discord_webhook_url}
                >
                  <Send size={15} />
                  <span>{testingWebhook ? 'Testing...' : 'Test Webhook'}</span>
                </button>
              </div>
            </div>

            {/* Discord Bot Token */}
            <div className="form-field-card">
              <label className="field-label-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="field-title">Discord Bot Token (2-Way Chat Discord ↔ Minecraft)</span>
                    <Tooltip content="Secret Bot Token from Discord Developer Portal → Bot tab. Required for 2-way incoming chat listener (Discord → Minecraft/Web)." />
                  </div>
                  {settings.discord_bot_token ? (
                    <span className="badge-role-admin" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                      ● Token Saved
                    </span>
                  ) : (
                    <span className="badge-role-admin" style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#fda4af', borderColor: 'rgba(244, 63, 94, 0.4)' }}>
                      ● Not Configured
                    </span>
                  )}
                </div>
                <span className="field-subtitle">
                  Bot Token from Discord Developer Portal → Menu <strong>Bot</strong> → <strong>Reset Token</strong>. <em>(Required for Discord → Web/Game 2-Way chat)</em>
                </span>
              </label>

              <div className="field-input-action-row">
                <div className="field-icon-input-wrapper" style={{ flex: 1 }}>
                  <Bot size={16} color="#818cf8" />
                  <input 
                    type={showBotToken ? "text" : "password"}
                    className="settings-text-field no-border"
                    placeholder="Paste secret Bot Token here (e.g. MTA5...)"
                    value={settings.discord_bot_token}
                    onChange={(e) => setSettings({ ...settings, discord_bot_token: e.target.value })}
                  />
                  <button 
                    type="button" 
                    className="btn-toggle-eye"
                    onClick={() => setShowBotToken(!showBotToken)}
                  >
                    {showBotToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button 
                  type="button" 
                  className="btn-action-test"
                  onClick={handleTestBot}
                  disabled={testingBot || !settings.discord_bot_token}
                  title="Test Bot Token Login"
                >
                  <Bot size={15} />
                  <span>{testingBot ? 'Testing...' : 'Test Bot'}</span>
                </button>
              </div>
            </div>

            {/* Target Channel ID */}
            <div className="form-field-card">
              <label className="field-label-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="field-title">Target Discord Channel ID (Optional)</span>
                  <Tooltip content="18-19 digit numeric channel ID (e.g. 1201501389952663688). Restricts the bot listener strictly to this text channel." />
                </div>
                <span className="field-subtitle">Text channel ID where the Bot listens to chat messages to forward into Minecraft</span>
              </label>
              <div className="field-icon-input-wrapper">
                <Hash size={16} color="#94a3b8" />
                <input 
                  type="text"
                  className="settings-text-field no-border"
                  placeholder="e.g. 1201501390330134607"
                  value={settings.discord_channel_id}
                  onChange={(e) => setSettings({ ...settings, discord_channel_id: e.target.value })}
                />
              </div>
            </div>

            {/* Discord Server Invite Link (Join Channel) */}
            <div className="form-field-card">
              <label className="field-label-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="field-title">Discord Server Invite URL (Join Our Server)</span>
                  <Tooltip content="Permanent invite link (e.g. https://discord.gg/abc123). Displayed on Web Live Chat sidebar so unlinked players can join." />
                </div>
                <span className="field-subtitle">Permanent invite URL for your Discord server (e.g. <code>https://discord.gg/abcde123</code>) for unjoined players</span>
              </label>
              <div className="field-input-action-row">
                <input 
                  type="url"
                  className="settings-text-field"
                  placeholder="https://discord.gg/your_invite_code"
                  value={settings.discord_invite_url}
                  onChange={(e) => setSettings({ ...settings, discord_invite_url: e.target.value })}
                />
                {settings.discord_invite_url && (
                  <a 
                    href={settings.discord_invite_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn-action-test"
                    style={{ textDecoration: 'none', background: 'rgba(88, 101, 242, 0.2)', borderColor: 'rgba(88, 101, 242, 0.4)', color: '#a5b4fc' }}
                  >
                    Open Link
                  </a>
                )}
              </div>
            </div>

            {/* Bedrock API Bearer Token Generator */}
            <div className="form-field-card">
              <label className="field-label-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="field-title">Bedrock Server API Key (Secret Bearer Token)</span>
                  <Tooltip content="Shared secret bearer token between Minecraft Bedrock Behavior Pack (MGC_Bridge[BP]/scripts/main.js) and this Hono backend." />
                </div>
                <span className="field-subtitle">Secret Bearer Key required for authenticating Minecraft Bedrock Script API to Hono</span>
              </label>
              
              <div className="field-input-action-row">
                <div className="field-icon-input-wrapper" style={{ flex: 1 }}>
                  <Key size={16} color="#94a3b8" />
                  <input 
                    type="text"
                    className="settings-text-field no-border"
                    value={settings.api_key}
                    onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
                    required
                  />
                </div>

                <button 
                  type="button" 
                  className="btn-generate-token"
                  onClick={handleGenerateApiKey}
                  title="Generate New Secure Random Bearer Token"
                >
                  <Sparkles size={15} />
                  <span>Generate New Token</span>
                </button>
              </div>

              {/* Script Snippet Box */}
              <div className="script-snippet-preview">
                <div className="snippet-header">
                  <span className="snippet-title">
                    <FileCode size={14} color="#38bdf8" />
                    Snippet for <code>MGC_Bridge[BP]/scripts/main.js</code>
                  </span>
                  <button 
                    type="button" 
                    className="btn-copy-snippet"
                    onClick={handleCopySnippet}
                  >
                    {copiedSnippet ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                    <span>{copiedSnippet ? 'Copied!' : 'Copy Snippet'}</span>
                  </button>
                </div>
                <pre className="snippet-code-body">
{`const HONO_BACKEND_URL = "${window.location.origin}/api/game";
const API_KEY = "${settings.api_key || 'SECRET_BEARER_TOKEN'}";`}
                </pre>
              </div>
            </div>

            {/* Server Display Name */}
            <div className="form-field-card">
              <label className="field-label-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="field-title">Minecraft Server Display Name</span>
                  <Tooltip content="Custom server label displayed across Discord Bot embeds and Web Dashboard headers." />
                </div>
                <span className="field-subtitle">Server name label displayed across Discord Bot and Web Dashboard</span>
              </label>
              <input 
                type="text"
                className="settings-text-field"
                value={settings.server_name}
                onChange={(e) => setSettings({ ...settings, server_name: e.target.value })}
              />
            </div>

            <div className="form-submit-row">
              <button 
                type="submit" 
                className="btn-primary-save"
                disabled={savingSettings}
              >
                <Save size={16} />
                <span>{savingSettings ? 'Saving to PostgreSQL...' : 'Save Settings to Database'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          1. DISCORD DEVELOPER SETUP TUTORIAL GUIDE SHEET
          ======================================================== */}
      <Sheet
        isOpen={showGuideSheet}
        onClose={() => setShowGuideSheet(false)}
        maxWidth="540px"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color="#818cf8" />
            <span>Discord Setup Tutorial Guide</span>
          </div>
        }
        description="Step-by-step instructions to configure Discord Webhook, Bot Token, and 2-Way Chat sync."
        footer={
          <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <a 
              href="https://discord.com/developers/applications" 
              target="_blank" 
              rel="noreferrer"
              className="guide-quick-link-btn"
            >
              <span>Discord Developer Portal</span>
              <ExternalLink size={13} />
            </a>

            <button 
              type="button" 
              className="btn-primary-save" 
              onClick={() => setShowGuideSheet(false)}
            >
              <span>Got it, Close Guide</span>
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Overview Callout */}
          <div className="office-alert-pill info" style={{ margin: 0 }}>
            <Info size={18} />
            <span style={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
              Follow these 4 simple steps to connect your Minecraft Bedrock Server with your Discord Community.
            </span>
          </div>

          {/* Step 1: Webhook */}
          <div className="guide-step-card">
            <div className="guide-step-header">
              <span className="guide-step-num">1</span>
              <h4 className="guide-step-title">Create Discord Webhook (Outbox)</h4>
            </div>
            <p className="guide-step-desc">
              Webhooks forward game chat, joins, leaves, and death alerts into Discord.
            </p>
            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>In Discord, right-click your chat channel (e.g. <code>#ingame-chat</code>) → <strong>Edit Channel</strong>.</li>
              <li>Go to <strong>Integrations</strong> → <strong>Webhooks</strong> → <strong>New Webhook</strong>.</li>
              <li>Click <strong>Copy Webhook URL</strong> and paste into the <em>Discord Webhook URL</em> field.</li>
            </ol>
          </div>

          {/* Step 2: Bot & Intent */}
          <div className="guide-step-card" style={{ borderColor: 'rgba(99, 102, 241, 0.3)', background: 'rgba(99, 102, 241, 0.05)' }}>
            <div className="guide-step-header">
              <span className="guide-step-num">2</span>
              <h4 className="guide-step-title">Discord Bot Token & Message Content Intent</h4>
            </div>
            <p className="guide-step-desc">
              Required so the Bot can listen to messages typed in Discord and forward them to Minecraft Bedrock & Web.
            </p>
            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Open <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" style={{ color: '#818cf8', textDecoration: 'underline' }}>Discord Developer Portal</a> → select your Application.</li>
              <li>Click menu <strong>Bot</strong> in the left sidebar.</li>
              <li>Click <strong>Reset Token</strong> → <strong>Copy Token</strong> → Paste into <em>Discord Bot Token</em> field.</li>
              <li><strong style={{ color: '#fbbf24' }}>Crucial:</strong> Scroll down to <em>Privileged Gateway Intents</em> and toggle <strong>ON</strong>:
                <div style={{ marginTop: '4px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="guide-code-pill" style={{ padding: '2px 8px', fontSize: '0.72rem' }}>✅ MESSAGE CONTENT INTENT</span>
                  <span className="guide-code-pill" style={{ padding: '2px 8px', fontSize: '0.72rem' }}>✅ SERVER MEMBERS INTENT</span>
                </div>
              </li>
              <li>Click <strong>Save Changes</strong>.</li>
            </ol>
          </div>

          {/* Step 3: Target Channel ID */}
          <div className="guide-step-card">
            <div className="guide-step-header">
              <span className="guide-step-num">3</span>
              <h4 className="guide-step-title">Get Target Discord Channel ID</h4>
            </div>
            <p className="guide-step-desc">
              Locks bot chat listening strictly to your designated game channel.
            </p>
            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>In Discord, enable <strong>Developer Mode</strong> (<em>User Settings → Advanced → Developer Mode</em>).</li>
              <li>Right-click your <code>#ingame-chat</code> channel → Click <strong>Copy Channel ID</strong>.</li>
              <li>Paste into <em>Target Discord Channel ID</em> field.</li>
            </ol>
          </div>

          {/* Step 4: Bot Invite */}
          <div className="guide-step-card">
            <div className="guide-step-header">
              <span className="guide-step-num">4</span>
              <h4 className="guide-step-title">Invite Bot to Your Server</h4>
            </div>
            <p className="guide-step-desc">
              Ensure your Bot is present in your Discord server with message permissions.
            </p>
            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>In Developer Portal, go to <strong>OAuth2</strong> → <strong>URL Generator</strong>.</li>
              <li>Select Scopes: <code>bot</code> and <code>applications.commands</code>.</li>
              <li>Select Permissions: <code>Send Messages</code>, <code>Read Message History</code>, <code>Embed Links</code>.</li>
              <li>Open generated URL in your browser to invite the bot to your Discord server!</li>
            </ol>
          </div>
        </div>
      </Sheet>

      {/* ========================================================
          2. UNBAN PLAYER CONFIRMATION SHEET
          ======================================================== */}
      <Sheet
        isOpen={!!unbanTarget}
        onClose={() => setUnbanTarget(null)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={20} color="#34d399" />
            <span>Unban Minecraft Player</span>
          </div>
        }
        description="Remove player from the database blacklist and allow them to rejoin the server."
        footer={
          <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn-modal-cancel" 
              onClick={() => setUnbanTarget(null)}
              disabled={submittingAction}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn-primary-save"
              style={{ background: '#059669', borderColor: '#047857' }}
              onClick={handleExecuteUnban}
              disabled={submittingAction}
            >
              {submittingAction ? 'Unbanning...' : 'Confirm Unban Player'}
            </button>
          </div>
        }
      >
        {unbanTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}>
              <img 
                src={`https://mc-heads.net/avatar/${encodeURIComponent(unbanTarget)}/44`} 
                alt=""
                style={{ width: '44px', height: '44px', borderRadius: '8px', imageRendering: 'pixelated' }}
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Player IGN</span>
                <h4 style={{ color: '#f8fafc', fontSize: '1.1rem', margin: 0 }}>{unbanTarget}</h4>
              </div>
            </div>

            <div className="office-alert-pill info" style={{ margin: 0 }}>
              <Info size={16} />
              <span style={{ fontSize: '0.8rem' }}>
                Unbanning this player will remove their record from <code>banned_players</code>. They will be able to reconnect to Minecraft Bedrock immediately.
              </span>
            </div>
          </div>
        )}
      </Sheet>

      {/* ========================================================
          3. DELETE USER CONFIRMATION SHEET
          ======================================================== */}
      <Sheet
        isOpen={!!deleteUserTarget}
        onClose={() => setDeleteUserTarget(null)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={20} color="#f43f5e" />
            <span>Delete User Account</span>
          </div>
        }
        description="Permanently delete user profile mapping and revoke administrative dashboard access."
        footer={
          <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn-modal-cancel" 
              onClick={() => setDeleteUserTarget(null)}
              disabled={submittingAction}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn-primary-save"
              style={{ background: '#e11d48', borderColor: '#be123c' }}
              onClick={handleExecuteDeleteUser}
              disabled={submittingAction}
            >
              {submittingAction ? 'Deleting...' : 'Confirm Delete User'}
            </button>
          </div>
        }
      >
        {deleteUserTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target User</span>
                <h4 style={{ color: '#fda4af', fontSize: '1.1rem', margin: 0 }}>@{deleteUserTarget.username}</h4>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>User ID: #{deleteUserTarget.id}</span>
              </div>
            </div>

            <div className="office-alert-pill error" style={{ margin: 0 }}>
              <AlertTriangle size={16} />
              <span style={{ fontSize: '0.8rem' }}>
                Warning: This will unlink the Discord account from Minecraft IGN and delete user records from PostgreSQL. This action cannot be undone.
              </span>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
};
