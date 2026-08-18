import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Zap, 
  Compass, 
  Shield, 
  Sword, 
  Sparkles, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Package, 
  Navigation,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Sheet } from './Sheet.tsx';

interface SlotItem {
  slot: number;
  typeId: string;
  amount: number;
  nameTag?: string;
  damage?: number;
  maxDamage?: number;
}

interface PlayerTelemetry {
  username: string;
  health: { current: number; max: number };
  hunger?: { current: number; max: number };
  level: number;
  xpProgress: number;
  location: { x: number; y: number; z: number; dimension: string };
  gameMode: string;
  armor: {
    head?: SlotItem | null;
    chest?: SlotItem | null;
    legs?: SlotItem | null;
    feet?: SlotItem | null;
    offhand?: SlotItem | null;
    mainhand?: SlotItem | null;
  };
  mainInventory: SlotItem[];
  lastSynced: string;
}

interface PlayerInventorySheetProps {
  ign: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// Quick items for admin autocomplete / quick pick
const QUICK_ITEMS = [
  { id: 'diamond', name: 'Diamond', icon: '💎' },
  { id: 'netherite_ingot', name: 'Netherite Ingot', icon: '⬛' },
  { id: 'diamond_sword', name: 'Diamond Sword', icon: '⚔️' },
  { id: 'netherite_sword', name: 'Netherite Sword', icon: '🗡️' },
  { id: 'golden_apple', name: 'Golden Apple', icon: '🍏' },
  { id: 'enchanted_golden_apple', name: 'Enchanted G-Apple', icon: '🍎' },
  { id: 'totem_of_undying', name: 'Totem of Undying', icon: '🗿' },
  { id: 'elytra', name: 'Elytra Wings', icon: '🪽' },
  { id: 'ender_pearl', name: 'Ender Pearl', icon: '🔮' },
  { id: 'cooked_beef', name: 'Steak', icon: '🥩' },
  { id: 'experience_bottle', name: 'Bottle o\' Enchanting', icon: '🧪' },
  { id: 'iron_ingot', name: 'Iron Ingot', icon: '🪙' },
];

export const PlayerInventorySheet: React.FC<PlayerInventorySheetProps> = ({
  ign,
  isOpen,
  onClose,
}) => {
  const [telemetry, setTelemetry] = useState<PlayerTelemetry | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Give item form
  const [giveItemId, setGiveItemId] = useState<string>('diamond');
  const [giveAmount, setGiveAmount] = useState<number>(16);

  // Gamemode form
  const [selectedGamemode, setSelectedGamemode] = useState<string>('survival');

  const fetchInventory = async () => {
    if (!ign) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/office/players/${encodeURIComponent(ign)}/inventory`);
      const data = await res.json();
      if (res.ok) {
        setTelemetry(data.telemetry);
        setIsOnline(data.isOnline);
        if (data.telemetry?.gameMode) {
          setSelectedGamemode(data.telemetry.gameMode);
        }
      }
    } catch (e) {
      console.error('Failed to load player inventory:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && ign) {
      fetchInventory();
      setFeedback(null);
    }
  }, [isOpen, ign]);

  const executeAction = async (action: string, payload: Record<string, any> = {}) => {
    if (!ign) return;
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/office/players/${encodeURIComponent(ign)}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ text: data.message || 'Action executed successfully!', type: 'success' });
        // Refresh after action
        setTimeout(fetchInventory, 1000);
      } else {
        setFeedback({ text: data.error || 'Failed to execute action', type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Network connection failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGiveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giveItemId.trim()) return;
    executeAction('give', { itemId: giveItemId.trim(), amount: giveAmount });
  };

  const handleClearSlot = (item: SlotItem) => {
    executeAction('clear_item', { itemId: item.typeId, amount: item.amount });
  };

  const handleWipeInventory = () => {
    executeAction('wipe_inventory');
  };

  const handleHeal = () => {
    executeAction('heal');
  };

  const handleGamemodeChange = (mode: string) => {
    setSelectedGamemode(mode);
    executeAction('gamemode', { gamemode: mode });
  };

  if (!ign) return null;

  // Build a complete 36-slot map
  const slotMap = new Map<number, SlotItem>();
  if (telemetry?.mainInventory) {
    for (const item of telemetry.mainInventory) {
      slotMap.set(item.slot, item);
    }
  }

  const currentHp = telemetry?.health?.current ?? 20;
  const maxHp = telemetry?.health?.max ?? 20;
  const hpPercent = Math.min(100, Math.max(0, (currentHp / maxHp) * 100));

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src={`https://mc-heads.net/avatar/${encodeURIComponent(ign)}/32`} 
            alt={ign}
            style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{ign}</span>
              <span className={`status-pill ${isOnline ? 'online' : 'offline'}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      }
      description="Live player health status, armor, coordinates, and real-time inventory management."
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <button 
            type="button" 
            className="btn-danger-sm" 
            onClick={handleWipeInventory}
            disabled={actionLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Trash2 size={14} />
            <span>Wipe All Inventory</span>
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              className="btn-modal-cancel" 
              onClick={fetchInventory} 
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            <button type="button" className="btn-primary-save" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Feedback alert */}
        {feedback && (
          <div className={`feedback-msg ${feedback.type}`} style={{ margin: 0, padding: '10px 14px' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* 1. Live Player HUD Bar */}
        <div className="player-hud-card" style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Activity size={16} color="#38bdf8" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Live Vitals & Coordinates
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Synced: {telemetry?.lastSynced || 'Pending'}
            </span>
          </div>

          {/* HP Bar */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#fda4af' }}>
                <Heart size={14} color="#f43f5e" fill="#f43f5e" />
                Health: {currentHp} / {maxHp} HP ({Math.round(currentHp / 2)} Hearts)
              </span>
              <button 
                type="button" 
                className="btn-heal-quick" 
                onClick={handleHeal} 
                disabled={actionLoading}
                style={{ 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  border: '1px solid rgba(16, 185, 129, 0.3)', 
                  color: '#34d399', 
                  borderRadius: 6, 
                  padding: '2px 8px', 
                  fontSize: '0.72rem', 
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Sparkles size={12} />
                Instant Heal & Feed
              </button>
            </div>
            <div style={{ width: '100%', height: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div 
                style={{ 
                  width: `${hpPercent}%`, 
                  height: '100%', 
                  background: hpPercent > 50 ? 'linear-gradient(90deg, #10b981, #34d399)' : hpPercent > 25 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)',
                  transition: 'width 0.3s ease'
                }} 
              />
            </div>
          </div>

          {/* Quick HUD Badges Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            {/* Level */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Zap size={12} color="#fbbf24" /> Level & XP
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                Lvl {telemetry?.level ?? 0} <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 500 }}>({Math.round((telemetry?.xpProgress ?? 0) * 100)}%)</span>
              </div>
            </div>

            {/* Dimension */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Compass size={12} color="#a855f7" /> Dimension
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#c084fc', textTransform: 'capitalize', marginTop: 2 }}>
                {telemetry?.location?.dimension || 'Overworld'}
              </div>
            </div>

            {/* Coordinates */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Navigation size={12} color="#34d399" /> XYZ Position
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                {telemetry?.location ? `${telemetry.location.x}, ${telemetry.location.y}, ${telemetry.location.z}` : '0, 64, 0'}
              </div>
            </div>

            {/* Gamemode Selector */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Sword size={12} color="#f43f5e" /> Gamemode
              </div>
              <select
                value={selectedGamemode}
                onChange={(e) => handleGamemodeChange(e.target.value)}
                disabled={actionLoading}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: '#f8fafc', 
                  fontSize: '0.82rem', 
                  fontWeight: 700, 
                  width: '100%', 
                  cursor: 'pointer',
                  outline: 'none',
                  marginTop: 2
                }}
              >
                <option value="survival" style={{ background: '#1e293b' }}>Survival (s)</option>
                <option value="creative" style={{ background: '#1e293b' }}>Creative (c)</option>
                <option value="adventure" style={{ background: '#1e293b' }}>Adventure (a)</option>
                <option value="spectator" style={{ background: '#1e293b' }}>Spectator (sp)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Equipment (Armor & Hands) */}
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={14} color="#818cf8" />
            <span>Equipped Armor & Hands</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {[
              { label: 'Helmet', item: telemetry?.armor?.head },
              { label: 'Chest', item: telemetry?.armor?.chest },
              { label: 'Legs', item: telemetry?.armor?.legs },
              { label: 'Boots', item: telemetry?.armor?.feet },
              { label: 'Offhand', item: telemetry?.armor?.offhand },
              { label: 'Mainhand', item: telemetry?.armor?.mainhand },
            ].map(({ label, item }, idx) => (
              <div 
                key={idx}
                style={{ 
                  background: 'rgba(15, 23, 42, 0.8)', 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  borderRadius: 8, 
                  padding: '8px 4px', 
                  textAlign: 'center',
                  minHeight: 64,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</span>
                {item ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }} title={item.typeId}>
                      {item.typeId.replace(/^minecraft:/, '').replace(/_/g, ' ')}
                    </span>
                    {item.amount > 1 && (
                      <span style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 700 }}>×{item.amount}</span>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>_Empty_</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Main 36 Inventory Slots Grid */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={14} color="#34d399" />
              <span>Player Inventory (36 Slots)</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Click any item slot to clear
            </span>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(9, 1fr)', 
            gap: 6, 
            background: 'rgba(15, 23, 42, 0.85)', 
            padding: 12, 
            borderRadius: 12, 
            border: '1px solid rgba(255,255,255,0.08)' 
          }}>
            {Array.from({ length: 36 }).map((_, slotIdx) => {
              const item = slotMap.get(slotIdx);
              return (
                <div
                  key={slotIdx}
                  onClick={() => item && handleClearSlot(item)}
                  style={{
                    aspectRatio: '1/1',
                    background: item ? 'rgba(56, 189, 248, 0.08)' : 'rgba(0, 0, 0, 0.4)',
                    border: item ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor: item ? 'pointer' : 'default',
                    userSelect: 'none',
                    padding: 2
                  }}
                  title={item ? `${item.typeId} (Click to clear)` : `Slot ${slotIdx}`}
                >
                  {item ? (
                    <>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#f8fafc', textAlign: 'center', lineHeight: 1.1, wordBreak: 'break-word', maxWidth: '100%' }}>
                        {item.typeId.replace(/^minecraft:/, '').substring(0, 7)}
                      </span>
                      {item.amount > 1 && (
                        <span style={{ position: 'absolute', bottom: 1, right: 3, fontSize: '0.65rem', fontWeight: 800, color: '#fbbf24' }}>
                          {item.amount}
                        </span>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.1)' }}>{slotIdx}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Give / Add Item Tool */}
        <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} color="#34d399" />
            <span>Give Item to {ign}</span>
          </div>

          {/* Quick Pick Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {QUICK_ITEMS.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setGiveItemId(q.id)}
                style={{
                  background: giveItemId === q.id ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.04)',
                  border: giveItemId === q.id ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                  color: giveItemId === q.id ? '#38bdf8' : '#cbd5e1',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span>{q.icon}</span>
                <span>{q.name}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleGiveItem} style={{ display: 'grid', gridTemplateColumns: '1fr 100px auto', gap: 8, alignItems: 'center' }}>
            <input 
              type="text" 
              className="settings-text-field"
              placeholder="e.g. diamond, netherite_sword, golden_apple"
              value={giveItemId}
              onChange={(e) => setGiveItemId(e.target.value)}
              style={{ margin: 0 }}
              required
            />
            <input 
              type="number" 
              className="settings-text-field"
              min={1}
              max={64}
              value={giveAmount}
              onChange={(e) => setGiveAmount(Number(e.target.value) || 1)}
              style={{ margin: 0 }}
              required
            />
            <button 
              type="submit" 
              className="btn-primary-save" 
              disabled={actionLoading || !giveItemId.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px' }}
            >
              <Plus size={14} />
              <span>Give</span>
            </button>
          </form>
        </div>
      </div>
    </Sheet>
  );
};
