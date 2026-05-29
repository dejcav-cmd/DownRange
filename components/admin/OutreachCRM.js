'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// DownRange CRM — Full rebuild
// Features:
//   • Contact database with search, filters, dedup detection
//   • Beautiful HTML email composer with DR branding (no raw code shown)
//   • Template library with live visual preview
//   • Queue / approval flow
//   • Send history + analytics
//   • Duplicate detector
// ─────────────────────────────────────────────────────────────────────────────

const GOLD   = '#C8922A'
const MONO   = "'IBM Plex Mono',monospace"
const BEBAS  = "'Bebas Neue',cursive"
const BARLOW = "'Barlow Condensed',sans-serif"

const TYPE_META = {
  youtuber:     { label:'YouTuber',          color:'#ef4444', icon:'▶' },
  gun_shop:     { label:'Gun Shop',          color:'#f59e0b', icon:'🏪' },
  ffl_dealer:   { label:'FFL Dealer',        color:'#3b82f6', icon:'🛒' },
  manufacturer: { label:'Manufacturer',      color:'#8b5cf6', icon:'🏭' },
  organization: { label:'Organization',      color:'#06b6d4', icon:'🏛' },
  instructor:   { label:'Instructor',        color:'#10b981', icon:'🎯' },
  holster:      { label:'Holster Co',        color:'#f97316', icon:'🔫' },
  range:        { label:'Range',             color:'#84cc16', icon:'🎳' },
  press:        { label:'Press',             color:'#a78bfa', icon:'📰' },
  other:        { label:'Other',             color:'#6b7280', icon:'👤' },
}

const STATUS_META = {
  active:          { color:'#22c55e', label:'Active' },
  unsubscribed:    { color:'#ef4444', label:'Unsubscribed' },
  bounced:         { color:'#f97316', label:'Bounced' },
  do_not_contact:  { color:'#7f1d1d', label:'DNC' },
  pending:         { color:'#f59e0b', label:'Pending' },
}

// ─── Reusable email HTML builder ─────────────────────────────────────────────
function buildEmailHTML({ subject, greeting, body, ctaText, ctaUrl, contactName, senderName = 'DJ Cavalcanti' }) {
  const firstName = contactName?.split(' ')[0] || 'there'
  const finalGreeting = (greeting || 'Hi {{firstName}},').replace('{{firstName}}', firstName)
  const finalBody = (body || '').replace(/{{firstName}}/g, firstName)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject || 'DownRange'}</title>
</head>
<body style="margin:0;padding:0;background:#09090B;font-family:Arial,Helvetica,sans-serif;color:#e5e7eb;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#09090B;padding:40px 16px;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#0A0B0C;border:1px solid #1f2428;max-width:600px;width:100%;">

    <!-- HEADER -->
    <tr><td style="background:#0A0B0C;border-bottom:3px solid ${GOLD};padding:28px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-family:Georgia,serif;font-size:28px;font-weight:900;color:${GOLD};letter-spacing:0.12em;line-height:1;">DOWNRANGE</div>
            <div style="font-size:9px;color:#4b5563;letter-spacing:0.25em;margin-top:4px;text-transform:uppercase;">Firearms & 2A Intelligence Hub</div>
          </td>
          <td align="right" style="vertical-align:bottom;">
            <div style="font-family:'Courier New',monospace;font-size:9px;color:#374151;letter-spacing:0.1em;">downrangeco.com</div>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- BODY -->
    <tr><td style="padding:36px 36px 28px;">
      <p style="font-size:15px;color:#9ca3af;line-height:1.8;margin:0 0 20px;">${finalGreeting}</p>
      <div style="font-size:15px;color:#d1d5db;line-height:1.85;white-space:pre-line;">${finalBody}</div>

      ${ctaText && ctaUrl ? `
      <table cellpadding="0" cellspacing="0" style="margin:32px 0 0;">
        <tr><td style="background:${GOLD};padding:0;">
          <a href="${ctaUrl}" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#000;text-decoration:none;letter-spacing:0.08em;text-transform:uppercase;">${ctaText} →</a>
        </td></tr>
      </table>` : ''}

      <div style="margin-top:36px;padding-top:24px;border-top:1px solid #1f2428;">
        <p style="font-size:14px;color:#9ca3af;line-height:1.7;margin:0 0 4px;">— ${senderName}</p>
        <p style="font-size:11px;color:#4b5563;margin:0;">Founder, DownRange · <a href="https://downrangeco.com" style="color:${GOLD};text-decoration:none;">downrangeco.com</a></p>
      </div>
    </td></tr>

    <!-- GOLD DIVIDER -->
    <tr><td style="padding:0 36px;"><div style="height:1px;background:linear-gradient(90deg,${GOLD}44,${GOLD},${GOLD}44);"></div></td></tr>

    <!-- FOOTER -->
    <tr><td style="padding:20px 36px 28px;background:#050506;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:10px;color:#374151;line-height:1.7;">
            DownRange Media LLC · America's Firearms Intelligence Hub<br>
            <a href="https://downrangeco.com/press" style="color:${GOLD};text-decoration:none;">Press Kit</a> &nbsp;·&nbsp;
            <a href="https://downrangeco.com" style="color:#4b5563;text-decoration:none;">downrangeco.com</a>
          </td>
          <td align="right" style="font-size:9px;color:#1f2937;letter-spacing:0.1em;vertical-align:bottom;">
            <a href="{{unsubscribeUrl}}" style="color:#374151;text-decoration:none;font-size:9px;">Unsubscribe</a>
          </td>
        </tr>
      </table>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`
}

// ─── Email Template Presets ───────────────────────────────────────────────────
const EMAIL_TEMPLATES = [
  {
    id: 'intro-youtuber',
    name: 'YouTuber — Introduction',
    category: 'youtuber',
    subject: 'DownRange wants to feature your channel — quick question',
    greeting: 'Hey {{firstName}},',
    body: `I came across your channel while building out the video section of DownRange — we're an independent firearms and 2A news portal I launched out of Washington State.

Your content stands out. The production quality and how you explain {{topic}} is exactly the kind of thing our readers (serious gun owners, CCW holders, competitors) actually want to see.

I'd love to embed some of your recent videos on our site and link your channel on our dedicated YouTuber directory. Zero cost, just exposure to a targeted 2A audience.

