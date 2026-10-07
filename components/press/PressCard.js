import Link from 'next/link'
import { KIND_META, photoFor, timeAgo, PRESS_BASE } from '../../lib/pressUi'

export default function PressCard({ item, featured = false }) {
  const kind = KIND_META[item.kind] || KIND_META.product
  const img = item.image || photoFor(item.category, item.kind)
  return (
    <Link href={`${PRESS_BASE}/${item.slug}`} className={`pr-card${featured ? ' pr-card-featured' : ''}`}>
      <div className="pr-card-img">
        <img src={img} alt="" loading={featured ? 'eager' : 'lazy'} decoding="async" />
        <span className="pr-badge-brand">{item.brand}</span>
        <span className="pr-badge-kind" style={{ color: kind.color, borderColor: kind.color }}>{kind.label}</span>
      </div>
      <div className="pr-card-body">
        <h3 className="pr-card-title">{item.title}</h3>
        {item.summary && <p className="pr-card-sum">{item.summary}</p>}
        <div className="pr-card-meta">
          <span>{timeAgo(item.publishedAt)}</span>
          {item.readTime ? <span>{item.readTime} min read</span> : null}
          <span className="pr-card-go">READ →</span>
        </div>
      </div>
    </Link>
  )
}
