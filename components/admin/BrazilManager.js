'use client'
import { useState } from 'react'
import UniversalContentEditor from './UniversalContentEditor'

const FIELDS_ARTIGO = [
  { key:'title',     label:'Título',              type:'text'  },
  { key:'tag',       label:'Tag',                 opts:['LEI','GUIA','POLÍTICA','SETOR','SEGURANÇA','CAC','MUNIÇÃO'] },
  { key:'readMins',  label:'Tempo de Leitura',    type:'text'  },
  { key:'summary',   label:'Resumo',              rows:3  },
  { key:'body',      label:'Corpo (HTML)',         rows:14 },
  { key:'sourceUrl', label:'URL da Fonte',         type:'url'  },
  { key:'imageUrl',  label:'URL da Imagem',        type:'url'  },
  { key:'author',    label:'Autor',               type:'text' },
  { key:'order',     label:'Ordem',               type:'number' },
]
const FIELDS_LEI = [
  { key:'title',         label:'Nome da Lei',       type:'text'  },
  { key:'status',        label:'Status',            opts:['EM VIGOR','REVOGADO','PARCIALMENTE VIGENTE','SUSPENSO','EM TRAMITAÇÃO','OBRIGATÓRIO'] },
  { key:'impact',        label:'Impacto',           opts:['CRÍTICO','ALTO','MÉDIO','BAIXO','EM VIGOR','REVOGADO','OBRIGATÓRIO'] },
  { key:'effectiveDate', label:'Data Efetiva',      type:'text'  },
  { key:'summary',       label:'Resumo',            rows:3  },
  { key:'detail',        label:'Detalhes',          rows:6  },
  { key:'sourceUrl',     label:'Fonte Oficial',     type:'url'  },
  { key:'order',         label:'Ordem',             type:'number' },
]
const FIELDS_ESTADO = [
  { key:'title',   label:'Nome do Estado', type:'text'  },
  { key:'abbr',    label:'Sigla',          type:'text', hint:'ex: SP' },
  { key:'rating',  label:'Classificação',  opts:['A+','A','A-','B+','B','B-','C+','C','C-','D+','D'] },
  { key:'color',   label:'Cor (hex)',      type:'text', hint:'ex: #22c55e' },
  { key:'summary', label:'Resumo',         rows:4  },
  { key:'order',   label:'Ordem',          type:'number' },
]
const FIELDS_MUNICAO = [
  { key:'title',        label:'Calibre',          type:'text'  },
  { key:'brlPrice',     label:'Preço BRL',         type:'text', hint:'ex: R$3,50/rd' },
  { key:'usdEquiv',     label:'Equiv. USD',        type:'text'  },
  { key:'availability', label:'Disponibilidade',   opts:['Alta','Moderada','Baixa'] },
  { key:'trend',        label:'Tendência',         opts:['up','flat','down'] },
  { key:'note',         label:'Observações',       rows:2  },
  { key:'order',        label:'Ordem',             type:'number' },
]
const FIELDS_GENERIC = [
  { key:'title',   label:'Título',      type:'text'  },
  { key:'summary', label:'Mensagem',    rows:3  },
  { key:'value',   label:'Valor / Stat',type:'text'  },
  { key:'color',   label:'Cor (hex)',   type:'text'  },
  { key:'order',   label:'Ordem',       type:'number' },
]

const TYPES = [
  { key:'artigo',   label:'Artigos',      icon:'✍', fields:FIELDS_ARTIGO,  baseUrl:'/brazil' },
  { key:'lei',      label:'Leis',         icon:'⚖', fields:FIELDS_LEI,     baseUrl:null },
  { key:'estado',   label:'Estados',      icon:'🗺', fields:FIELDS_ESTADO,  baseUrl:null },
  { key:'municao',  label:'Munição',      icon:'🔴', fields:FIELDS_MUNICAO, baseUrl:null },
  { key:'alerta',   label:'Alertas',      icon:'🚨', fields:FIELDS_GENERIC, baseUrl:null },
  { key:'stat',     label:'Estatísticas', icon:'📊', fields:FIELDS_GENERIC, baseUrl:null },
  { key:'cac_info', label:'Info CAC',     icon:'🎯', fields:FIELDS_GENERIC, baseUrl:null },
]

export default function BrazilManager({ adminKey }) {
  const [activeType, setActiveType] = useState('artigo')
  const cfg = TYPES.find(t => t.key === activeType) || TYPES[0]

  function pullArticles(flash, reload) {
    flash('⏳ Gerando artigos em português + imagens reais...')
    return fetch('/api/admin/write-brazil-articles', {
      method:'POST',
      headers:{'x-admin-key':adminKey,'Content-Type':'application/json'},
      body:JSON.stringify({limit:10,force:false}),
    }).then(r => r.json()).then(d => {
      const created = (d.results||[]).filter(x=>x.status==='created').length
      flash('✅ ' + created + ' novos artigos criados')
      if (activeType === 'artigo') reload()
    }).catch(() => flash('❌ Falha ao puxar artigos'))
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 60px)' }}>
      <div style={{ display:'flex', gap:6, padding:'8px 14px', borderBottom:'1px solid var(--border)', flexWrap:'wrap', background:'var(--bg2)', flexShrink:0 }}>
        <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:'var(--gold)', marginRight:4 }}>🇧🇷</span>
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
            api:    '/api/brazil',
            type:   activeType,
            fields: cfg.fields,
            baseUrl:cfg.baseUrl,
            lang:   'pt',
            pullFn: activeType === 'artigo' ? pullArticles : undefined,
          }}
        />
      </div>
    </div>
  )
}
