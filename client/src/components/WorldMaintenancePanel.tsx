import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ShieldCheck, 
  RefreshCw, 
  HardDrive, 
  Sparkles, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Compass,
  Check
} from 'lucide-react';

interface WorldStats {
  worldFolder: string;
  dbPath: string;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  totalFiles: number;
  estimatedTotalChunks: number;
  protectedZonesCount: number;
  estimatedProtectedChunks: number;
  estimatedPrunableChunks: number;
  estimatedSpaceSavingsBytes: number;
  estimatedSpaceSavingsFormatted: string;
  lastPruneTimestamp: string | null;
  serverRunning: boolean;
  panelConnected?: boolean;
  panelProvider?: string;
}

interface ProtectedZone {
  id: string;
  name: string;
  type: string;
  dimension: string;
  minChunkX: number;
  minChunkZ: number;
  maxChunkX: number;
  maxChunkZ: number;
  owner?: string;
  updatedAt: string;
}

export const WorldMaintenancePanel: React.FC = () => {
  const [stats, setStats] = useState<WorldStats | null>(null);
  const [zones, setZones] = useState<ProtectedZone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPruning, setIsPruning] = useState(false);
  const [pruneResult, setPruneResult] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchWorldHealth = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const [statsRes, zonesRes] = await Promise.all([
        fetch('/api/game/world/stats'),
        fetch('/api/game/world/protected-zones')
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        if (data.success && data.stats) setStats(data.stats);
      }

      if (zonesRes.ok) {
        const data = await zonesRes.json();
        if (data.success && data.zones) setZones(data.zones);
      }
    } catch (err: any) {
      setStatusMessage(`Failed to load world statistics: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorldHealth();
  }, []);

  const handleExecutePrune = async () => {
    setIsPruning(true);
    setShowConfirmModal(false);
    setPruneResult(null);
    try {
      const res = await fetch('/api/game/world/prune', { method: 'POST' });
      const data = await res.json();
      setPruneResult(data);
      if (data.success) {
        fetchWorldHealth();
      }
    } catch (err: any) {
      setPruneResult({
        success: false,
        message: `Pruning execution failed: ${err.message}`
      });
    } finally {
      setIsPruning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. HERO BANNER CARD */}
      <div className="office-panel-card" style={{ 
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
        borderColor: 'rgba(52, 211, 153, 0.3)',
        padding: '22px 26px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: '52px', 
              height: '52px', 
              borderRadius: '14px', 
              background: 'rgba(16, 185, 129, 0.18)', 
              border: '1px solid rgba(52, 211, 153, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)'
            }}>
              <Database size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Smart Chunk & World Maintenance
                </h2>
                <span className="badge-role" style={{ 
                  background: 'rgba(52, 211, 153, 0.15)', 
                  color: '#34d399', 
                  borderColor: 'rgba(52, 211, 153, 0.35)',
                  fontSize: '0.72rem'
                }}>
                  Zero World Border
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Automatically prune empty transient exploration chunks without restricting player exploration freedom.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={fetchWorldHealth}
              disabled={isLoading || isPruning}
              className="office-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.85rem' }}
            >
              <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
              <span>Scan World</span>
            </button>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={isLoading || isPruning || (stats?.estimatedPrunableChunks ?? 0) === 0}
              className="office-btn-primary"
              style={{ 
                background: 'linear-gradient(135deg, #10b981, #059669)', 
                borderColor: '#10b981',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '10px 20px', 
                fontSize: '0.85rem' 
              }}
            >
              <Sparkles size={16} />
              <span>Smart Clean Chunks</span>
            </button>
          </div>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {statusMessage && (
        <div className="office-alert-pill error" style={{ margin: 0 }}>
          <AlertTriangle size={18} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* RESULT NOTICE */}
      {pruneResult && (
        <div className={`office-alert-pill ${pruneResult.success ? 'success' : 'error'}`} style={{ margin: 0 }}>
          {pruneResult.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <div>
            <strong>{pruneResult.message}</strong>
            {pruneResult.success && (
              <div style={{ fontSize: '0.78rem', marginTop: '2px', opacity: 0.9 }}>
                Storage reclaimed: <strong>{pruneResult.freedFormatted}</strong> ({pruneResult.prunedChunksCount.toLocaleString()} transient chunks pruned).
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. STATS METRIC GRID */}
      <div className="office-stats-row">
        {/* World Size */}
        <div className="metric-stat-card">
          <div className="metric-icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <HardDrive size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-label">World Database Size</span>
            <span className="metric-number">{stats?.totalSizeFormatted || '0 B'}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {stats?.totalFiles.toLocaleString() || 0} active LevelDB files
            </span>
          </div>
        </div>

        {/* Total Generated Chunks */}
        <div className="metric-stat-card">
          <div className="metric-icon-wrap user-bg">
            <Layers size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Generated Chunks</span>
            <span className="metric-number">{stats?.estimatedTotalChunks.toLocaleString() || 0}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Explored territory
            </span>
          </div>
        </div>

        {/* Protected Chunks */}
        <div className="metric-stat-card">
          <div className="metric-icon-wrap ign-bg">
            <ShieldCheck size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Protected Zones (Safe)</span>
            <span className="metric-number" style={{ color: '#34d399' }}>
              {stats?.estimatedProtectedChunks.toLocaleString() || 0} <small style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>chunks</small>
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Spawn, Claims, Homes, & Builds
            </span>
          </div>
        </div>

        {/* Space Savings */}
        <div className="metric-stat-card">
          <div className="metric-icon-wrap" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' }}>
            <Sparkles size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Potential Space Savings</span>
            <span className="metric-number" style={{ color: '#fbbf24' }}>
              {stats?.estimatedSpaceSavingsFormatted || '0 B'}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              ~{stats?.estimatedPrunableChunks.toLocaleString() || 0} transient chunks
            </span>
          </div>
        </div>
      </div>

      {/* 3. PROTECTED ZONES WHITELIST CARD */}
      <div className="office-panel-card">
        <div className="office-panel-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} color="#34d399" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Protected Whitelisted Zones & Player Builds
            </h3>
          </div>
          <span className="badge-role" style={{ background: 'rgba(148, 163, 184, 0.12)', color: '#cbd5e1', borderColor: 'rgba(148, 163, 184, 0.25)' }}>
            {zones.length} Registered Areas
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="office-data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Type</th>
                <th>Zone Name / Description</th>
                <th>Dimension</th>
                <th>Chunk Bounds (Min ➔ Max)</th>
                <th style={{ textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {zones.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                    No custom zones detected yet. Main world spawn area is automatically protected.
                  </td>
                </tr>
              ) : (
                zones.map((zone) => (
                  <tr key={zone.id}>
                    <td>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '8px', 
                        background: zone.type === 'spawn' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                        color: zone.type === 'spawn' ? '#fbbf24' : '#34d399',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {zone.type === 'spawn' ? <Compass size={16} /> : <MapPin size={16} />}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{zone.name}</div>
                      {zone.owner && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Owner: {zone.owner}</div>}
                    </td>
                    <td>
                      <span className="badge-role" style={{ textTransform: 'capitalize' }}>
                        {zone.dimension}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#94a3b8' }}>
                      ({zone.minChunkX}, {zone.minChunkZ}) ➔ ({zone.maxChunkX}, {zone.maxChunkZ})
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge-role" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.3)' }}>
                        <Check size={12} style={{ marginRight: 4 }} /> Protected
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(251, 191, 36, 0.15)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Confirm Smart Chunk Prune
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Prune uninhabited exploration chunks
                </p>
              </div>
            </div>

            <div style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '0.85rem',
              color: '#cbd5e1',
              lineHeight: 1.5
            }}>
              <p style={{ margin: '0 0 10px' }}>
                The system will prune approximately <strong style={{ color: '#fbbf24' }}>{stats?.estimatedPrunableChunks.toLocaleString()} transient chunks</strong> that players only passed through during exploration.
              </p>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: '#94a3b8' }}>
                <li>All bases, buildings, spawn area, & claims are <strong style={{ color: '#34d399' }}>100% safe & protected</strong>.</li>
                <li>An automatic safety backup snapshot is created before pruning.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="office-btn-secondary"
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePrune}
                className="office-btn-primary"
                style={{ 
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderColor: '#10b981',
                  padding: '8px 20px', 
                  fontSize: '0.85rem' 
                }}
              >
                Confirm & Prune Chunks
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
