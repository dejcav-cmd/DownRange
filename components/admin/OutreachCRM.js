'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'

const GOLD   = '#C8922A'
const MONO   = "'IBM Plex Mono',monospace"
const BEBAS  = "'Bebas Neue',cursive"
const BARLOW = "'Barlow Condensed',sans-serif"

const TYPE_META = {
  youtube_emerging: { label:'Emerging YouTuber (<150K)', color:'#f43f5e', icon:'📺' },
  youtuber:         { label:'YouTuber',     color:'#ef4444', icon:'▶' },
  gun_shop:     { label:'Gun Shop',     color:'#f59e0b', icon:'🏪' },
  ffl_dealer:   { label:'FFL Dealer',   color:'#3b82f6', icon:'🛒' },
  manufacturer: { label:'Manufacturer', color:'#8b5cf6', icon:'🏭' },
  organization: { label:'Organization', color:'#06b6d4', icon:'🏛' },
  instructor:   { label:'Instructor',   color:'#10b981', icon:'🎯' },
  holster:      { label:'Holster Co',   color:'#f97316', icon:'🔫' },
  range:        { label:'Range',        color:'#84cc16', icon:'🎳' },
  press:        { label:'Press',        color:'#a78bfa', icon:'📰' },
  other:        { label:'Other',        color:'#6b7280', icon:'👤' },
}

const STATUS_META = {
  active:         { color:'#22c55e', label:'Active' },
  unsubscribed:   { color:'#ef4444', label:'Unsub' },
  bounced:        { color:'#f97316', label:'Bounced' },
  do_not_contact: { color:'#7f1d1d', label:'DNC' },
  pending:        { color:'#f59e0b', label:'Pending' },
}

function buildEmailHTML({ subject, preheader, greeting, body, ctaText, ctaUrl, contactName, senderName='DJ Cavalcanti', signature='', accentColor=GOLD }) {
  const fn = (contactName||'').split(' ')[0] || 'there'
  const g  = (greeting||'Hi {{firstName}},').replace(/\{\{firstName\}\}/g, fn)
  const b  = (body||'').replace(/\{\{firstName\}\}/g, fn)
  const cta = ctaText && ctaUrl ? `<table cellpadding="0" cellspacing="0" style="margin:32px 0 0;"><tr><td style="background:${accentColor};padding:0;"><a href="${ctaUrl}" style="display:inline-block;padding:14px 36px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#000;text-decoration:none;letter-spacing:0.1em;text-transform:uppercase;">${ctaText} &rarr;</a></td></tr></table>` : ''
  const sig = signature ? `<div style="margin-top:12px;font-size:13px;color:#9ca3af;line-height:1.7;white-space:pre-line;">${signature}</div>` : `<div style="margin-top:12px;"><p style="font-size:14px;color:#9ca3af;line-height:1.7;margin:0 0 2px;">&mdash; ${senderName}</p><p style="font-size:11px;color:#4b5563;margin:0;">Founder, DownRange &middot; <a href="https://downrangeco.com" style="color:${accentColor};text-decoration:none;">downrangeco.com</a></p></div>`
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject||'DownRange'}</title></head><body style="margin:0;padding:0;background:#09090B;font-family:Arial,Helvetica,sans-serif;">${preheader?`<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>`:''}<table width="100%" cellpadding="0" cellspacing="0" style="background:#09090B;padding:32px 16px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#0A0B0C;border:1px solid #1f2428;max-width:600px;width:100%;"><tr><td style="background:#0d0e10;border-bottom:3px solid ${accentColor};padding:20px 36px;"><img src="https://downrangeco.com/img/logo-banner.png" alt="DownRange" width="480" height="auto" style="display:block;height:auto;max-height:58px;width:auto;max-width:100%;"></td></tr><tr><td style="padding:32px 36px 24px;"><p style="font-size:15px;color:#9ca3af;line-height:1.8;margin:0 0 18px;">${g}</p><div style="font-size:15px;color:#d1d5db;line-height:1.9;white-space:pre-line;">${b}</div>${cta}<div style="margin-top:32px;padding-top:20px;border-top:1px solid #1f2428;">${sig}</div></td></tr><tr><td style="padding:0 36px;"><div style="height:1px;background:linear-gradient(90deg,${accentColor}22,${accentColor},${accentColor}22);"></div></td></tr><tr><td style="padding:16px 36px 24px;background:#050506;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:10px;color:#374151;line-height:1.7;">DownRange Media LLC &middot; America's Firearms Intelligence Hub<br><a href="https://downrangeco.com/press" style="color:${accentColor};text-decoration:none;">Press Kit</a> &nbsp;&middot;&nbsp; <a href="https://downrangeco.com" style="color:#4b5563;text-decoration:none;">downrangeco.com</a></td><td align="right" style="vertical-align:bottom;"><a href="{{unsubscribeUrl}}" style="color:#374151;text-decoration:none;font-size:9px;letter-spacing:.08em;">Unsubscribe</a></td></tr></table></td></tr></table></td></tr></table></body></html>`
}

const TEMPLATES = [
  { id:'intro-youtuber', name:'YouTuber — Intro', cat:'youtuber', subject:`{{firstName}} — wanted you to hear about this directly`, greeting:'Hey {{firstName}},', preheader:'Built something for the 2A community. Your content is already part of it.', body:`My name is DJ Cavalcanti, founder of DownRange — a free Second Amendment intelligence portal built for gun owners who want real information: breaking 2A news updated every 15 minutes, all 50 states’ gun laws and CCW reciprocity, live ammo prices, NFA wait times, manufacturer releases, and NICS data. No ads, no manufacturer funding, no pay-to-play. Free for the community, always.\n\nI’m reaching out because {{channelName}} is already featured on DownRange through a dedicated creator profile and inclusion in our Video Hub, helping firearms enthusiasts discover your content alongside the news, resources, and tools they already use on the platform. I wanted you to hear about it directly rather than stumble across it later.\n\nIf you’d prefer not to have your content featured on DownRange, just let me know and I’ll respect that decision completely.\n\nThat said, I’m also hoping this becomes the start of something more useful for both sides. A few things that could benefit us both:\n\n— A dedicated creator profile on DownRange linking directly to your channel, helping firearms-focused users discover your content\n— Your videos featured in our Video Hub, in front of an audience actively looking for reviews, training, industry updates, and 2A content\n— A mention of DownRange as a free resource for 50-state gun laws, CCW reciprocity, live ammo pricing, NFA wait times, and firearms news — the kind of thing your audience actually uses\n— Sharing or referencing DownRange content when it aligns with topics you cover — we publish original 2A news, industry analysis, and legislative updates daily\n\nThis is not a sponsorship request. I’m not asking you to promote something you don’t believe in. The audience that follows {{channelName}} is exactly who DownRange was built to serve — connecting them with quality creators and useful resources is the whole point.\n\nIf you’d like to explore working together, I’d love to hear from you.\n\nThank you for your time, and for everything you do for the firearms community.`, ctaText:'Visit DownRange', ctaUrl:'https://downrangeco.com' },
  { id:'intro-manufacturer', name:'Manufacturer — Press', cat:'manufacturer', subject:'DownRange — covering your releases for the 2A community', greeting:'Hi {{firstName}},', preheader:'The firearms industry deserves media that treats manufacturers like partners.', body:`My name is DJ Cavalcanti, founder of DownRange (downrangeco.com). I built this platform because the firearms industry deserves media coverage that treats manufacturers like partners — and because gun owners deserve accurate, timely information about the products they carry.\n\nDownRange is an independent firearms intelligence portal. We cover breaking legislation, new product releases, market data, and 2A news daily. Our audience are active buyers, FFLs, competitive shooters, and daily carriers who make purchasing decisions based on what they read.\n\nI'd like to cover your releases as they happen. We publish what's true and what matters to people who take the Second Amendment seriously.\n\nIf you have a media contact, press releases, or a PR list, I'd genuinely appreciate being added.`, ctaText:'Visit Our Press Page', ctaUrl:'https://downrangeco.com/press' },
  { id:'intro-ffl', name:'FFL Dealer — Free Listing', cat:'ffl_dealer', subject:'Free listing on DownRange — built for FFLs like yours', greeting:'Hi {{firstName}},', preheader:'Gun shops are the backbone of the 2A community.', body:`My name is DJ Cavalcanti, and I run DownRange — a firearms news and resource portal at downrangeco.com. I'd like to add your shop to our FFL dealer directory — completely free, no strings attached.\n\nWhen someone in your area needs a transfer, wants to buy their first firearm, or is searching for an NFA dealer who actually knows the process — DownRange is where we want them to land. And we want them finding you.\n\nThe listing includes your hours, specialties, and contact information. Just reply with what you'd like included.`, ctaText:'Find Your State Listing', ctaUrl:'https://downrangeco.com/state-hub' },
  { id:'intro-holster', name:'Holster Company — Feature', cat:'holster', subject:'DownRange — featuring your brand for daily carriers', greeting:'Hi {{firstName}},', preheader:'Our audience carries every day. They want honest gear recommendations.', body:`My name is DJ Cavalcanti, founder of DownRange (downrangeco.com). I built this platform for gun owners who carry every day — people who take their equipment seriously.\n\nA good holster is something someone trusts their life to. That's why we dedicated an entire section to holster coverage — and why I'm reaching out specifically.\n\nI'd like to feature your brand. We don't do pay-to-play — if your holsters earn a spot, it's because our readers would genuinely benefit from knowing about them.\n\nIf you'd like to be featured, I'd love to learn more about what you're building.`, ctaText:'See Our Holster Coverage', ctaUrl:'https://downrangeco.com/holsters' },
  { id:'intro-range', name:'Range — Directory', cat:'range', subject:'DownRange — adding your range to our directory', greeting:'Hi {{firstName}},', preheader:'Help shooters in your area find you.', body:`My name is DJ Cavalcanti, and I run DownRange — a firearms intelligence portal for gun owners across all 50 states.\n\nI'd like to add your range to our directory. We're building a resource that helps gun owners find ranges that match their needs — steel targets, NFA bays, long-range, instruction.\n\nThe listing is free. Just reply with what you'd like included.`, ctaText:'View Our Range Directory', ctaUrl:'https://downrangeco.com/state-hub' },
  { id:'followup', name:'Follow-Up (Universal)', cat:null, subject:'Following up — DownRange', greeting:'Hey {{firstName}},', preheader:'Keeping this short.', body:`I wanted to follow up on my previous note about DownRange (downrangeco.com).\n\nI'll keep this brief. DownRange is the independent firearms intelligence portal I'm building for gun owners who want serious, accurate information.\n\nIf now isn't the right time, no hard feelings. Either way, keep doing what you're doing.`, ctaText:"See What We're Building", ctaUrl:'https://downrangeco.com' },
]