Would you be open to that? Takes about 60 seconds to say yes.`,
    ctaText: 'View DownRange',
    ctaUrl: 'https://downrangeco.com',
  },
  {
    id: 'intro-manufacturer',
    name: 'Manufacturer — Press Coverage',
    category: 'manufacturer',
    subject: 'DownRange would like to cover {{businessName}}',
    greeting: 'Hi {{firstName}},',
    body: `I'm DJ Cavalcanti, founder of DownRange (downrangeco.com) — an independent firearms and Second Amendment news portal covering breaking legislation, new releases, market data, and gear for serious gun owners.

I'd like to add {{businessName}} to our manufacturer profiles and cover your upcoming releases as they happen. We publish AI-powered articles daily and our audience skews toward active buyers: FFLs, competitive shooters, and daily carriers.

Our press page is at downrangeco.com/press. If you have a media contact or PR list you'd like us on, I'd appreciate being added.`,
    ctaText: 'Visit Our Press Page',
    ctaUrl: 'https://downrangeco.com/press',
  },
  {
    id: 'intro-ffl',
    name: 'FFL Dealer — Directory Listing',
    category: 'ffl_dealer',
    subject: 'Free listing on DownRange — 2A portal in your area',
    greeting: 'Hi {{firstName}},',
    body: `My name is DJ, and I run DownRange — a firearms news and resource portal at downrangeco.com. We're building the most comprehensive FFL dealer directory in the country, organized by state with maps, hours, and specialties.

I'd like to add {{businessName}} to our directory at no cost. We drive traffic from readers looking for local transfer dealers, consignment sales, and NFA-capable FFLs.

If you'd like to be listed (or want to update an existing listing), just reply with your preferred contact details and I'll get it done.`,
    ctaText: 'Find Your Listing',
    ctaUrl: 'https://downrangeco.com/state-hub',
  },
  {
    id: 'intro-holster',
    name: 'Holster Company — Coverage',
    category: 'holster',
    subject: 'DownRange holster coverage opportunity',
    greeting: 'Hi {{firstName}},',
    body: `I'm building out the holster section of DownRange, our firearms intelligence portal, and {{businessName}} came up as a brand worth covering.

We have a dedicated holster directory and I write buyer guides for our CCW-focused readers — the kind of people who own 3+ holsters and care about retention levels, sweat guards, and ride height.

Would you be open to sending a sample for an honest review? No manufacturer money — we call it like we see it — but we give real exposure to brands that deserve it.`,
    ctaText: 'View Our Holster Coverage',
    ctaUrl: 'https://downrangeco.com/holsters',
  },
  {
    id: 'intro-range',
    name: 'Range — Partnership',
    category: 'range',
    subject: 'DownRange wants to feature {{businessName}}',
    greeting: 'Hey {{firstName}},',
    body: `DJ Cavalcanti here, founder of DownRange — a firearms and 2A news portal covering the full spectrum of gun ownership.

We have a Range Finder tool that helps readers locate ranges near them, and I'd like to add {{businessName}} to our database with your full details: hours, bays, rental programs, instruction availability.

It's free and takes 5 minutes. Our readers are actively looking for quality ranges in your area.`,
    ctaText: 'View Our Range Finder',
    ctaUrl: 'https://downrangeco.com/ranges',
  },
  {
    id: 'followup',
    name: 'Follow-Up (14 Days)',
    category: 'all',
    subject: 'Following up — DownRange coverage for {{businessName}}',
    greeting: 'Hey {{firstName}},',
    body: `Just following up on my note from a couple weeks ago about featuring {{businessName}} on DownRange.

Totally understand if timing was off — wanted to leave the door open in case it's a better fit now. We're still building out coverage and would genuinely like to include you.

No pressure either way. Let me know if you have any questions.`,
    ctaText: 'Visit DownRange',
    ctaUrl: 'https://downrangeco.com',
  },
]

