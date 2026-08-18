import React, { useState } from 'react';
import { UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { AuthUser } from './Navbar.tsx';
import { Sheet } from './Sheet.tsx';

interface ProfileModalProps {
  user: AuthUser;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [ign, setIgn] = useState<string>(user.minecraft_username || '');
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ign.trim()) return;

    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/auth/profile/ign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minecraft_username: ign.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ text: data.message || 'Minecraft IGN linked successfully!', type: 'success' });
        setTimeout(() => {
          onUpdated();
          onClose();
        }, 1000);
      } else {
        setFeedback({ text: data.error || 'Failed to link account.', type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Connection to server failed.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleUnlink = async () => {
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/auth/profile/ign', {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        setIgn('');
        setFeedback({ text: data.message || 'Minecraft IGN unlinked successfully!', type: 'success' });
        setTimeout(() => {
          onUpdated();
          onClose();
        }, 1000);
      } else {
        setFeedback({ text: data.error || 'Failed to unlink account.', type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Connection to server failed.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCheck size={20} color="#818cf8" />
          <span>Link Minecraft In-Game Name</span>
        </div>
      }
      description="Connect your Minecraft Bedrock character with your Discord account for bridge identity."
      footer={
        <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {user.minecraft_username && (
              <button 
                type="button" 
                className="btn-danger-sm"
                onClick={handleUnlink}
                disabled={saving}
                style={{ padding: '8px 12px', fontSize: '0.78rem' }}
              >
                Unlink IGN
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn-modal-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn-primary-save" 
              onClick={handleSubmit}
              disabled={saving || !ign.trim()}
            >
              <span>{saving ? 'Saving...' : 'Save IGN'}</span>
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* User Discord Preview */}
        <div className="user-profile-preview" style={{ margin: 0 }}>
          <img 
            src={user.discord_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
            alt={user.discord_username}
            className="modal-avatar"
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f8fafc' }}>
              {user.discord_username}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Status: {user.minecraft_username ? <span style={{ color: '#34d399' }}>Linked: {user.minecraft_username}</span> : <span style={{ color: '#fda4af' }}>Not Linked</span>}
            </div>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '6px' }}>
            Minecraft In-Game Name (IGN)
          </label>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '10px', lineHeight: 1.4 }}>
            Enter your exact Minecraft character name. Your Discord profile will automatically connect when you play in-game.
          </span>
          <input 
            type="text" 
            className="settings-text-field"
            placeholder="e.g. Steve, Alex, RyanBuilder"
            value={ign}
            onChange={(e) => setIgn(e.target.value)}
            maxLength={32}
            autoFocus
            required
          />
        </div>

        {feedback && (
          <div className={`feedback-msg ${feedback.type}`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            ) : (
              <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            )}
            {feedback.text}
          </div>
        )}
      </form>
    </Sheet>
  );
};
