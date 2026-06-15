// components/admin/MailingListManager.js
'use client'

import { useState, useEffect, useCallback } from 'react'

const S = `
.ml-container{display:flex;flex-direction:column;gap:20px;font-family:'IBM Plex Mono',monospace;color:var(--text)}
.ml-header{display:flex;justify-content:space-between;align-items:center;gap:20px;border-bottom:2px solid var(--gold);padding-bottom:16px}
.ml-header h3{margin:0;font-size:20px;color:var(--text);font-weight:700}
.ml-stats{display:flex;gap:16px;flex-wrap:wrap}
.ml-stat{display:flex;flex-direction:column;align-items:center;padding:10px 16px;background:rgba(200,146,42,.1);border:1px solid var(--gold);border-radius:4px;min-width:100px}
.ml-stat .label{font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.05em}
.ml-stat .value{font-size:24px;font-weight:700;color:var(--gold);margin-top:4px}
.ml-stat .value.green{color:#22c55e}
.ml-stat .value.red{color:#ef4444}
.ml-toolbar{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.ml-search{flex:1;min-width:200px;background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:10px 12px;font-family:'IBM Plex Mono',monospace;font-size:12px;outline:none}
.ml-search:focus{border-color:var(--gold)}
.ml-select{background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:10px 12px;font-family:'IBM Plex Mono',monospace;font-size:12px;outline:none;cursor:pointer}
.ml-select:focus{border-color:var(--gold)}
.ml-btn{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;padding:10px 16px;cursor:pointer;text-transform:uppercase;letter-spacing:.06em;transition:opacity .15s}
.ml-btn:hover{opacity:.85}
.ml-btn:disabled{opacity:.4;cursor:not-allowed}
.ml-btn-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);padding:8px 12px;font-size:11px;cursor:pointer;transition:all .15s}
.ml-btn-ghost:hover{border-color:var(--gold);color:var(--gold)}
.ml-btn-danger{border-color:#ef4444;color:#ef4444}
.ml-btn-danger:hover{background:rgba(239,68,68,.1)}
.ml-alert{padding:12px 16px;border-radius:4px;font-size:12px;border:1px solid;margin-bottom:12px}
.ml-alert.error{background:rgba(239,68,68,.1);border-color:#ef4444;color:#fca5a5}
.ml-alert.success{background:rgba(34,197,94,.1);border-color:#22c55e;color:#86efac}
.ml-add-form{background:rgba(200,146,42,.05);border:1px solid var(--gold);padding:16px;border-radius:4px;display:flex;flex-direction:column;gap:12px}
.ml-form-group{display:flex;flex-direction:column;gap:6px}
.ml-form-group label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-dim)}
.ml-input,.ml-textarea{background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:10px 12px;font-family:'IBM Plex Mono',monospace;font-size:12px;outline:none;width:100%;box-sizing:border-box}
.ml-input:focus,.ml-textarea:focus{border-color:var(--gold)}
.ml-textarea{resize:vertical;min-height:60px}
.ml-form-actions{display:flex;gap:12px;justify-content:flex-end}
.ml-bulk{display:flex;gap:12px;align-items:center;padding:12px;background:rgba(200,146,42,.05);border:1px solid var(--gold);border-radius:4px;flex-wrap:wrap;font-size:12px}
.ml-bulk > span{color:var(--gold);font-weight:700;flex:0 0 auto}
.ml-bulk .ml-btn{padding:6px 12px;font-size:11px}
.ml-table-wrapper{overflow-x:auto;border:1px solid var(--border);border-radius:4px}
.ml-table{width:100%;border-collapse:collapse;font-size:12px}
.ml-table thead{background:var(--bg2);border-bottom:2px solid var(--border)}
.ml-table th{padding:12px;text-align:left;font-weight:700;color:var(--gold);text-transform:uppercase;font-size:10px;letter-spacing:.05em}
.ml-table tbody tr{border-bottom:1px solid var(--border);transition:background .15s}
.ml-table tbody tr:hover{background:rgba(200,146,42,.05)}
.ml-table tbody tr.selected{background:rgba(200,146,42,.1)}
.ml-table td{padding:12px}
.ml-checkbox{cursor:pointer;accent-color:var(--gold)}
.ml-email{font-weight:700;color:var(--text)}
.ml-status{display:inline-block;padding:4px 8px;border-radius:2px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.ml-status.active{background:rgba(34,197,94,.2);color:#22c55e}
.ml-status.unsubscribed{background:rgba(156,163,175,.2);color:#d1d5db}
.ml-status.bounced{background:rgba(239,68,68,.2);color:#ef4444}
.ml-status.complained{background:rgba(239,68,68,.2);color:#ef4444}
.ml-date{color:var(--text-dim);font-size:11px}
.ml-notes{color:var(--text-dim);font-size:11px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ml-actions{text-align:center}
.ml-loading{padding:40px;text-align:center;color:var(--text-dim);font-size:14px}
.ml-empty{padding:40px;text-align:center;color:var(--text-dim);font-size:14px}
.ml-pagination{display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;padding-top:16px;border-top:1px solid var(--border);font-size:12px}
.ml-pagination .ml-btn{padding:6px 12px;font-size:11px}
.ml-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:1000}
.ml-modal{background:var(--bg);border:1px solid var(--border);border-radius:8px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 10px 40px rgba(0,0,0,.5)}
.ml-modal-header{display:flex;justify-content:space-between;align-items:center;padding:20px;border-bottom:1px solid var(--border);gap:16px}
.ml-modal-header h3{margin:0;font-size:16px;font-weight:700;color:var(--text)}
.ml-modal-close{background:none;border:none;color:var(--text-dim);font-size:20px;cursor:pointer;padding:0;width:24px;height:24px;display:flex;align-items:center;justify-content:center}
.ml-modal-close:hover{color:var(--text)}
.ml-modal-content{padding:20px}
.ml-modal-actions{display:flex;gap:12px;justify-content:flex-end;padding:20px;border-top:1px solid var(--border);margin-top:16px}
.ml-modal-actions .ml-btn{margin:0;flex:1}
.ml-schedule-card{display:flex;justify-content:space-between;align-items:center;padding:16px;background:rgba(200,146,42,.08);border:1px solid var(--gold);border-radius:4px;margin-bottom:16px}
.ml-schedule-info{flex:1}
.ml-schedule-days{font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px;text-transform:capitalize}
.ml-schedule-time{font-size:12px;color:var(--text-dim)}
.ml-schedule-status{font-size:11px;color:var(--gold);text-transform:uppercase;margin-top:4px;letter-spacing:.05em}
.ml-days-group{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px}
.ml-day-btn{padding:8px 12px;background:var(--bg3);border:1px solid var(--border);color:var(--text);font-size:12px;cursor:pointer;border-radius:4px;transition:all .2s;text-transform:capitalize}
.ml-day-btn.active{background:var(--gold);color:#000;border-color:var(--gold);font-weight:700}
.ml-day-btn:hover{border-color:var(--gold)}
.ml-time-group{display:flex;gap:12px;align-items:flex-end}
.ml-time-field{flex:1}
.ml-time-field label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-dim);margin-bottom:6px}
.ml-time-field input{background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:8px 10px;border-radius:4px;width:100%;font-family:'IBM Plex Mono',monospace;font-size:12px}
.ml-time-field input:focus{border-color:var(--gold)}
`

