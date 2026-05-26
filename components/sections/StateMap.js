'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const RATING_COLORS = {
  'A+': '#16A34A', 'A': '#22C55E', 'B+': '#65A30D', 'B': '#84CC16',
  'C': '#EAB308', 'D': '#F97316', 'D-': '#EF4444', 'F': '#DC2626',
}

// SVG path data for all 50 US states (simplified but accurate positions)
const STATE_POSITIONS = {
  // Western states
  WA:{x:80,y:55,w:80,h:60}, OR:{x:75,y:115,w:75,h:80}, CA:{x:50,y:195,w:70,h:160},
  NV:{x:95,y:155,w:65,h:90}, ID:{x:140,y:80,w:65,h:110}, MT:{x:175,y:45,w:110,h:80},
  WY:{x:205,y:125,w:90,h:75}, UT:{x:155,y:175,w:70,h:90}, AZ:{x:150,y:265,w:80,h:90},
  CO:{x:210,y:180,w:90,h:70}, NM:{x:200,y:265,w:75,h:90},
  // Central states
  ND:{x:300,y:55,w:80,h:65}, SD:{x:300,y:120,w:80,h:65}, NE:{x:295,y:185,w:95,h:60},
  KS:{x:295,y:245,w:95,h:60}, OK:{x:285,y:305,w:105,h:60}, TX:{x:265,y:350,w:130,h:130},
  MN:{x:345,y:55,w:85,h:90}, IA:{x:355,y:165,w:80,h:65}, MO:{x:355,y:230,w:80,h:75},
  AR:{x:360,y:305,w:75,h:65}, LA:{x:355,y:360,w:75,h:70},
  // Great Lakes
  WI:{x:395,y:75,w:75,h:90}, IL:{x:400,y:165,w:60,h:90}, MI:{x:440,y:60,w:85,h:90},
  IN:{x:440,y:160,w:55,h:80}, OH:{x:490,y:130,w:70,h:80}, KY:{x:455,y:240,w:95,h:65},
  TN:{x:435,y:305,w:110,h:55}, MS:{x:405,y:355,w:60,h:80}, AL:{x:445,y:330,w:60,h:85},
  // Eastern states
  PA:{x:535,y:110,w:90,h:65}, NY:{x:565,y:60,w:95,h:80}, VT:{x:630,y:45,w:35,h:55},
  NH:{x:640,y:45,w:35,h:55}, ME:{x:650,y:30,w:55,h:65}, MA:{x:645,y:95,w:55,h:35},
  RI:{x:665,y:120,w:25,h:25}, CT:{x:640,y:120,w:45,h:30}, NJ:{x:600,y:130,w:35,h:45},
  DE:{x:600,y:155,w:28,h:30}, MD:{x:565,y:155,w:65,h:30}, WV:{x:530,y:175,w:60,h:60},
  VA:{x:540,y:185,w:100,h:60}, NC:{x:530,y:245,w:115,h:55}, SC:{x:545,y:300,w:75,h:55},
  GA:{x:490,y:305,w:75,h:85}, FL:{x:490,y:375,w:90,h:110},
  // Non-contiguous (shown as inset boxes)
  AK:{x:80,y:380,w:110,h:80}, HI:{x:220,y:420,w:90,h:50},
}

const FULL_STATE_DATA = {
  AL:{name:'Alabama',rating:'A',cc:true}, AK:{name:'Alaska',rating:'A+',cc:true}, AZ:{name:'Arizona',rating:'A+',cc:true},
  AR:{name:'Arkansas',rating:'A',cc:true}, CA:{name:'California',rating:'F',cc:false}, CO:{name:'Colorado',rating:'C',cc:false},
  CT:{name:'Connecticut',rating:'D',cc:false}, DE:{name:'Delaware',rating:'D',cc:false}, FL:{name:'Florida',rating:'B+',cc:true},
  GA:{name:'Georgia',rating:'A',cc:true}, HI:{name:'Hawaii',rating:'F',cc:false}, ID:{name:'Idaho',rating:'A+',cc:true},
  IL:{name:'Illinois',rating:'D-',cc:false}, IN:{name:'Indiana',rating:'A',cc:true}, IA:{name:'Iowa',rating:'A',cc:true},
  KS:{name:'Kansas',rating:'A',cc:true}, KY:{name:'Kentucky',rating:'A',cc:true}, LA:{name:'Louisiana',rating:'A',cc:true},
  ME:{name:'Maine',rating:'A',cc:true}, MD:{name:'Maryland',rating:'D',cc:false}, MA:{name:'Massachusetts',rating:'F',cc:false},
  MI:{name:'Michigan',rating:'B',cc:false}, MN:{name:'Minnesota',rating:'C',cc:false}, MS:{name:'Mississippi',rating:'A+',cc:true},
  MO:{name:'Missouri',rating:'A+',cc:true}, MT:{name:'Montana',rating:'A+',cc:true}, NE:{name:'Nebraska',rating:'B+',cc:true},
  NV:{name:'Nevada',rating:'C',cc:false}, NH:{name:'New Hampshire',rating:'A+',cc:true}, NJ:{name:'New Jersey',rating:'F',cc:false},
  NM:{name:'New Mexico',rating:'C',cc:false}, NY:{name:'New York',rating:'F',cc:false}, NC:{name:'North Carolina',rating:'B',cc:false},
  ND:{name:'North Dakota',rating:'A+',cc:true}, OH:{name:'Ohio',rating:'A',cc:true}, OK:{name:'Oklahoma',rating:'A+',cc:true},
  OR:{name:'Oregon',rating:'D',cc:false}, PA:{name:'Pennsylvania',rating:'B',cc:false}, RI:{name:'Rhode Island',rating:'D',cc:false},
  SC:{name:'South Carolina',rating:'B+',cc:true}, SD:{name:'South Dakota',rating:'A+',cc:true}, TN:{name:'Tennessee',rating:'A',cc:true},
  TX:{name:'Texas',rating:'A',cc:true}, UT:{name:'Utah',rating:'A',cc:true}, VT:{name:'Vermont',rating:'A',cc:true},
  VA:{name:'Virginia',rating:'B',cc:false}, WA:{name:'Washington',rating:'D',cc:false}, WV:{name:'West Virginia',rating:'A+',cc:true},
  WI:{name:'Wisconsin',rating:'B',cc:false}, WY:{name:'Wyoming',rating:'A+',cc:true},
}

