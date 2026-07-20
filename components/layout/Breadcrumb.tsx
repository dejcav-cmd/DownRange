import Link from 'next/link'

export interface Crumb {
  label: string
  href?: string
}

/**
 * Breadcrumb — lightweight nav crumb for inner pages.
 * Also rendered invisibly for SEO via JSON-LD BreadcrumbList in each page's metadata.
 *
 * Usage:
 *   <Breadcrumb crumbs={[
 *     { label: 'HOME', href: '/' },
 *     { label: 'SERVIÇOS' },
 *   ]} />
 */
export default function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="aa-breadcrumb">
      <div className="container">
        <ol className="aa-breadcrumb-list">
          {crumbs.map((c, i) => (
            <li key={c.label} className="aa-breadcrumb-item">
              {i > 0 && <span className="aa-breadcrumb-sep" aria-hidden="true">›</span>}
              {c.href && i < crumbs.length - 1 ? (
                <Link href={c.href} className="aa-breadcrumb-link">{c.label}</Link>
              ) : (
                <span className="aa-breadcrumb-current" aria-current="page">{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  )
}
