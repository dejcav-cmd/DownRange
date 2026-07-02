import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'
import { fetchLegislation, fetchBreakingAlerts, fetchAllStateProfiles } from '../../sanity/lib/client'
import { STATE_SEED } from '../../lib/stateSeed'

export const metadata = {
  title: '2A Legal Intelligence | DownRange',
  description: 'Second Amendment law command center. Your state\'s gun laws, federal bills in Congress, ATF rules, and active SCOTUS cases — all in one place.',
  keywords: 'gun laws by state, Second Amendment law, ATF regulations, concealed carry laws, state firearms laws, gun control legislation 2026',
  alternates: { canonical: 'https://www.downrangeco.com/laws' },
  openGraph: {
    type: 'website', url: 'https://www.downrangeco.com/laws',
    title: '2A Legal Intelligence | DownRange',
    description: 'Know the law. Know your rights. Federal bills, state laws, ATF rules, and SCOTUS cases.',
    images: [{ url: 'https://www.downrangeco.com/og-default.png', width: 1200, height: 630 }],
  },
}
export const revalidate = 300

const SCOTUS_PENDING = [
  { name: 'Viramontes v. Cook County', status: 'Under conference', topic: 'AWB', url: 'https://firearmslaw.duke.edu' },
  { name: 'Wolford v. Lopez', status: 'Argued Jan 2026', topic: 'Carry ban', url: 'https://www.scotusblog.com/case-files/cases/wolford-v-lopez/' },
  { name: 'United States v. Hemani', status: 'Decision expected Jun/Jul 2026', topic: 'Drug user prohibition', url: 'https://www.scotusblog.com/case-files/cases/united-states-v-hemani/' },
]

const FREEDOM_TIER = {
  high: { color: '#34D399', label: 'Constitutional Carry' },
  mid:  { color: '#FBBF24', label: 'Permit Required' },
  low:  { color: '#EF4444', label: 'Restricted' },
}

function getTier(p) {
  if (p.constitutionalCarry) return 'high'
  if (p.awbStatus && p.awbStatus !== 'None' && p.awbStatus !== 'none') return 'low'
  if (p.magLimit) return 'low'
  return 'mid'
}


const LAWS_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: '2A Legal Intelligence — DownRange',
    description: 'Comprehensive database of Second Amendment legislation, state gun laws, ATF regulations, and SCOTUS cases.',
    url: 'https://www.downrangeco.com/laws',
    publisher: { '@id': 'https://www.downrangeco.com/#organization' },
    keywords: ['Second Amendment', 'gun laws', 'ATF regulations', 'state firearms laws', 'concealed carry', 'SCOTUS 2A'],
    temporalCoverage: '2024/..',
    spatialCoverage: 'United States',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.downrangeco.com' },
      { '@type': 'ListItem', position: 2, name: '2A Legal Intelligence', item: 'https://www.downrangeco.com/laws' },
    ],
  },
]

