'use client'
import { useState, useEffect, useRef } from 'react'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

// ── SEED DATA — shown until live data loads ──────────────────────────────────
const SEED = [
  { _id:'c1',  name:'NRA Bianchi Cup',                org:'NRA',        discipline:'Practical Pistol',  matchType:'National',    level:'Advanced',          startDate:'2026-06-12', endDate:'2026-06-15', city:'Columbia',      state:'MO', entryFee:150, registrationUrl:'https://competitions.nra.org', description:'Oldest and most prestigious practical pistol championship in the world. 4 events: Practical, Barricade, Mover, and Plates.' },
  { _id:'c2',  name:'USPSA Area 3 Championship',      org:'USPSA/IPSC', discipline:'Practical Pistol',  matchType:'Area Match',   level:'All Levels',        startDate:'2026-07-18', endDate:'2026-07-20', city:'Tulsa',         state:'OK', entryFee:120, registrationUrl:'https://practiscore.com', description:'USPSA Area 3 Championship. Multi-gun stages. All divisions.' },
  { _id:'c3',  name:'PRS National Championship',       org:'PRS',        discipline:'Precision Rifle',   matchType:'National',    level:'Advanced',          startDate:'2026-09-14', endDate:'2026-09-19', city:'Tulsa',         state:'OK', entryFee:500, registrationUrl:'https://precisionrifleseries.com', description:'The Super Bowl of precision rifle. 200 top shooters. 12-stage match.' },
  { _id:'c4',  name:'IDPA Indoor Nationals',           org:'IDPA',       discipline:'Practical Pistol',  matchType:'National',    level:'All Levels',        startDate:'2026-10-08', endDate:'2026-10-12', city:'Tulsa',         state:'OK', entryFee:175, registrationUrl:'https://idpa.com', description:'IDPA Indoor Nationals. Stock Service Pistol, Enhanced Service Pistol, and more.' },
  { _id:'c5',  name:'NRL22 National Championship',     org:'NRL',        discipline:'Precision Rifle',   matchType:'National',    level:'All Levels',        startDate:'2026-08-07', endDate:'2026-08-09', city:'Rockcastle',    state:'KY', entryFee:200, registrationUrl:'https://nationalrifleleague.org', description:'NRL22 rimfire precision rifle nationals. .22 LR only. Great intro to PRS-style shooting.' },
  { _id:'c6',  name:'Ironman 3-Gun',                   org:'Other',      discipline:'3-Gun',             matchType:'National',    level:'All Levels',        startDate:'2026-10-22', endDate:'2026-10-25', city:'Talladega',     state:'AL', entryFee:300, registrationUrl:'https://ironman3gun.com', description:'Premier 3-gun match at the Talladega Marksmanship Park. Pistol, rifle, shotgun.' },
  { _id:'c7',  name:'Steel Challenge World Speed Shoot',org:'USPSA/IPSC',discipline:'Practical Pistol',  matchType:'World',       level:'All Levels',        startDate:'2026-08-24', endDate:'2026-08-29', city:'Talladega',     state:'AL', entryFee:200, registrationUrl:'https://practiscore.com', description:'World Steel Challenge Championship. Speed only — 5 stage formats, all divisions.' },
  { _id:'c8',  name:'NSSF Rimfire Challenge',          org:'NSSF',       discipline:'Rimfire',           matchType:'National',    level:'Beginner Friendly', startDate:'2026-07-25', endDate:'2026-07-27', city:'Wyandotte',     state:'MI', entryFee:85,  registrationUrl:'https://nssf.org', description:'Family-friendly rimfire competition. .22 LR pistol and rifle. Great first match.' },
  { _id:'c9',  name:'Precision Rifle Series — Season Opener', org:'PRS', discipline:'Precision Rifle',  matchType:'Regional',    level:'Intermediate',      startDate:'2026-06-06', endDate:'2026-06-07', city:'Wendell',       state:'NC', entryFee:275, registrationUrl:'https://precisionrifleseries.com', description:'PRS season opener. Gas gun division available.' },
  { _id:'c10', name:'USPSA Multi-Gun Nationals',       org:'USPSA/IPSC', discipline:'3-Gun',             matchType:'National',    level:'All Levels',        startDate:'2026-11-04', endDate:'2026-11-08', city:'Talladega',     state:'AL', entryFee:350, registrationUrl:'https://practiscore.com', description:'USPSA Multi-Gun National Championship at Talladega Marksmanship Park.' },
  { _id:'c11', name:'NRA High Power Long Range',       org:'NRA',        discipline:'Long Range',        matchType:'National',    level:'Intermediate',      startDate:'2026-07-07', endDate:'2026-07-12', city:'Camp Perry',    state:'OH', entryFee:130, registrationUrl:'https://competitions.nra.org', description:'F-Class and service rifle long range at the iconic Camp Perry National Matches.' },
  { _id:'c12', name:'IDPA Regional — Southeast',       org:'IDPA',       discipline:'Practical Pistol',  matchType:'Regional',    level:'All Levels',        startDate:'2026-06-27', endDate:'2026-06-28', city:'Macon',         state:'GA', entryFee:90,  registrationUrl:'https://idpa.com', description:'IDPA Southeast Regional. All divisions. Stock service pistol to enhanced.' },
]

