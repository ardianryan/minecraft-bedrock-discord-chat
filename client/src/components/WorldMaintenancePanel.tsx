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
  Compass 
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-slate-900/50 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                  Smart Chunk & World Maintenance
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                    Zero World Border
                  </span>
                </h2>
                <p className="text-sm text-slate-400">
                  Automatically prune empty transient exploration chunks without restricting player exploration freedom.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchWorldHealth}
              disabled={isLoading || isPruning}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 rounded-xl font-medium text-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Scan World
            </button>

            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isLoading || isPruning || (stats?.estimatedPrunableChunks ?? 0) === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              Smart Clean Chunks
            </button>
          </div>
        </div>
      </div>

      {/* Error / Status Notice */}
      {statusMessage && (
        <div className="p-4 rounded-xl border bg-rose-950/30 border-rose-500/30 text-rose-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{statusMessage}</p>
        </div>
      )}

      {/* Result Notice */}
      {pruneResult && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          pruneResult.success 
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
        }`}>
          {pruneResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
          <div className="text-sm space-y-1">
            <p className="font-semibold">{pruneResult.message}</p>
            {pruneResult.success && (
              <p className="text-xs text-emerald-400/80">
                Storage reclaimed: <span className="font-bold text-white">{pruneResult.freedFormatted}</span> ({pruneResult.prunedChunksCount.toLocaleString()} transient chunks pruned).
              </p>
            )}
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total World Size */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">World Database Size</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats?.totalSizeFormatted || '0 B'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {stats?.totalFiles.toLocaleString() || 0} active LevelDB files
          </p>
        </div>

        {/* Total Chunks */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Generated Chunks</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats?.estimatedTotalChunks.toLocaleString() || 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Explored world territory
          </p>
        </div>

        {/* Protected Chunks */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Protected Zones (Safe)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {stats?.estimatedProtectedChunks.toLocaleString() || 0} <span className="text-sm text-slate-400 font-normal">chunks</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Spawn, Claims, Homes, & Builds
          </p>
        </div>

        {/* Space Savings */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Potential Savings</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {stats?.estimatedSpaceSavingsFormatted || '0 B'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ~{stats?.estimatedPrunableChunks.toLocaleString() || 0} transient chunks
          </p>
        </div>
      </div>

      {/* Protected Zones Breakdown */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Protected Whitelisted Zones & Areas</h3>
          </div>
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            {zones.length} Registered Areas
          </span>
        </div>

        <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto pr-2">
          {zones.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">
              No custom zones detected yet. Main world spawn is automatically protected.
            </div>
          ) : (
            zones.map((zone) => (
              <div key={zone.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                    {zone.type === 'spawn' ? <Compass className="w-4 h-4 text-amber-400" /> : <MapPin className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{zone.name}</p>
                    <p className="text-xs text-slate-400">
                      Dimension: <span className="text-slate-300 capitalize">{zone.dimension}</span> | Chunk Coords: ({zone.minChunkX}, {zone.minChunkZ}) to ({zone.maxChunkX}, {zone.maxChunkZ})
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" /> Protected
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Smart Chunk Prune</h3>
                <p className="text-xs text-slate-400">Prune uninhabited exploration chunks</p>
              </div>
            </div>

            <div className="text-sm text-slate-300 space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <p>
                The system will prune approximately <span className="font-bold text-amber-400">{stats?.estimatedPrunableChunks.toLocaleString()} chunks</span> that players only passed through during exploration.
              </p>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li>All bases, buildings, spawn area, & claims are <span className="text-emerald-400 font-semibold">100% safe & protected</span>.</li>
                <li>An automatic safety backup snapshot is created before pruning.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePrune}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-semibold shadow-lg transition-all"
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
