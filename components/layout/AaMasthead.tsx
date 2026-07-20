'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Home',               href: '/',                 exact: true },
  { label: 'Serviços',           href: '/servicos'          },
  { label: 'Catálogo',           href: '/catalogo'          },
  { label: 'Sobre',              href: '/sobre'             },
  { label: 'Guia de Importação', href: '/guia-importacao'   },
  { label: 'Contato',            href: '/contato'           },
]

export default function AaMasthead() {
  const pathname  = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close mobile menu on navigation
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Body scroll lock while mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  function isActive(item: { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }

  return (
    <header className="aa-masthead">
      <style>{`
        .aa-masthead {
          background: #111318;
          border-bottom: 1px solid #1F2428;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .aa-masthead-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 72px;
          gap: 1rem;
        }
        .aa-mh-logo { display: block; line-height: 0; flex-shrink: 0; }
        .aa-mh-logo img { height: 52px; width: auto; display: block; }

        /* Desktop nav */
        .aa-mh-nav { display: flex; align-items: center; gap: 0; }
        .aa-mh-link {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #9CA3AF;
          text-decoration: none;
          padding: 0 12px;
          height: 72px;
          display: flex;
          align-items: center;
          border-bottom: 2px solid transparent;
          white-space: nowrap;
          transition: color 0.15s, border-color 0.15s;
        }
        .aa-mh-link:hover { color: #E5E5E5; }
        .aa-mh-link.active { color: #E5E5E5; border-bottom-color: var(--gold, #C8922A); }

        /* CTA */
        .aa-mh-cta {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          background: var(--gold, #C8922A);
          color: #09090B;
          padding: 9px 20px;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .aa-mh-cta:hover { background: #E5A83A; }

        /* Hamburger */
        .aa-mh-hamburger {
          display: none;
          background: none;
          border: 1px solid #1F2428;
          color: #9CA3AF;
          padding: 7px 14px;
          cursor: pointer;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }

        /* Mobile sheet */
        .aa-mob-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.65);
          z-index: 98;
        }
        .aa-mob-backdrop.open { display: block; }
        .aa-mob-sheet {
          display: none;
          flex-direction: column;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: #111318;
          border-top: 2px solid var(--gold, #C8922A);
          border-radius: 16px 16px 0 0;
          z-index: 99;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 -8px 60px rgba(0,0,0,0.95);
        }
        .aa-mob-sheet.open { display: flex; }
        .aa-mob-link {
          display: flex;
          align-items: center;
          min-height: 52px;
          padding: 0 20px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #9CA3AF;
          text-decoration: none;
          border-bottom: 1px solid #1F2428;
          transition: color 0.15s, background 0.15s;
        }
        .aa-mob-link:hover, .aa-mob-link.active { color: var(--gold, #C8922A); background: #16191F; }
        .aa-mob-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 56px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          background: var(--gold, #C8922A);
          color: #09090B;
          text-decoration: none;
          margin: 12px 16px 16px;
        }

        @media (max-width: 960px) {
          .aa-mh-nav { display: none; }
          .aa-mh-cta { display: none; }
          .aa-mh-hamburger { display: block; }
        }
        @media (max-width: 480px) {
          .aa-mh-logo img { height: 40px; }
        }
      `}</style>

      <div className="container aa-masthead-inner">
        {/* Logo */}
        <Link href="/" className="aa-mh-logo" aria-label="Arsenal Americano">
          <Image
            src="/logo-web.webp"
            alt="Arsenal Americano"
            width={800}
            height={450}
            style={{ height: 52, width: 'auto', display: 'block' }}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="aa-mh-nav" aria-label="Navegação principal">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`aa-mh-link${isActive(item) ? ' active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <Link href="/contato" className="aa-mh-cta">
          Falar com Especialista
        </Link>

        {/* Hamburger */}
        <button
          className="aa-mh-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕ FECHAR' : '☰ MENU'}
        </button>
      </div>

      {/* Mobile backdrop */}
      <div
        className={`aa-mob-backdrop${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile sheet */}
      <nav
        className={`aa-mob-sheet${menuOpen ? ' open' : ''}`}
        aria-label="Menu mobile"
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`aa-mob-link${isActive(item) ? ' active' : ''}`}
          >
            {item.label}
          </Link>
        ))}

        <Link href="/contato" className="aa-mob-cta">
          Falar com Especialista
        </Link>
      </nav>
    </header>
  )
}
