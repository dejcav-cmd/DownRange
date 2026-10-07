'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { pressHref, KIND_FILTERS } from '../../lib/pressUi'

// Sticky filter bar: swipeable manufacturer chips, type chips, and a searchable
// "all manufacturers" bottom sheet that works one-handed on a phone.
export default function PressFilterBar({ brands, activeBrand, activeKind, month, total }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const rowRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const el = rowRef.current && rowRef.current.querySelector('[data-on="1"]')
    if (el && el.scrollIntoView) el.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [activeBrand])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    const t = setTimeout(() => inputRef.current && inputRef.current.focus({ preventScroll: true }), 260)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); clearTimeout(t) }
  }, [open])

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? brands.filter(b => b.brand.toLowerCase().includes(s)) : brands
  }, [brands, q])

  const activeName = brands.find(b => b.brandSlug === activeBrand)?.brand

  return (
    <div className="pr-filter" id="pr-filter">
      <div className="pr-filter-in">
        <div className="pr-chiprow" ref={rowRef} role="tablist" aria-label="Filter by manufacturer">
          <Link scroll={false} href={pressHref({ kind: activeKind, month })} data-on={!activeBrand ? '1' : '0'}
            className={`pr-chip${!activeBrand ? ' on' : ''}`}>All <b>{total}</b></Link>
          {brands.map(b => (
            <Link scroll={false} key={b.brandSlug} href={pressHref({ brand: b.brandSlug, kind: activeKind, month })}
              data-on={activeBrand === b.brandSlug ? '1' : '0'}
              className={`pr-chip${activeBrand === b.brandSlug ? ' on' : ''}`}>{b.brand} <b>{b.count}</b></Link>
          ))}
        </div>
        <button type="button" className="pr-allbtn" onClick={() => setOpen(true)} aria-haspopup="dialog">
          <span>☰</span><span className="pr-allbtn-t">All manufacturers</span>
        </button>
      </div>

      <div className="pr-kindrow">
        {KIND_FILTERS.map(([val, label]) => (
          <Link scroll={false} key={val || 'all'} href={pressHref({ brand: activeBrand, kind: val, month })}
            className={`pr-kind${(activeKind || '') === val ? ' on' : ''}`}>{label}</Link>
        ))}
      </div>

      {(activeBrand || activeKind || month) && (
        <div className="pr-active">
          <span>Showing{activeName ? ' ' + activeName : ''}{activeKind ? ' · ' + activeKind : ''}{month ? ' · ' + month : ''}</span>
          <Link scroll={false} href={pressHref({})} className="pr-clear">✕ Clear filters</Link>
        </div>
      )}

      {open && (
        <div className="pr-sheet-wrap" role="dialog" aria-modal="true" aria-label="Choose a manufacturer">
          <div className="pr-sheet-bd" onClick={() => setOpen(false)} />
          <div className="pr-sheet">
            <div className="pr-sheet-handle" />
            <div className="pr-sheet-head">
              <b>Manufacturers</b>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="pr-sheet-x">✕</button>
            </div>
            <input ref={inputRef} type="search" value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search manufacturers" className="pr-sheet-search" />
            <div className="pr-sheet-list">
              <Link href={pressHref({ kind: activeKind, month })} onClick={() => setOpen(false)}
                className={`pr-sheet-item${!activeBrand ? ' on' : ''}`}><span>All manufacturers</span><b>{total}</b></Link>
              {list.map(b => (
                <Link key={b.brandSlug} href={pressHref({ brand: b.brandSlug, kind: activeKind, month })} onClick={() => setOpen(false)}
                  className={`pr-sheet-item${activeBrand === b.brandSlug ? ' on' : ''}`}><span>{b.brand}</span><b>{b.count}</b></Link>
              ))}
              {list.length === 0 && <div className="pr-sheet-none">No manufacturer matches that search.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
