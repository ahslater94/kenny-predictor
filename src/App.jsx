import { useState, useEffect, useCallback } from 'react';
import { db } from './api.js';
import { KENNY_PLAYERS } from './players.js';

const CACHE_KEY = 'kenny_cache';
const THEME_KEY = 'kenny_theme';
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
  'Haiti':'🇭🇹','South Korea':'🇰🇷','Tunisia':'🇹🇳','Iran':'🇮🇷',
};
const fl = t => FLAGS[t] || '🏳️';
const MEDALS = ['🥇','🥈','🥉'];

const KENNY_GROUP_MAP = {
  group1: {'France':'I','Spain':'H','Germany':'E','Brazil':'C','Netherlands':'F','Belgium':'G','Argentina':'J','Portugal':'K','Norway':'I','England':'L','Morocco':'C','Colombia':'K'},
  group2: {'Uruguay':'H','Japan':'F','Croatia':'L','Mexico':'A','Ecuador':'E','Sweden':'F','USA':'D','United States':'D','Switzerland':'B','Turkey':'D','Austria':'J','Senegal':'I','Canada':'B'},
  group3: {'Czechia':'A','Czech Republic':'A','Scotland':'C','Ghana':'L','Paraguay':'D','Egypt':'G','Ivory Coast':'E','Algeria':'J','Panama':'L','Iraq':'I','Bosnia':'B','Curacao':'E','Curaçao':'E'},
  group4: {'DR Congo':'K','Democratic Republic of the Congo':'K','Cape Verde':'H','New Zealand':'G','South Africa':'A','Uzbekistan':'K','Saudi Arabia':'H','Qatar':'B','Curacao':'E','Curaçao':'E','Iraq':'I','Jordan':'J','Panama':'L','Haiti':'C','South Korea':'A','Tunisia':'F','Iran':'G','Algeria':'J'},
};

function calcPlayerPoints(player, matches) {
  let pts = 0;
  const breakdown = [];
  ['group1','group2','group3','group4'].forEach(gKey => {
    const pick = player[gKey];
    const grp = KENNY_GROUP_MAP[gKey][pick];
    if (!grp) return;
    const match = t => t===pick||(pick==='USA'&&t==='United States')||(pick==='Czechia'&&t==='Czech Republic')||(pick==='DR Congo'&&t==='Democratic Republic of the Congo')||(pick==='Curacao'&&t==='Curaçao');
    matches.filter(m=>m.group_code===grp&&(match(m.team_a)||match(m.team_b))&&m.actual_a!==null&&m.actual_a!==undefined).forEach(m=>{
      const home=match(m.team_a),ts=home?m.actual_a:m.actual_b,os=home?m.actual_b:m.actual_a,opp=home?m.team_b:m.team_a;
      if(ts>os){pts+=20;breakdown.push({label:`${pick} beat ${opp}`,pts:20});}
      else if(ts===os){pts+=10;breakdown.push({label:`${pick} drew ${opp}`,pts:10});}
      else{breakdown.push({label:`${pick} lost to ${opp}`,pts:0});}
    });
  });
  return {pts,breakdown};
}

function calcGroupTables(matches) {
  const groups={};
  matches.filter(m=>GROUP_CODES.includes(m.group_code)).forEach(m=>{
    if(!groups[m.group_code])groups[m.group_code]={};
    [m.team_a,m.team_b].forEach(t=>{if(!groups[m.group_code][t])groups[m.group_code][t]={team:t,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0};});
    if(m.actual_a===null||m.actual_a===undefined)return;
    const[ga,gb]=[m.actual_a,m.actual_b],home=groups[m.group_code][m.team_a],away=groups[m.group_code][m.team_b];
    home.p++;away.p++;home.gf+=ga;home.ga+=gb;away.gf+=gb;away.ga+=ga;
    if(ga>gb){home.w++;home.pts+=3;away.l++;}else if(ga<gb){away.w++;away.pts+=3;home.l++;}else{home.d++;home.pts++;away.d++;away.pts++;}
  });
  const result={};
  Object.entries(groups).forEach(([g,teams])=>{result[g]=Object.values(teams).sort((a,b)=>b.pts!==a.pts?b.pts-a.pts:(b.gf-b.ga)!==(a.gf-a.ga)?(b.gf-b.ga)-(a.gf-a.ga):b.gf-a.gf);});
  return result;
}

