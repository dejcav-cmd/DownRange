'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const RATING_COLORS = {
  'A+':'#16A34A','A':'#22C55E','B+':'#65A30D','B':'#84CC16',
  'C+':'#BEF264','C':'#EAB308','D':'#F97316','D-':'#EF4444','F':'#DC2626',
}

const STATE_DATA = {
  AL:{name:'Alabama',rating:'A',cc:true}, AK:{name:'Alaska',rating:'A+',cc:true},
  AZ:{name:'Arizona',rating:'A+',cc:true}, AR:{name:'Arkansas',rating:'A',cc:true},
  CA:{name:'California',rating:'F',cc:false}, CO:{name:'Colorado',rating:'C',cc:false},
  CT:{name:'Connecticut',rating:'D',cc:false}, DE:{name:'Delaware',rating:'D',cc:false},
  FL:{name:'Florida',rating:'B+',cc:true}, GA:{name:'Georgia',rating:'A',cc:true},
  HI:{name:'Hawaii',rating:'F',cc:false}, ID:{name:'Idaho',rating:'A+',cc:true},
  IL:{name:'Illinois',rating:'D-',cc:false}, IN:{name:'Indiana',rating:'A',cc:true},
  IA:{name:'Iowa',rating:'A',cc:true}, KS:{name:'Kansas',rating:'A',cc:true},
  KY:{name:'Kentucky',rating:'A',cc:true}, LA:{name:'Louisiana',rating:'A',cc:true},
  ME:{name:'Maine',rating:'A',cc:true}, MD:{name:'Maryland',rating:'D',cc:false},
  MA:{name:'Massachusetts',rating:'F',cc:false}, MI:{name:'Michigan',rating:'B',cc:false},
  MN:{name:'Minnesota',rating:'C',cc:false}, MS:{name:'Mississippi',rating:'A+',cc:true},
  MO:{name:'Missouri',rating:'A+',cc:true}, MT:{name:'Montana',rating:'A+',cc:true},
  NE:{name:'Nebraska',rating:'B+',cc:true}, NV:{name:'Nevada',rating:'C',cc:false},
  NH:{name:'New Hampshire',rating:'A+',cc:true}, NJ:{name:'New Jersey',rating:'F',cc:false},
  NM:{name:'New Mexico',rating:'C',cc:false}, NY:{name:'New York',rating:'F',cc:false},
  NC:{name:'North Carolina',rating:'B',cc:false}, ND:{name:'North Dakota',rating:'A+',cc:true},
  OH:{name:'Ohio',rating:'A',cc:true}, OK:{name:'Oklahoma',rating:'A+',cc:true},
  OR:{name:'Oregon',rating:'D',cc:false}, PA:{name:'Pennsylvania',rating:'B',cc:false},
  RI:{name:'Rhode Island',rating:'D',cc:false}, SC:{name:'South Carolina',rating:'B+',cc:true},
  SD:{name:'South Dakota',rating:'A+',cc:true}, TN:{name:'Tennessee',rating:'A',cc:true},
  TX:{name:'Texas',rating:'A',cc:true}, UT:{name:'Utah',rating:'A',cc:true},
  VT:{name:'Vermont',rating:'A',cc:true}, VA:{name:'Virginia',rating:'B',cc:false},
  WA:{name:'Washington',rating:'D',cc:false}, WV:{name:'West Virginia',rating:'A+',cc:true},
  WI:{name:'Wisconsin',rating:'B',cc:false}, WY:{name:'Wyoming',rating:'A+',cc:true},
}

