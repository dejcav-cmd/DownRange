'use client'
import { useState, useEffect, useCallback } from 'react'
import ImageSearchModal from './ImageSearchModal'
import { LockToggle } from './BulkLockBar'

const TYPES = [
  { key:'artigo',   label:'Artigos/Notícias', icon:'✍' },
  { key:'lei',      label:'Leis Federais',    icon:'⚖' },
  { key:'estado',   label:'Estados',          icon:'🗺' },
  { key:'municao',  label:'Munição',          icon:'🔴' },
  { key:'alerta',   label:'Alertas',          icon:'🚨' },
  { key:'stat',     label:'Estatísticas',     icon:'📊' },
  { key:'cac_info', label:'Info CAC',         icon:'🎯' },
]

const IMPACTS  = ['CRÍTICO','ALTO','MÉDIO','BAIXO','EM VIGOR','REVOGADO','OBRIGATÓRIO']
const RATINGS  = ['A+','A','A-','B+','B','B-','C+','C','C-','D+','D']
const AVAIL    = ['Alta','Moderada','Baixa']
const TRENDS   = ['up','flat','down']
const TAGS_ART = ['LEI','GUIA','POLÍTICA','SETOR','SEGURANÇA','CAC','MUNIÇÃO']

const S = `
.bm-wrap{display:flex;height:calc(100vh - 120px);overflow:hidden}
.bm-list{width:300px;flex-shrink:0;border-right:1px solid var(--border);overflow-y:auto;background:var(--bg)}
.bm-detail{flex:1;overflow-y:auto;padding:20px 24px;background:var(--bg2)}
.bm-input{background:var(--bg3,#1a1f2e);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 10px;outline:none;width:100%;box-sizing:border-box}
.bm-input:focus{border-color:var(--gold)}
.bm-ta{background:var(--bg3,#1a1f2e);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:10px;outline:none;width:100%;resize:vertical;line-height:1.7;box-sizing:border-box}
.bm-ta:focus{border-color:var(--gold)}
.bm-btn{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:8px 16px;cursor:pointer}
.bm-btn:hover{opacity:.85}
.bm-btn:disabled{opacity:.35;cursor:not-allowed}
.bm-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer}
.bm-ghost:hover{border-color:var(--gold);color:var(--gold)}
.bm-del{background:none;border:1px solid rgba(239,68,68,.35);color:#ef4444;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer}
.bm-del:hover{background:rgba(239,68,68,.1)}
.bm-row{display:flex;gap:10px;align-items:flex-start;padding:11px 14px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s}
.bm-row:hover{background:rgba(200,146,42,.04)}
.bm-row.sel{background:rgba(200,146,42,.08);border-left:2px solid var(--gold)}
.bm-lbl{font-size:9px;color:#64748b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;display:block}
.bm-grp{margin-bottom:18px}
.bm-green{background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);color:#22c55e;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:8px 12px;margin-bottom:12px}
`