export default async function LawsHub() {
  const [legislation, alerts, sanityProfiles] = await Promise.all([
    fetchLegislation(6).catch(() => []),
    fetchBreakingAlerts(3).catch(() => []),
    fetchAllStateProfiles().catch(() => []),
  ])

  const profileMap2 = {}
  for (const p of Object.values(STATE_SEED)) { profileMap2[p.abbr] = { ...p } }
  for (const p of sanityProfiles) { if (p?.abbr && profileMap2[p.abbr]) { for (const [k,v] of Object.entries(p)) { if (v !== null && v !== undefined) profileMap2[p.abbr][k] = v } } }
  const profiles = Object.values(profileMap2).sort((a,b) => a.name.localeCompare(b.name))
  const recentLaws = legislation.slice(0, 6)
  const ccCount = profiles.filter(p => p.constitutionalCarry).length
  const restrictedCount = profiles.filter(p => p.magLimit || (p.awbStatus && p.awbStatus !== 'None' && p.awbStatus !== 'none')).length

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LAWS_SCHEMA) }} />
      <Masthead />

      {/* ── HERO ── */}
      <div style={{
        background: 'linear-gradient(180deg, #0d0d10 0%, #09090B 100%)',
        borderBottom: '1px solid #1a1a1a',
        padding: '64px 0 48px',
      }}>
        <div className="container">
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#C8922A', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
            Second Amendment Legal Intelligence
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(3rem, 7vw, 5.5rem)', color: '#fff', lineHeight: 0.92, letterSpacing: '0.02em', margin: '0 0 20px' }}>
            Know the Law.<br />
            <span style={{ color: '#C8922A' }}>Know Your Rights.</span>
          </h1>
          <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 16, color: '#6B7280', lineHeight: 1.7, maxWidth: 520, margin: 0 }}>
            Federal bills, your state's gun laws, ATF rulemaking, and active SCOTUS cases. Updated continuously.
          </p>
        </div>
      </div>

      {/* ── BREAKING ALERTS ── */}
      {alerts.length > 0 && (
        <div style={{ background: '#0f0505', borderBottom: '1px solid #7F1D1D', padding: '10px 0' }}>
          <div className="container" style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#EF4444', letterSpacing: '0.15em', fontWeight: 700, flexShrink: 0 }}>BREAKING</span>
            {alerts.slice(0, 2).map(a => (
              <span key={a._id} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#FCA5A5' }}>{a.headline}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── THREE PILLARS ── */}
      <div style={{ padding: '48px 0', borderBottom: '1px solid #1a1a1a' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>

            {/* YOUR STATE */}
            <Link href="/laws/my-state" style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                background: '#111318', border: '1px solid #1F2428', borderTop: '3px solid #C8922A',
                padding: '32px 28px', height: '100%',
              }}
              >
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#C8922A', letterSpacing: '0.15em', marginBottom: 12 }}>YOUR STATE</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: '#fff', lineHeight: 1, marginBottom: 16 }}>State Gun Laws</div>
                <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
                  Your state's carry laws, magazine limits, AWB status, waiting periods, and reciprocity — auto-detected from your location.
                </p>
                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: '#34D399' }}>{ccCount}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#4B5563', letterSpacing: '0.1em' }}>CONST. CARRY</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: '#EF4444' }}>{restrictedCount}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#4B5563', letterSpacing: '0.1em' }}>RESTRICTED</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: '#60A5FA' }}>50</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#4B5563', letterSpacing: '0.1em' }}>STATES TRACKED</div>
                  </div>
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#C8922A', letterSpacing: '0.08em' }}>
                  My State + Reciprocity →
                </div>
              </div>
            </Link>

            {/* FEDERAL */}
            <Link href="/laws/federal" style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                background: '#111318', border: '1px solid #1F2428', borderTop: '3px solid #60A5FA',
                padding: '32px 28px', height: '100%', transition: 'all 200ms',
              }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#60A5FA', letterSpacing: '0.15em', marginBottom: 12 }}>FEDERAL</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: '#fff', lineHeight: 1, marginBottom: 16 }}>Bills & Rules</div>
                <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
                  Bills in Congress, ATF rulemaking, and the legislation that defines what's legal nationwide.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {[
                    ['National CCW Reciprocity Act', 'H.R. 38', 'passed'],
                    ['NFA Tax Stamp Eliminated', 'H.R. 1', 'passed'],
                    ['Pistol Brace Rule Rescinded', 'ATF Final Rule', 'passed'],
                  ].map(([title, num, status]) => (
                    <div key={num} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
                      <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: '#D0D0D0' }}>{title}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#34D399', background: '#001A0A', padding: '2px 6px', border: '1px solid #34D39940' }}>PASSED</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#60A5FA', letterSpacing: '0.08em' }}>
                  Federal Intelligence →
                </div>
              </div>
            </Link>

            {/* SCOTUS */}
            <Link href="/laws/federal#scotus" style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                background: '#111318', border: '1px solid #1F2428', borderTop: '3px solid #A78BFA',
                padding: '32px 28px', height: '100%', transition: 'all 200ms',
              }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#A78BFA', letterSpacing: '0.15em', marginBottom: 12 }}>SUPREME COURT</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: '#fff', lineHeight: 1, marginBottom: 16 }}>SCOTUS Cases</div>
                <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
                  Active cases that could rewrite Second Amendment law. Pending decisions, landmark rulings, and Bruen's ongoing impact.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {SCOTUS_PENDING.map(c => (
                    <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
                      <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: '#D0D0D0' }}>{c.name}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#A78BFA', whiteSpace: 'nowrap', marginLeft: 8 }}>PENDING</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#A78BFA', letterSpacing: '0.08em' }}>
                  All Cases →
                </div>
              </div>
            </Link>

          </div>
        </div>
      </div>

      {/* ── 50-STATE STRIP ── */}
      <div style={{ padding: '48px 0', borderBottom: '1px solid #1a1a1a' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#fff', margin: 0, letterSpacing: '0.04em' }}>All 50 States</h2>
            <Link href="/laws/states" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#C8922A', textDecoration: 'none' }}>Full map →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 4 }}>
            {profiles.sort((a, b) => a.name?.localeCompare(b.name)).map(p => {
              const tier = getTier(p)
              const color = FREEDOM_TIER[tier].color
              return (
                <Link key={p.abbr} href={`/laws/${p.abbr?.toLowerCase()}`}
                  style={{ textDecoration: 'none', background: '#111318', border: `1px solid ${color}30`, padding: '10px 4px', textAlign: 'center', transition: 'all 150ms', display: 'block' }}
                  title={`${p.name} — ${FREEDOM_TIER[tier].label}`}
                >
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 700, color }}>{p.abbr}</div>
                </Link>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
            {Object.entries(FREEDOM_TIER).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, background: v.color, borderRadius: 2 }} />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#4B5563' }}>{v.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RECENT LAW UPDATES ── */}
      {recentLaws.length > 0 && (
        <div style={{ padding: '48px 0', borderBottom: '1px solid #1a1a1a' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#fff', margin: 0, letterSpacing: '0.04em' }}>Latest Law Updates</h2>
              <Link href="/laws/federal" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#C8922A', textDecoration: 'none' }}>All updates →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 1 }}>
              {recentLaws.map(bill => {
                const STATUS = { passed: ['#34D399', 'PASSED'], signed: ['#34D399', 'SIGNED'], challenged: ['#FBBF24', 'CHALLENGED'], committee: ['#6B7280', 'COMMITTEE'], failed: ['#EF4444', 'FAILED'], advancing: ['#60A5FA', 'ADVANCING'] }
                const [color, label] = STATUS[bill.status?.toLowerCase()] || ['#6B7280', 'PENDING']
                return (
                  <a key={bill._id} href={bill.url || `/laws/federal`} target={bill.url ? '_blank' : '_self'} rel="noreferrer"
                    style={{ textDecoration: 'none', background: '#111318', border: '1px solid #1a1a1a', padding: '20px', display: 'block', transition: 'all 150ms' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#4B5563' }}>{bill.billNumber}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color, background: `${color}15`, padding: '2px 6px', border: `1px solid ${color}30` }}>{label}</span>
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: '#E5E5E5', lineHeight: 1.3, marginBottom: 8 }}>{bill.title}</div>
                    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{bill.summary?.slice(0, 120)}…</div>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