// Real geographic SVG paths for the contiguous US map (900x580 viewBox)
const STATE_PATHS = {
  ME:"M830,65 L840,60 L855,62 L858,75 L845,85 L832,80 Z",
  NH:"M820,68 L830,65 L832,80 L825,95 L815,90 L810,78 Z",
  VT:"M808,65 L820,68 L815,90 L805,85 L800,70 Z",
  MA:"M820,95 L845,90 L852,100 L835,108 L815,105 Z",
  RI:"M845,98 L852,96 L855,108 L848,110 Z",
  CT:"M808,100 L820,95 L818,110 L806,112 Z",
  NY:"M740,70 L808,65 L808,100 L806,112 L788,120 L760,115 L742,100 L735,82 Z",
  NJ:"M788,120 L806,112 L810,130 L800,145 L785,138 Z",
  PA:"M700,105 L788,100 L788,120 L760,128 L700,125 Z",
  DE:"M800,138 L810,130 L815,145 L805,150 Z",
  MD:"M745,135 L800,130 L805,150 L785,155 L748,150 Z",
  VA:"M690,145 L785,140 L790,158 L770,170 L720,168 L688,162 Z",
  WV:"M690,125 L745,120 L748,150 L720,165 L688,158 L682,138 Z",
  NC:"M668,172 L778,165 L782,182 L720,190 L668,185 Z",
  SC:"M720,182 L782,178 L785,198 L748,208 L715,200 Z",
  GA:"M668,185 L748,180 L750,210 L720,225 L668,220 Z",
  FL:"M640,220 L720,218 L725,240 L738,268 L715,285 L688,278 L658,260 L638,238 Z",
  AL:"M635,185 L668,185 L668,222 L638,225 L630,205 Z",
  MS:"M600,182 L638,180 L638,225 L608,225 L595,205 Z",
  TN:"M582,162 L690,158 L690,178 L582,182 Z",
  KY:"M580,140 L692,135 L692,160 L582,162 Z",
  OH:"M695,105 L760,100 L758,138 L695,140 Z",
  IN:"M650,105 L697,105 L695,148 L650,148 Z",
  MI:"M640,62 L700,58 L705,88 L685,95 L660,95 L638,82 Z",
  WI:"M598,60 L648,55 L650,100 L598,105 Z",
  IL:"M600,105 L650,105 L650,162 L598,162 Z",
  MN:"M540,38 L600,35 L600,100 L540,100 Z",
  IA:"M540,100 L600,100 L600,140 L538,140 Z",
  MO:"M540,140 L600,138 L600,175 L538,178 Z",
  AR:"M538,178 L600,175 L602,210 L538,212 Z",
  LA:"M538,212 L602,210 L605,238 L565,248 L535,238 Z",
  ND:"M428,30 L542,28 L542,78 L428,80 Z",
  SD:"M428,80 L542,78 L540,125 L428,128 Z",
  NE:"M428,128 L540,125 L540,162 L428,165 Z",
  KS:"M428,165 L540,162 L538,200 L428,202 Z",
  OK:"M390,200 L538,198 L540,235 L448,238 L390,235 Z",
  TX:"M390,235 L452,235 L460,280 L448,320 L408,345 L370,322 L342,292 L348,255 Z",
  MT:"M285,20 L430,15 L432,95 L285,98 Z",
  WY:"M285,98 L432,92 L432,148 L285,148 Z",
  CO:"M285,148 L432,145 L430,198 L285,198 Z",
  NM:"M285,198 L432,198 L432,250 L285,252 Z",
  ID:"M205,25 L285,20 L288,115 L248,120 L210,100 Z",
  UT:"M205,115 L285,110 L285,175 L205,178 Z",
  AZ:"M205,178 L285,175 L285,258 L230,265 L200,248 L198,212 Z",
  NV:"M155,98 L208,88 L212,175 L155,178 L142,145 L148,110 Z",
  OR:"M105,48 L205,38 L210,100 L150,105 L105,85 Z",
  WA:"M108,15 L205,10 L208,40 L108,48 Z",
  CA:"M102,85 L155,98 L158,178 L140,215 L105,232 L88,195 L85,148 Z",
  AK:"M62,340 L125,308 L160,325 L155,360 L118,375 L72,368 Z",
  HI:"M200,355 L220,348 L225,362 L210,368 Z",
}

