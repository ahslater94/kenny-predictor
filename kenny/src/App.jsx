import { useState, useEffect, useCallback } from 'react';
import { db } from './api.js';
import { KENNY_PLAYERS } from './players.js';
import './styles.css';

const CACHE_KEY = 'kenny_cache';
const GROUP_CODES = ['A','B','C','D','E','F','G','H','I','J','K','L'];

const FLAGS = {
  'France':'🇫🇷','Spain':'🇪🇸','Germany':'🇩🇪','Brazil':'🇧🇷','Netherlands':'🇳🇱',
  'Belgium':'🇧🇪','Argentina':'🇦🇷','Portugal':'🇵🇹','Norway':'🇳🇴','England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Morocco':'🇲🇦','Colombia':'🇨🇴','Uruguay':'🇺🇾','Japan':'🇯🇵','Croatia':'🇭🇷',
  'Mexico':'🇲🇽','Ecuador':'🇪🇨','Sweden':'🇸🇪','USA':'🇺🇸','United States':'🇺🇸',
  'Switzerland':'🇨🇭','Turkey':'🇹🇷','Austria':'🇦🇹','Senegal':'🇸🇳','Canada':'🇨🇦',
  'Czechia':'🇨🇿','Czech Republic':'🇨🇿','Scotland':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','Ghana':'🇬🇭',
  'Paraguay':'🇵🇾','Egypt':'🇪🇬','Ivory Coast':'🇨🇮','Algeria':'🇩🇿','Panama':'🇵🇦',
  'Bosnia':'🇧🇦','Iraq':'🇮🇶','DR Congo':'🇨🇩','Democratic Republic of the Congo':'🇨🇩',
  'Cape Verde':'🇨🇻','New Zealand':'🇳🇿','South Africa':'🇿🇦','Uzbekistan':'🇺🇿',
  'Saudi Arabia':'🇸🇦','Qatar':'🇶🇦','Curacao':'🏳️','Curaçao':'🏳️','Jordan':'🇯🇴',
  'Haiti':'🇭🇹','South Korea':'🇰🇷','Tunisia':'🇹🇳','Iran':'🇮🇷','Ghana':'🇬🇭',
};
const fl = t => FLAGS[t] || '🏳️';
const MEDALS = ['🥇','🥈','🥉'];

const THEME_KEY = 'kenny_theme';

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || null; } catch { return null; }
}
function saveCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
}

// Map Kenny group names to actual WC group codes
const KENNY_GROUP_MAP = {
  group1: { 'France':'I','Spain':'H','Germany':'E','Brazil':'C','Netherlands':'F',
             'Belgium':'G','Argentina':'J','Portugal':'K','Norway':'I','England':'L',
             'Morocco':'C','Colombia':'K' },
  group2: { 'Uruguay':'H','Japan':'F','Croatia':'L','Mexico':'A','Ecuador':'E',
             'Sweden':'F','USA':'D','United States':'D','Switzerland':'B','Turkey':'D',
             'Austria':'J','Senegal':'I','Canada':'B' },
  group3: { 'Czechia':'A','Czech Republic':'A','Scotland':'C','Ghana':'L','Paraguay':'D',
             'Egypt':'G','Ivory Coast':'E','Algeria':'J','Panama':'L','Iraq':'I',
             'Bosnia':'B','Bolivia':'','Curacao':'E','Curaçao':'E' },
  group4: { 'DR Congo':'K','Democratic Republic of the Congo':'K','Cape Verde':'H',
             'New Zealand':'G','South Africa':'A','Uzbekistan':'K','Saudi Arabia':'H',
             'Qatar':'B','Curacao':'E','Curaçao':'E','Iraq':'I','Jordan':'J',
             'Panama':'L','Haiti':'C','South Korea':'A','Tunisia':'F','Iran':'G',
             'Algeria':'J' },
};

