import Link from 'next/link'
import { pressHref, monthLabel } from '../../lib/pressUi'

// Bottom navigation: newer / older, page numbers, and a month-by-month timeline.
export default function PressPager({ page, pages, total, brand, kind, month, months }) {
  const nums = []
  const lo = Math.max(1, Math.min(page - 2, pages - 4))
  const hi = Math.min(pages, lo + 4)
  for (let p = lo; p <= hi; p++) nums.push(p)
  const href = p => pressHref({ brand, kind, month, page: p })
  const newer = page > 1 ? href(page - 1) : null
  const older = page < pages ? href(page + 1) : null

  return (
    <nav className="pr-pager" aria-label="Press release navigation">
      <div className="pr-pager-row">
        {newer ? <Link href={newer} rel="prev" className="pr-pg-btn" data-dir="newer">← Newer</Link>
               : <span className="pr-pg-btn pr-pg-off">← Newer</span>}
        <span className="pr-pg-count">Page {page} of {pages}</span>
        {older ? <Link href={older} rel="next" className="pr-pg-btn" data-dir="older">Older →</Link>
               : <span className="pr-pg-btn pr-pg-off">Older →</span>}
      </div>

      {pages > 1 && (
        <div className="pr-pg-nums">
          {lo > 1 && <><Link href={href(1)} className="pr-pg-num">1</Link>{lo > 2 && <span className="pr-pg-dots">…</span>}</>}
          {nums.map(p => p === page
            ? <span key={p} className="pr-pg-num pr-pg-cur" aria-current="page">{p}</span>
            : <Link key={p} href={href(p)} className="pr-pg-num">{p}</Link>)}
          {hi < pages && <>{hi < pages - 1 && <span className="pr-pg-dots">…</span>}<Link href={href(pages)} className="pr-pg-num">{pages}</Link></>}
        </div>
      )}

      {months && months.length > 1 && (
        <div className="pr-tl">
          <div className="pr-tl-label">JUMP THROUGH TIME</div>
          <div className="pr-tl-row">
            <Link href={pressHref({ brand, kind })} className={`pr-tl-chip${!month ? ' on' : ''}`}>All time</Link>
            {months.map(m => (
              <Link key={m.key} href={pressHref({ brand, kind, month: m.key })} className={`pr-tl-chip${month === m.key ? ' on' : ''}`}>
                {monthLabel(m.key)} <b>{m.count}</b>
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="pr-pg-foot">
        <span>{total} release{total === 1 ? '' : 's'}</span>
        <a href="#pr-top" className="pr-top">↑ Back to top</a>
      </div>
    </nav>
  )
}
