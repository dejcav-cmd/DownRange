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
  const [lead, ...rest] = items
  const list = rest.slice(0, 10)
  return (
    <section className="hr-sec" aria-labelledby="hr-news">
      <div className="container">
        <div className="hr-head">
          <div>
            <h2 className="hr-title" id="hr-news">Top <span>News</span></h2>
            <div className="hr-sub">Today's biggest story, plus the 10 latest</div>
          </div>
          <Link href="/news" className="hr-all">All news →</Link>
        </div>
        <div className="tn">
          <Link href={'/news/' + lead.slug} className="tn-lead">
            <img src={sized(lead.image, true)} alt={lead.title} loading="eager" fetchPriority="high" decoding="async" />
            <div className="tn-shade" />
            <div className="tn-copy">
              {lead.category ? <span className="hr-tag tn-tag">{lead.category}</span> : null}
              <h3 className="tn-h">{lead.title}</h3>
              {lead.summary ? <p className="tn-sum">{lead.summary}</p> : null}
              <div className="tn-meta">{timeAgo(lead.publishedAt)} · {lead.source || 'DownRange'}</div>
            </div>
          </Link>
          <aside className="tn-side" aria-label="Latest 10 stories">
            <div className="tn-side-h">Latest 10 stories</div>
            <ol className="tn-list">
              {list.map(a => (
                <li key={a._id}>
                  <Link href={'/news/' + a.slug} className="tn-item">
                    <img src={sized(a.image)} alt="" loading="lazy" decoding="async" />
                    <span className="tn-it">
                      <span className="tn-ih">{a.title}</span>
                      <span className="tn-im">{timeAgo(a.publishedAt)} · {a.source || 'DownRange'}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
    </section>
  )
}

export function DealsSection({ items }) {
  if (!items.length) return null
  return (
    <Section id="hr-deals" title="Latest" accent="Deals" sub="Newest 10 deals, checked and refreshed all day" allHref="/deals" allLabel="All deals">
      {items.map((d, i) => (
        <Card key={d._id} external href={d.url} img={d.image} rank={i + 1}
          tag={d.store || d.source} title={d.title} 
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
        <Card key={p._id} href={'/news/manufacturer-press-releases/' + p.slug} img={p.image}
          tag={p.brand} title={p.title} 
          left={timeAgo(p.publishedAt)} right={p.readTime ? p.readTime + ' min read' : ''} />
      ))}
    </Section>
  )
}