const TOOLBAR = [
  { icon:'B', cmd:'bold', title:'Bold', style:{fontWeight:900} },
  { icon:'I', cmd:'italic', title:'Italic', style:{fontStyle:'italic'} },
  { icon:'U', cmd:'underline', title:'Underline', style:{textDecoration:'underline'} },
  null,
  { icon:'H1', cmd:'h1', title:'Heading' },
  { icon:'¶', cmd:'p', title:'Paragraph' },
  null,
  { icon:'•', cmd:'ul', title:'Bullet List' },
  { icon:'🔗', cmd:'link', title:'Insert Link' },
  { icon:'—', cmd:'divider', title:'Horizontal Rule' },
]

const CSS = `
.crm-app{display:flex;height:calc(100vh - 52px);overflow:hidden;background:#09090B}
.crm-rail{width:52px;background:#050506;border-right:1px solid #1a1f2e;display:flex;flex-direction:column;align-items:center;padding:8px 0;gap:2px;flex-shrink:0}
.rail-btn{width:38px;height:38px;background:none;border:none;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;position:relative;gap:2px}
.rail-btn:hover{background:rgba(200,146,42,.1)}
.rail-btn.on{background:rgba(200,146,42,.15)}
.rail-icon{font-size:15px;line-height:1}
.rail-lbl{font-size:7px;color:#374151;letter-spacing:.04em;text-transform:uppercase;line-height:1}
.rail-btn.on .rail-lbl{color:${GOLD}}
.rail-badge{position:absolute;top:2px;right:2px;background:${GOLD};color:#000;font-size:8px;font-weight:700;min-width:14px;height:14px;border-radius:7px;display:flex;align-items:center;justify-content:center;padding:0 2px}
.crm-left{width:260px;flex-shrink:0;border-right:1px solid #1a1f2e;display:flex;flex-direction:column;background:#0A0B0C}
.crm-left-hdr{padding:10px 12px;border-bottom:1px solid #1a1f2e;display:flex;align-items:center;gap:8px;flex-shrink:0}
.left-search{flex:1;background:#111318;border:1px solid #1a1f2e;color:#e5e7eb;font-family:${MONO};font-size:11px;padding:6px 9px;outline:none}
.left-search:focus{border-color:${GOLD}}
.c-row{display:flex;align-items:center;gap:9px;padding:8px 12px;border-bottom:1px solid #0d1117;cursor:pointer;transition:background .1s}
.c-row:hover{background:rgba(200,146,42,.04)}
.c-row.chk{background:rgba(200,146,42,.06)}
.c-row.prev{border-left:2px solid ${GOLD}}
.crm-avt{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:${BEBAS};font-size:11px;flex-shrink:0}
.compose{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.c-hdr{background:#0A0B0C;border-bottom:1px solid #1a1f2e;flex-shrink:0}
.c-field{display:flex;align-items:center;border-bottom:1px solid #0d1117;padding:0 16px;min-height:40px}
.c-lbl{font-size:10px;color:#4b5563;letter-spacing:.08em;text-transform:uppercase;width:76px;flex-shrink:0;font-family:${MONO}}
.c-inp{flex:1;background:none;border:none;color:#e5e7eb;font-family:${MONO};font-size:12px;padding:9px 0;outline:none}
.c-inp::placeholder{color:#374151}
.toolbar{display:flex;gap:1px;padding:5px 10px;background:#050506;border-bottom:1px solid #1a1f2e;flex-wrap:wrap;flex-shrink:0}
.t-btn{background:none;border:1px solid transparent;color:#6b7280;font-family:${MONO};font-size:11px;font-weight:700;padding:4px 8px;cursor:pointer;border-radius:3px;white-space:nowrap}
.t-btn:hover{background:rgba(255,255,255,.06);color:#e5e7eb;border-color:#1a1f2e}
.t-sep{width:1px;background:#1a1f2e;margin:2px 3px;align-self:stretch}
.body-area{flex:1;overflow:hidden;display:flex}
.editor{flex:1;background:#0d1117;color:#d1d5db;font-size:14px;line-height:1.9;padding:28px 32px;outline:none;overflow-y:auto;font-family:Arial,sans-serif}
.editor:empty:before{content:attr(data-placeholder);color:#374151}
.preview-pane{border-left:1px solid #1a1f2e;overflow-y:auto;background:#050506;display:flex;flex-direction:column}
.preview-bar{padding:7px 12px;background:#050506;border-bottom:1px solid #1a1f2e;display:flex;align-items:center;gap:7px;flex-shrink:0}
.send-bar{padding:9px 16px;background:#0A0B0C;border-top:1px solid #1a1f2e;display:flex;gap:8px;align-items:center;flex-shrink:0;flex-wrap:wrap}
.crm-right{width:230px;flex-shrink:0;border-left:1px solid #1a1f2e;display:flex;flex-direction:column;background:#050506;overflow-y:auto}
.r-sec{padding:12px 14px;border-bottom:1px solid #1a1f2e}
.r-lbl{font-size:9px;color:#374151;letter-spacing:.1em;text-transform:uppercase;margin-bottom:7px;display:block;font-family:${MONO}}
.r-inp{background:#111318;border:1px solid #1a1f2e;color:#e5e7eb;font-family:${MONO};font-size:11px;padding:6px 9px;outline:none;width:100%;box-sizing:border-box;margin-bottom:6px}
.r-inp:focus{border-color:${GOLD}}
.r-sel{background:#111318;border:1px solid #1a1f2e;color:#e5e7eb;font-family:${MONO};font-size:11px;padding:6px 9px;outline:none;width:100%;cursor:pointer}
.tpl-chip{padding:6px 10px;background:#111318;border:1px solid #1a1f2e;color:#9ca3af;font-family:${MONO};font-size:10px;cursor:pointer;margin-bottom:4px;display:block;text-align:left;width:100%}
.tpl-chip:hover{border-color:${GOLD};color:${GOLD};background:rgba(200,146,42,.06)}
.tpl-chip.on{border-color:${GOLD};color:${GOLD};background:rgba(200,146,42,.1)}
.crm-btn{background:${GOLD};color:#000;border:none;font-family:${BARLOW};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:8px 18px;cursor:pointer;white-space:nowrap}
.crm-btn:hover{opacity:.85}
.crm-btn:disabled{opacity:.4;cursor:not-allowed}
.ghost{background:none;border:1px solid #1a1f2e;color:#6b7280;font-family:${MONO};font-size:11px;padding:7px 12px;cursor:pointer}
.ghost:hover{border-color:${GOLD};color:${GOLD}}
.ghost:disabled{opacity:.35;cursor:not-allowed}
.crm-badge{display:inline-block;font-family:${MONO};font-size:9px;font-weight:700;letter-spacing:.05em;padding:2px 7px;border-radius:2px;text-transform:uppercase}
.crm-table{width:100%;border-collapse:collapse}
.crm-th{font-family:${MONO};font-size:9px;color:#4b5563;letter-spacing:.1em;text-transform:uppercase;padding:9px 12px;border-bottom:1px solid #1a1f2e;text-align:left;background:#050506;position:sticky;top:0;z-index:1}
.crm-td{padding:9px 12px;border-bottom:1px solid #0d1117;font-size:12px;vertical-align:middle}
.crm-tr:hover .crm-td{background:rgba(200,146,42,.02)}
.stat-row{display:flex;gap:10px;padding:12px 20px;border-bottom:1px solid #1a1f2e;flex-wrap:wrap}
.stat-box{background:#0A0B0C;border:1px solid #1a1f2e;padding:10px 14px;flex:1;min-width:90px}
.stat-n{font-family:${BEBAS};font-size:1.7rem;color:${GOLD};line-height:1}
.stat-l{font-size:9px;color:#4b5563;text-transform:uppercase;letter-spacing:.06em;margin-top:2px;font-family:${MONO}}
.q-item{border-bottom:1px solid #1a1f2e;padding:14px 22px;display:grid;grid-template-columns:1fr auto;gap:14px;align-items:start}
.q-item:hover{background:rgba(200,146,42,.02)}
.crm-toast{position:fixed;bottom:20px;right:20px;z-index:9999;padding:9px 16px;font-family:${MONO};font-size:11px;background:#0A0B0C;border:1px solid #1a1f2e;border-left:3px solid ${GOLD};max-width:320px;animation:slideIn .2s ease}
@keyframes slideIn{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}
`

