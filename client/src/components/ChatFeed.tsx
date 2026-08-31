import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Send, 
  Clock, 
  Sparkles, 
  Terminal, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  Volume2, 
  VolumeX, 
  ChevronDown, 
  User, 
  CloudSun, 
  Zap, 
  Globe 
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

/**
 * Format timestamp gracefully to Asia/Jakarta (WIB) 24h format: HH:mm:ss
 */
function formatTimeWIB(raw: string): string {
  if (!raw) return '';
  try {
    // If it's already a clean HH:mm:ss or HH.mm.ss format
    if (/^\d{2}[:.]\d{2}[:.]\d{2}$/.test(raw.trim())) {
      return raw.trim().replace(/\./g, ':');
    }
    // If it's a date or ISO string
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jakarta',
        hour12: false
      }).replace(/\./g, ':');
    }
  } catch {}
  return raw;
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
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const prevMsgCountRef = useRef<number>(messages.length);
  const isInitialMount = useRef<boolean>(true);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((smooth = true) => {
    if (!chatAreaRef.current) return;
    chatAreaRef.current.scrollTo({
      top: chatAreaRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
    isNearBottomRef.current = true;
    setShowScrollBottomBtn(false);
    setUnreadCount(0);
  }, []);

  // Monitor scroll position to determine if user is near bottom
  const handleScroll = useCallback(() => {
    if (!chatAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current;
    // User is considered near bottom if within 90px of the bottom edge
    const distanceToBottom = scrollHeight - (scrollTop + clientHeight);
    const nearBottom = distanceToBottom <= 90;
    
    isNearBottomRef.current = nearBottom;
    if (nearBottom) {
      setShowScrollBottomBtn(false);
      setUnreadCount(0);
    } else {
      setShowScrollBottomBtn(true);
    }
  }, []);

  // Smart Auto-Scroll on message updates
  useEffect(() => {
    // Initial mount: instant scroll to bottom
    if (isInitialMount.current && messages.length > 0) {
      isInitialMount.current = false;
      prevMsgCountRef.current = messages.length;
      setTimeout(() => scrollToBottom(false), 50);
      return;
    }

    const hasNewMessages = messages.length > prevMsgCountRef.current;

    if (hasNewMessages) {
      // Play subtle chime on new message
      if (soundEnabled) {
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

      // Smart Scroll Decision:
      // Only auto-scroll if user is ALREADY near the bottom.
      // If user scrolled up to read earlier chats, DO NOT interrupt them!
      if (isNearBottomRef.current) {
        scrollToBottom(true);
      } else {
        // Increment unread count badge on the floating scroll button
        const diff = messages.length - prevMsgCountRef.current;
        setUnreadCount((prev) => prev + diff);
      }
    }

    prevMsgCountRef.current = messages.length;
  }, [messages, soundEnabled, scrollToBottom]);

  // Handle form submission with forced scroll to bottom
  const handleFormSubmit = (e: React.FormEvent) => {
    onSendMessage(e);
    // User just sent a message -> force scroll to bottom
    setTimeout(() => scrollToBottom(true), 100);
  };

  const quickCommands = [
    { icon: <img src="/mc-icons/clock.png" alt="Day" style={{ width: 14, height: 14, imageRendering: 'pixelated' }} />, label: 'Daytime', cmd: '/time set day' },
    { icon: <img src="/mc-icons/clock.png" alt="Night" style={{ width: 14, height: 14, imageRendering: 'pixelated' }} />, label: 'Nighttime', cmd: '/time set night' },
    { icon: <CloudSun size={12} />, label: 'Clear Weather', cmd: '/weather clear' },
    { icon: <img src="/mc-icons/diamond.png" alt="Diamonds" style={{ width: 14, height: 14, imageRendering: 'pixelated' }} />, label: 'Give Diamonds', cmd: '/give @a diamond 10' },
  ];

  return (
    <div className="chat-card-container">
      {/* Header bar */}
      <div className="chat-card-header">
        <div className="chat-header-title">
          <div className="chat-badge-icon">
            <img src="/mc-icons/book.png" alt="Chat" style={{ width: 20, height: 20, imageRendering: 'pixelated' }} />
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
            <span className="messages-count-pill" title="Total messages loaded">
              <Flame size={13} color="#f59e0b" />
              <span>{messages.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area with Smart Scroll Detection */}
      <div 
        className="chat-messages-area" 
        ref={chatAreaRef}
        onScroll={handleScroll}
      >
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
            const isCommand = msg.message.includes('Executing command') || msg.message.includes('Menjalankan command') || msg.message.startsWith('/');

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
                      src={`https://mc-heads.net/avatar/${encodeURIComponent(msg.sender)}/32`} 
                      alt={msg.sender}
                      className="msg-avatar-img mc-skin-head"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="msg-avatar-fallback web-avatar">
                      {msg.sender ? msg.sender.charAt(0).toUpperCase() : <User size={14} />}
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className="msg-content-block">
                  <div className="msg-meta-row">
                    <span className={`msg-source-tag ${msg.source}`}>
                      {msg.source === 'Game' ? (
                        <>
                          <img src="/mc-icons/diamond_helmet.png" alt="Minecraft" style={{ width: 12, height: 12, display: 'inline', marginRight: '4px', verticalAlign: 'middle', imageRendering: 'pixelated' }} />
                          Minecraft
                        </>
                      ) : msg.source === 'Discord' ? (
                        <>
                          <Globe size={11} style={{ display: 'inline', marginRight: '3px' }} />
                          Discord
                        </>
                      ) : msg.source === 'System' ? (
                        <>
                          <Zap size={11} style={{ display: 'inline', marginRight: '3px' }} />
                          System
                        </>
                      ) : (
                        <>
                          <Globe size={11} style={{ display: 'inline', marginRight: '3px' }} />
                          Web
                        </>
                      )}
                    </span>
                    
                    <span className="msg-sender-name">
                      {msg.sender}
                      {msg.discordUser && (
                        <span className="msg-discord-tag">
                          @{msg.discordUser.username}
                        </span>
                      )}
                    </span>

                    <span className="msg-timestamp" title="Waktu Indonesia Barat (WIB)">
                      <Clock size={11} />
                      {formatTimeWIB(msg.timestamp)}
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
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottomBtn && (
        <button
          type="button"
          className="btn-scroll-bottom"
          onClick={() => scrollToBottom(true)}
          title="Scroll to latest messages"
        >
          <ChevronDown size={16} />
          <span>Scroll Down</span>
          {unreadCount > 0 && (
            <span className="scroll-unread-chip">+{unreadCount}</span>
          )}
        </button>
      )}

      {/* Admin Quick Commands Bar */}
      {user.role === 'admin' && (
        <div className="quick-commands-bar">
          <div className="quick-bar-title">
            <Terminal size={13} color="#f59e0b" />
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
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                {qc.icon}
                <span>{qc.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar Form */}
      <form onSubmit={handleFormSubmit} className="chat-input-container">
        <div className="input-fields-group">
          {/* Sender IGN Chip */}
          <div className="sender-ign-pill" title="Your In-Game Sender Identity">
            <span className="sender-ign-label">From:</span>
            <input 
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="sender-ign-input"
              placeholder="IGN"
              maxLength={20}
              required
            />
          </div>

          {/* Main Message Input */}
          <div className="main-input-wrapper">
            <input 
              type="text"
              className="chat-main-text-input"
              placeholder={user.role === 'admin' ? "Type message or command (e.g. /time set day)..." : "Type a message to send to Minecraft & Discord..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              required
            />

            <button 
              type="submit" 
              className="chat-submit-btn"
              disabled={sending || !message.trim()}
              title="Send Message (Enter)"
            >
              <Send size={15} />
              <span className="send-btn-label">Send</span>
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