export default function MailingListManager({ adminKey }) {
  const [subscribers, setSubscribers] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, unsubscribed: 0, bounced: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [limit, setLimit] = useState(50)
  const [totalPages, setTotalPages] = useState(1)
  const [sort, setSort] = useState('subscribedAt')
  const [order, setOrder] = useState('desc')

  const [selectedIds, setSelectedIds] = useState(new Set())
  const [selectAll, setSelectAll] = useState(false)

  const [showAddForm, setShowAddForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newNotes, setNewNotes] = useState('')

  const [showTestEmail, setShowTestEmail] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testLoading, setTestLoading] = useState(false)

  const [showNewsletterSend, setShowNewsletterSend] = useState(false)
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [testNewsletterLoading, setTestNewsletterLoading] = useState(false)
  const [testNewsletterEmail, setTestNewsletterEmail] = useState('')

  // Schedule management
  const [schedule, setSchedule] = useState(null)
  const [scheduleLoading, setScheduleLoading] = useState(true)
  const [showScheduleEditor, setShowScheduleEditor] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null) // For test newsletters

  const fetchSubscribers = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        page,
        limit,
        sort,
        order,
      })

      const res = await fetch(`/api/admin/subscribers?${params}`, {
        headers: { 'x-admin-key': adminKey },
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(`${res.status}: ${errorData.error || errorData.message || 'Failed to fetch'}`)
      }

      const data = await res.json()
      console.log('[MailingListManager] API response:', {
        subscribersCount: data.subscribers?.length,
        stats: data.stats,
        totalPages: data.totalPages,
        firstSubscriber: data.subscribers?.[0],
      })
      setSubscribers(data.subscribers)
      setStats(data.stats)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error('[MailingListManager] Error:', err)
      setError(err.message || 'Failed to fetch subscribers')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page, limit, sort, order, adminKey])

  const loadSchedule = useCallback(async () => {
    try {
      setScheduleLoading(true)
      const res = await fetch('/api/admin/newsletter-schedule', {
        headers: { 'x-admin-key': adminKey },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch schedule')
      }

      const data = await res.json()
      setSchedule(data)
      setEditingSchedule(data)
      console.log('[MailingListManager] Schedule loaded:', data)
    } catch (err) {
      console.error('[MailingListManager] Schedule error:', err)
      setError('Failed to load schedule: ' + err.message)
    } finally {
      setScheduleLoading(false)
    }
  }, [adminKey])

  const handleUpdateSchedule = async () => {
    if (!editingSchedule || !editingSchedule.days || editingSchedule.days.length === 0) {
      setError('Select at least one day')
      return
    }

    try {
      const res = await fetch('/api/admin/newsletter-schedule', {
        method: 'PATCH',
        headers: {
          'x-admin-key': adminKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: editingSchedule.enabled,
          days: editingSchedule.days,
          hour: editingSchedule.hour,
          minute: editingSchedule.minute,
          notes: editingSchedule.notes,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      const updated = await res.json()
      setSchedule(updated)
      setShowScheduleEditor(false)
      setSuccess('Schedule updated!')
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    fetchSubscribers()
    loadSchedule()
  }, [fetchSubscribers, loadSchedule])

  const handleDelete = async (id) => {
    if (!confirm('Delete this subscriber?')) return

    try {
      const res = await fetch(`/api/admin/subscribers?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      })

      if (!res.ok) throw new Error('Failed to delete')

      setSubscribers(subscribers.filter((s) => s._id !== id))
      setSuccess('Subscriber deleted')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} subscriber(s)?`)) return

    try {
      setLoading(true)
      for (const id of selectedIds) {
        await fetch(`/api/admin/subscribers?id=${id}`, {
          method: 'DELETE',
          headers: { 'x-admin-key': adminKey },
        })
      }
      setSelectedIds(new Set())
      setSelectAll(false)
      setSuccess(`Deleted ${selectedIds.size} subscriber(s)`)
      setTimeout(() => setSuccess(''), 3000)
      fetchSubscribers()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleBulkStatusChange = async (newStatus) => {
    try {
      setLoading(true)
      for (const id of selectedIds) {
        await fetch(`/api/admin/subscribers`, {
          method: 'PATCH',
          headers: {
            'x-admin-key': adminKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id, status: newStatus }),
        })
      }
      setSelectedIds(new Set())
      setSelectAll(false)
      setSuccess(`Updated ${selectedIds.size} subscriber(s)`)
      setTimeout(() => setSuccess(''), 3000)
      fetchSubscribers()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAddSubscriber = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'POST',
        headers: {
          'x-admin-key': adminKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newEmail, source: 'admin', notes: newNotes }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add')
      }

      setNewEmail('')
      setNewNotes('')
      setShowAddForm(false)
      setSuccess('Subscriber added')
      setTimeout(() => setSuccess(''), 3000)
      fetchSubscribers()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSendTestEmail = async (e) => {
    e.preventDefault()
    if (!testEmail) {
      setError('Email required')
      return
    }

    try {
      setTestLoading(true)
      const res = await fetch('/api/newsletter/test', {
        method: 'POST',
        headers: {
          'x-admin-key': adminKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: testEmail }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send')
      }

      setTestEmail('')
      setShowTestEmail(false)
      setSuccess('Test welcome email sent to ' + testEmail)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setTestLoading(false)
    }
  }

  const handleSendTestNewsletter = async () => {
    if (!testNewsletterEmail) return setError('Enter an email address')
    try {
      setTestNewsletterLoading(true)
      setError('')
      const res = await fetch('/api/newsletter/send-test', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testNewsletterEmail }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      setSuccess(`✓ Test newsletter sent to ${testNewsletterEmail}`)
      setTestNewsletterEmail('')
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setTestNewsletterLoading(false)
    }
  }

  const handleSendNewsletter = async (sendToTest = false) => {
    if (sendToTest) return handleSendTestNewsletter()
    try {
      setNewsletterLoading(true)
      setError('')
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      const result = await res.json()
      setSuccess(`✓ Newsletter sent to ${result.sent}/${result.total} subscribers`)
      setShowNewsletterSend(false)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setNewsletterLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const allData = []
      let currentPage = 0
      let hasMore = true

      while (hasMore) {
        const params = new URLSearchParams({
          search,
          status: statusFilter,
          page: currentPage,
          limit: 100,
        })

        const res = await fetch(`/api/admin/subscribers?${params}`, {
          headers: { 'x-admin-key': adminKey },
        })

        const data = await res.json()
        allData.push(...data.subscribers)
        hasMore = currentPage < data.totalPages - 1
        currentPage++
      }

      const headers = ['Email', 'Status', 'Subscribed Date', 'Source', 'Notes']
      const rows = allData.map((s) => [
        s.email,
        s.status,
        new Date(s.subscribedAt).toLocaleString(),
        s.source,
        s.notes || '',
      ])

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `downrange-subscribers-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)

      setSuccess('Export complete')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDebug = async () => {
    try {
      const res = await fetch('/api/admin/debug/subscribers', {
        headers: { 'x-admin-key': adminKey },
      })
      const data = await res.json()
      console.log('🔍 MAILING LIST DEBUG INFO:', data)
      setSuccess(`✅ Debug data logged to console. Found ${data.subscriberCount} subscribers in database.`)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError('❌ Debug error: ' + err.message)
    }
  }

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
    setSelectAll(false)
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set())
      setSelectAll(false)
    } else {
      const allIds = new Set(subscribers.map((s) => s._id))
      setSelectedIds(allIds)
      setSelectAll(true)
    }
  }

  return (
    <div className="ml-container">
      <style>{S}</style>

      <div className="ml-header">
        <h3>📬 Mailing List</h3>
        <div className="ml-stats">
          <div className="ml-stat">
            <span className="label">Total</span>
            <span className="value">{stats.total}</span>
          </div>
          <div className="ml-stat">
            <span className="label">Active</span>
            <span className="value green">{stats.active}</span>
          </div>
          <div className="ml-stat">
            <span className="label">Unsubscribed</span>
            <span className="value">{stats.unsubscribed}</span>
          </div>
          <div className="ml-stat">
            <span className="label">Bounced</span>
            <span className="value red">{stats.bounced}</span>
          </div>
        </div>
      </div>

      {error && <div className="ml-alert error">❌ {error}</div>}
      {success && <div className="ml-alert success">✅ {success}</div>}

      {/* SCHEDULE SECTION - Always Visible */}
      <div style={{marginBottom: '24px', padding: '20px', background: 'linear-gradient(135deg, rgba(200,146,42,0.15) 0%, rgba(200,146,42,0.05) 100%)', border: '2px solid #c8922a', borderRadius: '6px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px'}}>
          <div>
            <div style={{fontSize: '13px', fontWeight: '700', color: '#c8922a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px'}}>
              📅 Newsletter Schedule
            </div>
            {scheduleLoading ? (
              <div style={{fontSize: '12px', color: '#999'}}>⏳ Loading schedule...</div>
            ) : schedule ? (
              <>
                <div style={{fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '4px'}}>
                  {schedule.days?.length ? schedule.days.map(d => d.slice(0, 3).toUpperCase()).join(', ') : 'No days set'}
                </div>
                <div style={{fontSize: '12px', color: '#b0b0b0'}}>
                  ⏰ {String(schedule.hour).padStart(2, '0')}:{String(schedule.minute).padStart(2, '0')} UTC
                </div>
                <div style={{fontSize: '11px', color: schedule.enabled ? '#22c55e' : '#ef4444', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600'}}>
                  {schedule.enabled ? '✓ AUTO-SEND ENABLED' : '✗ AUTO-SEND DISABLED'}
                </div>
              </>
            ) : (
              <div style={{fontSize: '12px', color: '#999'}}>No schedule data</div>
            )}
          </div>
          <button onClick={() => setShowScheduleEditor(true)} className="ml-btn" style={{margin: '0', height: 'fit-content'}}>
            ⚙️ Edit
          </button>
        </div>
      </div>

      <div className="ml-toolbar">
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          className="ml-search"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(0)
          }}
          className="ml-select"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="unsubscribed">Unsubscribed</option>
          <option value="bounced">Bounced</option>
          <option value="complained">Complained</option>
        </select>
        <button onClick={() => setShowAddForm(!showAddForm)} className="ml-btn">
          + Add
        </button>
        <button onClick={() => setShowTestEmail(!showTestEmail)} className="ml-btn" style={{background:'#666'}}>
          📧 Test Email
        </button>
        <button onClick={() => setShowNewsletterSend(!showNewsletterSend)} className="ml-btn" style={{background:'#8b6914'}}>
          📬 Send Newsletter
        </button>
        <button onClick={handleDebug} className="ml-btn" style={{background:'#666'}}>
          🔍 Debug
        </button>
        <button onClick={handleExport} className="ml-btn" disabled={stats.total === 0}>
          📥 Export
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddSubscriber} className="ml-add-form">
          <div className="ml-form-group">
            <label>Email *</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="ml-input"
            />
          </div>
          <div className="ml-form-group">
            <label>Notes</label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="ml-textarea"
            />
          </div>
          <div className="ml-form-actions">
            <button type="submit" className="ml-btn">
              Add
            </button>
            <button type="button" onClick={() => setShowAddForm(false)} className="ml-btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      {showTestEmail && (
        <form onSubmit={handleSendTestEmail} className="ml-add-form" style={{background:'rgba(102,102,102,.1)',borderColor:'#666'}}>
          <div className="ml-form-group">
            <label>📧 Send Test Welcome Email</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              required
              className="ml-input"
            />
          </div>
          <div className="ml-form-actions">
            <button type="submit" disabled={testLoading} className="ml-btn">
              {testLoading ? 'Sending...' : 'Send Test'}
            </button>
            <button type="button" onClick={() => setShowTestEmail(false)} className="ml-btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      {selectedIds.size > 0 && (
        <div className="ml-bulk">
          <span>{selectedIds.size} selected</span>
          <button onClick={() => handleBulkStatusChange('active')} className="ml-btn" style={{padding:'6px 12px',fontSize:'11px'}}>
            Mark Active
          </button>
          <button onClick={() => handleBulkStatusChange('unsubscribed')} className="ml-btn" style={{padding:'6px 12px',fontSize:'11px'}}>
            Mark Unsubscribed
          </button>
          <button onClick={() => handleBulkStatusChange('bounced')} className="ml-btn" style={{padding:'6px 12px',fontSize:'11px'}}>
            Mark Bounced
          </button>
          <button onClick={handleBulkDelete} className="ml-btn ml-btn-danger" style={{padding:'6px 12px',fontSize:'11px'}}>
            🗑️ Delete
          </button>
          <button onClick={() => {setSelectedIds(new Set());setSelectAll(false)}} className="ml-btn-ghost">
            Clear
          </button>
        </div>
      )}

      <div className="ml-table-wrapper">
        {loading ? (
          <div className="ml-loading">⏳ Loading...</div>
        ) : subscribers.length === 0 ? (
          <div className="ml-empty">No subscribers found</div>
        ) : (
          <table className="ml-table">
            <thead>
              <tr>
                <th style={{width:'40px'}}>
                  <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="ml-checkbox" />
                </th>
                <th>Email</th>
                <th>Status</th>
                <th>Subscribed</th>
                <th>Source</th>
                <th>Notes</th>
                <th style={{width:'40px'}}>Act</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((sub) => (
                <tr key={sub._id} className={selectedIds.has(sub._id) ? 'selected' : ''}>
                  <td style={{textAlign:'center'}}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(sub._id)}
                      onChange={() => toggleSelect(sub._id)}
                      className="ml-checkbox"
                    />
                  </td>
                  <td className="ml-email">{sub.email}</td>
                  <td>
                    <span className={`ml-status ${sub.status}`}>{sub.status}</span>
                  </td>
                  <td className="ml-date">
                    {new Date(sub.subscribedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="ml-date">{sub.source}</td>
                  <td className="ml-notes">{sub.notes || '—'}</td>
                  <td className="ml-actions">
                    <button onClick={() => handleDelete(sub._id)} className="ml-btn-ghost ml-btn-danger" style={{padding:'4px 8px'}}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* SCHEDULE EDITOR MODAL */}
      {showScheduleEditor && editingSchedule && (
        <div className="ml-modal-overlay" onClick={() => setShowScheduleEditor(false)}>
          <div className="ml-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ml-modal-header">
              <h3>⚙️ Newsletter Schedule</h3>
              <button onClick={() => setShowScheduleEditor(false)} className="ml-modal-close">✕</button>
            </div>
            <div className="ml-modal-content">
              {/* Enable Toggle */}
              <div className="ml-form-group" style={{marginBottom: '20px'}}>
                <label style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'}}>
                  <input
                    type="checkbox"
                    checked={editingSchedule.enabled}
                    onChange={(e) => setEditingSchedule({...editingSchedule, enabled: e.target.checked})}
                    className="ml-checkbox"
                  />
                  <span>Enable Automatic Sends</span>
                </label>
              </div>

              {/* Days Selection */}
              <div style={{marginBottom: '20px'}}>
                <label style={{fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-dim)', display: 'block', marginBottom: '12px'}}>
                  📅 Send On Days
                </label>
                <div className="ml-days-group">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const updated = editingSchedule.days.includes(day)
                          ? editingSchedule.days.filter(d => d !== day)
                          : [...editingSchedule.days, day]
                        setEditingSchedule({...editingSchedule, days: updated})
                      }}
                      className={`ml-day-btn ${editingSchedule.days.includes(day) ? 'active' : ''}`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              <div style={{marginBottom: '20px'}}>
                <label style={{fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-dim)', display: 'block', marginBottom: '12px'}}>
                  ⏰ Send Time (UTC)
                </label>
                <div className="ml-time-group">
                  <div className="ml-time-field">
                    <label>Hour</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={editingSchedule.hour}
                      onChange={(e) => setEditingSchedule({...editingSchedule, hour: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="ml-time-field">
                    <label>Minute</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={editingSchedule.minute}
                      onChange={(e) => setEditingSchedule({...editingSchedule, minute: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div style={{marginBottom: '20px'}}>
                <label style={{fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-dim)', display: 'block', marginBottom: '6px'}}>
                  Notes
                </label>
                <textarea
                  value={editingSchedule.notes || ''}
                  onChange={(e) => setEditingSchedule({...editingSchedule, notes: e.target.value})}
                  className="ml-textarea"
                  placeholder="Any notes about this schedule..."
                  style={{minHeight: '60px'}}
                />
              </div>

              {error && <div className="ml-alert error">{error}</div>}
              {success && <div className="ml-alert success">{success}</div>}

              <div className="ml-modal-actions">
                <button onClick={() => setShowScheduleEditor(false)} className="ml-btn" style={{background:'var(--border)'}}>
                  Cancel
                </button>
                <button onClick={handleUpdateSchedule} className="ml-btn">
                  ✓ Save Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEST EMAIL MODAL */}
      {showTestEmail && (
        <div className="ml-modal-overlay" onClick={() => setShowTestEmail(false)}>
          <div className="ml-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ml-modal-header">
              <h3>📧 Send Test Welcome Email</h3>
              <button onClick={() => setShowTestEmail(false)} className="ml-modal-close">✕</button>
            </div>
            <form onSubmit={handleSendTestEmail} className="ml-modal-content">
              <div className="ml-form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="ml-input"
                  required
                />
              </div>
              {error && <div className="ml-alert error">{error}</div>}
              {success && <div className="ml-alert success">{success}</div>}
              <div className="ml-modal-actions">
                <button type="button" onClick={() => setShowTestEmail(false)} className="ml-btn" style={{background:'var(--border)'}}>
                  Cancel
                </button>
                <button type="submit" disabled={testLoading} className="ml-btn">
                  {testLoading ? '⏳ Sending...' : '📧 Send Test Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEWSLETTER SEND MODAL */}
      {showNewsletterSend && (
        <div className="ml-modal-overlay" onClick={() => setShowNewsletterSend(false)}>
          <div className="ml-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ml-modal-header">
              <h3>📬 Send Daily Newsletter</h3>
              <button onClick={() => setShowNewsletterSend(false)} className="ml-modal-close">✕</button>
            </div>
            <div className="ml-modal-content">
              <div style={{marginBottom: '20px', padding: '12px', background: 'rgba(200,146,42,.1)', border: '1px solid var(--gold)', borderRadius: '4px', fontSize: '12px', color: 'var(--text-dim)'}}>
                <strong>⚠️ Manual Send:</strong> This will send the curated newsletter (top 6 news, 3 blogs, hottest deals) to all active subscribers.
              </div>

              {/* TEST NEWSLETTER SECTION */}
              <div style={{marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)'}}>
                <h4 style={{margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--gold)'}}>
                  🧪 Send Test Newsletter
                </h4>
                <div className="ml-form-group" style={{marginBottom: '12px'}}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={testNewsletterEmail}
                    onChange={(e) => setTestNewsletterEmail(e.target.value)}
                    className="ml-input"
                  />
                </div>
                <button 
                  onClick={() => handleSendNewsletter(true)}
                  disabled={testNewsletterLoading || !testNewsletterEmail}
                  className="ml-btn"
                  style={{width: '100%', background: '#8b6914'}}
                >
                  {testNewsletterLoading ? '⏳ Sending...' : '🧪 Send Test'}
                </button>
              </div>

              {/* PRODUCTION SEND SECTION */}
              <div style={{marginBottom: '12px'}}>
                <h4 style={{margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--gold)'}}>
                  🚀 Send to All Subscribers
                </h4>
                <p style={{fontSize: '12px', color: 'var(--text-dim)', margin: '0 0 12px 0'}}>
                  This will be sent to <strong>{stats.active}</strong> active subscribers.
                </p>
                <button
                  onClick={() => handleSendNewsletter(false)}
                  disabled={newsletterLoading || stats.active === 0}
                  className="ml-btn"
                  style={{width: '100%', background: '#c8922a'}}
                >
                  {newsletterLoading ? '⏳ Sending to all...' : `📬 Send to ${stats.active} Subscribers`}
                </button>
              </div>

              {error && <div className="ml-alert error">{error}</div>}
              {success && <div className="ml-alert success">{success}</div>}

              <div className="ml-modal-actions">
                <button onClick={() => setShowNewsletterSend(false)} className="ml-btn" style={{background:'var(--border)', width: '100%'}}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="ml-pagination">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="ml-btn"
          >
            ← Prev
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            className="ml-btn"
          >
            Next →
          </button>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value))
              setPage(0)
            }}
            className="ml-select"
          >
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      )}
    </div>
  )
}
