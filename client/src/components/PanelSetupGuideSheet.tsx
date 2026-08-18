import React, { useState } from 'react';
import { 
  BookOpen, 
  Server, 
  ShieldCheck, 
  Layers
} from 'lucide-react';
import { Sheet } from './Sheet.tsx';

interface PanelSetupGuideSheetProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'pterodactyl' | 'crafty';
}

export const PanelSetupGuideSheet: React.FC<PanelSetupGuideSheetProps> = ({
  isOpen,
  onClose,
  defaultTab = 'pterodactyl',
}) => {
  const [activeTab, setActiveTab] = useState<'pterodactyl' | 'crafty'>(defaultTab);

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={20} color="#38bdf8" />
          <span>Server Panel Setup Tutorial</span>
        </div>
      }
      description="Step-by-step instructions to connect Pterodactyl Panel or Crafty Controller with the Office Dashboard."
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <button type="button" className="btn-primary-save" onClick={onClose}>
            Got It, Let's Connect!
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Provider Selector Switch */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(15, 23, 42, 0.8)', padding: 4, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('pterodactyl')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px',
              borderRadius: 8,
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'pterodactyl' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
              color: activeTab === 'pterodactyl' ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <Server size={16} />
            <span>Pterodactyl Panel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crafty')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px',
              borderRadius: 8,
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'crafty' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              color: activeTab === 'crafty' ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <Layers size={16} />
            <span>Crafty Controller</span>
          </button>
        </div>

        {/* Option 1: Pterodactyl Panel Guide */}
        {activeTab === 'pterodactyl' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.3)', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#38bdf8', fontSize: '0.9rem', marginBottom: 4 }}>
                <ShieldCheck size={16} />
                <span>Pterodactyl / Wings Client API</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                Allows the Office Dashboard to fetch real-time CPU & RAM gauges, trigger server restarts, and execute console commands through Pterodactyl Client credentials.
              </p>
            </div>

            {/* Step 1 */}
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#0284c7', color: '#fff', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>1</span>
                <span>Get your Client API Key</span>
              </div>
              <ol style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, paddingLeft: 20, margin: 0 }}>
                <li>Log in to your Pterodactyl Panel (e.g. <code>https://panel.yourdomain.com</code>).</li>
                <li>Click on your <strong>User Avatar / Account Settings</strong> in the top right corner.</li>
                <li>Click on the <strong>API Credentials</strong> tab.</li>
                <li>Enter a description (e.g., <em>Office Dashboard Bridge</em>) and click <strong>Create</strong>.</li>
                <li>Copy the generated API Key (starts with <code>ptlc_...</code>).</li>
              </ol>
            </div>

            {/* Step 2 */}
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#0284c7', color: '#fff', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>2</span>
                <span>Find your Server Identifier / UUID</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Open your Minecraft server in Pterodactyl. The Server Identifier is the <strong>8-character short code</strong> in the URL bar (e.g. <code>https://panel.domain.com/server/<strong>c74fa092</strong></code>).
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#0284c7', color: '#fff', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>3</span>
                <span>Paste into Office Settings</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Set Provider to <strong>Pterodactyl Panel</strong>, paste your <strong>Panel URL</strong>, <strong>Server Identifier</strong>, and <strong>Client API Key</strong>, then click <strong>Test Connection</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Option 2: Crafty Controller Guide */}
        {activeTab === 'crafty' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#34d399', fontSize: '0.9rem', marginBottom: 4 }}>
                <ShieldCheck size={16} />
                <span>Crafty Controller v4 REST API</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                Connects directly to your Crafty Controller daemon to monitor Bedrock BDS memory, start/stop the server, and write commands to STDIN.
              </p>
            </div>

            {/* Step 1 */}
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#10b981', color: '#fff', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>1</span>
                <span>Create an API Token in Crafty</span>
              </div>
              <ol style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, paddingLeft: 20, margin: 0 }}>
                <li>Open your Crafty Controller Web UI (e.g. <code>https://crafty.yourdomain.com:8443</code>).</li>
                <li>Go to <strong>Config</strong> or <strong>Users & Roles</strong>.</li>
                <li>Click <strong>API Tokens</strong> $\rightarrow$ <strong>Generate New Token</strong>.</li>
                <li>Assign Administrator or Server Control permissions and copy the token.</li>
              </ol>
            </div>

            {/* Step 2 */}
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#10b981', color: '#fff', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>2</span>
                <span>Get your Crafty Server ID</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Go to the <strong>Servers</strong> tab in Crafty. Check your Minecraft server details or URL bar to find the Server ID (usually a number like <code>1</code> or a server UUID).
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#10b981', color: '#fff', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>3</span>
                <span>Enter Credentials in Office</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Select <strong>Crafty Controller</strong> as Provider, enter your <strong>Crafty URL</strong>, <strong>Server ID</strong>, and <strong>API Token</strong>, then click <strong>Save & Test Connection</strong>.
              </p>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
};