function loadCache(){try{return JSON.parse(localStorage.getItem(CACHE_KEY))||null;}catch{return null;}}
function saveCache(d){try{localStorage.setItem(CACHE_KEY,JSON.stringify(d));}catch{}}

// Theme colours
const THEMES = {
  england: { bg:'#001133', surface:'#001c58', border:'#003080', border2:'#002266', accent:'#CF111A', text:'#ffffff', dim:'#8090b8', tabBg:'#001133' },
  green:   { bg:'#07120a', surface:'#0d1f11', border:'#1a3520', border2:'#112516', accent:'#f5c518', text:'#e8f5e9', dim:'#7ab87f', tabBg:'#07120a' },
};

export default function App() {
  const [tab, setTab]       = useState('leaderboard');
  const [matches, setMatches] = useState(()=>loadCache()?.matches||[]);
  const [loading, setLoading] = useState(!loadCache());
  const [expanded, setExpanded] = useState(null);
  const [synced, setSynced]   = useState(false);
  const [theme, setTheme]     = useState(()=>{try{return localStorage.getItem(THEME_KEY)||'england';}catch{return 'england';}});

  const C = THEMES[theme] || THEMES.england;

  function toggleTheme() {
    const next = theme==='england' ? 'green' : 'england';
    setTheme(next);
    try{localStorage.setItem(THEME_KEY,next);}catch{}
  }

  const loadData = useCallback(async()=>{
    try{const ms=await db.get('matches','?order=kickoff.asc');setMatches(ms);saveCache({matches:ms});setSynced(true);}
    catch(e){console.error(e);}finally{setLoading(false);}
  },[]);

  useEffect(()=>{if(loadCache()){setLoading(false);loadData();}else{loadData();}},[]);
  useEffect(()=>{const t=setInterval(loadData,5*60_000);return()=>clearInterval(t);},[loadData]);

  const leaderboard = KENNY_PLAYERS.map(p=>{const{pts,breakdown}=calcPlayerPoints(p,matches);return{...p,pts,breakdown};}).sort((a,b)=>b.pts-a.pts);
  const groupTables = calcGroupTables(matches);
  const resultsIn   = matches.filter(m=>m.actual_a!==null&&m.actual_a!==undefined).length;
  const isEngland   = theme==='england';

  // Apply background to full page to avoid white side lines
  useEffect(() => {
    document.body.style.background = C.bg;
    document.body.style.color = C.text;
  }, [C.bg, C.text]);

  return (
    <div style={{maxWidth:820,margin:'0 auto',padding:'0 14px 80px',fontFamily:'Inter,system-ui,sans-serif',color:C.text,minHeight:'100vh'}}>

      {/* Header */}
      <header style={{textAlign:'center',padding:'28px 0 0',background:isEngland?'linear-gradient(180deg,#001c58,#001133)':'linear-gradient(180deg,#0d1f11,#07120a)',marginBottom:0}}>
        {isEngland && <div style={{fontSize:'1.2rem',letterSpacing:'0.2em',marginBottom:8}}>🏴󠁧󠁢󠁥󠁮󠁧󠁿 🏴󠁧󠁢󠁥󠁮󠁧󠁿 🏴󠁧󠁢󠁥󠁮󠁧󠁿</div>}
        <h1 style={{fontSize:'clamp(1.4rem,5vw,2.2rem)',fontWeight:900,letterSpacing:'-0.04em',color:'#fff',lineHeight:1.1}}>
          ⚽ Kenny's World Cup <span style={{color:C.accent}}>2026</span>
        </h1>
        <p style={{color:C.dim,fontSize:'0.76rem',marginTop:6,textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:500}}>
          {isEngland?`🏴󠁧󠁢󠁥󠁮󠁧󠁿 Three Lions Edition · ${KENNY_PLAYERS.length} Players 🏴󠁧󠁢󠁥󠁮󠁧󠁿`:`${KENNY_PLAYERS.length} Players · World Cup 2026`}
        </p>
        <div style={{height:4,background:C.accent,marginTop:20,width:'100%'}} />
      </header>

      {/* ── THEME TOGGLE — big and obvious ── */}
      <div style={{display:'flex',justifyContent:'center',padding:'16px 0 4px'}}>
        <button
          onClick={toggleTheme}
          style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'12px 28px',
            borderRadius:12,
            border:`2px solid ${C.accent}`,
            background: C.surface,
            color: C.text,
            fontWeight:700,
            fontSize:'0.92rem',
            cursor:'pointer',
            fontFamily:'inherit',
            letterSpacing:'0.02em',
            boxShadow:`0 0 0 1px ${C.accent}22`,
          }}>
          {isEngland ? '🌿 Switch to Green Theme' : '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Switch to England Theme'}
        </button>
      </div>

      {/* Session bar */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:'9px 14px',margin:'12px 0 14px',fontSize:'0.82rem',color:C.dim}}>
        <span><span style={{display:'inline-block',width:7,height:7,borderRadius:'50%',background:C.accent,marginRight:6,verticalAlign:'middle'}} />{resultsIn} results in · {KENNY_PLAYERS.length} players</span>
        <button onClick={loadData} style={{padding:'5px 11px',border:`1px solid ${C.border}`,borderRadius:8,background:'transparent',color:C.dim,fontWeight:700,fontSize:'0.75rem',cursor:'pointer',fontFamily:'inherit'}}>↻ Refresh</button>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:3,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:4,marginBottom:20}}>
        {[['leaderboard','🏆 Leaderboard'],['groups','📊 Groups']].map(([k,label])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:'10px 4px',border:'none',borderRadius:9,background:tab===k?(isEngland?'#CF111A':'#163320'):'transparent',color:tab===k?'#fff':C.dim,fontWeight:600,fontSize:'0.8rem',cursor:'pointer',fontFamily:'inherit'}}>{label}</button>
        ))}
      </div>

      {loading && <div style={{textAlign:'center',color:C.dim,padding:'50px 20px'}}>Loading…</div>}

      {/* ── LEADERBOARD ── */}
      {!loading && tab==='leaderboard' && (
        <div>
          <div style={{borderRadius:12,overflow:'hidden',border:`1px solid ${C.border}`}}>
            <div style={{display:'grid',gridTemplateColumns:'40px 1fr auto',padding:'9px 16px',background:C.tabBg,color:C.dim,fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:600}}>
              <div>#</div><div>Player</div><div>Pts</div>
            </div>
            {leaderboard.map((p,i)=>(
              <div key={p.name}>
                <div onClick={()=>setExpanded(expanded===p.name?null:p.name)}
                  style={{display:'grid',gridTemplateColumns:'40px 1fr auto',alignItems:'center',padding:'14px 16px',borderBottom:`1px solid ${C.border2}`,cursor:'pointer',background:expanded===p.name?C.border2:'transparent'}}>
                  <div style={{fontSize:'1.2rem'}}>{MEDALS[i]||`${i+1}`}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:'0.95rem',color:C.text,display:'flex',alignItems:'center',gap:6}}>
                      {p.name}<span style={{fontSize:'0.65rem',color:C.dim}}>{expanded===p.name?'▲':'▼'}</span>
                    </div>
                    <div style={{fontSize:'0.7rem',color:C.dim,marginTop:2}}>{p.breakdown.length} games scored</div>
                  </div>
                  <div style={{fontSize:'1.2rem',fontWeight:900,color:isEngland?'#fff':C.accent}}>{p.pts}</div>
                </div>
                {expanded===p.name&&(
                  <div style={{background:C.border2,borderBottom:`1px solid ${C.border}`}}>
                    <div style={{padding:'10px 14px 6px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                      {[{l:'Group 1',v:`${fl(p.group1)} ${p.group1}`},{l:'Group 2',v:`${fl(p.group2)} ${p.group2}`},{l:'Group 3',v:`${fl(p.group3)} ${p.group3}`},{l:'Group 4',v:`${fl(p.group4)} ${p.group4}`},{l:'Golden Boot',v:p.golden_boot},{l:'Player of Tournament',v:p.pot},{l:'England Goals',v:p.england_goals}].map((item,j)=>(
                        <div key={j} style={{fontSize:'0.76rem'}}><span style={{color:C.dim}}>{item.l}: </span><span style={{color:C.text,fontWeight:600}}>{item.v}</span></div>
                      ))}
                    </div>
                    <div style={{padding:'6px 14px 10px',borderTop:`1px solid ${C.border}`,marginTop:6}}>
                      <div style={{fontSize:'0.66rem',color:C.dim,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>Score breakdown</div>
                      {p.breakdown.length===0
                        ?<div style={{fontSize:'0.8rem',color:C.dim}}>No results yet</div>
                        :p.breakdown.map((r,j)=>(
                          <div key={j} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${C.border}`,fontSize:'0.8rem'}}>
                            <span style={{color:C.text}}>{r.label}</span>
                            <span style={{fontWeight:700,color:r.pts>=20?C.accent:r.pts>=10?C.text:C.dim}}>{r.pts}pts</span>
                          </div>
                        ))
                      }
                      <div style={{textAlign:'right',fontWeight:700,color:C.text,fontSize:'0.84rem',paddingTop:8}}>Total: {p.pts} pts</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:18,marginTop:14}}>
            <div style={{fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.1em',color:C.dim,marginBottom:12,fontWeight:600}}>Scoring System</div>
            <div style={{fontSize:'0.82rem',color:C.text,lineHeight:1.9}}>
              <div>🏆 Group stage win → <strong>20pts</strong></div>
              <div>🤝 Group stage draw → <strong>10pts</strong></div>
              <div>❌ Group stage loss → <strong>0pts</strong></div>
              <div>⚡ Knockout points double each round: R32: 40 · R16: 80 · QF: 160 · SF: 320 · Final: 640</div>
              <div>🥅 Golden Boot correct → <strong>100pts</strong></div>
              <div>⭐ Player of Tournament correct → <strong>150pts</strong></div>
              <div>🏴󠁧󠁢󠁥󠁮󠁧󠁿 England goals → <strong>Tiebreaker only</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* ── GROUPS ── */}
      {!loading && tab==='groups' && (
        <div>
          {GROUP_CODES.map((grp,gi)=>{
            const rows=groupTables[grp]||[];
            return(
              <div key={grp} style={{marginBottom:14}}>
                <div style={{fontSize:'0.68rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.12em',color:isEngland?'#fff':C.accent,padding:'14px 0 6px',borderTop:gi===0?'none':`1px solid ${C.border}`,marginTop:gi===0?0:8}}>Group {grp}</div>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:11,overflow:'hidden'}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 28px 28px 28px 28px 28px 28px 36px',gap:4,padding:'7px 12px',background:C.tabBg,fontSize:'0.62rem',color:C.dim,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>
                    <div>Team</div><div style={{textAlign:'center'}}>P</div><div style={{textAlign:'center'}}>W</div><div style={{textAlign:'center'}}>D</div><div style={{textAlign:'center'}}>L</div><div style={{textAlign:'center'}}>GF</div><div style={{textAlign:'center'}}>GA</div><div style={{textAlign:'center'}}>Pts</div>
                  </div>
                  {rows.length===0
                    ?<div style={{padding:'10px 12px',fontSize:'0.8rem',color:C.dim}}>No results yet</div>
                    :rows.map((r,i)=>(
                      <div key={r.team} style={{display:'grid',gridTemplateColumns:'1fr 28px 28px 28px 28px 28px 28px 36px',gap:4,padding:'9px 12px',borderTop:i===0?'none':`1px solid ${C.border2}`,fontSize:'0.82rem',alignItems:'center'}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,fontWeight:i<2?700:400,color:C.text}}>
                          {i<2&&<span style={{width:4,height:4,borderRadius:'50%',background:C.accent,display:'inline-block',flexShrink:0}}/>}
                          {fl(r.team)} {r.team}
                        </div>
                        <div style={{textAlign:'center',color:C.dim}}>{r.p}</div>
                        <div style={{textAlign:'center',color:C.dim}}>{r.w}</div>
                        <div style={{textAlign:'center',color:C.dim}}>{r.d}</div>
                        <div style={{textAlign:'center',color:C.dim}}>{r.l}</div>
                        <div style={{textAlign:'center',color:C.dim}}>{r.gf}</div>
                        <div style={{textAlign:'center',color:C.dim}}>{r.ga}</div>
                        <div style={{textAlign:'center',fontWeight:700,color:isEngland?'#fff':C.accent}}>{r.pts}</div>
                      </div>
                    ))
                  }
                </div>
              </div>
            );
          })}
          <div style={{fontSize:'0.72rem',color:C.dim,textAlign:'center',padding:'8px 0 20px'}}>Top 2 qualify · Best 8 third-placed teams also advance</div>
        </div>
      )}
    </div>
  );
}