export default function BrazilManager({ adminKey }) {
  const [activeType, setActiveType] = useState('artigo')
  const [items,      setItems]      = useState([])
  const [sel,        setSel]        = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [busy,       setBusy]       = useState(false)
  const [msg,        setMsg]        = useState('')
  const [showAdd,    setShowAdd]    = useState(false)
  const [form,       setForm]       = useState({})
  const [aiTopic,    setAiTopic]    = useState('')
  const [imgSearch,  setImgSearch]  = useState(null)
  const [filter,     setFilter]     = useState('')
  const [pulled,     setPulled]     = useState(null)

  const H = { 'x-admin-key': adminKey }
  const flash = m => { setMsg(m); setTimeout(() => setMsg(''), 5000) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/brazil?all=1&type=' + activeType, { headers: H })
      const d = await r.json()
      setItems(d.items || [])
    } catch {} finally { setLoading(false) }
  }, [activeType, adminKey])

  useEffect(() => { load(); setSel(null) }, [load])

  async function save(id, fields) {
    setBusy(true)
    try {
      const r = await fetch('/api/brazil', { method:'POST', headers:{...H,'Content-Type':'application/json'}, body:JSON.stringify({action:'patch',id,fields}) })
      const d = await r.json()
      if (d.ok) { await load(); flash('✅ Salvo') }
      else flash('❌ ' + (d.error||'Erro'))
    } finally { setBusy(false) }
  }

  async function del(id) {
    if (!confirm('Excluir este item?')) return
    setBusy(true)
    try {
      const r = await fetch('/api/brazil', { method:'POST', headers:{...H,'Content-Type':'application/json'}, body:JSON.stringify({action:'delete',id}) })
      const d = await r.json()
      if (d.ok) { setSel(null); await load(); flash('🗑 Excluído') }
    } finally { setBusy(false) }
  }

  async function create() {
    if (!form.title) { flash('❌ Título obrigatório'); return }
    setBusy(true)
    try {
      const r = await fetch('/api/brazil', { method:'POST', headers:{...H,'Content-Type':'application/json'}, body:JSON.stringify({action:'create',type:activeType,...form}) })
      const d = await r.json()
      if (d.ok) { setShowAdd(false); setForm({}); await load(); flash('✅ Criado') }
      else flash('❌ ' + (d.error||'Erro'))
    } finally { setBusy(false) }
  }

  async function aiWrite(id) {
    if (!aiTopic) { flash('❌ Informe um tópico'); return }
    setBusy(true); flash('⏳ Escrevendo com IA em português...')
    try {
      const r = await fetch('/api/brazil', { method:'POST', headers:{...H,'Content-Type':'application/json'}, body:JSON.stringify({action:'ai-write',id,type:activeType,topic:aiTopic}) })
      const d = await r.json()
      if (d.ok) { await load(); flash('✅ Escrito pela IA' + (d.imageUrl ? ' + imagem' : '')) }
      else flash('❌ ' + (d.error||'Falha IA'))
    } finally { setBusy(false) }
  }

  async function fixImage(id, title) {
    setBusy(true); flash('⏳ Buscando imagem no Pexels/Pixabay...')
    try {
      const r = await fetch('/api/brazil', { method:'POST', headers:{...H,'Content-Type':'application/json'}, body:JSON.stringify({action:'fix-image',id,title,type:activeType}) })
      const d = await r.json()
      if (d.ok) { await load(); flash('✅ Imagem: ' + d.imageUrl.slice(0,50)) }
      else flash('❌ ' + (d.error||'Não encontrada'))
    } finally { setBusy(false) }
  }

  async function pullArticles() {
    setBusy(true); flash('⏳ Gerando artigos + imagens reais...')
    try {
      const r = await fetch('/api/admin/write-brazil-articles', { method:'POST', headers:{...H,'Content-Type':'application/json'}, body:JSON.stringify({limit:10,force:false}) })
      const d = await r.json()
      const created = (d.results||[]).filter(x=>x.status==='created').length
      const skipped = (d.results||[]).filter(x=>x.status==='skipped').length
      setPulled(d.results||[])
      flash(`✅ ${created} criados · ${skipped} já existiam`)
      if (activeType === 'artigo') await load()
    } finally { setBusy(false) }
  }

  async function fixAllImages() {
    setBusy(true); flash('⏳ Corrigindo todas as imagens...')
    try {
      const r = await fetch('/api/admin/fix-images-intl', { method:'POST', headers:{...H,'Content-Type':'application/json'}, body:JSON.stringify({type:'brazil'}) })
      const d = await r.json()
      flash(`✅ Imagens: ${d.fixed||0} corrigidas`)
      await load()
    } catch { flash('❌ Erro ao corrigir imagens') } finally { setBusy(false) }
  }

  const selItem = items.find(x => x._id === sel)
  const filtered = filter ? items.filter(i => i.title?.toLowerCase().includes(filter.toLowerCase())) : items

  function Fld({ label, field, item, type='text', opts=null, rows=null }) {
    const [v, setV] = useState(item?.[field] ?? '')
    useEffect(() => { setV(item?.[field] ?? '') }, [item?._id, field])
    return (
      <div className="bm-grp">
        <span className="bm-lbl">{label}</span>
        {opts ? (
          <select className="bm-input" value={v} onChange={e => setV(e.target.value)} onBlur={() => save(item._id, {[field]:v})}>
            <option value="">—</option>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ) : rows ? (
          <textarea className="bm-ta" rows={rows} value={v} onChange={e=>setV(e.target.value)} onBlur={() => save(item._id, {[field]:v})} />
        ) : (
          <input className="bm-input" type={type} value={v} onChange={e=>setV(e.target.value)} onBlur={() => save(item._id, {[field]:v})} />
        )}
      </div>
    )
  }

  return (
    <>
      <style>{S}</style>

      {/* Top bar */}
      <div style={{display:'flex',gap:8,padding:'10px 14px',borderBottom:'1px solid var(--border)',flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.2rem',color:'var(--gold)',marginRight:4}}>🇧🇷 BRASIL</span>

        {TYPES.map(t => (
          <button key={t.key} onClick={()=>{setActiveType(t.key);setSel(null)}}
            style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:'5px 10px',background:'none',
              border:'1px solid '+(activeType===t.key?'var(--gold)':'var(--border)'),
              color:activeType===t.key?'var(--gold)':'var(--text-dim)',cursor:'pointer'}}>
            {t.icon} {t.label}
          </button>
        ))}

        <div style={{marginLeft:'auto',display:'flex',gap:6,flexWrap:'wrap'}}>
          <button className="bm-ghost" onClick={pullArticles} disabled={busy}>⬇ Puxar Artigos</button>
          <button className="bm-ghost" onClick={fixAllImages} disabled={busy}>🖼 Corrigir Imagens</button>
          <button className="bm-ghost" onClick={()=>setShowAdd(true)} disabled={busy}>＋ Novo</button>
          <button className="bm-ghost" onClick={load} disabled={loading}>↺</button>
        </div>
      </div>

      {msg && <div className="bm-green">{msg}</div>}

      {/* Pull results */}
      {pulled && (
        <div style={{padding:'8px 14px',borderBottom:'1px solid var(--border)',fontSize:10,fontFamily:"'IBM Plex Mono',monospace",color:'#4b5563'}}>
          {pulled.map((r,i) => (
            <span key={i} style={{marginRight:12,color:r.status==='created'?'#22c55e':r.status==='skipped'?'#4b5563':'#ef4444'}}>
              {r.status==='created'?'✅':r.status==='skipped'?'↩':'❌'} {(r.title||r.slug||'').slice(0,40)}
              {r.imageUrl && <span style={{color:'#3b82f6'}}> 🖼</span>}
            </span>
          ))}
        </div>
      )}

      {/* New item form */}
      {showAdd && (
        <div style={{padding:'14px',borderBottom:'1px solid var(--border)',background:'rgba(200,146,42,.04)'}}>
          <span className="bm-lbl">Novo {TYPES.find(t=>t.key===activeType)?.label}</span>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:6}}>
            <input className="bm-input" style={{flex:2,minWidth:200}} placeholder="Título *" value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})} />
            {activeType==='artigo' && <input className="bm-input" style={{flex:1,minWidth:120}} placeholder="Tag (LEI, GUIA...)" value={form.tag||''} onChange={e=>setForm({...form,tag:e.target.value})} />}
            {activeType==='lei' && <input className="bm-input" style={{flex:1,minWidth:120}} placeholder="Status (EM VIGOR...)" value={form.status||''} onChange={e=>setForm({...form,status:e.target.value})} />}
            <button className="bm-btn" onClick={create} disabled={busy}>Criar</button>
            <button className="bm-ghost" onClick={()=>{setShowAdd(false);setForm({})}}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="bm-wrap">
        {/* List */}
        <div className="bm-list">
          <div style={{padding:'8px 10px',borderBottom:'1px solid var(--border)'}}>
            <input className="bm-input" placeholder="Filtrar..." value={filter} onChange={e=>setFilter(e.target.value)} />
          </div>
          {loading ? (
            <div style={{padding:20,textAlign:'center',color:'#4b5563',fontFamily:"'IBM Plex Mono',monospace",fontSize:11}}>Carregando...</div>
          ) : filtered.length === 0 ? (
            <div style={{padding:20,textAlign:'center',color:'#4b5563',fontFamily:"'IBM Plex Mono',monospace",fontSize:11}}>
              Nenhum item. <button className="bm-ghost" style={{marginTop:8,display:'block'}} onClick={pullArticles}>⬇ Puxar Artigos</button>
            </div>
          ) : filtered.map(item => (
            <div key={item._id} className={'bm-row'+(sel===item._id?' sel':'')} onClick={()=>setSel(item._id)}>
              <div style={{flex:1,minWidth:0}}>
                {item.editorLocked && <span style={{fontSize:8,color:'#C8922A',marginRight:4}}>🔒</span>}
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,fontSize:13,color:'var(--text)',lineHeight:1.2,marginBottom:3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.title}</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {item.tag && <span style={{fontSize:8,color:'#C8922A',letterSpacing:'.05em'}}>{item.tag}</span>}
                  {item.status && <span style={{fontSize:8,color:'#4b5563'}}>{item.status}</span>}
                  {item.imageUrl && !item.imageUrl.includes('/img/') ? <span style={{fontSize:8,color:'#22c55e'}}>🖼</span> : item.imageUrl ? <span style={{fontSize:8,color:'#f59e0b'}}>⚠img</span> : <span style={{fontSize:8,color:'#ef4444'}}>⬜</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="bm-detail">
          {!selItem ? (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:'#4b5563',gap:16}}>
              <div style={{fontSize:'3rem'}}>🇧🇷</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12}}>Selecione um item para editar</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
                <button className="bm-btn" onClick={pullArticles} disabled={busy}>⬇ Puxar Artigos com IA + Imagens</button>
              </div>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,gap:12,flexWrap:'wrap'}}>
                <div>
                  <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.4rem',color:'var(--text)',lineHeight:1}}>{selItem.title}</div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#4b5563',marginTop:3}}>
                    ID: {selItem._id} · Tipo: {selItem.type}
                  </div>
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  <LockToggle locked={selItem.editorLocked} onToggle={async()=>{ await fetch('/api/brazil',{method:'POST',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify({action:'patch',id:selItem._id,fields:{editorLocked:!selItem.editorLocked}})}); await load() }} />
                  <button className="bm-ghost" onClick={()=>setImgSearch(selItem)}>🔍 Imagem</button>
                  <button className="bm-ghost" onClick={()=>fixImage(selItem._id, selItem.title)} disabled={busy}>🖼 Auto-Imagem</button>
                  <button className="bm-del" onClick={()=>del(selItem._id)} disabled={busy}>🗑 Excluir</button>
                </div>
              </div>

              {/* Image preview */}
              {selItem.imageUrl && (
                <div style={{marginBottom:16}}>
                  <span className="bm-lbl">Imagem atual</span>
                  <img src={selItem.imageUrl} alt="" style={{width:'100%',maxHeight:200,objectFit:'cover',border:'1px solid var(--border)'}} onError={e=>{e.target.style.display='none'}} />
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#4b5563',marginTop:4,wordBreak:'break-all'}}>{selItem.imageUrl}</div>
                </div>
              )}

              {/* Fields based on type */}
              <Fld label="Título" field="title" item={selItem} />

              {selItem.type === 'artigo' && <>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <Fld label="Tag" field="tag" item={selItem} opts={TAGS_ART} />
                  <Fld label="Tempo de Leitura" field="readMins" item={selItem} />
                </div>
                <Fld label="Resumo" field="summary" item={selItem} rows={3} />
                <Fld label="Corpo do Artigo (HTML)" field="body" item={selItem} rows={14} />
                <Fld label="URL da Fonte" field="sourceUrl" item={selItem} type="url" />
                <Fld label="URL da Imagem" field="imageUrl" item={selItem} type="url" />
                <div style={{marginTop:12,padding:'12px',background:'rgba(200,146,42,.06)',border:'1px solid rgba(200,146,42,.2)'}}>
                  <span className="bm-lbl">Escrever com IA em Português</span>
                  <div style={{display:'flex',gap:8,marginTop:6}}>
                    <input className="bm-input" style={{flex:1}} placeholder="Tópico para escrever (ex: Decreto Lula sobre CAC...)" value={aiTopic} onChange={e=>setAiTopic(e.target.value)} />
                    <button className="bm-btn" onClick={()=>aiWrite(selItem._id)} disabled={busy}>🤖 Escrever</button>
                  </div>
                </div>
              </>}

              {selItem.type === 'lei' && <>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <Fld label="Status" field="status" item={selItem} opts={['EM VIGOR','REVOGADO','PARCIALMENTE VIGENTE','SUSPENSO','EM TRAMITAÇÃO','OBRIGATÓRIO']} />
                  <Fld label="Impacto" field="impact" item={selItem} opts={IMPACTS} />
                  <Fld label="Data Efetiva" field="effectiveDate" item={selItem} />
                  <Fld label="URL da Fonte" field="sourceUrl" item={selItem} type="url" />
                </div>
                <Fld label="Resumo" field="summary" item={selItem} rows={3} />
                <Fld label="Detalhes" field="detail" item={selItem} rows={6} />
              </>}

              {selItem.type === 'estado' && <>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <Fld label="Sigla (ex: SP)" field="abbr" item={selItem} />
                  <Fld label="Classificação" field="rating" item={selItem} opts={RATINGS} />
                  <Fld label="Cor (hex)" field="color" item={selItem} />
                </div>
                <Fld label="Resumo" field="summary" item={selItem} rows={4} />
              </>}

              {selItem.type === 'municao' && <>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <Fld label="Preço BRL (ex: R$3,50/rd)" field="brlPrice" item={selItem} />
                  <Fld label="Equiv. USD" field="usdEquiv" item={selItem} />
                  <Fld label="Disponibilidade" field="availability" item={selItem} opts={AVAIL} />
                  <Fld label="Tendência" field="trend" item={selItem} opts={TRENDS} />
                </div>
                <Fld label="Observações" field="note" item={selItem} rows={3} />
              </>}

              {(selItem.type === 'stat' || selItem.type === 'alerta') && <>
                <Fld label="Valor / Stat" field="value" item={selItem} />
                <Fld label="Cor (hex)" field="color" item={selItem} />
                <Fld label="Resumo / Mensagem" field="summary" item={selItem} rows={3} />
              </>}

              {selItem.type === 'cac_info' && <>
                <Fld label="Resumo" field="summary" item={selItem} rows={3} />
                <Fld label="Detalhes Completos" field="detail" item={selItem} rows={6} />
              </>}

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:4}}>
                <Fld label="Ordem de Exibição" field="order" item={selItem} type="number" />
              </div>
            </div>
          )}
        </div>
      </div>

      {imgSearch && (
        <ImageSearchModal
          adminKey={adminKey}
          item={imgSearch}
          onClose={()=>setImgSearch(null)}
          onSaved={async()=>{ setImgSearch(null); await load() }}
          apiPath="/api/brazil"
        />
      )}
    </>
  )
}
