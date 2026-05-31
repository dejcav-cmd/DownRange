'use client'
import { useState } from 'react'
import UniversalContentEditor from './UniversalContentEditor'

const FIELDS_ARTICLE = [
  { key:'title',     label:'Title',                type:'text'   },
  { key:'tag',       label:'Tag',                  opts:['LAW','POLICY','GUIDE','ANALYSIS','SAFETY','AMMO'] },
  { key:'readMins',  label:'Read Time',            type:'text'   },
  { key:'summary',   label:'Summary',              rows:3  },
  { key:'body',      label:'Body (HTML)',           rows:14 },
  { key:'sourceUrl', label:'Source URL',            type:'url'   },
  { key:'imageUrl',  label:'Image URL',             type:'url'   },
  { key:'author',    label:'Author',               type:'text'  },
  { key:'order',     label:'Sort Order',           type:'number' },
]
const FIELDS_LAW = [
  { key:'title',         label:'Law Name',          type:'text'  },
  { key:'status',        label:'Status',            opts:['IN FORCE','REQUIRED','PENDING','REPEALED','CHALLENGED'] },
  { key:'impact',        label:'Impact Level',      opts:['CRITICAL','HIGH','MED','LOW','REQUIRED','IN FORCE'] },
  { key:'effectiveDate', label:'Effective Date',    type:'text'  },
  { key:'summary',       label:'Summary',           rows:3  },
  { key:'detail',        label:'Full Detail',       rows:6  },
  { key:'sourceUrl',     label:'Official Source',   type:'url'   },
  { key:'order',         label:'Sort Order',        type:'number' },
]
const FIELDS_PROVINCE = [
  { key:'title',   label:'Province Name',  type:'text'  },
  { key:'abbr',    label:'Abbreviation',   type:'text', hint:'e.g. AB' },
  { key:'rating',  label:'Rating',         opts:['A+','A','A-','B+','B','B-','C+','C','C-','D+','D'] },
  { key:'color',   label:'Color (hex)',    type:'text', hint:'e.g. #22c55e' },
  { key:'summary', label:'Summary',        rows:4  },
  { key:'order',   label:'Sort Order',     type:'number' },
]
const FIELDS_AMMO = [
  { key:'title',        label:'Calibre',          type:'text'  },
  { key:'cadPrice',     label:'CAD Price',         type:'text', hint:'e.g. C$0.42/rd' },
  { key:'usdEquiv',     label:'USD Equivalent',   type:'text'  },
  { key:'availability', label:'Availability',     opts:['High','Moderate','Low'] },
  { key:'trend',        label:'Price Trend',      opts:['up','flat','down'] },
  { key:'note',         label:'Notes',            rows:2  },
  { key:'order',        label:'Sort Order',       type:'number' },
]
const FIELDS_GENERIC = [
  { key:'title',   label:'Title',       type:'text'  },
  { key:'summary', label:'Message',     rows:3  },
  { key:'value',   label:'Value / Stat',type:'text'  },
  { key:'color',   label:'Color (hex)', type:'text'  },
  { key:'order',   label:'Sort Order',  type:'number' },
]

const TYPES = [
  { key:'article',  label:'Articles',     icon:'✍', fields:FIELDS_ARTICLE,  baseUrl:'/canada' },
  { key:'law',      label:'Laws',         icon:'⚖', fields:FIELDS_LAW,      baseUrl:null },
  { key:'province', label:'Provinces',    icon:'🗺', fields:FIELDS_PROVINCE, baseUrl:null },
  { key:'ammo',     label:'Ammo',         icon:'◎', fields:FIELDS_AMMO,     baseUrl:null },
  { key:'alert',    label:'Alerts',       icon:'🔴', fields:FIELDS_GENERIC,  baseUrl:null },
  { key:'stat',     label:'Stats',        icon:'📊', fields:FIELDS_GENERIC,  baseUrl:null },
]

export default function CanadaManager({ adminKey }) {
  const [activeType, setActiveType] = useState('article')
  const cfg = TYPES.find(t => t.key === activeType) || TYPES[0]

  function pullArticles(flash, reload) {
    flash('⏳ Writing Canada articles with AI + real images...')
    return fetch('/api/admin/write-canada-articles', {
      method:'POST',
      headers:{'x-admin-key':adminKey,'Content-Type':'application/json'},
      body:JSON.stringify({limit:5,force:false}),
    }).then(r => r.json()).then(d => {
      const created = (d.results||[]).filter(x=>x.status==='created').length
      flash('✅ ' + created + ' new articles created')
      if (activeType === 'article') reload()
    }).catch(() => flash('❌ Pull failed'))
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 60px)' }}>
      <div style={{ display:'flex', gap:6, padding:'8px 14px', borderBottom:'1px solid var(--border)', flexWrap:'wrap', background:'var(--bg2)', flexShrink:0 }}>
        <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:'var(--gold)', marginRight:4 }}>🇨🇦</span>
        {TYPES.map(t => (
          <button key={t.key} onClick={() => setActiveType(t.key)}
            style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, padding:'4px 10px', background:'none',
              border:'1px solid ' + (activeType===t.key ? 'var(--gold)' : 'var(--border)'),
              color: activeType===t.key ? 'var(--gold)' : 'var(--text-dim)', cursor:'pointer' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div style={{ flex:1, overflow:'hidden' }}>
        <UniversalContentEditor
          key={activeType}
          adminKey={adminKey}
          config={{
            label:  cfg.label,
            icon:   cfg.icon,
            api:    '/api/canada',
            type:   activeType,
            fields: cfg.fields,
            baseUrl:cfg.baseUrl,
            lang:   'en',
            pullFn: activeType === 'article' ? pullArticles : undefined,
          }}
        />
      </div>
    </div>
  )
}
