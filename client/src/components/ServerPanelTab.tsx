import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Play, 
  Square, 
  RotateCw, 
  Power, 
  Terminal, 
  Send, 
  RefreshCw, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle,
  Layers,
  Settings
} from 'lucide-react';
import { PanelSetupGuideSheet } from './PanelSetupGuideSheet.tsx';

interface ServerPanelTabProps {
  onRefreshAll?: () => void;
}

interface PanelStats {
  status: 'running' | 'starting' | 'stopping' | 'offline' | 'error';
  cpuPercent: number;
  memoryBytes: number;
  memoryLimitBytes: number;
  diskBytes: number;
  uptimeMs: number;
  provider: 'pterodactyl' | 'crafty' | 'none';
}

export const ServerPanelTab: React.FC<ServerPanelTabProps> = () => {
  const [stats, setStats] = useState<PanelStats | null>(null);
  const [configured, setConfigured] = useState<boolean>(false);
  const [provider, setProvider] = useState<'none' | 'pterodactyl' | 'crafty'>('none');
  const [serverName, setServerName] = useState<string>('Minecraft Bedrock Server');
  const [activePlayersCount, setActivePlayersCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Command input
  const [consoleCmd, setConsoleCmd] = useState<string>('');
  const [consoleLogs, setConsoleLogs] = useState<Array<{ text: string; type: 'cmd' | 'info' | 'err'; ts: string }>>([
    { text: 'Office BDS Console ready. Type a command below.', type: 'info', ts: new Date().toLocaleTimeString('id-ID') }
  ]);

  // Panel settings form
  const [panelUrl, setPanelUrl] = useState<string>('');
  const [panelServerId, setPanelServerId] = useState<string>('');
  const [panelApiKey, setPanelApiKey] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Tutorial Sheet
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  const fetchPanelData = async () => {
    setLoading(true);
    try {
      // 1. Fetch live stats
      const statsRes = await fetch('/api/office/server/stats');
      const statsData = await statsRes.json();
      if (statsRes.ok) {
        setConfigured(statsData.configured);
        setProvider(statsData.provider);
        setStats(statsData.stats);
        setServerName(statsData.serverName || 'Minecraft Bedrock Server');
        setActivePlayersCount(statsData.activePlayersCount || 0);
      }

      // 2. Fetch current panel settings
      const setRes = await fetch('/api/office/settings');
      const setData = await setRes.json();
      if (setRes.ok && setData.settings) {
        setProvider(setData.settings.server_panel_provider || 'none');
        setPanelUrl(setData.settings.panel_url || '');
        setPanelServerId(setData.settings.panel_server_id || '');
        setPanelApiKey(setData.settings.panel_api_key || '');
      }
    } catch (e) {
      console.error('Failed to fetch server panel data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPanelData();
    const interval = setInterval(fetchPanelData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSavePanelSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/office/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server_panel_provider: provider,
          panel_url: panelUrl.trim(),
          panel_server_id: panelServerId.trim(),
          panel_api_key: panelApiKey.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ text: 'Panel configuration saved to database successfully!', type: 'success' });
        setTimeout(fetchPanelData, 1000);
      } else {
        setFeedback({ text: data.error || 'Failed to save settings', type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Network connection failed', type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestConnection = async () => {
    if (provider === 'none') {
      setFeedback({ text: 'Please select Pterodactyl or Crafty Controller first', type: 'error' });
      return;
    }
    setTestingConnection(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/office/server/test-panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          panelUrl: panelUrl.trim(),
          serverId: panelServerId.trim(),
          apiKey: panelApiKey.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ text: data.message || 'Connection successful!', type: 'success' });
        setStats(data.stats);
        setConfigured(true);
      } else {
        setFeedback({ text: data.error || 'Connection failed', type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ text: 'Network connection error during test', type: 'error' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handlePowerAction = async (signal: 'start' | 'stop' | 'restart' | 'kill') => {
    if (!confirm(`Are you sure you want to send power signal "${signal.toUpperCase()}" to the server?`)) {
      return;
    }

    try {
      const res = await fetch('/api/office/server/power', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ text: data.message || `Signal "${signal}" sent!`, type: 'success' });
        setConsoleLogs(prev => [
          ...prev, 
          { text: `⚡ [POWER ACTION]: Dispatched ${signal.toUpperCase()}`, type: 'info', ts: new Date().toLocaleTimeString('id-ID') }
        ]);
        setTimeout(fetchPanelData, 2000);
      } else {
        setFeedback({ text: data.error || 'Failed to dispatch power action', type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Network connection failed', type: 'error' });
    }
  };

  const handleSendConsoleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleCmd.trim()) return;

    const cmd = consoleCmd.trim();
    setConsoleCmd('');

    setConsoleLogs(prev => [
      ...prev,
      { text: `> ${cmd}`, type: 'cmd', ts: new Date().toLocaleTimeString('id-ID') }
    ]);

    try {
      const res = await fetch('/api/office/server/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });

      const data = await res.json();
      if (res.ok) {
        setConsoleLogs(prev => [
          ...prev,
          { text: `✓ Command executed: ${data.message || 'OK'}`, type: 'info', ts: new Date().toLocaleTimeString('id-ID') }
        ]);
      } else {
        setConsoleLogs(prev => [
          ...prev,
          { text: `✗ Command error: ${data.error || 'Failed'}`, type: 'err', ts: new Date().toLocaleTimeString('id-ID') }
        ]);
      }
    } catch (err) {
      setConsoleLogs(prev => [
        ...prev,
        { text: `✗ Network connection error`, type: 'err', ts: new Date().toLocaleTimeString('id-ID') }
      ]);
    }
  };

  const formatMemory = (bytes: number) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${Math.round(mb)} MB`;
  };

  const formatDisk = (bytes: number) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${Math.round(mb)} MB`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Controls & Status Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={22} color="#38bdf8" />
            <span>Server Management & Hardware Controls</span>
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Monitor real-time resources for <strong style={{ color: '#f8fafc' }}>{serverName}</strong>, trigger power operations, and dispatch Bedrock commands.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={() => setIsGuideOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '8px 14px' }}
          >
            <HelpCircle size={15} color="#38bdf8" />
            <span>Setup Tutorial</span>
          </button>

          <button
            type="button"
            className="btn-modal-cancel"
            onClick={fetchPanelData}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '8px 14px' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`feedback-msg ${feedback.type}`} style={{ margin: 0 }}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 1. Live Hardware Telemetry Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {/* Server State */}
        <div className="card-glass" style={{ padding: 16 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Server size={14} color="#818cf8" />
            <span>Server Power State</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span 
              className={`status-pill ${stats?.status === 'running' ? 'online' : 'offline'}`}
              style={{ fontSize: '0.85rem', fontWeight: 800, padding: '4px 10px', textTransform: 'uppercase' }}
            >
              {stats ? stats.status : (configured ? 'OFFLINE' : 'STANDBY')}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              ({provider.toUpperCase()})
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Online Players: <strong style={{ color: '#38bdf8' }}>{activePlayersCount}</strong>
          </div>
        </div>

        {/* CPU Usage */}
        <div className="card-glass" style={{ padding: 16 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Cpu size={14} color="#38bdf8" />
            <span>CPU Utilization</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
            {stats ? `${stats.cpuPercent}%` : '—'}
          </div>
          <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginTop: 10 }}>
            <div 
              style={{ 
                width: `${Math.min(100, stats?.cpuPercent || 0)}%`, 
                height: '100%', 
                background: (stats?.cpuPercent || 0) > 80 ? '#ef4444' : '#38bdf8',
                transition: 'width 0.3s ease'
              }} 
            />
          </div>
        </div>

        {/* Memory RAM */}
        <div className="card-glass" style={{ padding: 16 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Layers size={14} color="#34d399" />
            <span>Memory (RAM)</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
            {stats ? formatMemory(stats.memoryBytes) : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Limit: {stats?.memoryLimitBytes ? formatMemory(stats.memoryLimitBytes) : 'Dynamic'}
          </div>
        </div>

        {/* Disk Usage */}
        <div className="card-glass" style={{ padding: 16 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <HardDrive size={14} color="#fbbf24" />
            <span>Storage Disk</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
            {stats ? formatDisk(stats.diskBytes) : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Dedicated BDS Data
          </div>
        </div>
      </div>

      {/* 2. Power Actions Bar */}
      <div className="card-glass" style={{ padding: 18 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 12 }}>
          Server Power Controls
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button
            type="button"
            onClick={() => handlePowerAction('start')}
            disabled={provider === 'none'}
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: provider === 'none' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Play size={16} />
            <span>Start Server</span>
          </button>

          <button
            type="button"
            onClick={() => handlePowerAction('restart')}
            disabled={provider === 'none'}
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: provider === 'none' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <RotateCw size={16} />
            <span>Restart Server</span>
          </button>

          <button
            type="button"
            onClick={() => handlePowerAction('stop')}
            disabled={provider === 'none'}
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#fbbf24',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: provider === 'none' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Square size={16} />
            <span>Graceful Stop</span>
          </button>

          <button
            type="button"
            onClick={() => handlePowerAction('kill')}
            disabled={provider === 'none'}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: provider === 'none' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Power size={16} />
            <span>Force Kill</span>
          </button>
        </div>
      </div>

      {/* 3. Server Console Terminal */}
      <div className="card-glass" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Terminal size={15} color="#38bdf8" />
            <span>Interactive Server Console</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Direct BDS / Script API Command Channel
          </span>
        </div>

        {/* Terminal Screen */}
        <div style={{ 
          background: '#090d16', 
          border: '1px solid rgba(255,255,255,0.08)', 
          borderRadius: 8, 
          padding: 14, 
          height: 180, 
          overflowY: 'auto', 
          fontFamily: 'monospace', 
          fontSize: '0.8rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          {consoleLogs.map((log, idx) => (
            <div key={idx} style={{ color: log.type === 'cmd' ? '#38bdf8' : log.type === 'err' ? '#f87171' : '#cbd5e1' }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', marginRight: 8 }}>[{log.ts}]</span>
              <span>{log.text}</span>
            </div>
          ))}
        </div>

        {/* Command Input Bar */}
        <form onSubmit={handleSendConsoleCommand} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 12, top: 12, color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700 }}>/</span>
            <input 
              type="text" 
              className="settings-text-field"
              placeholder="say Hello server!, gamemode c Steve, time set day..."
              value={consoleCmd}
              onChange={(e) => setConsoleCmd(e.target.value)}
              style={{ margin: 0, paddingLeft: 26, fontFamily: 'monospace' }}
            />
          </div>
          <button type="submit" className="btn-primary-save" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px' }}>
            <Send size={15} />
            <span>Execute</span>
          </button>
        </form>
      </div>

      {/* 4. Panel Credentials & Provider Settings */}
      <div className="card-glass" style={{ padding: 20 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Settings size={16} color="#818cf8" />
          <span>Panel Provider & API Configuration</span>
        </div>

        <form onSubmit={handleSavePanelSettings} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Provider Select */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: 6 }}>
              Select Server Panel Provider
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {[
                { id: 'none', label: 'None (Script API Only)', desc: 'Full in-game chat & inventory without external panel' },
                { id: 'pterodactyl', label: 'Pterodactyl Panel', desc: 'Connect via Client API Key (ptlc_...)' },
                { id: 'crafty', label: 'Crafty Controller', desc: 'Connect via Crafty v4 API Token' },
              ].map(p => (
                <div
                  key={p.id}
                  onClick={() => setProvider(p.id as any)}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: provider === p.id ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                    background: provider === p.id ? 'rgba(56, 189, 248, 0.1)' : 'rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: provider === p.id ? '#38bdf8' : '#f8fafc' }}>
                    {p.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {p.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {provider !== 'none' && (
            <>
              {/* Panel Base URL */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: 6 }}>
                  {provider === 'pterodactyl' ? 'Pterodactyl Base URL' : 'Crafty Controller URL'}
                </label>
                <input 
                  type="url" 
                  className="settings-text-field"
                  placeholder={provider === 'pterodactyl' ? 'https://panel.yourdomain.com' : 'https://crafty.yourdomain.com:8443'}
                  value={panelUrl}
                  onChange={(e) => setPanelUrl(e.target.value)}
                  style={{ margin: 0 }}
                  required
                />
              </div>

              {/* Server ID / UUID */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: 6 }}>
                  {provider === 'pterodactyl' ? 'Server Identifier / Short UUID' : 'Crafty Server ID'}
                </label>
                <input 
                  type="text" 
                  className="settings-text-field"
                  placeholder={provider === 'pterodactyl' ? 'e.g. c74fa092' : 'e.g. 1 or server-uuid'}
                  value={panelServerId}
                  onChange={(e) => setPanelServerId(e.target.value)}
                  style={{ margin: 0 }}
                  required
                />
              </div>

              {/* API Key / Token */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: 6 }}>
                  {provider === 'pterodactyl' ? 'Client API Key (starts with ptlc_)' : 'Crafty API Token'}
                </label>
                <input 
                  type="password" 
                  className="settings-text-field"
                  placeholder={provider === 'pterodactyl' ? 'ptlc_xxxxxxxxxxxxxxxxxxxx' : 'crafty_xxxxxxxxxxxxxxxxxxxx'}
                  value={panelApiKey}
                  onChange={(e) => setPanelApiKey(e.target.value)}
                  style={{ margin: 0 }}
                  required
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            {provider !== 'none' && (
              <button 
                type="button" 
                className="btn-modal-cancel"
                onClick={handleTestConnection}
                disabled={testingConnection || savingSettings}
              >
                {testingConnection ? 'Testing...' : 'Test Connection'}
              </button>
            )}
            <button 
              type="submit" 
              className="btn-primary-save"
              disabled={savingSettings}
            >
              {savingSettings ? 'Saving...' : 'Save Panel Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/* Tutorial Guide Sheet */}
      <PanelSetupGuideSheet 
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        defaultTab={provider === 'crafty' ? 'crafty' : 'pterodactyl'}
      />
    </div>
  );
};