// Calculate points for a player based on match results
function calcPlayerPoints(player, matches) {
  let pts = 0;
  const breakdown = [];

  ['group1','group2','group3','group4'].forEach((gKey, idx) => {
    const pickedTeam = player[gKey];
    const wcGroup = KENNY_GROUP_MAP[gKey][pickedTeam];
    if (!wcGroup) return;

    // Find all matches for this team in group stage
    const teamMatches = matches.filter(m =>
      m.group_code === wcGroup &&
      (m.team_a === pickedTeam || m.team_b === pickedTeam ||
       // handle name variations
       (pickedTeam === 'USA' && (m.team_a === 'United States' || m.team_b === 'United States')) ||
       (pickedTeam === 'Czechia' && (m.team_a === 'Czech Republic' || m.team_b === 'Czech Republic')) ||
       (pickedTeam === 'DR Congo' && (m.team_a === 'Democratic Republic of the Congo' || m.team_b === 'Democratic Republic of the Congo')) ||
       (pickedTeam === 'Curacao' && (m.team_a === 'Curaçao' || m.team_b === 'Curaçao'))
      ) &&
      m.actual_a !== null && m.actual_a !== undefined
    );

    teamMatches.forEach(m => {
      const isHome = m.team_a === pickedTeam ||
        (pickedTeam === 'USA' && m.team_a === 'United States') ||
        (pickedTeam === 'Czechia' && m.team_a === 'Czech Republic') ||
        (pickedTeam === 'DR Congo' && m.team_a === 'Democratic Republic of the Congo') ||
        (pickedTeam === 'Curacao' && m.team_a === 'Curaçao');

      const teamScore  = isHome ? m.actual_a : m.actual_b;
      const otherScore = isHome ? m.actual_b : m.actual_a;
      const opp = isHome ? m.team_b : m.team_a;

      if (teamScore > otherScore) {
        pts += 20;
        breakdown.push({ label: `${pickedTeam} beat ${opp}`, pts: 20 });
      } else if (teamScore === otherScore) {
        pts += 10;
        breakdown.push({ label: `${pickedTeam} drew ${opp}`, pts: 10 });
      } else {
        breakdown.push({ label: `${pickedTeam} lost to ${opp}`, pts: 0 });
      }
    });
  });

  return { pts, breakdown };
}

