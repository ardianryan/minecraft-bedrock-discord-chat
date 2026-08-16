import React, { useRef, useEffect, useState } from 'react';
import { 
  Send, 
  Clock, 
  Sparkles, 
  Terminal, 
  MessageSquare,
  Flame,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX
} from 'lucide-react';
import { AuthUser } from './Navbar.tsx';

export interface ChatMessage {
  id: string;
  source: 'Game' | 'Web' | 'Discord' | 'System';
  sender: string;
  message: string;
  timestamp: string;
  isDeath?: boolean;
  discordUser?: {
    id: string;
    username: string;
    avatar?: string;
  } | null;
}

interface ChatFeedProps {
  messages: ChatMessage[];
  user: AuthUser;
  sender: string;
  setSender: (s: string) => void;
  message: string;
  setMessage: (m: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  sending: boolean;
  feedback: { text: string; type: 'success' | 'error' } | null;
  onQuickCommand: (cmd: string) => void;
}

export const ChatFeed: React.FC<ChatFeedProps> = ({
  messages,
  user,
  sender,
  setSender,
  message,
  setMessage,
  onSendMessage,
  sending,
  feedback,
  onQuickCommand,
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const prevMsgCountRef = useRef<number>(messages.length);

  // Play subtle Web Audio chime on new message
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current && soundEnabled) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        }
      } catch {}
    }
    prevMsgCountRef.current = messages.length;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, soundEnabled]);

  const quickCommands = [
    { label: '☀️ Daytime', cmd: '/time set day' },
    { label: '🌙 Nighttime', cmd: '/time set night' },
    { label: '🌤️ Clear Weather', cmd: '/weather clear' },
    { label: '💎 Give Diamonds', cmd: '/give @a diamond 10' },
  ];

  return (
    <div className="chat-card-container">
      {/* Header bar */}
      <div className="chat-card-header">
        <div className="chat-header-title">
          <div className="chat-badge-icon">
            <MessageSquare size={18} />
          </div>
          <div className="chat-title-group">
            <h3 className="chat-title-text">Live Chat</h3>
            <span className="chat-subtitle-text">Bedrock ↔ Discord ↔ Web</span>
          </div>
        </div>

        <div className="chat-header-actions">
          {/* Sound Toggle Button */}
          <button 
            type="button" 
            className="btn-sound-toggle"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Notification Chime' : 'Unmute Notification Chime'}
          >
            {soundEnabled ? <Volume2 size={15} color="#34d399" /> : <VolumeX size={15} color="#94a3b8" />}
            <span className="sound-toggle-label">{soundEnabled ? 'Sound ON' : 'Mute'}</span>
          </button>

          <div className="chat-header-meta">
            <span className="messages-count-pill">
              <Flame size={13} color="#f59e0b" />
              <span>{messages.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="chat-messages-area">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="empty-icon-circle">
              <Sparkles size={28} color="#818cf8" />
            </div>
            <h4 className="empty-state-heading">No Chat Messages Yet</h4>
            <p className="empty-state-desc">
              Send a message below or start chatting from inside Minecraft / Discord channel!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCommand = msg.message.startsWith('⚡ Executing command') || msg.message.startsWith('⚡ Menjalankan command') || msg.message.startsWith('/');

            return (
              <div 
                key={msg.id} 
                className={`msg-bubble-card source-${msg.source} ${isCommand ? 'is-command-bubble' : ''}`}
              >
                {/* Avatar / Source Icon */}
                <div className="msg-avatar-container">
                  {msg.discordUser?.avatar ? (
                    <img src={msg.discordUser.avatar} alt="" className="msg-avatar-img" />
                  ) : msg.source === 'Game' ? (
                    <img 
                      src={`https://mc-heads.net/avatar/${encodeURIComponent(msg.sender)}/28`} 
                      alt={msg.sender}
                      className="msg-avatar-img mc-skin-head"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="msg-avatar-fallback web-avatar">
                      {msg.sender.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className="msg-content-block">
                  <div className="msg-meta-row">
                    <span className={`msg-source-tag ${msg.source}`}>
                      {msg.source === 'Game' ? '🎮 Minecraft' : msg.source === 'Discord' ? '💬 Discord' : msg.source === 'System' ? '⚡ System' : '🌐 Web'}
                    </span>
                    
                    <span className="msg-sender-name">
                      {msg.sender}
                      {msg.discordUser && (
                        <span className="msg-discord-tag">
                          @{msg.discordUser.username}
                        </span>
                      )}
                    </span>

                    <span className="msg-timestamp">
                      <Clock size={11} />
                      {msg.timestamp}
                    </span>
                  </div>

                  <div className="msg-body-text">
                    {isCommand ? (
                      <code className="msg-command-code">
                        <Terminal size={13} style={{ display: 'inline', marginRight: '6px' }} />
                        {msg.message}
                      </code>
                    ) : (
                      msg.message
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Admin Quick Commands Bar */}
      {user.role === 'admin' && (
        <div className="quick-commands-bar">
          <div className="quick-bar-title">
            <Terminal size={14} color="#f59e0b" />
            <span>Admin Quick Commands:</span>
          </div>
          <div className="quick-buttons-row">
            {quickCommands.map((qc) => (
              <button 
                key={qc.cmd}
                type="button" 
                className="quick-cmd-btn"
                onClick={() => onQuickCommand(qc.cmd)}
                title={`Send ${qc.cmd} directly to Minecraft`}
              >
                {qc.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar Form */}
      <form onSubmit={onSendMessage} className="chat-input-container">
        <div className="input-fields-group">
          {/* Sender IGN Chip */}
          <div className="sender-ign-pill" title="Sender Identity">
            <span className="sender-ign-label">From:</span>
            <input 
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="sender-ign-input"
              placeholder="Your IGN"
              maxLength={20}
              required
            />
          </div>

          {/* Main Message Input */}
          <div className="main-input-wrapper">
            <input 
              type="text"
              className="chat-main-text-input"
              placeholder={user.role === 'admin' ? "Type a chat message or Minecraft command (e.g. /time set day)..." : "Type a message to send to Minecraft & Discord..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              required
            />

            <button 
              type="submit" 
              className="chat-submit-btn"
              disabled={sending || !message.trim()}
            >
              <Send size={16} />
              <span>Send</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`chat-feedback-pill ${feedback.type}`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 size={14} />
            ) : (
              <AlertCircle size={14} />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </form>
    </div>
  );
};
