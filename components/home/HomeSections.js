import Link from 'next/link'
import Rail from './Rail'
import { timeAgo } from '../../lib/pressUi'

const SIZE = 'w=900&auto=format&q=80'
const sized = (u, lead) => (u && u.includes('cdn.sanity.io') ? u + (u.includes('?') ? '&' : '?') + (lead ? 'w=1400&auto=format&q=80' : SIZE) : u)

function Card({ href, external, lead, img, alt, tag, rank, title, summary, left, right, priority }) {
  const props = external ? { target: '_blank', rel: 'noopener nofollow sponsored' } : {}
  const Tag = external ? 'a' : Link
  return (
    <Tag href={href} className={'hr-card' + (lead ? ' hr-card-lead' : '')} {...props}>
      <div className="hr-img">
        <img src={sized(img, lead)} alt={alt || title} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" />
        {tag ? <span className="hr-tag">{tag}</span> : null}
        {rank ? <span className="hr-rank">{rank}</span> : null}
      </div>
      <div className="hr-body">
        <h3 className="hr-h">{title}</h3>
        {summary ? <p className="hr-sum">{summary}</p> : null}
        <div className="hr-meta"><span>{left}</span><span>{right}</span></div>
      </div>
    </Tag>
  )
}

function Section({ id, title, accent, sub, allHref, allLabel, children }) {
  return (
    <section className="hr-sec" aria-labelledby={id}>
      <div className="container">
        <div className="hr-head">
          <div>
            <h2 className="hr-title" id={id}>{title} <span>{accent}</span></h2>
            {sub ? <div className="hr-sub">{sub}</div> : null}
          </div>
          <Link href={allHref} className="hr-all">{allLabel} →</Link>
        </div>
        <Rail label={title + ' ' + accent}>
          {children}
          <Link href={allHref} className="hr-end">{allLabel} →</Link>
        </Rail>
      </div>
    </section>
  )
}

export function NewsSection({ items }) {
  if (!items.length) return null
  return (
    <Section id="hr-news" title="Top" accent="New" sub="Latest stories, newest first" allHref="/news" allLabel="All news">
      {items.map((a, i) => (
        <Card key={a._id} lead={i === 0} priority={i === 0} href={'/news/' + a.slug} img={a.image}
          tag={a.category} title={a.title} summary={i === 0 ? a.summary : null}
          left={timeAgo(a.publishedAt)} right={a.source || 'DownRange'} />
      ))}
    </Section>
  )
}

export function DealsSection({ items }) {
  if (!items.length) return null
  return (
    <Section id="hr-deals" title="Latest" accent="Deals" sub="Newest 10 deals, checked and refreshed all day" allHref="/deals" allLabel="All deals">
      {items.map((d, i) => (
        <Card key={d._id} external lead={i === 0} href={d.url} img={d.image} rank={i + 1}
          tag={d.store || d.source} title={d.title} summary={i === 0 ? d.summary : null}
          left={timeAgo(d.publishedAt)} right={d.price ? <span className="hr-price">{d.price}</span> : 'See deal'} />
      ))}
    </Section>
  )
}

export function PressSection({ items }) {
  if (!items.length) return null
  return (
    <Section id="hr-press" title="Manufacturer" accent="Press Releases" sub="Straight from the makers, with their photos" allHref="/news/manufacturer-press-releases" allLabel="All press releases">
      {items.map((p, i) => (
        <Card key={p._id} lead={i === 0} priority={false} href={'/news/manufacturer-press-releases/' + p.slug} img={p.image}
          tag={p.brand} title={p.title} summary={i === 0 ? p.summary : null}
          left={timeAgo(p.publishedAt)} right={p.readTime ? p.readTime + ' min read' : ''} />
      ))}
    </Section>
  )
}