const ORGS = [
  { key:'NRA',        label:'NRA',        color:'#ef4444', desc:'National Rifle Association competitive shooting events. Bianchi Cup, Camp Perry, High Power, and more.' },
  { key:'USPSA/IPSC', label:'USPSA/IPSC', color:'#3b82f6', desc:'United States Practical Shooting Association. Dynamic action pistol, multi-gun, and Steel Challenge.' },
  { key:'IDPA',       label:'IDPA',       color:'#22c55e', desc:'International Defensive Pistol Association. Scenario-based defensive shooting competitions.' },
  { key:'PRS',        label:'PRS',        color:'#C8922A', desc:'Precision Rifle Series. Long-range bolt gun and gas gun competition. The top tier of practical precision shooting.' },
  { key:'NRL',        label:'NRL22',      color:'#a855f7', desc:'National Rifle League. Rimfire and centerfire precision. Great entry point for PRS-style competition.' },
  { key:'NSSF',       label:'NSSF',       color:'#f97316', desc:'Rimfire Challenge and other NSSF-sanctioned events. Family-friendly, beginner welcoming.' },
  { key:'3-Gun',      label:'3-Gun Nation',color:'#f59e0b',desc:'Three-gun competition: pistol, rifle, and shotgun. Fast, dynamic, demanding.' },
  { key:'Other',      label:'Other',      color:'#6b7280', desc:'Independent matches, club shoots, regional events not affiliated with a national body.' },
]

const DISCIPLINES = ['All','Practical Pistol','Precision Rifle','3-Gun','Shotgun','Rimfire','Long Range','Steel Challenge','Hunting','Cowboy Action','Other']

const CAT_C = {'NRA':'#ef4444','USPSA/IPSC':'#3b82f6','IDPA':'#22c55e','PRS':'#C8922A','PRS Network':'#C8922A','NRL':'#a855f7','NSSF':'#f97316','3-Gun':'#f59e0b','Other':'#6b7280'}

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date()
  const days = Math.ceil(diff / 86400000)
  if (days < 0) return null
  if (days === 0) return 'TODAY'
  if (days === 1) return 'TOMORROW'
  if (days <= 7) return days + ' DAYS'
  if (days <= 30) return Math.ceil(days/7) + ' WKS'
  return Math.ceil(days/30) + ' MO'
}