export default function StateMap({ profiles = [] }) {
  const [hovered, setHovered] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const router = useRouter()

  const profileMap = {}
  profiles.forEach(p => { if (p.abbr) profileMap[p.abbr] = p })

  function getRating(abbr) {
    return profileMap[abbr]?.rating || STATE_DATA[abbr]?.rating || 'C'
  }

  function getColor(abbr) {
    const rating = getRating(abbr)
    return RATING_COLORS[rating] || '#6B7280'
  }

  function getCC(abbr) {
    return profileMap[abbr]?.constitutionalCarry ?? STATE_DATA[abbr]?.cc ?? false
  }

  function handleClick(abbr) {
    router.push(`/state-hub/${abbr.toLowerCase()}`)
  }

  function handleMouseMove(e, abbr) {
    const rect = e.currentTarget.closest('svg').getBoundingClientRect()
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setHovered(abbr)
  }

  const hoverData = hovered ? (STATE_DATA[hovered] || {}) : null

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      {/* Legend */}
      <div style={{ display:'flex', gap:'12px', marginBottom:'16px', flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563' }}>2A FREEDOM RATING:</span>
        {Object.entries(RATING_COLORS).map(([r, c]) => (
          <div key={r} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
            <div style={{ width:14, height:14, background:c, borderRadius:'2px', opacity:0.85 }} />
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6B7280' }}>{r}</span>
          </div>
        ))}
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', marginLeft:'8px' }}>Click any state for full law details</span>
      </div>

      {/* Tooltip */}
      {hovered && hoverData && (
        <div style={{
          position:'absolute', zIndex:20, pointerEvents:'none',
          left: Math.min(tooltipPos.x + 12, 700), top: Math.max(tooltipPos.y - 70, 0),
          background:'#111318', border:`1px solid ${getColor(hovered)}`,
          padding:'10px 14px', minWidth:'180px',
          boxShadow:'0 4px 20px rgba(0,0,0,0.6)',
        }}>
          <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.2rem', color:getColor(hovered), letterSpacing:'0.05em', marginBottom:'3px' }}>
            {hoverData.name || hovered}
          </div>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:getColor(hovered), background:`${getColor(hovered)}20`, padding:'1px 7px' }}>
              {getRating(hovered)} RATING
            </span>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color: getCC(hovered) ? '#34D399':'#EF4444' }}>
              {getCC(hovered) ? '✓ CC' : '✗ Permit'}
            </span>
          </div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#374151', marginTop:'5px' }}>Click for full details →</div>
        </div>
      )}

      {/* SVG Map */}
      <svg
        viewBox="0 0 900 420"
        style={{ width:'100%', maxWidth:'100%', cursor:'default' }}
        aria-label="US States 2A Freedom Rating Map"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Map background */}
        <rect x="0" y="0" width="900" height="420" fill="transparent" />

        {/* State paths */}
        {Object.entries(STATE_PATHS).map(([abbr, path]) => {
          const color = getColor(abbr)
          const isHovered = hovered === abbr
          return (
            <g key={abbr}>
              <path
                d={path}
                fill={color}
                fillOpacity={isHovered ? 0.95 : 0.7}
                stroke={isHovered ? '#F5F5F3' : '#0A0B0C'}
                strokeWidth={isHovered ? 2 : 0.8}
                filter={isHovered ? 'url(#glow)' : ''}
                style={{ cursor:'pointer', transition:'fill-opacity 0.15s' }}
                onClick={() => handleClick(abbr)}
                onMouseMove={e => handleMouseMove(e, abbr)}
                onMouseLeave={() => setHovered(null)}
              />
              {/* State label - only for larger states */}
              {!['RI','DE','CT','NJ','NH','VT','MA','MD','HI'].includes(abbr) && (
                <text
                  x={getCentroid(path).x}
                  y={getCentroid(path).y + 4}
                  textAnchor="middle"
                  fontSize={isHovered ? '10' : '8'}
                  fontFamily="monospace"
                  fontWeight="700"
                  fill={isHovered ? '#fff' : '#0A0B0C'}
                  fillOpacity="0.9"
                  style={{ pointerEvents:'none', userSelect:'none' }}
                >
                  {abbr}
                </text>
              )}
            </g>
          )
        })}

        {/* AK/HI labels */}
        <text x="93" y="400" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#4B5563">AK</text>
        <text x="212" y="380" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#4B5563">HI</text>

        {/* Constitutional carry label */}
        <text x="450" y="415" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#374151">
          Striped states require permit to carry concealed
        </text>
      </svg>
    </div>
  )
}

// Simple centroid calculation from polygon path
function getCentroid(pathStr) {
  const nums = pathStr.match(/-?\d+\.?\d*/g)?.map(Number) || []
  if (nums.length < 4) return { x: 0, y: 0 }
  let xs = [], ys = []
  for (let i = 0; i < nums.length - 1; i += 2) { xs.push(nums[i]); ys.push(nums[i+1]) }
  return {
    x: Math.round(xs.reduce((a, b) => a + b, 0) / xs.length),
    y: Math.round(ys.reduce((a, b) => a + b, 0) / ys.length),
  }
}
