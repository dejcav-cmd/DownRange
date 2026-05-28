'use client'
import { useState, useCallback } from 'react'

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useBulkLock({ items, setItems, patchFn, idKey = '_id' }) {
  const [checkedIds, setCheckedIds] = useState(new Set())
  const [bulkSaving, setBulkSaving] = useState(false)

  const toggleCheck = useCallback((id, e) => {
    if (e) e.stopPropagation()
    setCheckedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const toggleCheckAll = useCallback((visibleItems) => {
    const ids = visibleItems.map(i => i[idKey])
    setCheckedIds(prev =>
      prev.size === ids.length ? new Set() : new Set(ids)
    )
  }, [idKey])

  const isAllChecked = (visibleItems) =>
    visibleItems.length > 0 && checkedIds.size === visibleItems.length
  const isIndeterminate = (visibleItems) =>
    checkedIds.size > 0 && checkedIds.size < visibleItems.length

  const bulkSetLock = useCallback(async (lockValue, flash) => {
    if (!checkedIds.size) return
    setBulkSaving(true)
    if (flash) flash(`⏳ ${lockValue ? 'Locking' : 'Unlocking'} ${checkedIds.size} items...`)
    let done = 0, failed = 0
    for (const id of checkedIds) {
      try { await patchFn(id, { editorLocked: lockValue }); done++ }
      catch { failed++ }
    }
    setItems(prev => prev.map(item =>
      checkedIds.has(item[idKey]) ? { ...item, editorLocked: lockValue } : item
    ))
    setCheckedIds(new Set())
    setBulkSaving(false)
    if (flash) flash(`${lockValue ? '🔒 Locked' : '🔓 Unlocked'} ${done} items${failed ? ` · ${failed} failed` : ''}`)
  }, [checkedIds, patchFn, setItems, idKey])

  const clearChecked = () => setCheckedIds(new Set())

  return { checkedIds, toggleCheck, toggleCheckAll, isAllChecked, isIndeterminate, bulkSetLock, bulkSaving, clearChecked }
}

// ── Sticky Action Bar ─────────────────────────────────────────────────────────
export function BulkLockBar({ checkedIds, bulkSaving, onLock, onUnlock, onClear, lockAllLabel = 'LOCK ALL' }) {
  if (!checkedIds.size) return null
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20, marginBottom: 4,
      padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      background: '#0d1117', border: '1px solid var(--gold)', borderLeft: '4px solid var(--gold)',
    }}>
      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--gold)', whiteSpace: 'nowrap' }}>
        {checkedIds.size} selected
      </span>
      <button onClick={onLock} disabled={bulkSaving} style={{
        fontFamily: "'Bebas Neue',cursive", fontSize: '0.9rem', letterSpacing: '.06em',
        padding: '5px 16px', background: '#C8922A', color: '#000', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
      }}>
        {bulkSaving ? '⏳' : `🔒 ${lockAllLabel}`}
      </button>
      <button onClick={onUnlock} disabled={bulkSaving} style={{
        fontFamily: "'Bebas Neue',cursive", fontSize: '0.9rem', letterSpacing: '.06em',
        padding: '5px 16px', background: '#374151', color: '#9ca3af', border: '1px solid #4b5563', cursor: 'pointer', whiteSpace: 'nowrap',
      }}>
        {bulkSaving ? '⏳' : '🔓 UNLOCK ALL'}
      </button>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#4b5563' }}>
        Locked items are frozen — AI and cron jobs skip them
      </span>
      <button onClick={onClear} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 11 }}>
        ✕ Clear
      </button>
    </div>
  )
}

// ── Inline lock toggle (for list rows) ────────────────────────────────────────
export function LockToggle({ locked, onToggle }) {
  return (
    <span onClick={e => { e.stopPropagation(); onToggle() }} title={locked ? 'Click to unlock' : 'Click to lock'} style={{
      cursor: 'pointer', fontSize: 11, padding: '1px 5px', borderRadius: 2,
      background: locked ? 'rgba(200,146,42,.2)' : 'rgba(100,116,139,.1)',
      color: locked ? '#C8922A' : '#4b5563',
      border: `1px solid ${locked ? 'rgba(200,146,42,.4)' : 'rgba(100,116,139,.2)'}`,
      transition: 'all .15s', userSelect: 'none', display: 'inline-flex', alignItems: 'center',
    }}>
      {locked ? '🔒' : '🔓'}
    </span>
  )
}

// ── Row checkbox ──────────────────────────────────────────────────────────────
export function RowCheckbox({ id, checkedIds, toggleCheck }) {
  return (
    <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => toggleCheck(id, e)}>
      <input type="checkbox" checked={checkedIds.has(id)} onChange={() => {}}
        style={{ cursor: 'pointer', accentColor: 'var(--gold)', width: 14, height: 14 }} />
    </div>
  )
}

// ── Header checkbox ───────────────────────────────────────────────────────────
export function HeaderCheckbox({ visibleItems, isAllChecked, isIndeterminate, toggleCheckAll }) {
  return (
    <div style={{ padding: '8px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <input type="checkbox"
        checked={isAllChecked(visibleItems)}
        ref={el => { if (el) el.indeterminate = isIndeterminate(visibleItems) }}
        onChange={() => toggleCheckAll(visibleItems)}
        style={{ cursor: 'pointer', accentColor: 'var(--gold)', width: 14, height: 14 }} />
    </div>
  )
}