function MatchCard({ match, featured }) {
  const countdown = daysUntil(match.startDate)
  const orgColor  = CAT_C[match.org] || '#6b7280'
  const dateStr   = new Date(match.startDate).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })

  return (
    <div style={{ background: featured ? 'rgba(200,146,42,.06)' : 'var(--bg2)',
      border: `1px solid ${featured ? 'rgba(200,146,42,.4)' : 'var(--border)'}`,
      padding: '16px 18px', transition: 'border-color .15s', position: 'relative' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = featured ? '#C8922A' : '#C8922A'}
      onMouseLeave={e => e.currentTarget.style.borderColor = featured ? 'rgba(200,146,42,.4)' : 'var(--border)'}>

      {featured && <div style={{ position:'absolute', top:-1, right:16, background:'#C8922A', color:'#000', fontFamily:"'IBM Plex Mono',monospace", fontSize:8, fontWeight:700, padding:'2px 8px', letterSpacing:'.1em' }}>★ FEATURED</div>}

      <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10 }}>
        <div style={{ flexShrink:0, textAlign:'center', minWidth:52, background:'rgba(0,0,0,.3)', padding:'6px 8px' }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', textTransform:'uppercase' }}>
            {new Date(match.startDate).toLocaleDateString('en-US',{month:'short'})}
          </div>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem', color:'var(--text)', lineHeight:1 }}>
            {new Date(match.startDate).getDate()}
          </div>
          {match.endDate && match.endDate !== match.startDate && (
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563' }}>
              –{new Date(match.endDate).getDate()}
            </div>
          )}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:5, flexWrap:'wrap' }}>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, padding:'2px 7px', background:orgColor+'22', color:orgColor, letterSpacing:'.06em', textTransform:'uppercase' }}>{match.org}</span>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563' }}>{match.discipline}</span>
            {match.matchType === 'National' && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, color:'#f59e0b' }}>NATIONAL</span>}
            {match.matchType === 'World' && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, color:'#ef4444' }}>WORLD</span>}
          </div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:700, color:'var(--text)', lineHeight:1.15, marginBottom:4 }}>{match.name}</div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280' }}>
            📍 {match.city}, {match.state} {match.country !== 'USA' ? '· '+match.country : ''}
          </div>
        </div>

        <div style={{ flexShrink:0, textAlign:'right' }}>
          {countdown && (
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, color: parseInt(countdown) <= 14 ? '#ef4444' : '#f59e0b', marginBottom:4 }}>{countdown}</div>
          )}
          {match.entryFee > 0 && (
            <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.1rem', color:'#C8922A' }}>${match.entryFee}</div>
          )}
        </div>
      </div>

      {match.description && (
        <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', lineHeight:1.7, margin:'0 0 12px' }}>{match.description.slice(0,140)}{match.description.length > 140 ? '...' : ''}</p>
      )}

      <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'space-between', flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:8 }}>
          {match.level && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, padding:'2px 7px', background:'rgba(255,255,255,.05)', color:'#4b5563', border:'1px solid var(--border)' }}>{match.level}</span>}
        </div>
        {match.registrationUrl && (
          <a href={match.registrationUrl} target="_blank" rel="noreferrer"
            style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase',
              background:'#C8922A', color:'#000', padding:'6px 14px', textDecoration:'none', flexShrink:0 }}>
            Register ↗
          </a>
        )}
      </div>
    </div>
  )
}

