import React, { useState, useEffect } from 'react';
import { 
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

// Quick items for admin autocomplete / quick pick with authentic Bedrock icons
const QUICK_ITEMS = [
  { id: 'diamond', name: 'Diamond', iconImg: '/mc-icons/diamond.png' },
  { id: 'netherite_ingot', name: 'Netherite Ingot', iconImg: '/mc-icons/netherite_ingot.png' },
  { id: 'diamond_sword', name: 'Diamond Sword', iconImg: '/mc-icons/diamond_sword.png' },
  { id: 'netherite_sword', name: 'Netherite Sword', iconImg: '/mc-icons/netherite_sword.png' },
  { id: 'golden_apple', name: 'Golden Apple', iconImg: '/mc-icons/apple_golden.png' },
  { id: 'totem_of_undying', name: 'Totem', iconImg: '/mc-icons/totem.png' },
  { id: 'elytra', name: 'Elytra', iconImg: '/mc-icons/elytra.png' },
  { id: 'ender_pearl', name: 'Ender Pearl', iconImg: '/mc-icons/ender_pearl.png' },
  { id: 'cooked_beef', name: 'Steak', iconImg: '/mc-icons/beef_cooked.png' },
  { id: 'experience_bottle', name: "Bottle o' Exp", iconImg: '/mc-icons/experience_bottle.png' },
  { id: 'iron_ingot', name: 'Iron Ingot', iconImg: '/mc-icons/iron_ingot.png' },
  { id: 'gold_ingot', name: 'Gold Ingot', iconImg: '/mc-icons/gold_ingot.png' },
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
  const [giveAmount, setGiveAmount] = useState<number>(1);
  const [selectedGamemode, setSelectedGamemode] = useState<string>('survival');
  const [showWipeConfirm, setShowWipeConfirm] = useState<boolean>(false);

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
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && ign) {
      fetchInventory();
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
        setFeedback({ text: data.message || `Action dispatched for ${ign}!`, type: 'success' });
        setTimeout(fetchInventory, 1000);
      } else {
        setFeedback({ text: data.error || 'Failed to dispatch action', type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Network connection failed', type: 'error' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 4000);
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
    setShowWipeConfirm(true);
  };

  const executeWipeInventory = () => {
    executeAction('wipe_inventory');
    setShowWipeConfirm(false);
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
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fda4af' }}>
                <img src="/mc-icons/heart.png" alt="Health" style={{ width: 16, height: 16, imageRendering: 'pixelated' }} />
                Health: {currentHp} / {maxHp} HP ({Math.round(currentHp / 2)} Hearts)
              </span>
              <button 
                type="button" 
                className="btn-heal-quick" 
                onClick={handleHeal} 
                disabled={actionLoading}
                style={{ 
                  background: 'rgba(34, 197, 94, 0.15)', 
                  border: '1px solid rgba(34, 197, 94, 0.4)', 
                  color: '#86efac', 
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
            <div style={{ width: '100%', height: 10, background: 'rgba(0,0,0,0.6)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-mc-stone)', boxShadow: 'inset 1px 1px 0px #000' }}>
              <div 
                style={{ 
                  width: `${hpPercent}%`, 
                  height: '100%', 
                  background: hpPercent > 50 ? 'linear-gradient(90deg, #22c55e, #86efac)' : hpPercent > 25 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)',
                  transition: 'width 0.3s ease'
                }} 
              />
            </div>
          </div>

          {/* Quick HUD Badges Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            {/* Level */}
            <div style={{ background: '#121622', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-mc-stone)', boxShadow: 'inset 1px 1px 0px #090b10' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src="/mc-icons/experience_bottle.png" alt="XP" style={{ width: 14, height: 14, imageRendering: 'pixelated' }} /> Level & XP
              </div>
              <div style={{ fontSize: '0.92rem', fontFamily: 'var(--font-mc)', fontWeight: 700, color: '#86efac', marginTop: 2 }}>
                Lvl {telemetry?.level ?? 0} <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 500 }}>({Math.round((telemetry?.xpProgress ?? 0) * 100)}%)</span>
              </div>
            </div>

            {/* Dimension */}
            <div style={{ background: '#121622', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-mc-stone)', boxShadow: 'inset 1px 1px 0px #090b10' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src="/mc-icons/compass.png" alt="Compass" style={{ width: 14, height: 14, imageRendering: 'pixelated' }} /> Dimension
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#c084fc', textTransform: 'capitalize', marginTop: 2 }}>
                {telemetry?.location?.dimension || 'Overworld'}
              </div>
            </div>

            {/* Coordinates */}
            <div style={{ background: '#121622', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-mc-stone)', boxShadow: 'inset 1px 1px 0px #090b10' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Navigation size={12} color="#38bdf8" /> XYZ Position
              </div>
              <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                {telemetry?.location ? `${telemetry.location.x}, ${telemetry.location.y}, ${telemetry.location.z}` : '0, 64, 0'}
              </div>
            </div>

            {/* Gamemode Selector */}
            <div style={{ background: '#121622', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-mc-stone)', boxShadow: 'inset 1px 1px 0px #090b10' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src="/mc-icons/diamond_sword.png" alt="Sword" style={{ width: 14, height: 14, imageRendering: 'pixelated' }} /> Gamemode
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
                <option value="survival" style={{ background: '#121622' }}>Survival (s)</option>
                <option value="creative" style={{ background: '#121622' }}>Creative (c)</option>
                <option value="adventure" style={{ background: '#121622' }}>Adventure (a)</option>
                <option value="spectator" style={{ background: '#121622' }}>Spectator (sp)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Equipment (Armor & Hands) */}
        <div>
          <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mc)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src="/mc-icons/diamond_chestplate.png" alt="Armor" style={{ width: 16, height: 16, imageRendering: 'pixelated' }} />
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
                  background: item ? '#182236' : '#121622', 
                  border: item ? '1px solid #38bdf8' : '1px solid #232a3b',
                  boxShadow: 'inset 2px 2px 0px #090b10, inset -2px -2px 0px #2a3346',
                  borderRadius: 6, 
                  padding: '8px 4px', 
                  textAlign: 'center',
                  minHeight: 68,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mc)', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</span>
                {item ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8' }} title={item.typeId}>
                      {item.typeId.replace(/^minecraft:/, '').replace(/_/g, ' ')}
                    </span>
                    {item.amount > 1 && (
                      <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-pixel)', color: '#fbbf24', textShadow: '1px 1px 0px #000' }}>×{item.amount}</span>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.15)' }}>—</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Main 36 Inventory Slots Grid */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mc)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={14} color="#22c55e" />
              <span>Inventory (36 Slots)</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Click any item slot to clear
            </span>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(9, 1fr)', 
            gap: 6, 
            background: '#121622', 
            padding: 12, 
            borderRadius: 8, 
            border: '2px solid var(--border-mc-stone)',
            boxShadow: 'inset 2px 2px 0px #090b10, inset -2px -2px 0px #2a3346'
          }}>
            {Array.from({ length: 36 }).map((_, slotIdx) => {
              const item = slotMap.get(slotIdx);
              return (
                <div
                  key={slotIdx}
                  onClick={() => item && handleClearSlot(item)}
                  style={{
                    aspectRatio: '1/1',
                    background: item ? '#1a2436' : '#141824',
                    border: item ? '1px solid #38bdf8' : '1px solid #232b3d',
                    boxShadow: item ? 'inset 1px 1px 0px #090b10, 0 0 8px rgba(56, 189, 248, 0.25)' : 'inset 2px 2px 0px #090b10, inset -1px -1px 0px #2a3346',
                    borderRadius: 4,
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
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#f8fafc', textAlign: 'center', lineHeight: 1.1, wordBreak: 'break-word', maxWidth: '100%' }}>
                        {item.typeId.replace(/^minecraft:/, '').substring(0, 7)}
                      </span>
                      {item.amount > 1 && (
                        <span style={{ position: 'absolute', bottom: 1, right: 3, fontSize: '0.65rem', fontFamily: 'var(--font-pixel)', color: '#fbbf24', textShadow: '1px 1px 0px #000' }}>
                          {item.amount}
                        </span>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.1)' }}>{slotIdx}</span>
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
                  gap: 6
                }}
              >
                <img src={q.iconImg} alt={q.name} style={{ width: 16, height: 16, imageRendering: 'pixelated' }} />
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

      {/* Wipe Confirmation Sheet */}
      <Sheet
        isOpen={showWipeConfirm}
        onClose={() => setShowWipeConfirm(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trash2 size={20} color="#f43f5e" />
            <span>Wipe Player Inventory</span>
          </div>
        }
        description={`Permanently remove all items from ${ign}'s inventory.`}
        footer={
          <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn-modal-cancel" 
              onClick={() => setShowWipeConfirm(false)}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn-primary-save"
              style={{ background: '#e11d48', borderColor: '#be123c' }}
              onClick={executeWipeInventory}
              disabled={actionLoading}
            >
              {actionLoading ? 'Wiping...' : 'Confirm Wipe Inventory'}
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 14,
            borderRadius: 12,
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.2)'
          }}>
            <img 
              src={`https://mc-heads.net/avatar/${encodeURIComponent(ign)}/44`} 
              alt=""
              style={{ width: 44, height: 44, borderRadius: 8, imageRendering: 'pixelated' }}
            />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Minecraft Player</span>
              <h4 style={{ color: '#fda4af', fontSize: '1.1rem', margin: 0 }}>{ign}</h4>
            </div>
          </div>

          <div className="office-alert-pill error" style={{ margin: 0 }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: '0.8rem' }}>
              Warning: This will clear all 36 inventory slots and hotbar for <strong>{ign}</strong> using <code>/clear {ign}</code>. This action cannot be reversed.
            </span>
          </div>
        </div>
      </Sheet>
    </Sheet>
  );
};