export default function OutreachCRM({ adminKey }) {
  const H = { 'x-admin-key': adminKey, 'Content-Type': 'application/json' }
  const [view,         setView]         = useState('compose')
  const [contacts,     setContacts]     = useState([])
  const [loadingC,     setLoadingC]     = useState(false)
  const [search,       setSearch]       = useState('')
  const [fType,        setFType]        = useState('')
  const [fStatus,      setFStatus]      = useState('active')
  const [selIds,       setSelIds]       = useState(new Set())
  const [prevId,       setPrevId]       = useState(null)
  const [dupGroups,    setDupGroups]    = useState([])
  const [activeTpl,    setActiveTpl]    = useState(TEMPLATES[0].id)
  const [subject,      setSubject]      = useState(TEMPLATES[0].subject)
  const [preheader,    setPreheader]    = useState(TEMPLATES[0].preheader||'')
  const [greeting,     setGreeting]     = useState(TEMPLATES[0].greeting)
  const [ctaText,      setCtaText]      = useState(TEMPLATES[0].ctaText||'')
  const [ctaUrl,       setCtaUrl]       = useState(TEMPLATES[0].ctaUrl||'')
  const [accent,       setAccent]       = useState(GOLD)
  const [sig,          setSig]          = useState('')
  const [splitPrev,    setSplitPrev]    = useState(true)
  const [sending,      setSending]      = useState(false)
  const [sendRes,      setSendRes]      = useState(null)
  const [queue,        setQueue]        = useState([])
  const [qTab,         setQTab]         = useState('draft')
  const [qStats,       setQStats]       = useState({})
  const [loadingQ,     setLoadingQ]     = useState(false)
  const [history,      setHistory]      = useState([])
  const [loadingH,     setLoadingH]     = useState(false)
  const [toast,        setToast]        = useState(null)
  const edRef = useRef(null)
  const tplEdRef = useRef(null)
  const [contactModal, setContactModal] = useState(null)  // null | 'add' | contact-object (edit)
  const [cmForm, setCmForm] = useState({})
  const [cmSaving, setCmSaving] = useState(false)
  const [previewModal, setPreviewModal] = useState(null)  // null | { subject, html }
  const [testResult,   setTestResult]   = useState(null)
  const [testRunning,  setTestRunning]  = useState(false)
  const [tplEditing, setTplEditing] = useState(null)    // copy of template being edited
  const [tplDirty,   setTplDirty]   = useState(false)
  const [tplSaved,   setTplSaved]   = useState(false)
  const [tplTemplates, setTplTemplates] = useState(TEMPLATES) // mutable in-session copy

  const flash = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),4000) }

  const loadContacts = useCallback(async () => {
    setLoadingC(true)
    try {
      const p = new URLSearchParams({limit:'500'})
      if (fType)   p.set('type',fType)
      if (fStatus) p.set('status',fStatus)
      if (search)  p.set('search',search)
      const r = await fetch('/api/outreach/contacts?'+p, {headers:H})
      const d = await r.json()
      const list = d.contacts||[]
      setContacts(list)
      const em={}; list.forEach(c=>{if(c.email){const k=c.email.toLowerCase();em[k]=em[k]||[];em[k].push(c)}})
      setDupGroups(Object.values(em).filter(g=>g.length>1))
    } catch{}
    setLoadingC(false)
  }, [fType,fStatus,search,adminKey])

  useEffect(()=>{ if(view==='contacts'||view==='dups') loadContacts() },[view])

  const loadQueue = useCallback(async ()=>{
    setLoadingQ(true)
    try {
      const r=await fetch('/api/outreach/queue?status='+qTab+'&limit=100',{headers:H})
      const d=await r.json(); setQueue(d.entries||[]); setQStats(d.stats||{})
    } catch{} setLoadingQ(false)
  },[qTab,adminKey])

  useEffect(()=>{ if(view==='queue') loadQueue() },[view,qTab])

  const loadHistory=useCallback(async()=>{
    setLoadingH(true)
    try { const r=await fetch('/api/outreach/history?limit=200',{headers:H}); const d=await r.json(); setHistory(d.logs||d.history||d.entries||[]) } catch(e){ console.error('loadHistory failed',e) }
    setLoadingH(false)
  },[adminKey])

  useEffect(()=>{ if(view==='history') loadHistory() },[view])

  function applyTpl(id) {
    const t=tplTemplates.find(x=>x.id===id); if(!t) return
    setActiveTpl(id); setSubject(t.subject); setPreheader(t.preheader||''); setGreeting(t.greeting); setCtaText(t.ctaText||''); setCtaUrl(t.ctaUrl||'')
    if(edRef.current) edRef.current.innerHTML=t.body.split('\n\n').map(p=>'<p>'+p.replace(/\n/g,'<br>')+'</p>').join('')
  }

  function execCmd(cmd) {
    if(cmd==='h1') document.execCommand('formatBlock',false,'h2')
    else if(cmd==='p') document.execCommand('formatBlock',false,'p')
    else if(cmd==='ul') document.execCommand('insertUnorderedList')
    else if(cmd==='divider') document.execCommand('insertHTML',false,'<hr style="border:none;border-top:1px solid #444;margin:16px 0;"><p></p>')
    else if(cmd==='link'){const u=prompt('URL:');if(u) document.execCommand('createLink',false,u)}
    else document.execCommand(cmd)
    edRef.current?.focus()
  }

  function getBody() {
    if(!edRef.current) return ''
    return edRef.current.innerHTML
      .replace(/<h[23][^>]*>/gi,'\n').replace(/<\/h[23]>/gi,'\n\n')
      .replace(/<p[^>]*>/gi,'').replace(/<\/p>/gi,'\n\n')
      .replace(/<br\s*\/?>/gi,'\n').replace(/<hr[^>]*>/gi,'\n---\n')
      .replace(/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi,'$2 ($1)')
      .replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').trim()
  }

  // ── Test send ────────────────────────────────────────────────────────────
  async function runTestSend() {
    setTestRunning(true)
    setTestResult(null)
    try {
      const r = await fetch('/api/outreach/test-send', { method:'POST', headers:H })
      const d = await r.json()
      setTestResult(d)
    } catch(e) {
      setTestResult({ ok: false, exception: e.message })
    }
    setTestRunning(false)
  }

  // ── Contact CRUD ─────────────────────────────────────────────────────────
  function openAdd() {
    setCmForm({ name:'', firstName:'', email:'', type:'youtuber', status:'active', youtubeUrl:'', notes:'' })
    setContactModal('add')
  }
  function openEdit(c) {
    setCmForm({ name:c.name||'', firstName:c.firstName||'', email:c.email||'', type:c.type||'youtuber', status:c.status||'active', youtubeUrl:c.youtubeUrl||'', notes:c.notes||'' })
    setContactModal(c)
  }
  async function saveContact() {
    setCmSaving(true)
    try {
      if (contactModal === 'add') {
        const r = await fetch('/api/outreach/contacts', { method:'POST', headers:H, body: JSON.stringify({ ...cmForm, source:'manual', addedAt: new Date().toISOString() }) })
        const d = await r.json()
        if (!d.ok && !d.created) { flash('Save failed', false); setCmSaving(false); return }
      } else {
        const r = await fetch('/api/outreach/contacts', { method:'PATCH', headers:H, body: JSON.stringify({ id: contactModal._id, ...cmForm }) })
        const d = await r.json()
        if (!d.ok) { flash('Update failed', false); setCmSaving(false); return }
      }
      setContactModal(null)
      loadContacts()
      flash(contactModal === 'add' ? '✅ Contact added' : '✅ Contact updated')
    } catch { flash('Error saving', false) }
    setCmSaving(false)
  }
  async function deleteContact(c) {
    if (!confirm('Delete ' + c.name + '?')) return
    await fetch('/api/outreach/contacts', { method:'DELETE', headers:H, body: JSON.stringify({ id: c._id }) })
    loadContacts()
    flash('Deleted: ' + c.name)
  }

  // ── Template editor functions ─────────────────────────────────────────────
  function tplLoad(id) {
    const t = tplTemplates.find(x => x.id === id)
    if (!t) return
    setActiveTpl(id)
    setTplEditing({ ...t })
    setTplDirty(false)
    setTplSaved(false)
  }

  function tplSave() {
    if (!tplEditing) return
    setTplTemplates(prev => prev.map(t => t.id === tplEditing.id ? { ...tplEditing } : t))
    setTplDirty(false)
    setTplSaved(true)
    setTimeout(() => setTplSaved(false), 2500)
    flash('Template saved for this session')
  }

  function tplCmd(cmd) {
    if (!tplEditing) return
    const sel = window.getSelection()
    const selectedText = sel && !sel.isCollapsed ? sel.toString() : ''
    let insert = ''
    if (cmd === 'bold') insert = selectedText ? '**' + selectedText + '**' : '**bold text**'
    else if (cmd === 'link') {
      const url = prompt('URL:')
      if (!url) return
      insert = selectedText ? selectedText + ' (' + url + ')' : url
    } else if (cmd === 'ul') insert = '\n\u2014 '
    else if (cmd === 'divider') insert = '\n\n---\n\n'
    else if (cmd === 'var_fn') insert = '{{firstName}}'
    else if (cmd === 'var_ch') insert = '{{channelName}}'
    if (insert) {
      const ta = document.getElementById('tpl-body-editor')
      if (!ta) return
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newVal = tplEditing.body.slice(0, start) + insert + tplEditing.body.slice(end)
      setTplEditing(p => ({ ...p, body: newVal }))
      setTplDirty(true)
      setTimeout(() => { ta.focus(); ta.setSelectionRange(start + insert.length, start + insert.length) }, 0)
    }
  }

  const prevC = contacts.find(c=>c._id===prevId)
  const prevHTML = buildEmailHTML({subject,preheader,greeting,body:getBody()||(tplTemplates.find(t=>t.id===activeTpl)?.body||''),ctaText,ctaUrl,contactName:prevC?.name||'John Smith',accentColor:accent,signature:sig})

  async function sendToSel() {
    if(!selIds.size){flash('Select contacts first',false);return}
    setSending(true); setSendRes(null)
    const body=getBody()||(tplTemplates.find(t=>t.id===activeTpl)?.body||'')
    const targets=contacts.filter(c=>selIds.has(c._id)&&c.email)
    let sent=0,failed=0
    for(const c of targets){
      const html=buildEmailHTML({subject,preheader,greeting,body,ctaText,ctaUrl,contactName:c.firstName||c.name,accentColor:accent,signature:sig}).replace('{{unsubscribeUrl}}','https://downrangeco.com/api/outreach/unsubscribe?email='+encodeURIComponent(c.email))
      const subj=subject.replace(/\{\{firstName\}\}/g,c.firstName||c.name?.split(' ')[0]||'').replace(/\{\{businessName\}\}/g,c.name||'')
      try{const r=await fetch('/api/outreach/send/direct',{method:'POST',headers:H,body:JSON.stringify({contactId:c._id,subject:subj,html,toEmail:c.email,toName:c.name})}); if((await r.json()).ok)sent++;else failed++}catch{failed++}
    }
    setSendRes({sent,failed}); setSending(false); setSelIds(new Set())
    flash('✅ '+sent+' sent'+(failed?' · ❌ '+failed+' failed':''))
  }

  async function queueDrafts(){
    if(!selIds.size){flash('Select contacts first',false);return}
    setSending(true)
    try{const r=await fetch('/api/outreach/queue',{method:'POST',headers:H,body:JSON.stringify({action:'generate',contactIds:[...selIds],limit:selIds.size})}); const d=await r.json(); flash('📬 '+(d.created||0)+' drafts queued'); setSelIds(new Set())}catch{flash('Queue failed',false)}
    setSending(false)
  }

  async function approve(ids) {
    flash('Sending…')
    try {
      const r = await fetch('/api/outreach/queue', { method:'POST', headers:H, body:JSON.stringify({ action:'approve', ids }) })
      const d = await r.json()
      if (!r.ok || d.error) {
        flash('Send failed: ' + (d.error || r.status), false)
        loadQueue(); loadHistory(); return
      }
      const { sent=0, failed=0, errors=[] } = d
      if (failed > 0) {
        flash(`⚠ ${sent} sent, ${failed} failed — ${errors[0]?.error||'check log'}`, false)
      } else {
        flash(`✅ ${sent} sent`)
      }
    } catch(e) {
      flash('Network error: ' + e.message, false)
    }
    loadQueue()
    loadHistory()
  }
  async function skip(id){await fetch('/api/outreach/queue',{method:'POST',headers:H,body:JSON.stringify({action:'skip',ids:[id]})}); loadQueue()}
  async function delDup(id){if(!confirm('Delete this duplicate?'))return; await fetch('/api/outreach/contacts',{method:'DELETE',headers:H,body:JSON.stringify({id})}); loadContacts()}
  async function seed(url,label){await fetch(url,{method:'POST',headers:H}); loadContacts(); flash('Seeded: '+label)}

  const togSel=id=>setSelIds(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n})
  const selAll=()=>selIds.size===contacts.length?setSelIds(new Set()):setSelIds(new Set(contacts.map(c=>c._id)))
  const stats={total:contacts.length,email:contacts.filter(c=>c.email).length,touched:contacts.filter(c=>c.lastContactedAt).length,fresh:contacts.filter(c=>!c.lastContactedAt).length}

  const NAV=[
    {id:'compose',  icon:'✉',  lbl:'New'},
    {id:'contacts', icon:'👥', lbl:'People', badge:contacts.length||null},
    {id:'queue',    icon:'📬', lbl:'Queue',  badge:qStats.draft||null},
    {id:'history',  icon:'📜', lbl:'Sent',  badge: history.filter(h=>h.status==='failed').length||null, badgeColor:'#ef4444'},
    {id:'templates',icon:'📋', lbl:'Tpls'},
    {id:'dups',     icon:'⚠',  lbl:'Dups',  badge:dupGroups.length||null},
  ]

  return(
    <>
    <style>{CSS}</style>
    <div className="crm-app">

      {/* RAIL */}
      <div className="crm-rail">
        <div style={{fontFamily:BEBAS,fontSize:'1rem',color:GOLD,letterSpacing:'.1em',marginBottom:8}}>DR</div>
        {NAV.map(n=>(
          <button key={n.id} className={'rail-btn'+(view===n.id?' on':'')} onClick={()=>setView(n.id)} title={n.lbl}>
            {n.badge?<div className="rail-badge" style={{background:n.badgeColor||GOLD}}>{n.badge>99?'99+':n.badge}</div>:null}
            <div className="rail-icon">{n.icon}</div>
            <div className="rail-lbl">{n.lbl}</div>
          </button>
        ))}
        <div style={{flex:1}}/>
        {[{url:'/api/outreach/manufacturers',icon:'🏭',t:'Manufacturers'},{url:'/api/outreach/dealers',icon:'🛒',t:'Dealers'},{url:'/api/outreach/holsters',icon:'🔫',t:'Holsters'}].map(s=>(
          <button key={s.url} className="rail-btn" title={'Seed '+s.t} onClick={()=>seed(s.url,s.t)}>
            <div className="rail-icon">{s.icon}</div>
            <div className="rail-lbl">Seed</div>
          </button>
        ))}
      </div>

      {/* COMPOSE */}
      {view==='compose'&&(<>
        {/* Left contact list */}
        <div className="crm-left">
          <div className="crm-left-hdr">
            <span style={{fontFamily:BARLOW,fontSize:11,fontWeight:700,color:'#4b5563',letterSpacing:'.06em',textTransform:'uppercase'}}>TO</span>
            <input className="left-search" placeholder="Search contacts…" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&loadContacts()}/>
            <button className="ghost" style={{padding:'3px 7px',fontSize:10}} onClick={loadContacts}>↺</button>
          </div>
          <div style={{padding:'5px 10px',borderBottom:'1px solid #1a1f2e',display:'flex',gap:5}}>
            <select className="r-sel" style={{flex:1}} value={fType} onChange={e=>setFType(e.target.value)}>
              <option value="">All Types</option>
              {Object.entries(TYPE_META).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <select className="r-sel" style={{flex:1}} value={fStatus} onChange={e=>setFStatus(e.target.value)}>
              <option value="">All</option>
              {Object.entries(STATUS_META).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          {selIds.size>0&&<div style={{padding:'5px 12px',background:'rgba(200,146,42,.08)',borderBottom:'1px solid rgba(200,146,42,.2)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:10,color:GOLD,fontFamily:MONO}}>{selIds.size} selected</span>
            <button onClick={()=>setSelIds(new Set())} style={{background:'none',border:'none',color:'#4b5563',cursor:'pointer',fontSize:10}}>✕</button>
          </div>}
          <div style={{flex:1,overflowY:'auto'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'7px 12px',borderBottom:'1px solid #1a1f2e',cursor:'pointer'}} onClick={selAll}>
              <input type="checkbox" checked={selIds.size===contacts.length&&contacts.length>0} readOnly style={{accentColor:GOLD,cursor:'pointer',width:13,height:13}}/>
              <span style={{fontFamily:MONO,fontSize:10,color:'#4b5563'}}>All ({contacts.length})</span>
            </div>
            {loadingC?<div style={{padding:20,textAlign:'center',fontFamily:MONO,fontSize:10,color:'#374151'}}>Loading…</div>
            :contacts.length===0?<div style={{padding:20,textAlign:'center',fontFamily:MONO,fontSize:10,color:'#374151'}}>No contacts. Use seed buttons.</div>
            :contacts.map(c=>{
              const tm=TYPE_META[c.type]||TYPE_META.other
              const ini=(c.name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
              return(<div key={c._id} className={'c-row'+(selIds.has(c._id)?' chk':'')+(prevId===c._id?' prev':'')} onClick={()=>{togSel(c._id);setPrevId(c._id)}}>
                <input type="checkbox" checked={selIds.has(c._id)} readOnly style={{accentColor:GOLD,cursor:'pointer',width:13,height:13,flexShrink:0}}/>
                <div className="crm-avt" style={{background:tm.color+'22',color:tm.color}}>{ini}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:BARLOW,fontSize:12,fontWeight:700,color:'#e5e7eb',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name}</div>
                  <div style={{fontFamily:MONO,fontSize:9,color:'#4b5563',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.email||<span style={{color:'#374151'}}>no email</span>}</div>
                </div>
                <span style={{fontSize:11}}>{tm.icon}</span>
              </div>)
            })}
          </div>
        </div>

        {/* Center compose */}
        <div className="compose">
          <div className="c-hdr">
            <div className="c-field">
              <span className="c-lbl">To</span>
              <div style={{flex:1,display:'flex',flexWrap:'wrap',gap:5,padding:'5px 0',minHeight:34,alignItems:'center'}}>
                {selIds.size===0?<span style={{fontFamily:MONO,fontSize:11,color:'#374151'}}>Select contacts from left…</span>
                :<><span style={{fontFamily:MONO,fontSize:11,color:GOLD}}>{selIds.size} recipient{selIds.size>1?'s':''}</span>
                  {contacts.filter(c=>selIds.has(c._id)).slice(0,3).map(c=><span key={c._id} style={{fontFamily:MONO,fontSize:10,padding:'1px 7px',background:'rgba(200,146,42,.1)',color:GOLD,border:'1px solid rgba(200,146,42,.3)'}}>{c.name}</span>)}
                  {selIds.size>3&&<span style={{fontFamily:MONO,fontSize:10,color:'#4b5563'}}>+{selIds.size-3} more</span>}
                </>}
              </div>
            </div>
            <div className="c-field"><span className="c-lbl">Subject</span><input className="c-inp" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Subject… use {{firstName}}, {{businessName}}"/></div>
            <div className="c-field"><span className="c-lbl">Preheader</span><input className="c-inp" value={preheader} onChange={e=>setPreheader(e.target.value)} placeholder="Inbox preview text…" style={{color:'#6b7280',fontSize:11}}/></div>
            <div className="c-field"><span className="c-lbl">Greeting</span><input className="c-inp" value={greeting} onChange={e=>setGreeting(e.target.value)} placeholder="Hi {{firstName}},"/></div>
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            {TOOLBAR.map((t,i)=>t===null?<div key={i} className="t-sep"/>
              :<button key={t.cmd} className="t-btn" title={t.title} onMouseDown={e=>{e.preventDefault();execCmd(t.cmd)}}><span style={t.style||{}}>{t.icon}</span></button>
            )}
            <div className="t-sep"/>
            <button className={'t-btn'+(splitPrev?' on':'')} onClick={()=>setSplitPrev(v=>!v)} style={splitPrev?{background:'rgba(200,146,42,.15)',color:GOLD,border:'1px solid rgba(200,146,42,.3)'}:{}}>⊞ Preview</button>
          </div>

          {/* Editor + preview */}
          <div className="body-area">
            <div ref={edRef} className="editor" contentEditable suppressContentEditableWarning
              data-placeholder={"Write your email here…\n\nUse {{firstName}} and {{businessName}} for personalization."}
              style={{width:splitPrev?'50%':'100%'}}/>
            {splitPrev&&<div className="preview-pane" style={{width:'50%'}}>
              <div className="preview-bar">
                {['#ef4444','#f59e0b','#22c55e'].map(c=><div key={c} style={{width:9,height:9,borderRadius:'50%',background:c}}/>)}
                <span style={{fontFamily:MONO,fontSize:9,color:'#374151',marginLeft:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>
                  {(subject||'Email preview').replace(/\{\{firstName\}\}/g,prevC?.firstName||'John').replace(/\{\{businessName\}\}/g,prevC?.name||'Acme Arms')}
                </span>
                <select className="r-sel" style={{width:110,fontSize:10}} value={prevId||''} onChange={e=>setPrevId(e.target.value||null)}>
                  <option value="">Generic</option>
                  {contacts.filter(c=>c.email).slice(0,20).map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <iframe srcDoc={prevHTML} style={{flex:1,border:'none',background:'#fff'}} title="preview"/>
            </div>}
          </div>

          {/* Send bar */}
          <div className="send-bar">
            <button className="crm-btn" onClick={sendToSel} disabled={sending||!selIds.size}>
              {sending?'⏳ Sending…':selIds.size>0?'✉ Send to '+selIds.size:'✉ Send'}
            </button>
            <button className="ghost" onClick={queueDrafts} disabled={sending||!selIds.size}>📬 Queue for Approval</button>
            <div style={{flex:1}}/>
            {sendRes&&<div style={{fontFamily:MONO,fontSize:11,color:sendRes.failed?'#f59e0b':'#22c55e'}}>
              {sendRes.sent>0&&'✅ '+sendRes.sent+' sent'}{sendRes.failed>0&&' · ❌ '+sendRes.failed+' failed'}
            </div>}
            <span style={{fontFamily:MONO,fontSize:10,color:'#374151'}}>{(getBody()||'').length} chars</span>
          </div>
        </div>

        {/* Right panel */}
        <div className="crm-right">
          <div className="r-sec">
            <span className="r-lbl">Templates</span>
            {TEMPLATES.map(t=>(
              <button key={t.id} className={'tpl-chip'+(activeTpl===t.id?' on':'')} onClick={()=>applyTpl(t.id)}>{t.name}</button>
            ))}
          </div>
          <div className="r-sec">
            <span className="r-lbl">CTA Button</span>
            <input className="r-inp" placeholder="Button text" value={ctaText} onChange={e=>setCtaText(e.target.value)}/>
            <input className="r-inp" placeholder="https://…" value={ctaUrl} onChange={e=>setCtaUrl(e.target.value)}/>
          </div>
          <div className="r-sec">
            <span className="r-lbl">Accent Color</span>
            <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:6}}>
              <input type="color" value={accent} onChange={e=>setAccent(e.target.value)} style={{width:32,height:26,border:'none',background:'none',cursor:'pointer',padding:2}}/>
              <input className="r-inp" style={{flex:1,margin:0}} value={accent} onChange={e=>setAccent(e.target.value)}/>
              <button className="ghost" style={{padding:'4px 7px',fontSize:10}} onClick={()=>setAccent(GOLD)}>↩</button>
            </div>
          </div>
          <div className="r-sec">
            <span className="r-lbl">Signature Override</span>
            <textarea className="r-inp" rows={3} placeholder="Leave blank for default" value={sig} onChange={e=>setSig(e.target.value)} style={{resize:'vertical',lineHeight:1.6}}/>
          </div>
          <div className="r-sec">
            <span className="r-lbl">Preview As</span>
            <select className="r-sel" value={prevId||''} onChange={e=>setPrevId(e.target.value||null)}>
              <option value="">— Generic —</option>
              {contacts.filter(c=>c.email).slice(0,30).map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </>)}

      {/* CONTACTS */}
      {view==='contacts'&&<div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div className="stat-row">
          {[{v:stats.total,l:'Total'},{v:stats.email,l:'With Email'},{v:stats.touched,l:'Contacted'},{v:stats.fresh,l:'Untouched',c:'#f59e0b'},{v:dupGroups.length,l:'Duplicates',c:dupGroups.length>0?'#ef4444':'#22c55e'}].map(s=>(
            <div key={s.l} className="stat-box"><div className="stat-n" style={{color:s.c||GOLD}}>{s.v}</div><div className="stat-l">{s.l}</div></div>
          ))}
        </div>
        <div style={{padding:'9px 16px',borderBottom:'1px solid #1a1f2e',display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <input className="r-inp" style={{maxWidth:200,margin:0}} placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&loadContacts()}/>
          <select className="r-sel" style={{maxWidth:130}} value={fType} onChange={e=>setFType(e.target.value)}>
            <option value="">All Types</option>
            {Object.entries(TYPE_META).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          <select className="r-sel" style={{maxWidth:110}} value={fStatus} onChange={e=>setFStatus(e.target.value)}>
            <option value="">All Status</option>
            {Object.entries(STATUS_META).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
          <button className="crm-btn" style={{padding:'6px 14px'}} onClick={loadContacts}>Search</button>
          <button className="crm-btn" style={{padding:'6px 14px',background:'#1a2a1a',color:'#22c55e',border:'1px solid #22c55e22'}} onClick={openAdd}>＋ Add Contact</button>
          {selIds.size>0&&<><span style={{fontFamily:MONO,fontSize:10,color:GOLD}}>{selIds.size} sel</span>
            <button className="ghost" onClick={()=>setView('compose')}>✉ Compose</button>
            <button className="ghost" onClick={queueDrafts} disabled={sending}>📬 Queue</button>
          </>}
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          <table className="crm-table">
            <thead><tr>
              <th className="crm-th"><input type="checkbox" style={{accentColor:GOLD,cursor:'pointer'}} checked={selIds.size===contacts.length&&contacts.length>0} onChange={selAll}/></th>
              <th className="crm-th">Contact</th><th className="crm-th">Type</th><th className="crm-th">Email</th><th className="crm-th">Location</th><th className="crm-th">Status</th><th className="crm-th">Last Contacted</th><th className="crm-th">Actions</th>
            </tr></thead>
            <tbody>
              {loadingC?<tr><td colSpan={8} className="crm-td" style={{textAlign:'center',color:'#374151',padding:40}}>Loading…</td></tr>
              :contacts.map(c=>{
                const tm=TYPE_META[c.type]||TYPE_META.other
                const sm=STATUS_META[c.status]||STATUS_META.active
                const ini=(c.name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
                return(<tr key={c._id} className="crm-tr">
                  <td className="crm-td"><input type="checkbox" style={{accentColor:GOLD,cursor:'pointer'}} checked={selIds.has(c._id)} onChange={()=>togSel(c._id)}/></td>
                  <td className="crm-td"><div style={{display:'flex',alignItems:'center',gap:9}}>
                    <div className="crm-avt" style={{background:tm.color+'22',color:tm.color}}>{ini}</div>
                    <div><div style={{fontFamily:BARLOW,fontSize:13,fontWeight:700,color:'#e5e7eb'}}>{c.name}</div>
                    {c.firstName&&c.firstName!==c.name&&<div style={{fontFamily:MONO,fontSize:9,color:'#4b5563'}}>{c.firstName}</div>}</div>
                  </div></td>
                  <td className="crm-td"><span className="crm-badge" style={{background:tm.color+'22',color:tm.color}}>{tm.icon} {tm.label}</span></td>
                  <td className="crm-td" style={{fontFamily:MONO,fontSize:11}}>{c.email?<a href={'mailto:'+c.email} style={{color:GOLD,textDecoration:'none'}}>{c.email}</a>:<span style={{color:'#374151'}}>—</span>}</td>
                  <td className="crm-td" style={{fontFamily:MONO,fontSize:10,color:'#6b7280'}}>{[c.city,c.state].filter(Boolean).join(', ')||'—'}</td>
                  <td className="crm-td"><span className="crm-badge" style={{background:sm.color+'22',color:sm.color}}>{sm.label}</span></td>
                  <td className="crm-td" style={{fontFamily:MONO,fontSize:10,color:'#6b7280'}}>{c.lastContactedAt?new Date(c.lastContactedAt).toLocaleDateString():<span style={{color:'#f59e0b'}}>Never</span>}</td>
                  <td className="crm-td">
                    <div style={{display:'flex',gap:4}}>
                      {c.email&&<button className="ghost" style={{padding:'3px 7px',fontSize:10}} onClick={()=>{setSelIds(new Set([c._id]));setPrevId(c._id);setView('compose')}}>✉</button>}
                      <button className="ghost" style={{padding:'3px 7px',fontSize:10}} onClick={()=>openEdit(c)}>✏</button>
                      <button className="ghost" style={{padding:'3px 7px',fontSize:10,color:'#ef4444',borderColor:'rgba(239,68,68,.3)'}} onClick={()=>deleteContact(c)}>✕</button>
                    </div>
                  </td>
                </tr>)
              })}
            </tbody>
          </table>
        </div>
      </div>}

      {/* QUEUE */}
      {view==='queue'&&<div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'9px 18px',borderBottom:'1px solid #1a1f2e',display:'flex',gap:0,alignItems:'center',flexWrap:'wrap'}}>
          {['draft','approved','sent','skipped'].map(s=>(
            <button key={s} onClick={()=>setQTab(s)} style={{background:'none',border:'none',borderBottom:'2px solid',borderBottomColor:qTab===s?GOLD:'transparent',fontFamily:BARLOW,fontSize:12,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',padding:'8px 14px',cursor:'pointer',color:qTab===s?GOLD:'#4b5563'}}>
              {s} {qStats[s]?<span style={{fontSize:10}}>({qStats[s]})</span>:null}
            </button>
          ))}
          <div style={{flex:1}}/>
          <button className="ghost" style={{fontSize:10,padding:'4px 10px',borderColor:'#1a3a1a',color:'#22c55e'}} disabled={testRunning} onClick={runTestSend}>
            {testRunning ? '⏳ Testing…' : '🧪 Test Send'}
          </button>
          <button className="ghost" onClick={loadQueue} style={{marginLeft:4}}>↺</button>
          {qTab==='draft'&&queue.length>0&&<button className="crm-btn" style={{marginLeft:8}} onClick={()=>approve(queue.map(q=>q._id))}>✅ Approve All ({queue.length})</button>}
        </div>
        {testResult&&<div style={{padding:'10px 18px',borderBottom:'1px solid #1a1f2e',background:testResult.ok?'rgba(34,197,94,.05)':'rgba(239,68,68,.05)',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
            <span style={{fontFamily:MONO,fontSize:11,fontWeight:700,color:testResult.ok?'#22c55e':'#ef4444'}}>
              {testResult.ok ? '✅ Test send succeeded' : '❌ Test send failed'}
            </span>
            <button onClick={()=>setTestResult(null)} style={{background:'none',border:'none',color:'#4b5563',cursor:'pointer',fontSize:12}}>✕</button>
          </div>
          <div style={{fontFamily:MONO,fontSize:10,color:'#9ca3af',lineHeight:1.8}}>
            {testResult.diag&&Object.entries(testResult.diag).map(([k,v])=>(
              <span key={k} style={{marginRight:16,color:String(v).includes('MISSING')||v===false?'#ef4444':'#4b5563'}}>
                {k}: <span style={{color:String(v).includes('MISSING')||v===false?'#ef4444':'#e5e7eb'}}>{String(v)}</span>
              </span>
            ))}
          </div>
          {testResult.resend_error&&<div style={{fontFamily:MONO,fontSize:11,color:'#ef4444',marginTop:6}}>Resend error: {JSON.stringify(testResult.resend_error)}</div>}
          {testResult.exception&&<div style={{fontFamily:MONO,fontSize:11,color:'#ef4444',marginTop:6}}>Exception: {testResult.exception}</div>}
          {testResult.ok&&<div style={{fontFamily:MONO,fontSize:11,color:'#22c55e',marginTop:4}}>Resend ID: {testResult.resend_id} — check dj@downrangeco.com</div>}
        </div>}
        <div style={{flex:1,overflowY:'auto'}}>
          {loadingQ?<div style={{padding:60,textAlign:'center',fontFamily:MONO,fontSize:11,color:'#374151'}}>Loading…</div>
          :queue.length===0?<div style={{padding:60,textAlign:'center',fontFamily:MONO,fontSize:11,color:'#374151'}}>No {qTab} emails.</div>
          :queue.map(e=>{
            const c=e.contact; const tm=TYPE_META[c?.type]||TYPE_META.other
            return(<div key={e._id} className="q-item">
              <div>
                <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:7}}>
                  <div className="crm-avt" style={{width:24,height:24,background:tm.color+'22',color:tm.color,fontSize:9}}>{(c?.name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div>
                  <span style={{fontFamily:BARLOW,fontSize:13,fontWeight:700,color:'#e5e7eb'}}>{c?.name}</span>
                  <span style={{fontFamily:MONO,fontSize:10,color:'#4b5563'}}>{e.toEmail}</span>
                  <span className="crm-badge" style={{background:tm.color+'22',color:tm.color}}>{tm.icon}</span>
                </div>
                <div style={{fontFamily:MONO,fontSize:11,color:GOLD,marginBottom:7}}>📧 {e.subject}</div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <div style={{flex:1,fontFamily:MONO,fontSize:9,color:'#374151'}}>Drafted {e.draftedAt?new Date(e.draftedAt).toLocaleString():'—'}</div>
                  <button className="ghost" style={{fontSize:10,padding:'3px 10px'}} onClick={()=>setPreviewModal({subject:e.subject,html:e.bodyHtml})}>👁 Full Preview</button>
                </div>
                <div style={{background:'#fff',overflow:'hidden',height:180,border:'1px solid #1a1f2e',position:'relative',cursor:'pointer'}} onClick={()=>setPreviewModal({subject:e.subject,html:e.bodyHtml})}>
                  <iframe srcDoc={e.bodyHtml} style={{width:'100%',height:'100%',border:'none',pointerEvents:'none'}} title="q"/>
                  <div style={{position:'absolute',inset:0,background:'transparent'}}/>
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:5,minWidth:120}}>
                {qTab==='draft'&&<><button className="crm-btn" style={{width:'100%',fontSize:11}} onClick={()=>approve([e._id])}>✅ Approve</button>
                  <button className="ghost" style={{width:'100%',fontSize:10}} onClick={()=>skip(e._id)}>Skip</button></>}
                {qTab==='sent'&&<div style={{fontFamily:MONO,fontSize:9,color:'#22c55e',textAlign:'center'}}>✅ Sent<br/>{e.sentAt?new Date(e.sentAt).toLocaleDateString():''}</div>}
              </div>
            </div>)
          })}
        </div>
      </div>}

      {/* HISTORY / TRANSMISSION LOG */}
      {view==='history'&&(()=>{
        const LOG_STATUS = {
          sent:      { color:'#22c55e',  label:'Sent',      icon:'✅' },
          failed:    { color:'#ef4444',  label:'Failed',    icon:'❌' },
          bounced:   { color:'#f97316',  label:'Bounced',   icon:'↩' },
          opened:    { color:'#3b82f6',  label:'Opened',    icon:'👁' },
          clicked:   { color:'#8b5cf6',  label:'Clicked',   icon:'🔗' },
          replied:   { color:'#C8922A',  label:'Replied',   icon:'💬' },
          skipped:   { color:'#6b7280',  label:'Skipped',   icon:'⏭' },
          draft:     { color:'#4b5563',  label:'Draft',     icon:'📝' },
          approved:  { color:'#f59e0b',  label:'Approved',  icon:'⏳' },
        }
        const hFailed  = history.filter(h=>h.status==='failed')
        const hSent    = history.filter(h=>h.status==='sent')
        const hOther   = history.filter(h=>!['sent','failed'].includes(h.status))
        return(
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

          {/* header bar */}
          <div style={{padding:'9px 16px',borderBottom:'1px solid #1a1f2e',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',background:'#0A0B0C',flexShrink:0}}>
            <span style={{fontFamily:BEBAS,fontSize:'1.1rem',color:GOLD,letterSpacing:'.06em'}}>TRANSMISSION LOG</span>
            <div style={{flex:1}}/>
            {hFailed.length>0&&<span style={{fontFamily:MONO,fontSize:10,color:'#ef4444',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',padding:'2px 8px'}}>❌ {hFailed.length} failed</span>}
            <span style={{fontFamily:MONO,fontSize:10,color:'#22c55e'}}>✅ {hSent.length} sent</span>
            <span style={{fontFamily:MONO,fontSize:10,color:'#4b5563'}}>{history.length} total</span>
            <button className="ghost" style={{fontSize:10,padding:'4px 10px'}} onClick={loadHistory}>↺ Refresh</button>
          </div>

          {/* failed block — pinned at top if any */}
          {hFailed.length>0&&<div style={{flexShrink:0,borderBottom:'1px solid rgba(239,68,68,.2)',background:'rgba(239,68,68,.03)'}}>
            <div style={{padding:'6px 16px',background:'rgba(239,68,68,.08)',borderBottom:'1px solid rgba(239,68,68,.15)',display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontFamily:MONO,fontSize:9,fontWeight:700,color:'#ef4444',letterSpacing:'.1em',textTransform:'uppercase'}}>❌ Failed Transmissions ({hFailed.length})</span>
            </div>
            {hFailed.map(h=>{
              const tm=TYPE_META[h.contact?.type]||TYPE_META.other
              return(<div key={h._id} style={{padding:'10px 16px',borderBottom:'1px solid rgba(239,68,68,.1)',display:'grid',gridTemplateColumns:'1fr auto',gap:12,alignItems:'start'}}>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <span style={{fontFamily:BARLOW,fontSize:13,fontWeight:700,color:'#e5e7eb'}}>{h.toName}</span>
                    <span style={{fontFamily:MONO,fontSize:10,color:'#4b5563'}}>{h.toEmail}</span>
                    <span className="crm-badge" style={{background:tm.color+'22',color:tm.color}}>{tm.icon} {tm.label}</span>
                  </div>
                  <div style={{fontFamily:MONO,fontSize:11,color:'#9ca3af',marginBottom:4}}>📧 {h.subject}</div>
                  {h.error&&<div style={{fontFamily:MONO,fontSize:11,color:'#ef4444',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',padding:'6px 10px',marginTop:4}}>
                    <span style={{color:'#6b7280'}}>ERROR: </span>{h.error}
                  </div>}
                  <div style={{fontFamily:MONO,fontSize:9,color:'#374151',marginTop:4}}>
                    {h.sentAt?new Date(h.sentAt).toLocaleString():'—'}
                    {h.resendId&&<span style={{marginLeft:8,color:'#4b5563'}}>Resend ID: {h.resendId}</span>}
                  </div>
                </div>
                <button className="ghost" style={{fontSize:10,padding:'3px 8px',whiteSpace:'nowrap'}} onClick={()=>setPreviewModal({subject:h.subject,html:h.bodyHtml||'<p style="padding:20px;color:#999">No HTML body stored</p>'})}>👁 Preview</button>
              </div>)
            })}
          </div>}

          {/* all transmissions table */}
          <div style={{flex:1,overflowY:'auto'}}>
            {loadingH
              ? <div style={{padding:60,textAlign:'center',fontFamily:MONO,fontSize:11,color:'#374151'}}>Loading…</div>
              : history.length===0
                ? <div style={{padding:60,textAlign:'center',fontFamily:MONO,fontSize:11,color:'#374151'}}>No transmission logs yet.</div>
                : <table className="crm-table">
                    <thead><tr>
                      <th className="crm-th">Contact</th>
                      <th className="crm-th">Subject</th>
                      <th className="crm-th">Status</th>
                      <th className="crm-th">Timestamp</th>
                      <th className="crm-th">Error / ID</th>
                      <th className="crm-th"/>
                    </tr></thead>
                    <tbody>
                      {history.map(h=>{
                        const tm=TYPE_META[h.contact?.type]||TYPE_META.other
                        const ls=LOG_STATUS[h.status]||{color:'#6b7280',label:h.status,icon:'•'}
                        const ts = h.sentAt||h.approvedAt||h.draftedAt
                        return(
                          <tr key={h._id} className="crm-tr" style={{background:h.status==='failed'?'rgba(239,68,68,.02)':''}}>
                            <td className="crm-td">
                              <div style={{display:'flex',alignItems:'center',gap:8}}>
                                <div className="crm-avt" style={{width:24,height:24,background:tm.color+'22',color:tm.color,fontSize:9,flexShrink:0}}>
                                  {(h.toName||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                                </div>
                                <div>
                                  <div style={{fontFamily:BARLOW,fontSize:13,fontWeight:700,color:'#e5e7eb'}}>{h.toName||h.contact?.name}</div>
                                  <div style={{fontFamily:MONO,fontSize:9,color:'#4b5563'}}>{h.toEmail}</div>
                                </div>
                              </div>
                            </td>
                            <td className="crm-td" style={{fontFamily:MONO,fontSize:11,color:'#9ca3af',maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{h.subject}</td>
                            <td className="crm-td">
                              <span className="crm-badge" style={{background:ls.color+'22',color:ls.color}}>{ls.icon} {ls.label}</span>
                            </td>
                            <td className="crm-td" style={{fontFamily:MONO,fontSize:10,color:'#6b7280',whiteSpace:'nowrap'}}>
                              {ts ? new Date(ts).toLocaleString() : '—'}
                            </td>
                            <td className="crm-td" style={{fontFamily:MONO,fontSize:10,maxWidth:200}}>
                              {h.error
                                ? <span style={{color:'#ef4444',fontSize:10}}>{h.error.slice(0,80)}{h.error.length>80?'…':''}</span>
                                : h.resendId
                                  ? <span style={{color:'#374151'}}>{h.resendId}</span>
                                  : <span style={{color:'#1f2428'}}>—</span>
                              }
                            </td>
                            <td className="crm-td">
                              <button className="ghost" style={{fontSize:10,padding:'2px 7px'}}
                                onClick={()=>setPreviewModal({subject:h.subject,html:h.bodyHtml||'<div style="padding:20px;color:#999;font-family:sans-serif">No HTML body stored for this entry.</div>'})}>
                                👁
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
            }
          </div>
        </div>
        )
      })()}

      {/* TEMPLATES */}
      {view==='templates'&&<div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* ── LEFT: template list ── */}
        <div style={{width:240,borderRight:'1px solid #1a1f2e',overflowY:'auto',background:'#0A0B0C',flexShrink:0}}>
          <div style={{padding:'10px 14px 8px',borderBottom:'1px solid #1a1f2e',display:'flex',flexDirection:'column',gap:6}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontFamily:BARLOW,fontSize:11,fontWeight:700,color:'#4b5563',letterSpacing:'.06em',textTransform:'uppercase'}}>{tplTemplates.length} Templates</span>
              {tplDirty&&<span style={{fontFamily:MONO,fontSize:9,color:'#f59e0b'}}>● unsaved</span>}
            </div>
            <button className="ghost" style={{fontSize:10,padding:'4px 8px',width:'100%'}}
              onClick={async()=>{
                flash('Syncing templates to Sanity…')
                const r=await fetch('/api/outreach/templates/seed?action=templates',{method:'POST',headers:H})
                const d=await r.json()
                flash(d.ok?`✅ ${d.templates?.updated||0} updated, ${d.templates?.created||0} created`:'Sync failed',d.ok)
              }}>
              ↑ Sync to Sanity
            </button>
          </div>
          <div style={{padding:10}}>
            {tplTemplates.map(t=>{const tm=TYPE_META[t.cat]||TYPE_META.other;const active=activeTpl===t.id;return(
              <div key={t.id} onClick={()=>tplLoad(t.id)}
                style={{padding:'8px 10px',marginBottom:4,border:'1px solid '+(active?GOLD:'#1a1f2e'),background:active?'rgba(200,146,42,.08)':'#111318',cursor:'pointer',transition:'all .1s'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                  <span style={{fontFamily:BARLOW,fontSize:12,fontWeight:700,color:active?GOLD:'#e5e7eb',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{t.name}</span>
                  <span style={{fontSize:12,flexShrink:0}}>{tm.icon}</span>
                </div>
                <div style={{fontFamily:MONO,fontSize:9,color:'#4b5563',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.subject}</div>
              </div>
            )})}
          </div>
        </div>

        {/* ── RIGHT: editor + preview ── */}
        {tplEditing ? (
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>

            {/* top bar */}
            <div style={{padding:'8px 16px',background:'#0A0B0C',borderBottom:'1px solid #1a1f2e',display:'flex',alignItems:'center',gap:10,flexShrink:0,flexWrap:'wrap'}}>
              <span style={{fontFamily:BEBAS,fontSize:'1.1rem',color:GOLD,letterSpacing:'.06em'}}>{tplEditing.name}</span>
              <div style={{flex:1}}/>
              {tplSaved&&<span style={{fontFamily:MONO,fontSize:10,color:'#22c55e'}}>✓ saved</span>}
              {tplDirty&&<span style={{fontFamily:MONO,fontSize:10,color:'#f59e0b'}}>● unsaved changes</span>}
              <button className="ghost" style={{fontSize:11,padding:'5px 12px'}} onClick={()=>{tplLoad(activeTpl);setTplDirty(false)}}>↺ Reset</button>
              <button className="ghost" style={{fontSize:11,padding:'5px 12px'}} onClick={()=>{applyTpl(activeTpl);setView('compose')}}>✍ Use in Compose</button>
              <button className="crm-btn" style={{fontSize:11,padding:'7px 16px'}} disabled={!tplDirty} onClick={tplSave}>💾 Save Template</button>
            </div>

            <div style={{flex:1,display:'flex',overflow:'hidden'}}>

              {/* editor col */}
              <div style={{flex:'0 0 50%',display:'flex',flexDirection:'column',borderRight:'1px solid #1a1f2e',overflow:'hidden'}}>

                {/* metadata fields */}
                <div style={{background:'#0A0B0C',borderBottom:'1px solid #1a1f2e',flexShrink:0}}>
                  {[
                    {lbl:'Subject',    key:'subject',   ph:'Email subject line'},
                    {lbl:'Preview',    key:'preheader', ph:'Preview / preheader text'},
                    {lbl:'Greeting',   key:'greeting',  ph:'e.g. Hey {{firstName}},'},
                    {lbl:'CTA Text',   key:'ctaText',   ph:'Button label'},
                    {lbl:'CTA URL',    key:'ctaUrl',    ph:'https://'},
                  ].map(({lbl,key,ph})=>(
                    <div key={key} style={{display:'flex',alignItems:'center',borderBottom:'1px solid #0d1117',padding:'0 14px',minHeight:36}}>
                      <span style={{fontFamily:MONO,fontSize:9,color:'#4b5563',letterSpacing:'.1em',textTransform:'uppercase',width:72,flexShrink:0}}>{lbl}</span>
                      <input
                        value={tplEditing[key]||''}
                        placeholder={ph}
                        onChange={e=>{setTplEditing(p=>({...p,[key]:e.target.value}));setTplDirty(true)}}
                        style={{flex:1,background:'none',border:'none',color:'#e5e7eb',fontFamily:MONO,fontSize:12,padding:'8px 0',outline:'none'}}
                      />
                    </div>
                  ))}
                </div>

                {/* rich body toolbar */}
                <div style={{display:'flex',gap:1,padding:'5px 10px',background:'#050506',borderBottom:'1px solid #1a1f2e',flexWrap:'wrap',flexShrink:0}}>
                  {[
                    {lbl:'B',      cmd:'bold',        title:'Bold'},
                    {lbl:'I',      cmd:'italic',       title:'Italic'},
                    {lbl:'U',      cmd:'underline',    title:'Underline'},
                    null,
                    {lbl:'H2',     cmd:'h2',           title:'Heading'},
                    {lbl:'¶',      cmd:'formatBlock p',title:'Paragraph'},
                    null,
                    {lbl:'•',      cmd:'ul',           title:'Bullet list'},
                    {lbl:'🔗',    cmd:'link',          title:'Link'},
                    {lbl:'—',      cmd:'divider',      title:'Divider'},
                    null,
                    {lbl:'{{fn}}', cmd:'var_fn',       title:'Insert {{firstName}}'},
                    {lbl:'{{ch}}', cmd:'var_ch',       title:'Insert {{channelName}}'},
                  ].map((btn,i)=>btn===null
                    ? <div key={i} style={{width:1,background:'#1a1f2e',margin:'2px 3px',alignSelf:'stretch'}}/>
                    : <button key={btn.cmd} title={btn.title} onClick={()=>{
                        tplCmd(btn.cmd==='var_fn'?'var_fn':btn.cmd==='var_ch'?'var_ch':btn.cmd)
                        setTplDirty(true)
                      }}
                      style={{background:'none',border:'1px solid transparent',color:'#6b7280',fontFamily:MONO,fontSize:11,fontWeight:700,padding:'4px 8px',cursor:'pointer',borderRadius:3}}>
                      {btn.lbl}
                    </button>
                  )}
                </div>

                {/* body editor */}
                <textarea
                  id="tpl-body-editor"
                  value={tplEditing?.body||''}
                  onChange={e=>{setTplEditing(p=>({...p,body:e.target.value}));setTplDirty(true)}}
                  placeholder="Write email body here…"
                  spellCheck={false}
                  style={{flex:1,background:'#0d1117',color:'#d1d5db',fontSize:13,lineHeight:1.85,padding:'20px 24px',outline:'none',resize:'none',border:'none',fontFamily:"'IBM Plex Mono',monospace",whiteSpace:'pre-wrap'}}
                />
              </div>

              {/* live preview col */}
              <div style={{flex:'0 0 50%',display:'flex',flexDirection:'column',overflow:'hidden',background:'#050506'}}>
                <div style={{padding:'6px 14px',borderBottom:'1px solid #1a1f2e',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                  <span style={{fontFamily:MONO,fontSize:9,color:'#4b5563',letterSpacing:'.1em',textTransform:'uppercase'}}>Live Preview</span>
                  <div style={{flex:1}}/>
                  {['#ef4444','#f59e0b','#22c55e'].map(c=><div key={c} style={{width:8,height:8,borderRadius:'50%',background:c}}/>)}
                </div>
                <div style={{flex:1,overflow:'hidden',background:'#fff'}}>
                  <iframe
                    key={tplDirty?'dirty':'clean'}
                    srcDoc={buildEmailHTML({subject:tplEditing.subject,preheader:tplEditing.preheader,greeting:tplEditing.greeting,body:tplEditing.body,ctaText:tplEditing.ctaText,ctaUrl:tplEditing.ctaUrl,contactName:'John Smith'})}
                    style={{width:'100%',height:'100%',border:'none'}}
                    title="preview"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#374151',fontFamily:MONO,fontSize:12}}>
            ← Select a template to edit
          </div>
        )}
      </div>}

      {/* DUPS */}
      {view==='dups'&&<div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'9px 18px',borderBottom:'1px solid #1a1f2e',display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontFamily:BEBAS,fontSize:'1.1rem',color:'#ef4444',letterSpacing:'.06em'}}>⚠ DUPLICATES</span>
          <span style={{fontFamily:MONO,fontSize:10,color:'#4b5563'}}>{dupGroups.length} dup emails · {dupGroups.reduce((a,g)=>a+g.length,0)} records</span>
          <button className="ghost" onClick={loadContacts}>↺ Rescan</button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:18}}>
          {dupGroups.length===0?<div style={{textAlign:'center',padding:60,fontFamily:MONO,fontSize:12,color:'#22c55e'}}>✅ No duplicates.</div>
          :dupGroups.map((grp,gi)=>(
            <div key={gi} style={{marginBottom:18,border:'1px solid rgba(239,68,68,.25)',background:'rgba(239,68,68,.03)'}}>
              <div style={{padding:'7px 14px',background:'rgba(239,68,68,.08)',borderBottom:'1px solid rgba(239,68,68,.2)',fontFamily:MONO,fontSize:10,color:'#ef4444'}}>{grp[0]?.email} — {grp.length} records</div>
              <table className="crm-table">
                <thead><tr><th className="crm-th">Name</th><th className="crm-th">Type</th><th className="crm-th">Added</th><th className="crm-th">Last Contacted</th><th className="crm-th"/></tr></thead>
                <tbody>
                  {grp.map((c,ci)=>{const tm=TYPE_META[c.type]||TYPE_META.other;return(
                    <tr key={c._id} className="crm-tr">
                      <td className="crm-td" style={{fontFamily:BARLOW,fontSize:13,fontWeight:700}}>
                        {c.name} {ci===0&&<span style={{fontFamily:MONO,fontSize:8,color:'#22c55e',border:'1px solid #22c55e',padding:'1px 5px',marginLeft:6}}>KEEP</span>}
                      </td>
                      <td className="crm-td"><span className="crm-badge" style={{background:tm.color+'22',color:tm.color}}>{tm.label}</span></td>
                      <td className="crm-td" style={{fontFamily:MONO,fontSize:10,color:'#4b5563'}}>{c.addedAt?new Date(c.addedAt).toLocaleDateString():'—'}</td>
                      <td className="crm-td" style={{fontFamily:MONO,fontSize:10,color:c.lastContactedAt?'#22c55e':'#4b5563'}}>{c.lastContactedAt?new Date(c.lastContactedAt).toLocaleDateString():'Never'}</td>
                      <td className="crm-td">{ci>0&&<button style={{background:'none',border:'1px solid rgba(239,68,68,.4)',color:'#ef4444',fontFamily:MONO,fontSize:9,padding:'3px 8px',cursor:'pointer'}} onClick={()=>delDup(c._id)}>Delete</button>}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>}

    </div>

    {/* Toast */}
    {toast&&<div className="crm-toast" style={{borderLeftColor:toast.ok?GOLD:'#ef4444'}}>{toast.msg}</div>}

    {/* ── Email Full Preview Modal ── */}
    {previewModal&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',zIndex:1001,display:'flex',flexDirection:'column'}} onClick={e=>{if(e.target===e.currentTarget)setPreviewModal(null)}}>
      <div style={{background:'#0A0B0C',borderBottom:'1px solid #1a1f2e',padding:'10px 20px',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
        <span style={{fontFamily:MONO,fontSize:11,color:GOLD,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>📧 {previewModal.subject}</span>
        <button onClick={()=>setPreviewModal(null)} style={{background:'none',border:'1px solid #1a1f2e',color:'#9ca3af',cursor:'pointer',padding:'4px 12px',fontFamily:MONO,fontSize:11}}>✕ Close</button>
      </div>
      <div style={{flex:1,background:'#f3f4f6',overflow:'auto'}}>
        <iframe srcDoc={previewModal.html} style={{width:'100%',height:'100%',border:'none'}} title="full-preview"/>
      </div>
    </div>}

    {/* ── Contact Add/Edit Modal ── */}
    {contactModal&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)setContactModal(null)}}>
      <div style={{background:'#0d0e10',border:'1px solid #1f2428',width:480,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,.6)'}}>

        {/* Modal header */}
        <div style={{padding:'14px 20px',borderBottom:'1px solid #1a1f2e',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#0A0B0C'}}>
          <span style={{fontFamily:BEBAS,fontSize:'1.1rem',color:GOLD,letterSpacing:'.06em'}}>{contactModal==='add'?'Add Contact':'Edit Contact'}</span>
          <button onClick={()=>setContactModal(null)} style={{background:'none',border:'none',color:'#4b5563',cursor:'pointer',fontSize:18,lineHeight:1}}>✕</button>
        </div>

        {/* Form */}
        <div style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>
          {[
            {lbl:'Full Name *',       key:'name',       ph:'e.g. Hickok45',                  req:true},
            {lbl:'First Name',        key:'firstName',  ph:'e.g. Greg'},
            {lbl:'Email *',           key:'email',      ph:'contact@example.com',            req:true},
            {lbl:'YouTube / Website', key:'youtubeUrl', ph:'https://youtube.com/@handle'},
            {lbl:'Notes',             key:'notes',      ph:'Any background info…',           multi:true},
          ].map(({lbl,key,ph,req,multi})=>(
            <div key={key}>
              <label style={{fontFamily:MONO,fontSize:9,color:'#4b5563',letterSpacing:'.1em',textTransform:'uppercase',display:'block',marginBottom:4}}>{lbl}</label>
              {multi
                ? <textarea value={cmForm[key]||''} onChange={e=>setCmForm(p=>({...p,[key]:e.target.value}))} placeholder={ph} rows={3}
                    style={{width:'100%',boxSizing:'border-box',background:'#111318',border:'1px solid #1a1f2e',color:'#e5e7eb',fontFamily:MONO,fontSize:12,padding:'7px 10px',outline:'none',resize:'vertical'}}/>
                : <input value={cmForm[key]||''} onChange={e=>setCmForm(p=>({...p,[key]:e.target.value}))} placeholder={ph}
                    style={{width:'100%',boxSizing:'border-box',background:'#111318',border:'1px solid #1a1f2e',color:'#e5e7eb',fontFamily:MONO,fontSize:12,padding:'7px 10px',outline:'none'}}/>
              }
            </div>
          ))}

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label style={{fontFamily:MONO,fontSize:9,color:'#4b5563',letterSpacing:'.1em',textTransform:'uppercase',display:'block',marginBottom:4}}>Type</label>
              <select value={cmForm.type||'youtuber'} onChange={e=>setCmForm(p=>({...p,type:e.target.value}))}
                style={{width:'100%',background:'#111318',border:'1px solid #1a1f2e',color:'#e5e7eb',fontFamily:MONO,fontSize:11,padding:'7px 9px',outline:'none',cursor:'pointer'}}>
                {Object.entries(TYPE_META).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontFamily:MONO,fontSize:9,color:'#4b5563',letterSpacing:'.1em',textTransform:'uppercase',display:'block',marginBottom:4}}>Status</label>
              <select value={cmForm.status||'active'} onChange={e=>setCmForm(p=>({...p,status:e.target.value}))}
                style={{width:'100%',background:'#111318',border:'1px solid #1a1f2e',color:'#e5e7eb',fontFamily:MONO,fontSize:11,padding:'7px 9px',outline:'none',cursor:'pointer'}}>
                {Object.entries(STATUS_META).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:8,borderTop:'1px solid #1a1f2e',marginTop:4}}>
            <button className="ghost" onClick={()=>setContactModal(null)}>Cancel</button>
            <button className="crm-btn" disabled={cmSaving||!cmForm.name||!cmForm.email} onClick={saveContact}>
              {cmSaving?'Saving…':contactModal==='add'?'Add Contact':'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>}
    </>
  )
}
