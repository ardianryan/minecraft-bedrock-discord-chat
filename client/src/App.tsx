import React, { useState, useEffect } from 'react';
import { Navbar, AuthUser } from './components/Navbar.tsx';
import { ChatFeed, ChatMessage } from './components/ChatFeed.tsx';
import { PlayerList } from './components/PlayerList.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { OfficeDashboard } from './components/OfficeDashboard.tsx';
import { LeaderboardView } from './components/LeaderboardView.tsx';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Routing State: '/' (Live Chat), '/leaderboard' (Leaderboard), atau '/office' (Office Dashboard)
  const [currentRoute, setCurrentRoute] = useState<'/' | '/leaderboard' | '/office'>('/');

  // Live Chat & Server State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  const [sender, setSender] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  const [discordInviteUrl, setDiscordInviteUrl] = useState<string>('');
  const [serverIp, setServerIp] = useState<string>('');
  const [serverPort, setServerPort] = useState<string>('19132');
  const [serverName, setServerName] = useState<string>('Minecraft Bedrock Server');
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Fetch status info (including Discord invite URL and Server IP/Port)
  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        if (data.discordInviteUrl) setDiscordInviteUrl(data.discordInviteUrl);
        if (data.serverIp) setServerIp(data.serverIp);
        if (data.serverPort) setServerPort(data.serverPort);
        if (data.serverName) setServerName(data.serverName);
      })
      .catch(() => {});
  }, []);

  // Sync initial URL path
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/office')) {
      setCurrentRoute('/office');
    } else if (path.startsWith('/leaderboard')) {
      setCurrentRoute('/leaderboard');
    } else {
      setCurrentRoute('/');
    }

    const urlParams = new URLSearchParams(window.location.search);
    const err = urlParams.get('auth_error');
    if (err) {
      setAuthError(decodeURIComponent(err));
    }
  }, []);

  // Simple client router helper
  const navigate = (route: '/' | '/leaderboard' | '/office') => {
    setCurrentRoute(route);
    window.history.pushState({}, '', route);
  };

  // 1. Cek Sesi Login User
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          setUser(data.user);
          if (!sender) {
            setSender(data.user.minecraft_username || data.user.discord_username);
          }
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // 2. Polling Live Chat & Pemain Minecraft
  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/web/messages');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    }
  };

  const fetchPlayers = async () => {
    try {
      const res = await fetch('/api/web/players');
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.players || []);
      }
    } catch {}
  };

  useEffect(() => {
    if (!user) return;
    fetchMessages();
    fetchPlayers();

    const interval = setInterval(() => {
      fetchMessages();
      fetchPlayers();
    }, 2000);

    return () => clearInterval(interval);
  }, [user]);

  // 3. Kirim Pesan / In-Game Command ke Minecraft & Discord
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !sender.trim()) return;

    setSending(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/web/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: sender.trim(),
          message: message.trim(),
          discordUser: user ? {
            id: user.discord_id,
            username: user.discord_username,
            avatar: user.discord_avatar,
          } : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('');
        fetchMessages();
        if (data.isCommand) {
          setFeedback({ text: 'Command berhasil dikirim & dieksekusi di Minecraft!', type: 'success' });
        }
      } else {
        setFeedback({ text: data.error || 'Gagal mengirim pesan.', type: 'error' });
      }
    } catch {
      setFeedback({ text: 'Koneksi ke backend server gagal.', type: 'error' });
    } finally {
      setSending(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Quick Command Launcher Helper
  const handleQuickCommand = (cmd: string) => {
    setMessage(cmd);
  };

  // 4. Logout
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    window.location.href = '/';
  };

  // Loading State
  if (authLoading) {
    return (
      <div className="fullscreen-loading">
        <div className="spin-loader" />
        <span className="loading-text">Memuat Bedrock Bridge Console...</span>
      </div>
    );
  }

  // Jika Belum Login -> Tampilkan LoginPage
  if (!user) {
    return (
      <LoginPage 
        onLoginSuccess={checkAuth}
        authError={authError}
        discordInviteUrl={discordInviteUrl}
        serverIp={serverIp}
        serverPort={serverPort}
        serverName={serverName}
      />
    );
  }

  return (
    <div className="app-shell">
      {/* Top Navbar */}
      <Navbar 
        user={user}
        currentRoute={currentRoute}
        onNavigate={navigate}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
        backendOnline={backendOnline}
        activePlayersCount={players.length}
      />

      {/* Unlinked IGN Reminder Banner */}
      {!user.minecraft_username && (
        <div className="office-alert-pill error" style={{ margin: '16px auto', maxWidth: '1400px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>Akun Discord Anda belum ditautkan ke Minecraft In-Game Name (IGN). Tautkan sekarang agar chat Anda terverifikasi!</span>
          </div>
          <button 
            type="button"
            className="btn-primary-save" 
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            onClick={() => setIsProfileOpen(true)}
          >
            Tautkan Sekarang
          </button>
        </div>
      )}

      {/* Main Content Layout */}
      <main className="main-content-layout">
        {currentRoute === '/office' ? (
          user.role === 'admin' ? (
            <OfficeDashboard currentUser={user} />
          ) : (
            <div className="access-denied-box">
              <AlertCircle size={36} color="#f43f5e" />
              <h3>Access Denied</h3>
              <p>Only Administrator accounts are permitted to access the Office dashboard.</p>
              <button className="btn-primary-save" onClick={() => navigate('/')}>
                Back to Live Chat
              </button>
            </div>
          )
        ) : currentRoute === '/leaderboard' ? (
          <LeaderboardView currentUser={user} />
        ) : (
          <div className="dashboard-grid">
            {/* Left: Chat Feed Console */}
            <div className="grid-col-chat">
              <ChatFeed 
                messages={messages}
                user={user}
                sender={sender}
                setSender={setSender}
                message={message}
                setMessage={setMessage}
                onSendMessage={handleSendMessage}
                sending={sending}
                feedback={feedback}
                onQuickCommand={handleQuickCommand}
              />
            </div>

            {/* Right: Players Roster & System Status */}
            <div className="grid-col-sidebar">
              <PlayerList 
                players={players}
                user={user}
                onOpenProfile={() => setIsProfileOpen(true)}
                botOnline={backendOnline}
                discordInviteUrl={discordInviteUrl}
                serverIp={serverIp}
                serverPort={serverPort}
                serverName={serverName}
              />
            </div>
          </div>
        )}
      </main>

      {/* Profile / Link IGN Modal */}
      <ProfileModal 
        user={user}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUpdated={checkAuth}
      />
    </div>
  );
}