export default function CompetitionsPage() {
  const [matches,    setMatches]    = useState(SEED)
  const [loading,    setLoading]    = useState(true)
  const [orgFilter,  setOrgFilter]  = useState('all')
  const [discFilter, setDiscFilter] = useState('All')
  const [stateFilter,setStateFilter]= useState('')
  const [tab,        setTab]        = useState('upcoming')  // upcoming | calendar | orgs | finder
  const [search,     setSearch]     = useState('')

  useEffect(() => {
    fetch('/api/competitions')
      .then(r => r.json())
      .then(d => {
        if (d.matches?.length > 0) setMatches(d.matches)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = matches.filter(m => {
    if (orgFilter !== 'all' && m.org !== orgFilter) return false
    if (discFilter !== 'All' && m.discipline !== discFilter) return false
    if (stateFilter && m.state?.toLowerCase() !== stateFilter.toLowerCase()) return false
    if (search) {
      const s = search.toLowerCase()
      return (m.name+m.city+m.state+m.org+m.discipline).toLowerCase().includes(s)
    }
    return true
  })

  const upcoming  = filtered.filter(m => new Date(m.startDate) >= new Date()).sort((a,b) => new Date(a.startDate)-new Date(b.startDate))
  const featured  = upcoming.filter(m => m.featured || m.matchType === 'National' || m.matchType === 'World')
  const regular   = upcoming.filter(m => !m.featured && m.matchType !== 'National' && m.matchType !== 'World')

  // Group by month for calendar view
  const byMonth = {}
  upcoming.forEach(m => {
    const key = new Date(m.startDate).toLocaleDateString('en-US',{month:'long',year:'numeric'})
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(m)
  })

  const states = [...new Set(matches.map(m => m.state).filter(Boolean))].sort()

  return (
    <>
      <Masthead />

      {/* ── HERO ── */}
      <div style={{ background:'linear-gradient(180deg,#09090B 0%,#0d1117 100%)', borderBottom:'1px solid var(--border)', padding:'48px 0 32px' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#C8922A', letterSpacing:'.15em', fontWeight:700, textTransform:'uppercase' }}>🏆 Competitive Shooting</span>
          </div>
          <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(3rem,8vw,5rem)', color:'#F0EDE6', letterSpacing:'.04em', lineHeight:1, margin:'0 0 12px' }}>
            Competitions
          </h1>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#6b7280', margin:'0 0 24px', maxWidth:600, lineHeight:1.8 }}>
            NRA · USPSA/IPSC · IDPA · PRS · NRL22 · Steel Challenge · 3-Gun · and more. Find your next match.
          </p>

          {/* Org pills */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {ORGS.map(o => (
              <button key={o.key} onClick={() => setOrgFilter(orgFilter === o.key ? 'all' : o.key)}
                style={{ background: orgFilter === o.key ? o.color+'33' : 'transparent',
                  border: `1px solid ${orgFilter === o.key ? o.color : o.color+'44'}`,
                  color: orgFilter === o.key ? o.color : '#6b7280',
                  fontFamily:"'IBM Plex Mono',monospace", fontSize:10, fontWeight:700, letterSpacing:'.06em',
                  padding:'5px 12px', cursor:'pointer', transition:'all .15s', textTransform:'uppercase' }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:60, zIndex:20 }}>
        <div className="container">
          <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
            {[['upcoming','📅 Upcoming'],['calendar','🗓 Calendar'],['orgs','🏛 Organizations'],['finder','🔍 Finder']].map(([k,l]) => (
              <button key={k} onClick={() => setTab(k)}
                style={{ background:'none', border:'none', borderBottom:`2px solid ${tab===k?'var(--gold)':'transparent'}`,
                  color: tab===k?'var(--gold)':'var(--text-dim)', padding:'12px 18px',
                  fontFamily:"'IBM Plex Mono',monospace", fontSize:11, cursor:'pointer', whiteSpace:'nowrap', transition:'color .15s' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'32px 0 80px', background:'var(--bg)' }}>
        <div className="container">

          {/* ── UPCOMING ── */}
          {tab === 'upcoming' && (
            <div>
              {/* Filters */}
              <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search matches..."
                  style={{ background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'8px 12px', outline:'none', width:220 }} />
                <select value={discFilter} onChange={e=>setDiscFilter(e.target.value)}
                  style={{ background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'8px 10px', outline:'none' }}>
                  {DISCIPLINES.map(d => <option key={d}>{d}</option>)}
                </select>
                <select value={stateFilter} onChange={e=>setStateFilter(e.target.value)}
                  style={{ background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'8px 10px', outline:'none' }}>
                  <option value="">All States</option>
                  {states.map(s => <option key={s}>{s}</option>)}
                </select>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563', marginLeft:'auto' }}>{upcoming.length} matches</span>
              </div>

              {/* Featured / national */}
              {featured.length > 0 && (
                <div style={{ marginBottom:32 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'.05em' }}>★ Majors & Nationals</div>
                    <div style={{ flex:1, height:1, background:'var(--border)' }} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(380px,1fr))', gap:12 }}>
                    {featured.map(m => <MatchCard key={m._id} match={m} featured />)}
                  </div>
                </div>
              )}

              {/* All upcoming */}
              {regular.length > 0 && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--text)', letterSpacing:'.05em' }}>All Upcoming</div>
                    <div style={{ flex:1, height:1, background:'var(--border)' }} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(380px,1fr))', gap:12 }}>
                    {regular.map(m => <MatchCard key={m._id} match={m} />)}
                  </div>
                </div>
              )}

              {upcoming.length === 0 && !loading && (
                <div style={{ padding:'60px', textAlign:'center', fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#4b5563' }}>
                  No upcoming matches found with current filters.
                </div>
              )}
            </div>
          )}

          {/* ── CALENDAR VIEW ── */}
          {tab === 'calendar' && (
            <div>
              <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:24 }}>Match Calendar 2026</h2>
              {Object.entries(byMonth).map(([month, monthMatches]) => (
                <div key={month} style={{ marginBottom:32 }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#C8922A', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase',
                    marginBottom:12, padding:'6px 0', borderBottom:'1px solid rgba(200,146,42,.3)' }}>
                    {month} · {monthMatches.length} match{monthMatches.length!==1?'es':''}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {monthMatches.map(m => (
                      <div key={m._id} style={{ display:'grid', gridTemplateColumns:'52px 1fr auto', gap:12, alignItems:'center', padding:'10px 14px', background:'var(--bg2)', border:'1px solid var(--border)' }}>
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--text)', lineHeight:1 }}>{new Date(m.startDate).getDate()}</div>
                          {m.endDate && m.endDate!==m.startDate && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#4b5563' }}>–{new Date(m.endDate).getDate()}</div>}
                        </div>
                        <div>
                          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:2 }}>{m.name}</div>
                          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6b7280', display:'flex', gap:8 }}>
                            <span style={{ color: CAT_C[m.org]||'#6b7280' }}>{m.org}</span>
                            <span>·</span><span>{m.city}, {m.state}</span>
                            {m.matchType === 'National' && <><span>·</span><span style={{ color:'#f59e0b' }}>NATIONAL</span></>}
                          </div>
                        </div>
                        {m.registrationUrl && (
                          <a href={m.registrationUrl} target="_blank" rel="noreferrer"
                            style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#C8922A', textDecoration:'none', flexShrink:0 }}>
                            Register ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── ORGANIZATIONS ── */}
          {tab === 'orgs' && (
            <div>
              <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:8 }}>Sanctioning Bodies</h2>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', marginBottom:28 }}>The major organizations that run sanctioned competitive shooting in the US.</p>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
                {[
                  { org:'NRA', name:'National Rifle Association', url:'https://competitions.nra.org', color:'#ef4444',
                    desc:'The NRA runs some of the oldest and most prestigious shooting competitions in the country. Bianchi Cup, Camp Perry National Matches, and High Power are iconic events with decades of history. If you want to shoot against the best in traditional target and practical pistol, the NRA calendar is where to look.',
                    events:['Bianchi Cup (Columbia, MO)','Camp Perry National Matches','NRA National Championship','Pistol, Rifle, Shotgun events','Police Pistol Combat (PPC)'],
                    season:'Year-round, peak June–August' },
                  { org:'USPSA/IPSC', name:'United States Practical Shooting Association', url:'https://uspsa.org', color:'#3b82f6',
                    desc:'USPSA is the American affiliate of IPSC — the International Practical Shooting Confederation. Dynamic shooting on multi-stage courses. Pistol, Carry Optics, Production, Limited, Open, and Revolver divisions. Steel Challenge is also under the USPSA umbrella. If you carry a gun, you should shoot USPSA.',
                    events:['Area Championships (8 areas)','USPSA National Championship','Steel Challenge World Speed Shoot','Multi-Gun Nationals','Club matches every weekend'],
                    season:'Year-round nationwide' },
                  { org:'IDPA', name:'International Defensive Pistol Association', url:'https://idpa.com', color:'#22c55e',
                    desc:'IDPA was founded as a more defensive-oriented alternative to USPSA. Scenarios are drawn from real-world defensive situations — cover, concealment, and practical carry gear required. Less equipment-intensive than USPSA. Stock Service Pistol, Enhanced Service Pistol, Custom Defensive Pistol divisions.',
                    events:['IDPA Indoor Nationals','IDPA Nationals','Regional Championships','Club matches','Back Up Gun Nationals'],
                    season:'Year-round nationwide' },
                  { org:'PRS', name:'Precision Rifle Series', url:'https://precisionrifleseries.com', color:'#C8922A',
                    desc:'PRS is the highest level of practical precision rifle competition. Bolt guns in the main series, gas guns in PRS Gas Gun. Stages challenge wind reading, positional shooting, and andguns at distance. The PRS National Championship is the Super Bowl of long-range shooting.',
                    events:['PRS Season Opener','PRS Regional Events','PRS Gas Gun Series','PRS National Championship','Pro series events'],
                    season:'March–September' },
                  { org:'NRL', name:'National Rifle League / NRL22', url:'https://nationalrifleleague.org', color:'#a855f7',
                    desc:'NRL22 is the entry point for PRS-style shooting — .22 LR only, making ammo costs manageable. Scored the same way as PRS, great for learning wind and positional shooting without the expense of centerfire. The NRL centerfire series runs alongside for more experienced shooters.',
                    events:['NRL22 Season Matches','NRL22 Nationals','NRL Centerfire Series','Club-level NRL22'],
                    season:'February–October' },
                  { org:'NSSF', name:'National Shooting Sports Foundation', url:'https://nssf.org/rimfirechallenge', color:'#f97316',
                    desc:'The NSSF Rimfire Challenge is the best entry-level competition for new shooters. .22 LR pistol and rifle, five steel targets per stage, pure speed. Family-friendly, affordable, and available at hundreds of ranges nationwide. If you have never competed, start here.',
                    events:['Rimfire Challenge Club Matches','Rimfire Challenge Championship','Youth events'],
                    season:'Year-round' },
                ].map(org => (
                  <div key={org.org} style={{ background:'var(--bg2)', border:`1px solid ${org.color}33`, padding:'20px 22px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                      <div>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, padding:'3px 8px', background:org.color+'22', color:org.color, letterSpacing:'.1em', textTransform:'uppercase', display:'inline-block', marginBottom:6 }}>{org.org}</span>
                        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:700, color:'var(--text)', lineHeight:1.1 }}>{org.name}</div>
                      </div>
                      <a href={org.url} target="_blank" rel="noreferrer" style={{ color:org.color, fontSize:16, textDecoration:'none', flexShrink:0 }}>↗</a>
                    </div>
                    <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af', lineHeight:1.8, marginBottom:12 }}>{org.desc}</p>
                    <div style={{ marginBottom:10 }}>
                      {org.events.map(e => (
                        <div key={e} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', display:'flex', gap:6, marginBottom:3 }}>
                          <span style={{ color:org.color, flexShrink:0 }}>›</span>{e}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563' }}>Season: {org.season}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── FINDER ── */}
          {tab === 'finder' && (
            <div style={{ maxWidth:760 }}>
              <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:8 }}>Match Finder</h2>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', marginBottom:24 }}>Filter by what you shoot, where you are, and your experience level.</p>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                {[
                  ['What do you shoot?', discFilter, setDiscFilter, DISCIPLINES],
                  ['Your state', stateFilter, setStateFilter, ['', ...states]],
                ].map(([label, val, setter, opts]) => (
                  <div key={label}>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:4 }}>{label}</div>
                    <select value={val} onChange={e=>setter(e.target.value)}
                      style={{ background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'10px 12px', outline:'none', width:'100%' }}>
                      {opts.map(o => <option key={o} value={o}>{o || 'All States'}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {/* Level selector */}
              <div style={{ marginBottom:24 }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:8 }}>Your Level</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {['All Levels','Beginner Friendly','Intermediate','Advanced'].map(l => (
                    <button key={l} style={{ background:'transparent', border:'1px solid var(--border)', color:'var(--text-dim)', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, padding:'6px 14px', cursor:'pointer', transition:'all .15s' }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='#C8922A';e.currentTarget.style.color='#C8922A'}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-dim)'}}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:'var(--text)', letterSpacing:'.04em' }}>{upcoming.length} Matches Found</div>
                <div style={{ flex:1, height:1, background:'var(--border)' }} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {upcoming.slice(0,15).map(m => <MatchCard key={m._id} match={m} />)}
              </div>

              {/* External links */}
              <div style={{ marginTop:32, padding:'20px 24px', background:'var(--bg2)', border:'1px solid var(--border)' }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:12 }}>Find More Matches</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    ['Practiscore.com', 'https://practiscore.com/results/browse', 'USPSA/IDPA match registration and results. Largest firearms match database.'],
                    ['NRA Competition Finder', 'https://competitions.nra.org', 'Official NRA competition calendar and registration.'],
                    ['PRS Match Finder', 'https://precisionrifleseries.com/matches', 'All sanctioned PRS and PRS Pro Series matches.'],
                    ['NRL22 Match Finder', 'https://nationalrifleleague.org/find-a-match', 'NRL22 and NRL Hunter match locator by state.'],
                    ['IDPA Match Finder', 'https://www.idpa.com/compete/find-a-match', 'Official IDPA club and championship match finder.'],
                  ].map(([name, url, desc]) => (
                    <a key={name} href={url} target="_blank" rel="noreferrer"
                      style={{ display:'flex', gap:12, alignItems:'center', textDecoration:'none', padding:'10px 12px', background:'rgba(0,0,0,.2)', transition:'background .15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(200,146,42,.06)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(0,0,0,.2)'}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:2 }}>{name}</div>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6b7280' }}>{desc}</div>
                      </div>
                      <span style={{ color:'#C8922A', fontSize:14, flexShrink:0 }}>↗</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  )
}