export default function StateMap({ profiles = [] }) {
  const [hovered, setHovered] = useState(null)
  const router = useRouter()

  const profileMap = {}
  profiles.forEach(p => { if (p.abbr) profileMap[p.abbr] = p })

  function getColor(abbr) {
    const profile = profileMap[abbr] || FULL_STATE_DATA[abbr]
    const rating = profile?.rating || 'C'
    return RATING_COLORS[rating] || '#6B7280'
  }

  function handleClick(abbr) {
    router.push(`/state-hub/${abbr.toLowerCase()}`)
  }

  const hoverData = hovered ? (profileMap[hovered] || FULL_STATE_DATA[hovered]) : null

  return (
    <div style={{ position:'relative' }}>
      {/* Legend */}
      <div style={{ display:'flex', gap:'16px', marginBottom:'20px', flexWrap:'wrap' }}>
        {Object.entries(RATING_COLORS).map(([r,c])=>(
          <div key={r} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
            <div style={{ width:12, height:12, background:c, borderRadius:'2px' }} />
            <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#6B7280' }}>{r}</span>
          </div>
        ))}
        <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#4B5563', marginLeft:'8px' }}>Click any state for full law details</span>
      </div>

      {/* Tooltip */}
      {hovered && hoverData && (
        <div style={{ position:'absolute', top:0, right:0, background:'#111318', border:'1px solid #C8922A40', padding:'12px 16px', zIndex:10, minWidth:'200px', pointerEvents:'none' }}>
          <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em' }}>{hovered}</div>
          <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#F0EDE6', marginBottom:'6px' }}>{hoverData.name}</div>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            <span style={{ fontFamily:'monospace', fontSize:'10px', color:RATING_COLORS[hoverData.rating]||'#9CA3AF', background:'#0D1117', padding:'2px 6px' }}>
              {hoverData.rating} RATING
            </span>
            <span style={{ fontFamily:'monospace', fontSize:'10px', color:(hoverData.constitutionalCarry||hoverData.cc)?'#34D399':'#EF4444' }}>
              {(hoverData.constitutionalCarry||hoverData.cc) ? '✓ CONST. CARRY' : '✗ PERMIT REQ'}
            </span>
          </div>
          <div style={{ fontFamily:'monospace', fontSize:'9px', color:'#4B5563', marginTop:'6px' }}>Click for full law details →</div>
        </div>
      )}

      {/* SVG Map */}
      <svg viewBox="0 0 780 500" style={{ width:'100%', cursor:'pointer' }}>
        {Object.entries(STATE_POSITIONS).map(([abbr, pos]) => {
          const color = getColor(abbr)
          const isHovered = hovered === abbr
          const isSmall = pos.w < 40
          return (
            <g key={abbr}
              onClick={() => handleClick(abbr)}
              onMouseEnter={() => setHovered(abbr)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor:'pointer' }}>
              <rect
                x={pos.x} y={pos.y} width={pos.w} height={pos.h}
                fill={color}
                fillOpacity={isHovered ? 1 : 0.75}
                stroke={isHovered ? '#F5F5F3' : '#0A0B0C'}
                strokeWidth={isHovered ? 2 : 0.5}
                rx="2"
              />
              {!isSmall && (
                <text
                  x={pos.x + pos.w/2} y={pos.y + pos.h/2 + 1}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={pos.w < 55 ? '9' : '10'}
                  fontFamily="monospace" fontWeight="700"
                  fill={['F','D-','D'].includes(FULL_STATE_DATA[abbr]?.rating) ? '#FCA5A5' : '#0A0B0C'}
                  style={{ pointerEvents:'none', userSelect:'none' }}>
                  {abbr}
                </text>
              )}
            </g>
          )
        })}
        {/* AK/HI labels */}
        <text x="125" y="490" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#4B5563">ALASKA (inset)</text>
        <text x="265" y="490" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#4B5563">HAWAII (inset)</text>
      </svg>
    </div>
  )
}