function calcGroupTables(matches) {
  const groups = {};
  matches.filter(m => GROUP_CODES.includes(m.group_code)).forEach(m => {
    if (!groups[m.group_code]) groups[m.group_code] = {};
    [m.team_a, m.team_b].forEach(team => {
      if (!groups[m.group_code][team])
        groups[m.group_code][team] = { team, p:0, w:0, d:0, l:0, gf:0, ga:0, pts:0 };
    });
    if (m.actual_a === null || m.actual_a === undefined) return;
    const [ga, gb] = [m.actual_a, m.actual_b];
    const home = groups[m.group_code][m.team_a];
    const away = groups[m.group_code][m.team_b];
    home.p++; away.p++;
    home.gf += ga; home.ga += gb;
    away.gf += gb; away.ga += ga;
    if (ga > gb)      { home.w++; home.pts += 3; away.l++; }
    else if (ga < gb) { away.w++; away.pts += 3; home.l++; }
    else              { home.d++; home.pts++; away.d++; away.pts++; }
  });
  const result = {};
  Object.entries(groups).forEach(([grp, teams]) => {
    result[grp] = Object.values(teams).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if ((b.gf-b.ga) !== (a.gf-a.ga)) return (b.gf-b.ga)-(a.gf-a.ga);
      return b.gf - a.gf;
    });
  });
  return result;
}

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString([], { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

export default function App() {
  const [tab, setTab] = useState('leaderboard');
  const [matches, setMatches] = useState(() => loadCache()?.matches || []);
  const [loading, setLoading] = useState(!loadCache());
  const [expanded, setExpanded] = useState(null);
  const [synced, setSynced] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) || 'england'; } catch { return 'england'; }
  });

  useEffect(() => {
    document.body.className = theme === 'england' ? 'england' : '';
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);

  const groupTables = calcGroupTables(matches);

  const loadData = useCallback(async () => {
    try {
      const ms = await db.get('matches', '?order=kickoff.asc');
      setMatches(ms);
      saveCache({ matches: ms });
      setSynced(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loadCache()) {
      setLoading(false);
      loadData(); // refresh in background
    } else {
      loadData();
    }
  }, []);

  useEffect(() => {
    const t = setInterval(loadData, 5 * 60_000);
    return () => clearInterval(t);
  }, [loadData]);

  // Build leaderboard
  const leaderboard = KENNY_PLAYERS.map(p => {
    const { pts, breakdown } = calcPlayerPoints(p, matches);
    return { ...p, pts, breakdown };
  }).sort((a, b) => b.pts - a.pts);

  const resultsIn = matches.filter(m => m.actual_a !== null && m.actual_a !== undefined).length;

  return (
    <div className="wrap">
      <header className="app-header">
        {theme === 'england' && <div className="eng-flags">🏴󠁧󠁢󠁥󠁮󠁧󠁿 🏴󠁧󠁢󠁥󠁮󠁧󠁿 🏴󠁧󠁢󠁥󠁮󠁧󠁿</div>}
        <h1>⚽ Kenny's World Cup <span>2026</span></h1>
        <p>{theme === 'england' ? '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Three Lions Edition · ' + KENNY_PLAYERS.length + ' Players 🏴󠁧󠁢󠁥󠁮󠁧󠁿' : KENNY_PLAYERS.length + ' Players · World Cup 2026'}</p>
        <div className="eng-bar" />
      </header>

      {/* Theme toggle — prominent at top */}
      <div style={{ display:'flex', justifyContent:'center', margin:'0 0 14px' }}>
        <button
          onClick={() => setTheme(t => t === 'england' ? 'default' : 'england')}
          style={{
            padding: '10px 24px',
            borderRadius: 10,
            border: theme === 'england' ? '2px solid #CF111A' : '2px solid #2a5230',
            background: theme === 'england' ? '#001c58' : '#0d1f11',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '0.02em',
          }}>
          {theme === 'england' ? '🌿 Switch to Green Theme' : '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Switch to England Theme'}
        </button>
      </div>

      <div className="session-bar">
        <span>
          <span className={`sync-dot${synced ? '' : ' off'}`} />
          {resultsIn} results in · {KENNY_PLAYERS.length} players
        </span>
        <button className="btn btn-outline btn-sm" onClick={loadData}>↻</button>
      </div>

      <div className="tabs">
        {[['leaderboard','🏆 Leaderboard'],['groups','📊 Groups']].map(([k, label]) => (
          <button key={k} className={`tab${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {loading && <div className="loading">Loading…</div>}

      {/* ── LEADERBOARD ── */}
      {!loading && tab === 'leaderboard' && (
        <div>
          <div className="board">
            <div className="board-row board-hdr"><div>#</div><div>Player</div><div>Pts</div></div>
            {leaderboard.map((p, i) => (
              <div key={p.name}>
                <div className="board-row" style={{ cursor: 'pointer' }}
                  onClick={() => setExpanded(expanded === p.name ? null : p.name)}>
                  <div className="board-rank">{MEDALS[i] || `${i+1}`}</div>
                  <div>
                    <div className="board-name" style={{ display:'flex', alignItems:'center', gap:6 }}>
                      {p.name}
                      <span style={{ fontSize:'0.65rem', color:'var(--text-dim)' }}>{expanded === p.name ? '▲' : '▼'}</span>
                    </div>
                    <div className="board-sub">{p.breakdown.length} games scored</div>
                  </div>
                  <div className="board-pts">{p.pts}</div>
                </div>
                {expanded === p.name && (
                  <div style={{ background:'#002266', borderBottom:'1px solid #003080' }}>
                    {/* Picks summary */}
                    <div style={{ padding:'10px 14px 6px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                      {[
                        { label:'Group 1', val: `${fl(p.group1)} ${p.group1}` },
                        { label:'Group 2', val: `${fl(p.group2)} ${p.group2}` },
                        { label:'Group 3', val: `${fl(p.group3)} ${p.group3}` },
                        { label:'Group 4', val: `${fl(p.group4)} ${p.group4}` },
                        { label:'Golden Boot', val: p.golden_boot },
                        { label:'Player of Tournament', val: p.pot },
                        { label:'England Goals', val: p.england_goals },
                      ].map((item, j) => (
                        <div key={j} style={{ fontSize:'0.76rem' }}>
                          <span style={{ color:'#8090b8' }}>{item.label}: </span>
                          <span style={{ color:'#fff', fontWeight:600 }}>{item.val}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding:'6px 14px 10px', borderTop:'1px solid #003080', marginTop:6 }}>
                      <div style={{ fontSize:'0.66rem', color:'#8090b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Score breakdown</div>
                      {p.breakdown.length === 0
                        ? <div style={{ fontSize:'0.8rem', color:'#8090b8' }}>No results yet</div>
                        : p.breakdown.map((r, j) => (
                          <div key={j} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid #003080', fontSize:'0.8rem' }}>
                            <span style={{ color:'#c8d8f0' }}>{r.label}</span>
                            <span style={{ fontWeight:700, color: r.pts >= 20 ? '#CF111A' : r.pts >= 10 ? '#fff' : '#8090b8' }}>
                              {r.pts}pts
                            </span>
                          </div>
                        ))
                      }
                      <div style={{ textAlign:'right', fontWeight:700, color:'#fff', fontSize:'0.84rem', paddingTop:8 }}>
                        Total: {p.pts} pts
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Scoring guide */}
          <div className="card" style={{ marginTop:14 }}>
            <div className="sec-title">Scoring System</div>
            <div style={{ fontSize:'0.82rem', color:'#c8d8f0', lineHeight:1.9 }}>
              <div>🏆 Group stage win → <strong style={{color:'#fff'}}>20pts</strong></div>
              <div>🤝 Group stage draw → <strong style={{color:'#fff'}}>10pts</strong></div>
              <div>❌ Group stage loss → <strong style={{color:'#fff'}}>0pts</strong></div>
              <div>⚡ Points double each knockout round</div>
              <div style={{paddingLeft:16, color:'#8090b8', fontSize:'0.76rem'}}>R32: 40 · R16: 80 · QF: 160 · SF: 320 · Final: 640</div>
              <div>🥅 Golden Boot correct → <strong style={{color:'#fff'}}>100pts</strong></div>
              <div>⭐ Player of Tournament correct → <strong style={{color:'#fff'}}>150pts</strong></div>
              <div>🏴󠁧󠁢󠁥󠁮󠁧󠁿 England goals → <strong style={{color:'#fff'}}>Tiebreaker only</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* ── GROUPS ── */}
      {!loading && tab === 'groups' && (
        <div>
          {GROUP_CODES.map(grp => {
            const rows = groupTables[grp] || [];
            return (
              <div key={grp} style={{ marginBottom:14 }}>
                <div className="grp-hdr" style={{ paddingTop: grp === 'A' ? 0 : 14 }}>Group {grp}</div>
                <div style={{ background:'#001c58', border:'1px solid #003080', borderRadius:11, overflow:'hidden' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 28px 28px 28px 28px 28px 28px 36px', gap:4, padding:'7px 12px', background:'#001133', fontSize:'0.62rem', color:'#8090b8', textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:600 }}>
                    <div>Team</div><div style={{textAlign:'center'}}>P</div><div style={{textAlign:'center'}}>W</div><div style={{textAlign:'center'}}>D</div><div style={{textAlign:'center'}}>L</div><div style={{textAlign:'center'}}>GF</div><div style={{textAlign:'center'}}>GA</div><div style={{textAlign:'center'}}>Pts</div>
                  </div>
                  {rows.length === 0
                    ? <div style={{ padding:'10px 12px', fontSize:'0.8rem', color:'#8090b8' }}>No results yet</div>
                    : rows.map((r, i) => (
                      <div key={r.team} style={{ display:'grid', gridTemplateColumns:'1fr 28px 28px 28px 28px 28px 28px 36px', gap:4, padding:'9px 12px', borderTop: i===0?'none':'1px solid #002266', fontSize:'0.82rem', alignItems:'center' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, fontWeight: i<2?700:400 }}>
                          {i<2 && <span style={{ width:4, height:4, borderRadius:'50%', background:'#CF111A', display:'inline-block', flexShrink:0 }} />}
                          {fl(r.team)} {r.team}
                        </div>
                        <div style={{textAlign:'center',color:'#8090b8'}}>{r.p}</div>
                        <div style={{textAlign:'center',color:'#8090b8'}}>{r.w}</div>
                        <div style={{textAlign:'center',color:'#8090b8'}}>{r.d}</div>
                        <div style={{textAlign:'center',color:'#8090b8'}}>{r.l}</div>
                        <div style={{textAlign:'center',color:'#8090b8'}}>{r.gf}</div>
                        <div style={{textAlign:'center',color:'#8090b8'}}>{r.ga}</div>
                        <div style={{textAlign:'center',fontWeight:700,color:'#fff'}}>{r.pts}</div>
                      </div>
                    ))
                  }
                </div>
              </div>
            );
          })}
          <div style={{ fontSize:'0.72rem', color:'#8090b8', textAlign:'center', padding:'8px 0 20px' }}>
            🔴 Top 2 qualify · Best 8 third-placed teams also advance
          </div>
        </div>
      )}
    </div>
  );
}