// ─── Styles ──────────────────────────────────────────────────────────────────
const CSS = `
.crm-wrap { display:flex; height:calc(100vh - 52px); overflow:hidden; background:#09090B; }
.crm-sidebar { width:220px; min-width:220px; border-right:1px solid var(--border); display:flex; flex-direction:column; background:#0A0B0C; }
.crm-sidebar-header { padding:16px 16px 12px; border-bottom:1px solid var(--border); }
.crm-nav-item { display:flex; align-items:center; gap:10px; padding:9px 16px; cursor:pointer; font-family:${BARLOW}; font-size:13px; font-weight:700; letter-spacing:.04em; color:var(--text-dim); border-left:2px solid transparent; transition:all .12s; text-transform:uppercase; }
.crm-nav-item:hover { background:rgba(200,146,42,.06); color:var(--text); }
.crm-nav-item.active { border-left-color:${GOLD}; color:${GOLD}; background:rgba(200,146,42,.08); }
.crm-nav-icon { font-size:14px; width:18px; text-align:center; }
.crm-main { flex:1; overflow-y:auto; display:flex; flex-direction:column; }
.crm-topbar { padding:14px 24px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:12px; flex-wrap:wrap; background:#0A0B0C; position:sticky; top:0; z-index:10; }
.crm-search { background:var(--bg2); border:1px solid var(--border); color:var(--text); font-family:${MONO}; font-size:12px; padding:8px 12px 8px 34px; outline:none; flex:1; min-width:200px; max-width:320px; transition:border-color .15s; }
.crm-search:focus { border-color:${GOLD}; }
.crm-search-wrap { position:relative; flex:1; max-width:320px; }
.crm-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:13px; pointer-events:none; }
.crm-select { background:var(--bg2); border:1px solid var(--border); color:var(--text); font-family:${MONO}; font-size:11px; padding:7px 10px; outline:none; cursor:pointer; }
.crm-select:focus { border-color:${GOLD}; }
.crm-btn { background:${GOLD}; color:#000; border:none; font-family:${BARLOW}; font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:8px 16px; cursor:pointer; transition:opacity .12s; white-space:nowrap; }
.crm-btn:hover { opacity:.85; }
.crm-btn:disabled { opacity:.4; cursor:not-allowed; }
.crm-btn-ghost { background:none; border:1px solid var(--border); color:var(--text-dim); font-family:${MONO}; font-size:11px; padding:7px 12px; cursor:pointer; transition:all .12s; }
.crm-btn-ghost:hover { border-color:${GOLD}; color:${GOLD}; }
.crm-btn-danger { background:#ef4444; color:#fff; border:none; font-family:${BARLOW}; font-size:11px; font-weight:700; padding:6px 12px; cursor:pointer; }
.crm-content { padding:24px; flex:1; }
.crm-card { background:var(--bg2); border:1px solid var(--border); padding:20px; margin-bottom:16px; }
.crm-table { width:100%; border-collapse:collapse; }
.crm-table th { font-family:${MONO}; font-size:9px; color:#64748b; letter-spacing:.1em; text-transform:uppercase; padding:10px 12px; border-bottom:1px solid var(--border); text-align:left; background:var(--bg2); position:sticky; top:0; z-index:1; white-space:nowrap; }
.crm-table td { padding:10px 12px; border-bottom:1px solid rgba(30,41,59,.4); vertical-align:middle; font-size:12px; }
.crm-table tr:hover td { background:rgba(200,146,42,.03); }
.crm-table tr.selected td { background:rgba(200,146,42,.07); }
.crm-badge { display:inline-block; font-family:${MONO}; font-size:9px; font-weight:700; letter-spacing:.06em; padding:2px 7px; text-transform:uppercase; border-radius:2px; }
.crm-avatar { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:${BEBAS}; font-size:13px; flex-shrink:0; }
.crm-input { background:var(--bg2); border:1px solid var(--border); color:var(--text); font-family:${MONO}; font-size:12px; padding:9px 12px; outline:none; width:100%; box-sizing:border-box; transition:border-color .15s; }
.crm-input:focus { border-color:${GOLD}; }
.crm-textarea { background:var(--bg2); border:1px solid var(--border); color:var(--text); font-family:${MONO}; font-size:12px; padding:10px 12px; outline:none; width:100%; box-sizing:border-box; resize:vertical; transition:border-color .15s; line-height:1.6; }
.crm-textarea:focus { border-color:${GOLD}; }
.crm-label { font-family:${MONO}; font-size:10px; color:var(--text-dim); letter-spacing:.08em; text-transform:uppercase; display:block; margin-bottom:5px; }
.crm-checkbox { width:15px; height:15px; accent-color:${GOLD}; cursor:pointer; }
.crm-stat { background:var(--bg2); border:1px solid var(--border); padding:16px 20px; flex:1; min-width:120px; }
.crm-stat-val { font-family:${BEBAS}; font-size:2rem; color:${GOLD}; line-height:1; }
.crm-stat-label { font-family:${MONO}; font-size:9px; color:#6b7280; margin-top:2px; text-transform:uppercase; letter-spacing:.06em; }
.email-preview { background:#09090B; border:1px solid var(--border); border-radius:4px; overflow:hidden; }
.email-preview iframe { width:100%; height:520px; border:none; background:#fff; }
.crm-tab { background:none; border:none; border-bottom:2px solid transparent; font-family:${BARLOW}; font-size:13px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; padding:9px 16px; cursor:pointer; color:var(--text-dim); transition:all .12s; white-space:nowrap; }
.crm-tab.active { color:${GOLD}; border-bottom-color:${GOLD}; }
.crm-tab:hover:not(.active) { color:var(--text); }
.dedup-row { background:rgba(239,68,68,.06); border-left:3px solid #ef4444; }
.template-card { background:var(--bg2); border:1px solid var(--border); padding:16px; cursor:pointer; transition:all .15s; }
.template-card:hover, .template-card.selected { border-color:${GOLD}; background:rgba(200,146,42,.06); }
.compose-field { margin-bottom:16px; }
`

