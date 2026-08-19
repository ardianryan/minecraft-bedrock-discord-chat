import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy, Flame, Crown, Medal, Search, RefreshCw, Sparkles,
  Sword, Skull, Coins, Timer, DollarSign, Activity, Zap, Shield, UserCheck,
  Trash2, AlertCircle, Check
} from 'lucide-react';
import { AuthUser } from './Navbar.tsx';
import { Sheet } from './Sheet.tsx';

export interface LeaderboardEntry {
  id: number; discord_id: string; discord_username: string;
  discord_avatar?: string; minecraft_username?: string;
  role: 'admin' | 'user'; message_count: number;
  last_active: string; created_at: string;
}

export interface ScoreboardEntry {
  username: string; kills: number; deaths: number;
  money: number; coin: number; playtime: number;
  online: number; last_synced: string;
  discord_username?: string; discord_avatar?: string; discord_id?: string;
}

interface LeaderboardViewProps { currentUser: AuthUser; }

type SortKey = 'kills' | 'deaths' | 'money' | 'coin' | 'playtime';

const fmtMoney = (n: number) =>
  n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M`
  : n >= 1_000 ? `$${(n/1_000).toFixed(1)}K` : `$${n}`;

const fmtPlaytime = (ticks: number) => {
  const h = Math.floor(ticks / 3600);
  const m = Math.floor((ticks % 3600) / 60);
  return h >= 1 ? `${h}h ${m}m` : `${m}m`;
};

const kdRatio = (kills: number, deaths: number) =>
  deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();

const TAB_CONFIG: Array<{
  key: SortKey; label: string; icon: React.ReactNode; color: string;
  format: (e: ScoreboardEntry) => string;
}> = [
  { key: 'kills',    label: 'Kills',    icon: <Sword size={15}/>,       color: '#ef4444', format: e => `${e.kills}` },
  { key: 'deaths',   label: 'Deaths',   icon: <Skull size={15}/>,       color: '#a855f7', format: e => `${e.deaths}` },
  { key: 'money',    label: 'Money',    icon: <DollarSign size={15}/>,  color: '#f59e0b', format: e => fmtMoney(e.money) },
  { key: 'coin',     label: 'Coins',    icon: <Coins size={15}/>,       color: '#eab308', format: e => `${e.coin.toLocaleString()}` },
  { key: 'playtime', label: 'Playtime', icon: <Timer size={15}/>,       color: '#22c55e', format: e => fmtPlaytime(e.playtime) },
];

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ currentUser }) => {
  const [mode, setMode] = useState<'scoreboard' | 'discord'>('scoreboard');
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);
  const [sbSort, setSbSort] = useState<SortKey>('kills');
  const [sbLoading, setSbLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dlLoading, setDlLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastFetched, setLastFetched] = useState<string>('');
  const [showResetSheet, setShowResetSheet] = useState<boolean>(false);
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const getWibTime = () => {
    return new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta', hour12: false
    }) + ' WIB';
  };

  const fetchScoreboard = useCallback(async (sort: SortKey) => {
    setSbLoading(true);
    try {
      const res = await fetch(`/api/web/scoreboard?sort=${sort}&t=${Date.now()}`);
      if (res.ok) { 
        const d = await res.json(); 
        setScoreboard(d.scoreboard || []); 
        setLastFetched(getWibTime());
      }
    } catch {} finally { setSbLoading(false); }
  }, []);

  const fetchLeaderboard = async () => {
    setDlLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?t=${Date.now()}`);
      if (res.ok) { 
        const d = await res.json(); 
        setLeaderboard(d.leaderboard || []); 
        setLastFetched(getWibTime());
      }
    } catch {} finally { setDlLoading(false); }
  };

  const handleManualRefresh = async () => {
    try {
      if (mode === 'scoreboard') {
        await fetchScoreboard(sbSort);
      } else {
        await fetchLeaderboard();
      }
      setFeedback({ text: 'Data leaderboard berhasil disinkronkan & diperbarui langsung dari server!', type: 'success' });
    } catch {
      setFeedback({ text: 'Gagal menyinkronkan data leaderboard.', type: 'error' });
    } finally {
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleResetScoreboard = async () => {
    setResetLoading(true);
    try {
      const res = await fetch('/api/office/scoreboard/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setScoreboard([]);
        setFeedback({ text: 'Data scoreboard berhasil direset/dikosongkan.', type: 'success' });
        setShowResetSheet(false);
        fetchScoreboard(sbSort);
      } else {
        setFeedback({ text: 'Gagal mereset scoreboard.', type: 'error' });
      }
    } catch {
      setFeedback({ text: 'Terjadi kesalahan jaringan.', type: 'error' });
    } finally {
      setResetLoading(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  useEffect(() => {
    fetchScoreboard(sbSort);
    fetchLeaderboard();
    const iv = setInterval(() => {
      if (mode === 'scoreboard') fetchScoreboard(sbSort);
      else fetchLeaderboard();
    }, 15000);
    return () => clearInterval(iv);
  }, [mode, sbSort]);

  const filteredDl = leaderboard.filter(item => {
    const q = searchQuery.toLowerCase();
    return item.discord_username.toLowerCase().includes(q) ||
      (item.minecraft_username && item.minecraft_username.toLowerCase().includes(q));
  });

  const tabCfg = TAB_CONFIG.find(t => t.key === sbSort) || TAB_CONFIG[0];
  const [top1, top2, top3] = scoreboard;
  const isLoading = mode === 'scoreboard' ? sbLoading : dlLoading;

  return (
    <div className="leaderboard-container">

      {/* Mode Switcher & Controls */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'20px', flexWrap:'wrap', alignItems:'center' }}>
        <button className={`lb-mode-btn${mode==='scoreboard'?' active':''}`} onClick={() => setMode('scoreboard')}>
          <Zap size={15}/> KiwEssentials Scoreboard
        </button>
        <button className={`lb-mode-btn${mode==='discord'?' active':''}`} onClick={() => setMode('discord')}>
          <Flame size={15}/> Discord Activity
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {lastFetched && (
            <div className="leaderboard-sync-badge">
              <Activity size={13} color="#34d399" />
              <span>Sinkron: {lastFetched}</span>
            </div>
          )}

          {currentUser?.role === 'admin' && mode === 'scoreboard' && (
            <button 
              type="button" 
              className="leaderboard-reset-btn" 
              onClick={() => setShowResetSheet(true)}
              title="Reset data scoreboard jika server baru atau baru di-wipe"
            >
              <Trash2 size={14} />
              <span>Reset Data</span>
            </button>
          )}

          <button 
            type="button"
            onClick={handleManualRefresh}
            className="leaderboard-refresh-btn"
            disabled={isLoading}
            title="Fetch ulang data leaderboard secara langsung"
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''}/>
            <span>{isLoading ? 'Menyinkronkan...' : 'Fetch Ulang'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`office-alert-pill ${feedback.type}`} style={{ marginBottom: '16px' }}>
          {feedback.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ── KIWESSENTIALS SCOREBOARD ── */}
      {mode === 'scoreboard' && (<>

        {/* Sort Tabs */}
        <div className="sb-tabs">
          {TAB_CONFIG.map(tab => (
            <button key={tab.key}
              className={`sb-tab-btn${sbSort===tab.key?' active':''}`}
              style={{ '--tab-color': tab.color } as React.CSSProperties}
              onClick={() => { setSbSort(tab.key); fetchScoreboard(tab.key); }}>
              {tab.icon}<span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Podium */}
        {!sbLoading && scoreboard.length >= 2 && (
          <div className="podium-grid">
            {top2 && (
              <div className="podium-card rank-2">
                <div className="podium-rank-badge silver"><Medal size={16}/><span>#2</span></div>
                <div className="podium-avatar-wrapper">
                  <img src={`https://mc-heads.net/avatar/${encodeURIComponent(top2.username)}/64`}
                    alt={top2.username} className="podium-avatar-img"
                    onError={(e) => { (e.target as HTMLImageElement).src = top2.discord_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'; }}/>
                  {top2.online===1 && <span className="online-dot"/>}
                </div>
                <div className="podium-name-block">
                  <h4 className="podium-player-name">{top2.username}</h4>
                  {top2.discord_username && <span className="podium-discord-tag">@{top2.discord_username}</span>}
                </div>
                <div className="podium-score-pill" style={{'--pill-color':tabCfg.color} as React.CSSProperties}>
                  {tabCfg.icon}<span>{tabCfg.format(top2)}</span>
                </div>
                <div className="podium-mini-stats">
                  <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}><Sword size={11}/>{top2.kills}</span>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}><Skull size={11}/>{top2.deaths}</span>
                  <span>K/D {kdRatio(top2.kills,top2.deaths)}</span>
                </div>
              </div>
            )}
            {top1 && (
              <div className="podium-card rank-1 champion">
                <div className="champion-crown-wrap"><Crown size={28} color="#fbbf24" className="crown-glow"/></div>
                <div className="podium-rank-badge gold"><Trophy size={16}/><span>#1 Champion</span></div>
                <div className="podium-avatar-wrapper gold-ring">
                  <img src={`https://mc-heads.net/avatar/${encodeURIComponent(top1.username)}/80`}
                    alt={top1.username} className="podium-avatar-img large"
                    onError={(e) => { (e.target as HTMLImageElement).src = top1.discord_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'; }}/>
                  {top1.online===1 && <span className="online-dot"/>}
                </div>
                <div className="podium-name-block">
                  <h4 className="podium-player-name champion-text">{top1.username}</h4>
                  {top1.discord_username && <span className="podium-discord-tag">@{top1.discord_username}</span>}
                </div>
                <div className="podium-score-pill gold-pill" style={{'--pill-color':tabCfg.color} as React.CSSProperties}>
                  {tabCfg.icon}<span>{tabCfg.format(top1)}</span>
                </div>
                <div className="podium-mini-stats">
                  <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}><Sword size={11}/>{top1.kills}</span>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}><Skull size={11}/>{top1.deaths}</span>
                  <span>K/D {kdRatio(top1.kills,top1.deaths)}</span>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}><DollarSign size={11}/>{fmtMoney(top1.money)}</span>
                </div>
              </div>
            )}
            {top3 && (
              <div className="podium-card rank-3">
                <div className="podium-rank-badge bronze"><Medal size={16}/><span>#3</span></div>
                <div className="podium-avatar-wrapper">
                  <img src={`https://mc-heads.net/avatar/${encodeURIComponent(top3.username)}/64`}
                    alt={top3.username} className="podium-avatar-img"
                    onError={(e) => { (e.target as HTMLImageElement).src = top3.discord_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'; }}/>
                  {top3.online===1 && <span className="online-dot"/>}
                </div>
                <div className="podium-name-block">
                  <h4 className="podium-player-name">{top3.username}</h4>
                  {top3.discord_username && <span className="podium-discord-tag">@{top3.discord_username}</span>}
                </div>
                <div className="podium-score-pill" style={{'--pill-color':tabCfg.color} as React.CSSProperties}>
                  {tabCfg.icon}<span>{tabCfg.format(top3)}</span>
                </div>
                <div className="podium-mini-stats">
                  <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}><Sword size={11}/>{top3.kills}</span>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}><Skull size={11}/>{top3.deaths}</span>
                  <span>K/D {kdRatio(top3.kills,top3.deaths)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Table */}
        <div className="office-panel-card">
          <div className="office-panel-header">
            <div className="panel-title-group">
              <Activity size={18} color="#818cf8"/>
              <h3 className="panel-title-heading">Full Scoreboard — {tabCfg.label}</h3>
            </div>
            <span className="messages-count-pill">{scoreboard.length} Players Tracked</span>
          </div>
          <div className="table-container-responsive">
            <table className="office-data-table">
              <thead>
                <tr>
                  <th style={{width:'55px',textAlign:'center'}}>Rank</th>
                  <th>IGN</th>
                  <th style={{textAlign:'right'}}>Kills</th>
                  <th style={{textAlign:'right'}}>Deaths</th>
                  <th style={{textAlign:'right'}}>K/D</th>
                  <th style={{textAlign:'right'}}>Money</th>
                  <th style={{textAlign:'right'}}>Coin</th>
                  <th style={{textAlign:'right'}}>Playtime</th>
                  <th style={{textAlign:'center'}}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sbLoading ? (
                  <tr><td colSpan={9} className="table-empty-row">Syncing KiwEssentials scoreboard...</td></tr>
                ) : scoreboard.length === 0 ? (
                  <tr><td colSpan={9} className="table-empty-row">No data yet — syncs every 3 min when players are online.</td></tr>
                ) : scoreboard.map((entry, idx) => {
                  const rank = idx + 1;
                  const kd = parseFloat(kdRatio(entry.kills, entry.deaths));
                  const kdColor = kd >= 2 ? '#22c55e' : kd >= 1 ? '#f59e0b' : '#ef4444';
                  return (
                    <tr key={entry.username}>
                      <td style={{textAlign:'center'}}>
                        <span className={`rank-number-badge ${rank===1?'gold':rank===2?'silver':rank===3?'bronze':''}`}>
                          {rank===1 ? '#1' : rank===2 ? '#2' : rank===3 ? '#3' : `#${rank}`}
                        </span>
                      </td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <img src={`https://mc-heads.net/avatar/${encodeURIComponent(entry.username)}/24`} alt=""
                            style={{width:24,height:24,borderRadius:4,imageRendering:'pixelated'}}
                            onError={(e) => { (e.target as HTMLElement).style.display='none'; }}/>
                          <div>
                            <code className="ign-active" style={{fontSize:'0.85rem'}}>{entry.username}</code>
                            {entry.discord_username && <div style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>@{entry.discord_username}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{textAlign:'right'}}><span className="sb-stat-badge" style={{color:'#ef4444'}}>{entry.kills}</span></td>
                      <td style={{textAlign:'right'}}><span className="sb-stat-badge" style={{color:'#a855f7'}}>{entry.deaths}</span></td>
                      <td style={{textAlign:'right'}}><span className="sb-stat-badge kd-ratio" style={{color:kdColor}}>{kdRatio(entry.kills,entry.deaths)}</span></td>
                      <td style={{textAlign:'right'}}><span className="sb-stat-badge" style={{color:'#f59e0b'}}>{fmtMoney(entry.money)}</span></td>
                      <td style={{textAlign:'right'}}><span className="sb-stat-badge" style={{color:'#eab308'}}>{entry.coin.toLocaleString()}</span></td>
                      <td style={{textAlign:'right'}}><span className="sb-stat-badge" style={{color:'#22c55e'}}>{fmtPlaytime(entry.playtime)}</span></td>
                      <td style={{textAlign:'center'}}>
                        {entry.online===1
                          ? <span className="online-badge">Online</span>
                          : <span className="offline-badge">Offline</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>)}

      {/* ── DISCORD ACTIVITY MODE ── */}
      {mode === 'discord' && (<>
        <div className="leaderboard-search-wrap">
          <div className="leaderboard-search-box">
            <Search size={16} className="search-icon"/>
            <input type="text" placeholder="Search player or IGN..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="leaderboard-search-input"/>
          </div>
        </div>
        {!dlLoading && filteredDl.length >= 2 && (
          <div className="podium-grid">
            {[filteredDl[1], filteredDl[0], filteredDl[2]].map((entry, i) => {
              if (!entry) return null;
              const rn = i===0?2:i===1?1:3;
              return (
                <div key={entry.discord_id} className={`podium-card rank-${rn}${rn===1?' champion':''}`}>
                  {rn===1 && <div className="champion-crown-wrap"><Crown size={28} color="#fbbf24" className="crown-glow"/></div>}
                  <div className={`podium-rank-badge ${rn===1?'gold':rn===2?'silver':'bronze'}`}>
                    {rn===1?<Trophy size={16}/>:<Medal size={16}/>}
                    <span>#{rn}{rn===1?' Champion':''}</span>
                  </div>
                  <div className={`podium-avatar-wrapper${rn===1?' gold-ring':''}`}>
                    <img src={entry.minecraft_username?`https://mc-heads.net/avatar/${encodeURIComponent(entry.minecraft_username)}/${rn===1?80:64}`:(entry.discord_avatar||'https://cdn.discordapp.com/embed/avatars/0.png')}
                      alt={entry.discord_username} className={`podium-avatar-img${rn===1?' large':''}`}
                      onError={(e) => { if(entry.discord_avatar)(e.target as HTMLImageElement).src=entry.discord_avatar; }}/>
                  </div>
                  <div className="podium-name-block">
                    <h4 className={`podium-player-name${rn===1?' champion-text':''}`}>{entry.minecraft_username||entry.discord_username}</h4>
                    <span className="podium-discord-tag">@{entry.discord_username}</span>
                  </div>
                  <div className={`podium-score-pill${rn===1?' gold-pill':''}`}>
                    <Flame size={rn===1?15:14} color={rn===1?'#fbbf24':'#f59e0b'}/>
                    <span>{entry.message_count||0} Messages</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="office-panel-card">
          <div className="office-panel-header">
            <div className="panel-title-group">
              <Sparkles size={18} color="#818cf8"/>
              <h3 className="panel-title-heading">Discord Activity — All Ranked Members</h3>
            </div>
            <span className="messages-count-pill">{filteredDl.length} Players Ranked</span>
          </div>
          <div className="table-container-responsive">
            <table className="office-data-table">
              <thead>
                <tr>
                  <th style={{width:'80px',textAlign:'center'}}>Rank</th>
                  <th>Player / Discord</th><th>Minecraft IGN</th><th>Role</th>
                  <th style={{textAlign:'right'}}>Total Messages</th>
                </tr>
              </thead>
              <tbody>
                {filteredDl.length===0 ? (
                  <tr><td colSpan={5} className="table-empty-row">{dlLoading?'Loading...':'No records found.'}</td></tr>
                ) : filteredDl.map((entry, idx) => {
                  const isCurrent = entry.discord_id === currentUser.discord_id;
                  const rank = idx+1;
                  return (
                    <tr key={entry.id} className={isCurrent?'current-user-row':''}>
                      <td style={{textAlign:'center'}}>
                        <span className={`rank-number-badge ${rank===1?'gold':rank===2?'silver':rank===3?'bronze':''}`}>
                          {rank===1 ? '#1' : rank===2 ? '#2' : rank===3 ? '#3' : `#${rank}`}
                        </span>
                      </td>
                      <td>
                        <div className="user-avatar-cell">
                          <img src={entry.discord_avatar||'https://cdn.discordapp.com/embed/avatars/0.png'}
                            alt={entry.discord_username} className="table-avatar-img"/>
                          <div>
                            <div className="table-user-name">{entry.discord_username}
                              {isCurrent && <span className="current-user-chip" style={{marginLeft:'6px'}}>You</span>}
                            </div>
                            <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>ID: {entry.discord_id}</span>
                          </div>
                        </div>
                      </td>
                      <td>{entry.minecraft_username?(
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <img src={`https://mc-heads.net/avatar/${encodeURIComponent(entry.minecraft_username)}/24`} alt=""
                            style={{width:24,height:24,borderRadius:4,imageRendering:'pixelated'}}
                            onError={(e) => { (e.target as HTMLElement).style.display='none'; }}/>
                          <code className="ign-active" style={{fontSize:'0.85rem'}}>{entry.minecraft_username}</code>
                        </div>
                      ):(<span className="ign-missing">Not Linked</span>)}</td>
                      <td>
                        {entry.role==='admin' ? (
                          <span className="badge-role-admin">
                            <Shield size={12} style={{display:'inline',marginRight:'3px'}} />
                            Admin
                          </span>
                        ) : (
                          <span className="badge-role-member">
                            <UserCheck size={12} style={{display:'inline',marginRight:'3px'}} />
                            Member
                          </span>
                        )}
                      </td>
                      <td style={{textAlign:'right'}}>
                        <span className="leaderboard-score-badge"><Flame size={13} color="#f59e0b"/><strong>{entry.message_count||0}</strong></span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>)}

      {/* Admin Reset Scoreboard Confirmation Sheet */}
      <Sheet
        isOpen={showResetSheet}
        onClose={() => setShowResetSheet(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trash2 size={20} color="#f43f5e" />
            <span>Reset Data Scoreboard</span>
          </div>
        }
        description="Kosongkan seluruh data scoreboard KiwEssentials yang tersimpan di database."
        footer={
          <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn-modal-cancel" 
              onClick={() => setShowResetSheet(false)}
              disabled={resetLoading}
            >
              Batal
            </button>
            <button 
              type="button" 
              className="leaderboard-reset-btn"
              style={{ padding: '9px 20px', fontSize: '0.85rem' }}
              onClick={handleResetScoreboard}
              disabled={resetLoading}
            >
              {resetLoading ? 'Mereset...' : 'Konfirmasi Reset Data'}
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="office-alert-pill error" style={{ margin: 0 }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: '0.8rem' }}>
              <strong>Peringatan:</strong> Seluruh catatan kills, deaths, balance money, coins, dan playtime yang tersimpan akan dikosongkan. Gunakan fitur ini jika Anda baru saja melakukan wipe server atau menghubungkan ke server Minecraft baru. Data akan kembali terisi otomatis saat pemain bermain di server.
            </span>
          </div>
        </div>
      </Sheet>
    </div>
  );
};
