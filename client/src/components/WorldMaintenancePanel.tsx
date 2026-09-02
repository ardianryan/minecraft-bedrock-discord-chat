import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  ShieldCheck, 
  RefreshCw, 
  HardDrive, 
  Sparkles, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Compass,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Castle,
  Navigation,
  Star,
  Shield,
  Box
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
  type: 'spawn' | 'claim' | 'home' | 'warp' | 'pwarp' | 'lobby' | 'build';
  dimension: string;
  minChunkX: number;
  minChunkZ: number;
  maxChunkX: number;
  maxChunkZ: number;
  blockX?: number;
  blockY?: number;
  blockZ?: number;
  owner?: string;
  ownerName?: string;
  description?: string;
  isPublic?: boolean;
  membersCount?: number;
  updatedAt: string;
}

type FilterCategory = 'all' | 'claim' | 'warp' | 'pwarp' | 'spawn_lobby' | 'build';

export const WorldMaintenancePanel: React.FC = () => {
  const [stats, setStats] = useState<WorldStats | null>(null);
  const [zones, setZones] = useState<ProtectedZone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPruning, setIsPruning] = useState(false);
  const [pruneResult, setPruneResult] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dimensionFilter, setDimensionFilter] = useState<'all' | 'overworld' | 'nether' | 'the_end'>('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

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
        if (data.success && data.zones) {
          setZones(data.zones);
        }
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

  // Filter and search logic
  const filteredZones = useMemo(() => {
    return zones.filter((zone) => {
      // 1. Tab category filter
      if (activeTab === 'claim' && zone.type !== 'claim') return false;
      if (activeTab === 'warp' && zone.type !== 'warp') return false;
      if (activeTab === 'pwarp' && zone.type !== 'pwarp') return false;
      if (activeTab === 'spawn_lobby' && zone.type !== 'spawn' && zone.type !== 'lobby') return false;
      if (activeTab === 'build' && zone.type !== 'build') return false;

      // 2. Dimension filter
      if (dimensionFilter !== 'all' && zone.dimension.toLowerCase() !== dimensionFilter.toLowerCase()) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = zone.name.toLowerCase().includes(q);
        const matchOwner = (zone.owner || '').toLowerCase().includes(q) || (zone.ownerName || '').toLowerCase().includes(q);
        const matchDesc = (zone.description || '').toLowerCase().includes(q);
        const matchDim = zone.dimension.toLowerCase().includes(q);
        const matchCoords = `${zone.blockX ?? ''} ${zone.blockZ ?? ''} ${zone.minChunkX} ${zone.minChunkZ}`.includes(q);
        return matchName || matchOwner || matchDesc || matchDim || matchCoords;
      }

      return true;
    });
  }, [zones, activeTab, dimensionFilter, searchQuery]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, dimensionFilter, searchQuery, itemsPerPage]);

  // Paginated slice
  const totalItems = filteredZones.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedZones = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredZones.slice(start, start + itemsPerPage);
  }, [filteredZones, currentPage, itemsPerPage]);

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

  const getTabCount = (tab: FilterCategory) => {
    switch (tab) {
      case 'all': return zones.length;
      case 'claim': return zones.filter(z => z.type === 'claim').length;
      case 'warp': return zones.filter(z => z.type === 'warp').length;
      case 'pwarp': return zones.filter(z => z.type === 'pwarp').length;
      case 'spawn_lobby': return zones.filter(z => z.type === 'spawn' || z.type === 'lobby').length;
      case 'build': return zones.filter(z => z.type === 'build').length;
      default: return 0;
    }
  };

  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'spawn':
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px',
            background: 'rgba(251, 191, 36, 0.15)', 
            color: '#fbbf24', 
            border: '1px solid rgba(251, 191, 36, 0.35)',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: 700
          }}>
            <Compass size={12} /> SPAWN
          </span>
        );
      case 'claim':
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px',
            background: 'rgba(16, 185, 129, 0.15)', 
            color: '#34d399', 
            border: '1px solid rgba(16, 185, 129, 0.35)',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: 700
          }}>
            <Castle size={12} /> CLAIM
          </span>
        );
      case 'warp':
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px',
            background: 'rgba(6, 182, 212, 0.15)', 
            color: '#22d3ee', 
            border: '1px solid rgba(6, 182, 212, 0.35)',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: 700
          }}>
            <Navigation size={12} /> WARP
          </span>
        );
      case 'pwarp':
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px',
            background: 'rgba(168, 85, 247, 0.15)', 
            color: '#c084fc', 
            border: '1px solid rgba(168, 85, 247, 0.35)',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: 700
          }}>
            <Star size={12} /> PWARP
          </span>
        );
      case 'lobby':
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px',
            background: 'rgba(59, 130, 246, 0.15)', 
            color: '#60a5fa', 
            border: '1px solid rgba(59, 130, 246, 0.35)',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: 700
          }}>
            <Shield size={12} /> LOBBY
          </span>
        );
      default:
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px',
            background: 'rgba(148, 163, 184, 0.15)', 
            color: '#94a3b8', 
            border: '1px solid rgba(148, 163, 184, 0.35)',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: 700
          }}>
            <Box size={12} /> BUILD
          </span>
        );
    }
  };

  const renderDimensionBadge = (dim: string) => {
    const d = dim.toLowerCase();
    if (d.includes('nether')) {
      return (
        <span style={{ 
          background: 'rgba(239, 68, 68, 0.15)', 
          color: '#f87171', 
          border: '1px solid rgba(239, 68, 68, 0.35)',
          padding: '2px 7px',
          borderRadius: '5px',
          fontSize: '0.72rem',
          fontWeight: 600,
          textTransform: 'capitalize'
        }}>
          Nether
        </span>
      );
    }
    if (d.includes('end')) {
      return (
        <span style={{ 
          background: 'rgba(168, 85, 247, 0.15)', 
          color: '#c084fc', 
          border: '1px solid rgba(168, 85, 247, 0.35)',
          padding: '2px 7px',
          borderRadius: '5px',
          fontSize: '0.72rem',
          fontWeight: 600,
          textTransform: 'capitalize'
        }}>
          The End
        </span>
      );
    }
    return (
      <span style={{ 
        background: 'rgba(52, 211, 153, 0.15)', 
        color: '#34d399', 
        border: '1px solid rgba(52, 211, 153, 0.35)',
        padding: '2px 7px',
        borderRadius: '5px',
        fontSize: '0.72rem',
        fontWeight: 600,
        textTransform: 'capitalize'
      }}>
        Overworld
      </span>
    );
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
                Manage player land claims, server warps, pwarps, and execute lossless smart exploration chunk pruning.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={fetchWorldHealth}
              disabled={isLoading || isPruning}
              className="office-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px' }}
            >
              <RefreshCw size={15} className={isLoading ? 'spin-anim' : ''} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={isPruning || (stats?.estimatedPrunableChunks || 0) === 0}
              className="office-btn-primary"
              style={{ 
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderColor: '#10b981',
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px'
              }}
            >
              <Sparkles size={16} />
              {isPruning ? 'Pruning...' : 'Prune Exploration Chunks'}
            </button>
          </div>
        </div>

        {/* STATUS MESSAGE ALERT */}
        {statusMessage && (
          <div style={{ 
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertTriangle size={18} color="#f87171" />
            <span style={{ fontSize: '0.85rem', color: '#f87171' }}>
              {statusMessage}
            </span>
          </div>
        )}

        {/* PRUNE RESULT ALERT */}
        {pruneResult && (
          <div style={{ 
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: pruneResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${pruneResult.success ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {pruneResult.success ? (
                <CheckCircle2 size={18} color="#34d399" />
              ) : (
                <AlertTriangle size={18} color="#f87171" />
              )}
              <span style={{ fontSize: '0.85rem', color: pruneResult.success ? '#34d399' : '#f87171' }}>
                {pruneResult.message}
              </span>
            </div>
            {pruneResult.freedFormatted && (
              <span style={{ fontSize: '0.78rem', color: '#f8fafc', fontWeight: 700 }}>
                Saved: {pruneResult.freedFormatted} ({pruneResult.prunedChunksCount.toLocaleString()} chunks)
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. STATS GRID */}
      <div className="stats-metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {/* World DB Size */}
        <div className="metric-stat-card">
          <div className="metric-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <HardDrive size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-label">World Database Size</span>
            <span className="metric-number" style={{ color: '#60a5fa' }}>
              {stats?.totalSizeFormatted || '0 B'}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {stats?.totalFiles.toLocaleString() || 0} LevelDB storage files
            </span>
          </div>
        </div>

        {/* Total Generated Chunks */}
        <div className="metric-stat-card">
          <div className="metric-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <Layers size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Generated Chunks</span>
            <span className="metric-number" style={{ color: '#c084fc' }}>
              ~{stats?.estimatedTotalChunks.toLocaleString() || 0}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Across Overworld, Nether, & End
            </span>
          </div>
        </div>

        {/* Protected Chunks */}
        <div className="metric-stat-card">
          <div className="metric-icon-wrap ign-bg">
            <ShieldCheck size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Protected Whitelist</span>
            <span className="metric-number" style={{ color: '#34d399' }}>
              {zones.length} <small style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>zones</small>
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              ~{stats?.estimatedProtectedChunks.toLocaleString() || 0} protected chunks
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

      {/* 3. PROTECTED ZONES & PLAYER PLACES EXPLORER */}
      <div className="office-panel-card" style={{ padding: '20px' }}>
        
        {/* PANEL HEADER */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '14px',
          borderBottom: '1px solid var(--border-subtle)', 
          paddingBottom: '16px', 
          marginBottom: '16px' 
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} color="#34d399" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                World Zones, Warps & Player Land Claims
              </h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Real-time synchronization of server fast-travel warps, player warps, land claims, and protected regions.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-role" style={{ background: 'rgba(52, 211, 153, 0.12)', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.3)' }}>
              {totalItems} Found
            </span>
            <span className="badge-role" style={{ background: 'rgba(148, 163, 184, 0.12)', color: '#cbd5e1', borderColor: 'rgba(148, 163, 184, 0.25)' }}>
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>

        {/* FILTER CATEGORY TABS */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          overflowX: 'auto', 
          paddingBottom: '12px',
          marginBottom: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {[
            { id: 'all', label: 'All Zones', icon: Layers, count: getTabCount('all'), color: '#38bdf8' },
            { id: 'claim', label: 'Land Claims', icon: Castle, count: getTabCount('claim'), color: '#34d399' },
            { id: 'warp', label: 'Server Warps', icon: Navigation, count: getTabCount('warp'), color: '#22d3ee' },
            { id: 'pwarp', label: 'Player Warps', icon: Star, count: getTabCount('pwarp'), color: '#c084fc' },
            { id: 'spawn_lobby', label: 'Spawn & Lobby', icon: Shield, count: getTabCount('spawn_lobby'), color: '#fbbf24' },
            { id: 'build', label: 'Player Builds', icon: Box, count: getTabCount('build'), color: '#94a3b8' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as FilterCategory)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: isActive ? `1px solid ${tab.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isActive ? `rgba(${tab.id === 'claim' ? '16, 185, 129' : tab.id === 'pwarp' ? '168, 85, 247' : tab.id === 'warp' ? '6, 182, 212' : '56, 189, 248'}, 0.16)` : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#f8fafc' : 'var(--text-muted)',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={15} color={isActive ? tab.color : 'currentColor'} />
                <span>{tab.label}</span>
                <span style={{
                  background: isActive ? tab.color : 'rgba(255, 255, 255, 0.1)',
                  color: isActive ? '#0f172a' : '#94a3b8',
                  padding: '1px 6px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 800
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* SEARCH & DIMENSION CONTROLS */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '12px',
          marginBottom: '16px' 
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, player owner, dimension, coordinates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="office-input"
              style={{ paddingLeft: '36px', width: '100%', fontSize: '0.82rem', height: '38px' }}
            />
          </div>

          {/* Dimension Filter & Items Per Page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Dim:</span>
              <select
                value={dimensionFilter}
                onChange={(e) => setDimensionFilter(e.target.value as any)}
                className="office-input"
                style={{ padding: '6px 10px', fontSize: '0.8rem', height: '38px', borderRadius: '8px' }}
              >
                <option value="all">All Dimensions</option>
                <option value="overworld">Overworld</option>
                <option value="nether">Nether</option>
                <option value="the_end">The End</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="office-input"
                style={{ padding: '6px 10px', fontSize: '0.8rem', height: '38px', borderRadius: '8px' }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <table className="office-data-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: '90px' }}>Type</th>
                <th>Name & Information</th>
                <th>Owner / Creator</th>
                <th>Dimension</th>
                <th>Location / Chunk Bounds</th>
                <th style={{ textAlign: 'right' }}>Protection</th>
              </tr>
            </thead>
            <tbody>
              {paginatedZones.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Search size={28} style={{ opacity: 0.4 }} />
                      <span>No matching zones, warps, or claims found.</span>
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="office-btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '4px 10px', marginTop: '4px' }}
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedZones.map((zone) => (
                  <tr key={zone.id}>
                    {/* TYPE */}
                    <td>
                      {renderTypeBadge(zone.type)}
                    </td>

                    {/* NAME & DESCRIPTION */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.88rem' }}>
                        {zone.name}
                      </div>
                      {zone.description && (
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {zone.description}
                        </div>
                      )}
                    </td>

                    {/* OWNER */}
                    <td>
                      {zone.owner || zone.ownerName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ 
                            background: 'rgba(255, 255, 255, 0.07)', 
                            color: '#e2e8f0', 
                            padding: '2px 8px', 
                            borderRadius: '6px', 
                            fontSize: '0.76rem',
                            fontWeight: 600
                          }}>
                            {zone.ownerName || zone.owner}
                          </span>
                          {zone.membersCount !== undefined && zone.membersCount > 0 && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              +{zone.membersCount} members
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>Server System</span>
                      )}
                    </td>

                    {/* DIMENSION */}
                    <td>
                      {renderDimensionBadge(zone.dimension)}
                    </td>

                    {/* LOCATION / COORDS */}
                    <td>
                      {zone.blockX !== undefined && zone.blockZ !== undefined ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>
                            X: {zone.blockX} {zone.blockY !== undefined ? `Y: ${zone.blockY} ` : ''}Z: {zone.blockZ}
                          </span>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#64748b' }}>
                            Chunks: ({zone.minChunkX}, {zone.minChunkZ}) ➔ ({zone.maxChunkX}, {zone.maxChunkZ})
                          </span>
                        </div>
                      ) : (
                        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#94a3b8' }}>
                          Chunks: ({zone.minChunkX}, {zone.minChunkZ}) ➔ ({zone.maxChunkX}, {zone.maxChunkZ})
                        </div>
                      )}
                    </td>

                    {/* STATUS */}
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge-role" style={{ 
                        background: 'rgba(52, 211, 153, 0.15)', 
                        color: '#34d399', 
                        borderColor: 'rgba(52, 211, 153, 0.3)',
                        fontSize: '0.72rem'
                      }}>
                        <Check size={12} style={{ marginRight: 4 }} /> Protected
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap', 
            gap: '12px',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Showing <strong style={{ color: '#f8fafc' }}>{Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)}</strong> to <strong style={{ color: '#f8fafc' }}>{Math.min(totalItems, currentPage * itemsPerPage)}</strong> of <strong style={{ color: '#f8fafc' }}>{totalItems}</strong> entries
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* First Page */}
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="office-btn-secondary"
                style={{ padding: '6px 8px', fontSize: '0.8rem', opacity: currentPage === 1 ? 0.4 : 1 }}
                title="First Page"
              >
                <ChevronsLeft size={15} />
              </button>

              {/* Prev Page */}
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="office-btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.8rem', opacity: currentPage === 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={15} style={{ marginRight: 2 }} /> Prev
              </button>

              {/* Page Number Pills */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                let p = currentPage - 2 + idx;
                if (currentPage <= 2) p = idx + 1;
                else if (currentPage >= totalPages - 1) p = totalPages - 4 + idx;
                if (p < 1 || p > totalPages) return null;

                const isActive = p === currentPage;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: isActive ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      color: isActive ? '#34d399' : '#94a3b8',
                      fontSize: '0.78rem',
                      fontWeight: isActive ? 800 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {p}
                  </button>
                );
              })}

              {/* Next Page */}
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="office-btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.8rem', opacity: currentPage === totalPages ? 0.4 : 1 }}
              >
                Next <ChevronRight size={15} style={{ marginLeft: 2 }} />
              </button>

              {/* Last Page */}
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="office-btn-secondary"
                style={{ padding: '6px 8px', fontSize: '0.8rem', opacity: currentPage === totalPages ? 0.4 : 1 }}
                title="Last Page"
              >
                <ChevronsRight size={15} />
              </button>
            </div>
          </div>
        )}
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
                <li>All bases, buildings, spawn area, warps, & claims are <strong style={{ color: '#34d399' }}>100% safe & protected</strong>.</li>
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