export default function OutreachCRM({ adminKey }) {
  const H = { 'x-admin-key': adminKey, 'Content-Type': 'application/json' }
  const [view, setView] = useState('contacts')

  // ── Contacts state ─────────────────────────────────────────────────────────
  const [contacts, setContacts]       = useState([])
  const [loadingC, setLoadingC]       = useState(false)
  const [search, setSearch]           = useState('')
  const [filterType, setFilterType]   = useState('')
  const [filterStatus, setFilterStatus] = useState('active')
  const [filterState, setFilterState] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [dupGroups, setDupGroups]     = useState([])
  const [editContact, setEditContact] = useState(null)

  // ── Queue state ────────────────────────────────────────────────────────────
  const [queue, setQueue]     = useState([])
  const [queueStats, setQueueStats] = useState({})
  const [queueTab, setQueueTab] = useState('draft')
  const [loadingQ, setLoadingQ] = useState(false)

  // ── Compose state ─────────────────────────────────────────────────────────
  const [tplId, setTplId]         = useState('intro-youtuber')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailGreeting, setEmailGreeting] = useState('')
  const [emailBody, setEmailBody]   = useState('')
  const [emailCTA, setEmailCTA]     = useState('')
  const [emailCTAUrl, setEmailCTAUrl] = useState('')
  const [previewContact, setPreviewContact] = useState(null)
  const [sending, setSending]       = useState(false)
  const [sendResult, setSendResult] = useState(null)

  // ── History state ─────────────────────────────────────────────────────────
  const [history, setHistory] = useState([])
  const [loadingH, setLoadingH] = useState(false)

  // Load template into compose fields
  useEffect(() => {
    const t = EMAIL_TEMPLATES.find(t => t.id === tplId)
    if (t) {
      setEmailSubject(t.subject)
      setEmailGreeting(t.greeting)
      setEmailBody(t.body)
      setEmailCTA(t.ctaText || '')
      setEmailCTAUrl(t.ctaUrl || '')
    }
  }, [tplId])

  // Load contacts
  const loadContacts = useCallback(async () => {
    setLoadingC(true)
    try {
      const params = new URLSearchParams({ limit: '500' })
      if (filterType)   params.set('type', filterType)
      if (filterStatus) params.set('status', filterStatus)
      if (filterState)  params.set('state', filterState)
      if (search)       params.set('search', search)
      const res = await fetch('/api/outreach/contacts?' + params, { headers: H })
      const d = await res.json()
      setContacts(d.contacts || [])

      // Detect duplicates by email
      const emailMap = {}
      for (const c of (d.contacts || [])) {
        if (c.email) {
          const key = c.email.toLowerCase().trim()
          if (!emailMap[key]) emailMap[key] = []
          emailMap[key].push(c)
        }
      }
      setDupGroups(Object.values(emailMap).filter(g => g.length > 1))
    } catch(e) { console.error(e) }
    setLoadingC(false)
  }, [filterType, filterStatus, filterState, search, adminKey])

  useEffect(() => { if (view === 'contacts' || view === 'duplicates') loadContacts() }, [view, filterType, filterStatus, filterState])

  // Load queue
  const loadQueue = useCallback(async () => {
    setLoadingQ(true)
    try {
      const res = await fetch(`/api/outreach/queue?status=${queueTab}&limit=100`, { headers: H })
      const d = await res.json()
      setQueue(d.entries || [])
      setQueueStats(d.stats || {})
    } catch(e) {}
    setLoadingQ(false)
  }, [queueTab, adminKey])

  useEffect(() => { if (view === 'queue') loadQueue() }, [view, queueTab])

  // Load history
  const loadHistory = useCallback(async () => {
    setLoadingH(true)
    try {
      const res = await fetch('/api/outreach/history?limit=100', { headers: H })
      const d = await res.json()
      setHistory(d.history || d.entries || [])
    } catch(e) {}
    setLoadingH(false)
  }, [adminKey])

  useEffect(() => { if (view === 'history') loadHistory() }, [view])

  // ── Preview HTML ──────────────────────────────────────────────────────────
  const previewHTML = buildEmailHTML({
    subject:  emailSubject,
    greeting: emailGreeting,
    body:     emailBody,
    ctaText:  emailCTA,
    ctaUrl:   emailCTAUrl,
    contactName: previewContact?.name || previewContact?.firstName || 'John Smith',
    senderName: 'DJ Cavalcanti',
  })

  // ── Send emails to selected contacts ─────────────────────────────────────
  const sendToSelected = async () => {
    if (!selectedIds.size) return
    setSending(true)
    setSendResult(null)
    const selectedContacts = contacts.filter(c => selectedIds.has(c._id) && c.email)
    let sent = 0, failed = 0

    for (const contact of selectedContacts) {
      const html = buildEmailHTML({
        subject: emailSubject, greeting: emailGreeting,
        body: emailBody, ctaText: emailCTA, ctaUrl: emailCTAUrl,
        contactName: contact.firstName || contact.name,
      }).replace('{{unsubscribeUrl}}', `https://downrangeco.com/api/outreach/unsubscribe?email=${encodeURIComponent(contact.email)}`)

      const subj = emailSubject
        .replace('{{firstName}}', contact.firstName || contact.name?.split(' ')[0] || '')
        .replace('{{businessName}}', contact.name || '')
        .replace('{{topic}}', contact.specialties?.[0] || 'firearms')

      try {
        const res = await fetch('/api/outreach/send/direct', {
          method: 'POST',
          headers: H,
          body: JSON.stringify({ contactId: contact._id, subject: subj, html, toEmail: contact.email, toName: contact.name })
        })
        const data = await res.json()
        if (data.ok || res.ok) sent++
        else failed++
      } catch { failed++ }
    }

    setSendResult({ sent, failed })
    setSending(false)
    selectedIds.forEach(_ => {}) // trigger re-render
    setSelectedIds(new Set())
  }

  // ── Generate drafts for selected contacts ─────────────────────────────────
  const generateDrafts = async () => {
    if (!selectedIds.size) return
    setSending(true)
    try {
      const res = await fetch('/api/outreach/queue', {
        method: 'POST',
        headers: H,
        body: JSON.stringify({ action: 'generate', contactIds: [...selectedIds], limit: selectedIds.size })
      })
      const d = await res.json()
      setSendResult({ drafts: d.created || 0, message: `${d.created} drafts created in queue` })
    } catch(e) { setSendResult({ error: e.message }) }
    setSending(false)
    setSelectedIds(new Set())
  }

  // ── Approve queue item ────────────────────────────────────────────────────
  const approveItems = async (ids) => {
    try {
      await fetch('/api/outreach/queue', {
        method: 'POST',
        headers: H,
        body: JSON.stringify({ action: 'approve', ids })
      })
      loadQueue()
    } catch(e) {}
  }

  // ── Skip queue item ───────────────────────────────────────────────────────
  const skipItem = async (id) => {
    await fetch('/api/outreach/queue', {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ action: 'skip', ids: [id] })
    })
    loadQueue()
  }

  // ── Delete duplicate ──────────────────────────────────────────────────────
  const deleteDuplicate = async (id) => {
    await fetch('/api/outreach/contacts', {
      method: 'DELETE',
      headers: H,
      body: JSON.stringify({ id })
    })
    loadContacts()
  }

  // ── Stats across contact list ─────────────────────────────────────────────
  const stats = {
    total:       contacts.length,
    withEmail:   contacts.filter(c => c.email).length,
    contacted:   contacts.filter(c => c.lastContactedAt).length,
    neverTouched:contacts.filter(c => !c.lastContactedAt).length,
  }

  // ── Toggle select ─────────────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const selectAll = () => {
    if (selectedIds.size === contacts.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(contacts.map(c => c._id)))
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="crm-wrap">

        {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
        <div className="crm-sidebar">
          <div className="crm-sidebar-header">
            <div style={{ fontFamily:BEBAS, fontSize:'1.2rem', color:GOLD, letterSpacing:'.08em' }}>OUTREACH CRM</div>
            <div style={{ fontFamily:MONO, fontSize:9, color:'#374151', marginTop:2 }}>DownRange Intelligence</div>
          </div>

          {[
            { id:'contacts',   icon:'👥', label:'Contacts',         badge: contacts.length || null },
            { id:'compose',    icon:'✍',  label:'Compose & Send',   badge: null },
            { id:'queue',      icon:'📬', label:'Approval Queue',   badge: queueStats.draft || null },
            { id:'history',    icon:'📜', label:'Send History',     badge: null },
            { id:'duplicates', icon:'⚠',  label:'Duplicates',       badge: dupGroups.length || null },
            { id:'templates',  icon:'📋', label:'Templates',        badge: null },
          ].map(item => (
            <div key={item.id} className={`crm-nav-item${view === item.id ? ' active' : ''}`}
              onClick={() => setView(item.id)}>
              <span className="crm-nav-icon">{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
              {item.badge ? (
                <span style={{ background:GOLD, color:'#000', fontFamily:MONO, fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:2 }}>{item.badge}</span>
              ) : null}
            </div>
          ))}

          <div style={{ flex:1 }} />

          {/* Quick seeds */}
          <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)' }}>
            <div style={{ fontFamily:MONO, fontSize:9, color:'#374151', letterSpacing:'.08em', marginBottom:8, textTransform:'uppercase' }}>Seed Contacts</div>
            {[
              { url:'/api/outreach/manufacturers', label:'70+ Manufacturers' },
              { url:'/api/outreach/dealers',       label:'30+ Dealers' },
              { url:'/api/outreach/holsters',      label:'40+ Holster Cos' },
            ].map(s => (
              <button key={s.url} className="crm-btn-ghost"
                style={{ width:'100%', marginBottom:4, textAlign:'left', fontSize:10, padding:'5px 10px' }}
                onClick={async () => {
                  await fetch(s.url, { method:'POST', headers:H })
                  loadContacts()
                }}>
                + {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── MAIN ─────────────────────────────────────────────────────── */}
        <div className="crm-main">

          {/* ── CONTACTS VIEW ─────────────────────────────────────────── */}
          {view === 'contacts' && (
            <>
              {/* Stats row */}
              <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--border)', display:'flex', gap:12, flexWrap:'wrap', background:'rgba(0,0,0,.2)' }}>
                {[
                  { val:stats.total,        label:'Total Contacts' },
                  { val:stats.withEmail,    label:'Have Email' },
                  { val:stats.contacted,    label:'Contacted' },
                  { val:stats.neverTouched, label:'Never Touched', color:'#f59e0b' },
                  { val:dupGroups.length,   label:'Duplicates', color: dupGroups.length > 0 ? '#ef4444' : '#22c55e' },
                ].map(s => (
                  <div key={s.label} className="crm-stat">
                    <div className="crm-stat-val" style={{ color: s.color || GOLD }}>{s.val}</div>
                    <div className="crm-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Toolbar */}
              <div className="crm-topbar">
                <div className="crm-search-wrap">
                  <span className="crm-search-icon">⌕</span>
                  <input className="crm-search" placeholder="Search name, email, city…"
                    value={search} onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadContacts()} />
                </div>
                <select className="crm-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="">All Types</option>
                  {Object.entries(TYPE_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select className="crm-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">All Status</option>
                  {Object.entries(STATUS_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <input className="crm-input" style={{ width:80 }} placeholder="State" value={filterState} onChange={e => setFilterState(e.target.value)} />
                <button className="crm-btn" onClick={loadContacts}>Search</button>

                {selectedIds.size > 0 && (
                  <>
                    <div style={{ fontFamily:MONO, fontSize:11, color:GOLD, padding:'0 4px' }}>{selectedIds.size} selected</div>
                    <button className="crm-btn" onClick={() => { setView('compose'); setPreviewContact(contacts.find(c => selectedIds.has(c._id))) }}>
                      ✉ Compose Email
                    </button>
                    <button className="crm-btn-ghost" onClick={generateDrafts} disabled={sending}>
                      📬 Queue Drafts
                    </button>
                  </>
                )}
              </div>

              {/* Table */}
              <div style={{ overflow:'auto', flex:1 }}>
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th><input type="checkbox" className="crm-checkbox" checked={selectedIds.size === contacts.length && contacts.length > 0} onChange={selectAll} /></th>
                      <th>Contact</th>
                      <th>Type</th>
                      <th>Email</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Last Contact</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingC ? (
                      <tr><td colSpan={8} style={{ textAlign:'center', padding:40, fontFamily:MONO, fontSize:11, color:'#4b5563' }}>Loading contacts…</td></tr>
                    ) : contacts.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign:'center', padding:40, fontFamily:MONO, fontSize:11, color:'#4b5563' }}>No contacts found. Use seeds in sidebar.</td></tr>
                    ) : contacts.map(c => {
                      const tm = TYPE_META[c.type] || TYPE_META.other
                      const sm = STATUS_META[c.status] || STATUS_META.active
                      const initials = (c.name || '?').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
                      const isDup = dupGroups.some(g => g.find(x => x._id === c._id))
                      return (
                        <tr key={c._id} className={`${selectedIds.has(c._id) ? 'selected' : ''}`}>
                          <td><input type="checkbox" className="crm-checkbox" checked={selectedIds.has(c._id)} onChange={() => toggleSelect(c._id)} /></td>
                          <td>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <div className="crm-avatar" style={{ background: tm.color + '22', color: tm.color }}>
                                {initials}
                              </div>
                              <div>
                                <div style={{ fontFamily:BARLOW, fontSize:13, fontWeight:700, color:'var(--text)' }}>
                                  {c.name}
                                  {isDup && <span style={{ marginLeft:6, fontFamily:MONO, fontSize:8, color:'#ef4444', padding:'1px 5px', border:'1px solid #ef4444' }}>DUP</span>}
                                </div>
                                {c.firstName && c.firstName !== c.name && (
                                  <div style={{ fontFamily:MONO, fontSize:10, color:'#4b5563' }}>{c.firstName}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="crm-badge" style={{ background: tm.color + '22', color: tm.color }}>
                              {tm.icon} {tm.label}
                            </span>
                          </td>
                          <td>
                            {c.email ? (
                              <a href={'mailto:' + c.email} style={{ fontFamily:MONO, fontSize:11, color:GOLD, textDecoration:'none' }}>{c.email}</a>
                            ) : (
                              <span style={{ fontFamily:MONO, fontSize:10, color:'#374151' }}>—</span>
                            )}
                          </td>
                          <td style={{ fontFamily:MONO, fontSize:10, color:'#6b7280' }}>
                            {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                          </td>
                          <td>
                            <span className="crm-badge" style={{ background: sm.color + '22', color: sm.color }}>{sm.label}</span>
                          </td>
                          <td style={{ fontFamily:MONO, fontSize:10, color:'#6b7280' }}>
                            {c.lastContactedAt ? new Date(c.lastContactedAt).toLocaleDateString() : <span style={{ color:'#f59e0b' }}>Never</span>}
                          </td>
                          <td>
                            <div style={{ display:'flex', gap:6 }}>
                              {c.email && (
                                <button className="crm-btn-ghost" style={{ padding:'4px 8px', fontSize:10 }}
                                  onClick={() => { setSelectedIds(new Set([c._id])); setPreviewContact(c); setView('compose') }}>
                                  ✉
                                </button>
                              )}
                              {c.website && (
                                <a href={c.website} target="_blank" rel="noopener noreferrer">
                                  <button className="crm-btn-ghost" style={{ padding:'4px 8px', fontSize:10 }}>↗</button>
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── COMPOSE VIEW ──────────────────────────────────────────── */}
          {view === 'compose' && (
            <>
              <div className="crm-topbar">
                <div style={{ fontFamily:BEBAS, fontSize:'1.1rem', color:GOLD, letterSpacing:'.06em' }}>COMPOSE EMAIL</div>
                {selectedIds.size > 0 && (
                  <div style={{ fontFamily:MONO, fontSize:11, color:'#9ca3af' }}>
                    Sending to <span style={{ color:GOLD }}>{selectedIds.size} contacts</span>
                  </div>
                )}
                {sendResult && (
                  <div style={{ fontFamily:MONO, fontSize:11, color: sendResult.error ? '#ef4444' : '#22c55e', padding:'6px 12px', border:'1px solid', borderColor: sendResult.error ? '#ef4444' : '#22c55e', background: sendResult.error ? 'rgba(239,68,68,.08)' : 'rgba(34,197,94,.08)' }}>
                    {sendResult.error ? '❌ ' + sendResult.error : sendResult.drafts ? `📬 ${sendResult.drafts} drafts queued` : `✅ ${sendResult.sent} sent${sendResult.failed ? `, ${sendResult.failed} failed` : ''}`}
                  </div>
                )}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'380px 1fr', height:'100%', overflow:'hidden' }}>
                {/* Left: Compose form */}
                <div style={{ borderRight:'1px solid var(--border)', padding:'20px', overflowY:'auto' }}>

                  {/* Template picker */}
                  <div className="compose-field">
                    <label className="crm-label">Email Template</label>
                    <div style={{ display:'grid', gap:6 }}>
                      {EMAIL_TEMPLATES.map(t => {
                        const tm = TYPE_META[t.category] || TYPE_META.other
                        return (
                          <div key={t.id} className={`template-card${tplId === t.id ? ' selected' : ''}`}
                            onClick={() => setTplId(t.id)}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                              <div style={{ fontFamily:BARLOW, fontSize:12, fontWeight:700, color: tplId === t.id ? GOLD : 'var(--text)' }}>{t.name}</div>
                              <span className="crm-badge" style={{ background: tm.color + '22', color: tm.color, fontSize:8 }}>{tm.icon} {t.category}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="compose-field">
                    <label className="crm-label">Subject Line</label>
                    <input className="crm-input" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Subject…" />
                  </div>

                  {/* Greeting */}
                  <div className="compose-field">
                    <label className="crm-label">Greeting <span style={{ color:'#374151', fontSize:9 }}>use {'{{firstName}}'}</span></label>
                    <input className="crm-input" value={emailGreeting} onChange={e => setEmailGreeting(e.target.value)} />
                  </div>

                  {/* Body */}
                  <div className="compose-field">
                    <label className="crm-label">Email Body <span style={{ color:'#374151', fontSize:9 }}>{'{{firstName}} {{businessName}} {{topic}}'}</span></label>
                    <textarea className="crm-textarea" rows={10} value={emailBody} onChange={e => setEmailBody(e.target.value)} />
                  </div>

                  {/* CTA */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                    <div>
                      <label className="crm-label">CTA Button Text</label>
                      <input className="crm-input" value={emailCTA} onChange={e => setEmailCTA(e.target.value)} placeholder="Visit DownRange" />
                    </div>
                    <div>
                      <label className="crm-label">CTA URL</label>
                      <input className="crm-input" value={emailCTAUrl} onChange={e => setEmailCTAUrl(e.target.value)} placeholder="https://…" />
                    </div>
                  </div>

                  {/* Preview contact */}
                  <div className="compose-field">
                    <label className="crm-label">Preview As Contact</label>
                    <select className="crm-select" style={{ width:'100%' }}
                      value={previewContact?._id || ''}
                      onChange={e => setPreviewContact(contacts.find(c => c._id === e.target.value) || null)}>
                      <option value="">— Generic Preview —</option>
                      {contacts.filter(c => c.email).map(c => (
                        <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                      ))}
                    </select>
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {selectedIds.size > 0 ? (
                      <>
                        <button className="crm-btn" onClick={sendToSelected} disabled={sending} style={{ flex:1 }}>
                          {sending ? '⏳ Sending…' : `✉ Send to ${selectedIds.size} Contact${selectedIds.size > 1 ? 's' : ''}`}
                        </button>
                        <button className="crm-btn-ghost" onClick={generateDrafts} disabled={sending}>
                          📬 Queue for Approval
                        </button>
                      </>
                    ) : (
                      <div style={{ fontFamily:MONO, fontSize:11, color:'#4b5563', padding:'10px 0' }}>
                        ← Select contacts from the Contacts tab first
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Live preview */}
                <div style={{ overflowY:'auto', padding:'20px', background:'#050506' }}>
                  <div style={{ fontFamily:MONO, fontSize:10, color:'#374151', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:12 }}>
                    Live Email Preview — {previewContact?.name || 'Generic'}
                  </div>
                  <div style={{ background:'#fff', borderRadius:4, overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,.4)' }}>
                    <div style={{ background:'#f3f4f6', padding:'8px 16px', borderBottom:'1px solid #e5e7eb', display:'flex', gap:6, alignItems:'center' }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', background:'#ef4444' }} />
                      <div style={{ width:10, height:10, borderRadius:'50%', background:'#f59e0b' }} />
                      <div style={{ width:10, height:10, borderRadius:'50%', background:'#22c55e' }} />
                      <span style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', marginLeft:8 }}>
                        {emailSubject.replace('{{firstName}}', previewContact?.firstName || 'John').replace('{{businessName}}', previewContact?.name || 'Acme Arms') || 'Email Preview'}
                      </span>
                    </div>
                    <iframe
                      srcDoc={previewHTML}
                      style={{ width:'100%', height:'560px', border:'none' }}
                      title="Email Preview"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── QUEUE VIEW ────────────────────────────────────────────── */}
          {view === 'queue' && (
            <>
              <div className="crm-topbar">
                <div style={{ display:'flex', borderBottom:'none', gap:0 }}>
                  {['draft','approved','sent','skipped'].map(s => (
                    <button key={s} className={`crm-tab${queueTab === s ? ' active' : ''}`} onClick={() => setQueueTab(s)}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                      {queueStats[s] ? <span style={{ marginLeft:5, fontFamily:MONO, fontSize:9, color: queueTab===s ? GOLD : '#4b5563' }}>({queueStats[s]})</span> : null}
                    </button>
                  ))}
                </div>
                <div style={{ flex:1 }} />
                <button className="crm-btn" onClick={loadQueue}>↻ Refresh</button>
                {queueTab === 'draft' && queue.length > 0 && (
                  <button className="crm-btn" onClick={() => approveItems(queue.map(q => q._id))}>
                    ✅ Approve All ({queue.length})
                  </button>
                )}
              </div>

              <div style={{ overflow:'auto', flex:1 }}>
                {loadingQ ? (
                  <div style={{ textAlign:'center', padding:60, fontFamily:MONO, fontSize:11, color:'#4b5563' }}>Loading queue…</div>
                ) : queue.length === 0 ? (
                  <div style={{ textAlign:'center', padding:60, fontFamily:MONO, fontSize:11, color:'#4b5563' }}>No {queueTab} emails in queue.</div>
                ) : queue.map(entry => {
                  const contact = entry.contact
                  const tm = TYPE_META[contact?.type] || TYPE_META.other
                  return (
                    <div key={entry._id} style={{ borderBottom:'1px solid var(--border)', padding:'16px 24px', display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'start' }}>
                      <div>
                        {/* Contact info */}
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                          <div className="crm-avatar" style={{ background: tm.color + '22', color: tm.color, width:28, height:28, fontSize:11 }}>
                            {(contact?.name || '?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontFamily:BARLOW, fontSize:13, fontWeight:700, color:'var(--text)' }}>{contact?.name}</span>
                            <span style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', marginLeft:8 }}>{entry.toEmail}</span>
                          </div>
                          <span className="crm-badge" style={{ background: tm.color + '22', color: tm.color }}>{tm.icon} {tm.label}</span>
                        </div>

                        {/* Subject */}
                        <div style={{ fontFamily:MONO, fontSize:11, color:GOLD, marginBottom:6 }}>📧 {entry.subject}</div>

                        {/* Mini email preview */}
                        <div style={{ background:'#fff', borderRadius:3, overflow:'hidden', maxHeight:180, border:'1px solid #1f2428' }}>
                          <iframe srcDoc={entry.bodyHtml} style={{ width:'100%', height:180, border:'none', pointerEvents:'none' }} title="preview" />
                        </div>

                        <div style={{ fontFamily:MONO, fontSize:9, color:'#374151', marginTop:6 }}>
                          Drafted {entry.draftedAt ? new Date(entry.draftedAt).toLocaleString() : '—'}
                          {entry.campaign?.name && ` · Campaign: ${entry.campaign.name}`}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display:'flex', flexDirection:'column', gap:6, minWidth:120 }}>
                        {queueTab === 'draft' && (
                          <>
                            <button className="crm-btn" style={{ width:'100%' }} onClick={() => approveItems([entry._id])}>
                              ✅ Approve & Send
                            </button>
                            <button className="crm-btn-ghost" style={{ width:'100%', fontSize:10 }} onClick={() => skipItem(entry._id)}>
                              Skip
                            </button>
                          </>
                        )}
                        {queueTab === 'sent' && (
                          <div style={{ fontFamily:MONO, fontSize:9, color:'#22c55e', textAlign:'center' }}>
                            ✅ Sent<br />{entry.sentAt ? new Date(entry.sentAt).toLocaleDateString() : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* ── HISTORY VIEW ──────────────────────────────────────────── */}
          {view === 'history' && (
            <>
              <div className="crm-topbar">
                <div style={{ fontFamily:BEBAS, fontSize:'1.1rem', color:GOLD, letterSpacing:'.06em' }}>SEND HISTORY</div>
                <button className="crm-btn-ghost" onClick={loadHistory}>↻ Refresh</button>
              </div>

              <div style={{ overflow:'auto', flex:1 }}>
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Contact</th>
                      <th>Subject</th>
                      <th>Sent</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingH ? (
                      <tr><td colSpan={5} style={{ textAlign:'center', padding:40, fontFamily:MONO, fontSize:11, color:'#4b5563' }}>Loading…</td></tr>
                    ) : history.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign:'center', padding:40, fontFamily:MONO, fontSize:11, color:'#4b5563' }}>No send history yet.</td></tr>
                    ) : history.map(h => {
                      const tm = TYPE_META[h.contact?.type] || TYPE_META.other
                      return (
                        <tr key={h._id}>
                          <td>
                            <div style={{ fontFamily:BARLOW, fontSize:13, fontWeight:700 }}>{h.toName || h.contact?.name}</div>
                            <div style={{ fontFamily:MONO, fontSize:10, color:'#4b5563' }}>{h.toEmail}</div>
                          </td>
                          <td style={{ fontFamily:MONO, fontSize:11, maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {h.subject}
                          </td>
                          <td style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', whiteSpace:'nowrap' }}>
                            {h.sentAt ? new Date(h.sentAt).toLocaleString() : '—'}
                          </td>
                          <td>
                            <span className="crm-badge" style={{ background: tm.color + '22', color: tm.color }}>{tm.icon} {tm.label}</span>
                          </td>
                          <td>
                            <span className="crm-badge" style={{ background:'rgba(34,197,94,.12)', color:'#22c55e' }}>Sent</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── DUPLICATES VIEW ───────────────────────────────────────── */}
          {view === 'duplicates' && (
            <>
              <div className="crm-topbar">
                <div style={{ fontFamily:BEBAS, fontSize:'1.1rem', color:'#ef4444', letterSpacing:'.06em' }}>
                  ⚠ DUPLICATE CONTACTS
                </div>
                <div style={{ fontFamily:MONO, fontSize:11, color:'#6b7280' }}>
                  {dupGroups.length} duplicate email{dupGroups.length !== 1 ? 's' : ''} detected across {dupGroups.reduce((a, g) => a + g.length, 0)} contacts
                </div>
                <button className="crm-btn-ghost" onClick={loadContacts}>↻ Rescan</button>
              </div>

              <div style={{ padding:'20px 24px', overflow:'auto', flex:1 }}>
                {dupGroups.length === 0 ? (
                  <div style={{ textAlign:'center', padding:60, fontFamily:MONO, fontSize:12, color:'#22c55e' }}>
                    ✅ No duplicates found in your contact database.
                  </div>
                ) : dupGroups.map((group, gi) => (
                  <div key={gi} style={{ marginBottom:20, border:'1px solid rgba(239,68,68,.3)', background:'rgba(239,68,68,.04)' }}>
                    <div style={{ padding:'8px 16px', background:'rgba(239,68,68,.1)', borderBottom:'1px solid rgba(239,68,68,.2)', fontFamily:MONO, fontSize:10, color:'#ef4444', letterSpacing:'.06em' }}>
                      DUPLICATE EMAIL: {group[0]?.email}  ·  {group.length} records
                    </div>
                    <table className="crm-table" style={{ background:'transparent' }}>
                      <thead>
                        <tr>
                          <th>Name</th><th>Type</th><th>Location</th><th>Added</th><th>Last Contacted</th><th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.map((c, ci) => {
                          const tm = TYPE_META[c.type] || TYPE_META.other
                          return (
                            <tr key={c._id}>
                              <td>
                                <div style={{ fontFamily:BARLOW, fontSize:13, fontWeight:700 }}>
                                  {c.name}
                                  {ci === 0 && <span style={{ marginLeft:6, fontFamily:MONO, fontSize:8, color:'#22c55e', border:'1px solid #22c55e', padding:'1px 5px' }}>KEEP</span>}
                                </div>
                              </td>
                              <td><span className="crm-badge" style={{ background: tm.color + '22', color: tm.color }}>{tm.label}</span></td>
                              <td style={{ fontFamily:MONO, fontSize:10, color:'#6b7280' }}>{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
                              <td style={{ fontFamily:MONO, fontSize:10, color:'#4b5563' }}>{c.addedAt ? new Date(c.addedAt).toLocaleDateString() : '—'}</td>
                              <td style={{ fontFamily:MONO, fontSize:10, color: c.lastContactedAt ? '#22c55e' : '#4b5563' }}>
                                {c.lastContactedAt ? new Date(c.lastContactedAt).toLocaleDateString() : 'Never'}
                              </td>
                              <td>
                                {ci > 0 && (
                                  <button className="crm-btn-danger" style={{ fontSize:9, padding:'4px 8px' }}
                                    onClick={() => { if(window.confirm('Delete this duplicate?')) deleteDuplicate(c._id) }}>
                                    Delete Duplicate
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── TEMPLATES VIEW ────────────────────────────────────────── */}
          {view === 'templates' && (
            <>
              <div className="crm-topbar">
                <div style={{ fontFamily:BEBAS, fontSize:'1.1rem', color:GOLD, letterSpacing:'.06em' }}>EMAIL TEMPLATES</div>
                <div style={{ fontFamily:MONO, fontSize:11, color:'#6b7280' }}>{EMAIL_TEMPLATES.length} templates · Click to preview · Edit in Compose</div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', height:'100%', overflow:'hidden' }}>
                {/* Template list */}
                <div style={{ borderRight:'1px solid var(--border)', overflow:'auto', padding:'16px' }}>
                  {EMAIL_TEMPLATES.map(t => {
                    const tm = TYPE_META[t.category] || TYPE_META.other
                    return (
                      <div key={t.id} className={`template-card${tplId === t.id ? ' selected' : ''}`}
                        style={{ marginBottom:8 }} onClick={() => setTplId(t.id)}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                          <div style={{ fontFamily:BARLOW, fontSize:13, fontWeight:700, color: tplId === t.id ? GOLD : 'var(--text)' }}>{t.name}</div>
                          <span className="crm-badge" style={{ background: tm.color + '22', color: tm.color, fontSize:8 }}>{tm.icon}</span>
                        </div>
                        <div style={{ fontFamily:MONO, fontSize:10, color:'#4b5563', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {t.subject}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Template preview */}
                <div style={{ overflow:'auto', padding:'20px', background:'#050506' }}>
                  {(() => {
                    const t = EMAIL_TEMPLATES.find(x => x.id === tplId)
                    if (!t) return null
                    const html = buildEmailHTML({
                      subject: t.subject, greeting: t.greeting, body: t.body,
                      ctaText: t.ctaText, ctaUrl: t.ctaUrl,
                      contactName: 'John Smith',
                    })
                    return (
                      <>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                          <div>
                            <div style={{ fontFamily:BEBAS, fontSize:'1.1rem', color:GOLD }}>{t.name}</div>
                            <div style={{ fontFamily:MONO, fontSize:10, color:'#4b5563' }}>Subject: {t.subject}</div>
                          </div>
                          <button className="crm-btn" onClick={() => { setView('compose') }}>
                            ✍ Use This Template
                          </button>
                        </div>
                        <div style={{ background:'#fff', borderRadius:4, overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,.4)' }}>
                          <div style={{ background:'#f3f4f6', padding:'8px 16px', borderBottom:'1px solid #e5e7eb', display:'flex', gap:6, alignItems:'center' }}>
                            <div style={{ width:10, height:10, borderRadius:'50%', background:'#ef4444' }} />
                            <div style={{ width:10, height:10, borderRadius:'50%', background:'#f59e0b' }} />
                            <div style={{ width:10, height:10, borderRadius:'50%', background:'#22c55e' }} />
                            <span style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', marginLeft:8 }}>{t.subject}</span>
                          </div>
                          <iframe srcDoc={html} style={{ width:'100%', height:'580px', border:'none' }} title="template-preview" />
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  )
}
