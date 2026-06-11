import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

export const metadata = {
  title: 'About DownRange — Built for Gun Owners | Independent 2A Intelligence',
  description: 'DownRange is an independent firearms intelligence platform covering 2A news, state gun laws, new releases, and ammo prices. No manufacturer money. No paywalls.',
  alternates: { canonical: 'https://downrangeco.com/about' },
  openGraph: {
    type: 'website', url: 'https://downrangeco.com/about',
    title: 'About DownRange — Built for Gun Owners',
    description: 'Independent 2A intelligence. No manufacturer money. No paywalls. Built by a gun owner, for gun owners.',
    images: [{ url: 'https://downrangeco.com/og-default.png', width: 1200, height: 630, alt: 'About DownRange' }],
  },
}

const ABOUT_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': 'https://downrangeco.com/about#page',
  url: 'https://downrangeco.com/about',
  name: 'About DownRange',
  description: 'DownRange is an independent firearms intelligence platform covering Second Amendment news, gun laws, ammo prices, and new releases.',
  isPartOf: { '@id': 'https://downrangeco.com/#website' },
  about: {
    '@id': 'https://downrangeco.com/#organization',
    '@type': 'NewsMediaOrganization',
    name: 'DownRange',
    alternateName: 'DownRange Firearms Intelligence',
    url: 'https://downrangeco.com',
    foundingDate: '2026',
    areaServed: 'United States',
    knowsAbout: [
      'Second Amendment', 'Firearms Law', 'Concealed Carry',
      'ATF Regulations', 'Ammunition Prices', 'Gun Reviews',
      'National Firearms Act', '2A Legislation', 'SCOTUS Cases',
    ],
    founder: {
      '@type': 'Person',
      name: 'DJ Cavalcanti',
      url: 'https://downrangeco.com/about',
      jobTitle: 'Founder & Editor',
      knowsAbout: ['Second Amendment', 'Firearms', 'CCW', '2A Law'],
    },
    sameAs: [
      'https://twitter.com/downrangeco',
      'https://bsky.app/profile/downrangeco.com',
    ],
  },
}

const MANIFESTO_LINES = [
  'We believe the Second Amendment is not a privilege.',
  'It is not a hobby. It is not a talking point.',
  'It is a right — individual, fundamental, and non-negotiable.',
  'And rights require intelligence to defend.',
]

const PILLARS = [
  {
    number: '01',
    title: 'Relentless Coverage',
    body: 'The ATF doesn\'t take weekends off. Neither do we. DownRange monitors 50+ sources — RSS feeds, Congress.gov, LegiScan, manufacturer press lines, SCOTUS dockets — and surfaces what matters within the hour it breaks.',
    accent: 'Every 15 minutes. All day. Every day.',
  },
  {
    number: '02',
    title: 'Your State. Your Laws.',
    body: 'A mag ban in California is not your problem if you\'re in Texas. DownRange gives you the intelligence that\'s relevant to where you live, carry, and hunt — 50-state law profiles, live bill tracking, ATF rule updates, and SCOTUS case analysis.',
    accent: 'All 50 states. All the time.',
  },
  {
    number: '03',
    title: 'No Agenda. No Advertisers.',
    body: 'No manufacturer pays for placement here. No PAC buys favorable coverage. No paywall keeps information out of reach. DownRange\'s only obligation is to you — the person reading the page. We cover legislation on its merits, not on who funded the campaign.',
    accent: 'Independent. Forever.',
  },
  {
    number: '04',
    title: 'Built By a Carrier. Written for Carriers.',
    body: 'This was built in Washington State — one of the hardest places to be a gun owner in America. The laws change constantly. The media coverage is hostile. The information you actually need is buried. That frustration is why DownRange exists.',
    accent: 'We know what it costs to stay informed.',
  },
]

const TRUTH_LINES = [
  { stat: '100M+', label: 'Gun owners in America deserve better than 10 tabs open at once.' },
  { stat: '24/7',  label: 'The fight for the Second Amendment doesn\'t clock out.' },
  { stat: '0',     label: 'Dollars taken from manufacturers, PACs, or political organizations.' },
  { stat: '∞',     label: 'Commitment to keeping every article free, forever.' },
]

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ABOUT_SCHEMA) }} />
      <Masthead />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(180deg, #0a0b0e 0%, #09090B 100%)',
        borderBottom: '1px solid #1f2937',
        padding: '80px 0 64px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Crosshair watermark */}
        <div aria-hidden style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 480, height: 480, opacity: 0.03,
          border: '1px solid #C8922A', borderRadius: '50%',
          pointerEvents: 'none',
        }} />
        <div aria-hidden style={{
          position: 'absolute', top: '50%', left: 0, right: 0, height: 1,
          background: '#C8922A', opacity: 0.04, transform: 'translateY(-50%)',
        }} />
        <div aria-hidden style={{
          position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1,
          background: '#C8922A', opacity: 0.04, transform: 'translateX(-50%)',
        }} />

        <div className="container" style={{ maxWidth: 860, position: 'relative' }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '11px', letterSpacing: '0.2em',
            color: '#C8922A', marginBottom: '20px',
            textTransform: 'uppercase',
          }}>
            ◉ &nbsp;About DownRange
          </div>

          <h1 style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            lineHeight: 0.95,
            letterSpacing: '0.03em',
            color: '#F0EDE6',
            margin: '0 0 28px',
          }}>
            INTELLIGENCE<br />
            <span style={{ color: '#C8922A' }}>FOR THE ARMED</span><br />
            CITIZEN.
          </h1>

          <div style={{
            borderLeft: '3px solid #C8922A',
            paddingLeft: '20px',
            marginBottom: '40px',
          }}>
            {MANIFESTO_LINES.map((line, i) => (
              <p key={i} style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 'clamp(13px, 2vw, 16px)',
                color: i === 0 ? '#F0EDE6' : i < 3 ? '#94A3B8' : '#C8922A',
                lineHeight: 1.7,
                margin: '0 0 4px',
                fontWeight: i === 0 ? 600 : 400,
              }}>{line}</p>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a href="/news" style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '12px', letterSpacing: '0.12em',
              background: '#C8922A', color: '#09090B',
              padding: '11px 24px', textDecoration: 'none',
              fontWeight: 700, textTransform: 'uppercase',
            }}>Read Today's Intel →</a>
            <a href="/laws" style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '12px', letterSpacing: '0.12em',
              background: 'transparent',
              border: '1px solid #374151', color: '#94A3B8',
              padding: '11px 24px', textDecoration: 'none',
              textTransform: 'uppercase',
            }}>Your State's Laws →</a>
          </div>
        </div>
      </div>

      {/* ── ORIGIN STORY ─────────────────────────────────────────────── */}
      <div style={{ background: '#09090B', padding: '72px 0', borderBottom: '1px solid #1f2937' }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '40px', alignItems: 'start' }}>
            <div>
              <div style={{
                fontFamily: "'Bebas Neue', cursive",
                fontSize: '1rem', letterSpacing: '0.2em',
                color: '#4B5563', marginBottom: '8px',
              }}>THE ORIGIN</div>
              <div style={{
                width: 40, height: 3, background: '#C8922A',
              }} />
            </div>
            <div>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '18px', lineHeight: 1.9,
                color: '#F0EDE6', marginBottom: '20px',
                fontStyle: 'italic',
              }}>
                "I was living in Washington State, carrying every day, and I couldn't keep up.
                New laws. New ATF rules. New magazine limits. Hostile press. Scattered data.
                I wanted one place that treated me like an adult who carries a firearm —
                not a threat to be managed."
              </p>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '14px', lineHeight: 1.8,
                color: '#6B7280', marginBottom: '16px',
              }}>
                DownRange started as that place. It runs 24 hours a day, pulls from over 50 sources,
                and covers the Second Amendment as the individual right it is — not as a controversy
                to be balanced, both-sided, or softened for an audience that might be offended.
              </p>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '14px', lineHeight: 1.8,
                color: '#6B7280',
              }}>
                If you carry, hunt, shoot, or simply believe the right to bear arms should not require
                a law degree to exercise — this was built for you.
              </p>
              <div style={{
                marginTop: '24px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '12px', color: '#C8922A',
                letterSpacing: '0.1em',
              }}>
                — DJ CAVALCANTI, FOUNDER
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOUR PILLARS ─────────────────────────────────────────────── */}
      <div style={{ background: '#09090B', padding: '72px 0', borderBottom: '1px solid #1f2937' }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: '2rem', letterSpacing: '0.08em',
            color: '#C8922A', marginBottom: '40px',
          }}>WHAT WE STAND FOR</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {PILLARS.map((p) => (
              <div key={p.number} style={{
                display: 'grid',
                gridTemplateColumns: '64px 1fr',
                background: '#0d0e12',
                border: '1px solid #1f2937',
                borderLeft: '3px solid #C8922A',
                padding: '28px 24px',
                gap: '24px',
                alignItems: 'start',
              }}>
                <div style={{
                  fontFamily: "'Bebas Neue', cursive",
                  fontSize: '2.8rem', color: '#1f2937',
                  lineHeight: 1,
                }}>{p.number}</div>
                <div>
                  <div style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '14px', fontWeight: 700,
                    color: '#F0EDE6', marginBottom: '10px',
                    letterSpacing: '0.05em',
                  }}>{p.title}</div>
                  <p style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '13px', color: '#6B7280',
                    lineHeight: 1.75, margin: '0 0 12px',
                    textAlign: 'justify',
                  }}>{p.body}</p>
                  <div style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '11px', color: '#C8922A',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>{p.accent}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── APPAREL SHOP ─────────────────────────────────────────────── */}
      <div style={{
        background: '#0a0b0e',
        borderTop: '1px solid #1f2937',
        borderBottom: '1px solid #1f2937',
        padding: '72px 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Gold diagonal texture stripe */}
        <div aria-hidden style={{
          position: 'absolute', top: 0, right: 0,
          width: '40%', height: '100%',
          background: 'linear-gradient(135deg, transparent 40%, #C8922A08 100%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ maxWidth: 860, position: 'relative' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '48px',
            alignItems: 'center',
          }}>

            {/* Left copy */}
            <div>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '11px', letterSpacing: '0.2em',
                color: '#C8922A', marginBottom: '16px',
                textTransform: 'uppercase',
              }}>&#9677; &nbsp;Down Range Co. Apparel</div>

              <h2 style={{
                fontFamily: "'Bebas Neue', cursive",
                fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
                lineHeight: 0.97,
                letterSpacing: '0.03em',
                color: '#F0EDE6',
                margin: '0 0 20px',
              }}>
                WEAR WHAT<br />
                <span style={{ color: '#C8922A' }}>YOU BELIEVE.</span>
              </h2>

              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '14px', color: '#6B7280',
                lineHeight: 1.8, marginBottom: '14px',
                textAlign: 'justify',
              }}>
                The Second Amendment is not just something you read about.
                It is something you carry, practice, and defend every day.
                Down Range Co. apparel is built for the people who live it —
                hunters, carriers, veterans, and everyone who refuses to be
                unarmed or uninformed.
              </p>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '14px', color: '#6B7280',
                lineHeight: 1.8, marginBottom: '28px',
                textAlign: 'justify',
              }}>
                Every design is a statement. Not a slogan. If you believe in
                the right, wear the right.
              </p>

              <a
                href="https://shop.downrangeco.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '12px', letterSpacing: '0.14em',
                  background: '#C8922A', color: '#09090B',
                  padding: '13px 28px', textDecoration: 'none',
                  fontWeight: 700, textTransform: 'uppercase',
                }}
              >
                Shop the Collection
              </a>
            </div>

            {/* Right product tags */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {[
                { tag: 'HUNTERS',      line: 'Field-ready designs for the opening day crowd.' },
                { tag: 'CARRIERS',     line: 'For the ones who take the responsibility seriously.' },
                { tag: 'VETERANS',     line: 'Built with the respect the service deserves.' },
                { tag: '2A PATRIOTS',  line: 'Because some rights are worth putting on your chest.' },
              ].map(({ tag, line }) => (
                <a
                  key={tag}
                  href="https://shop.downrangeco.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    background: '#0d0e12',
                    border: '1px solid #1f2937',
                    padding: '16px 20px',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{
                    fontFamily: "'Bebas Neue', cursive",
                    fontSize: '0.85rem', letterSpacing: '0.15em',
                    color: '#C8922A', minWidth: 100,
                    textTransform: 'uppercase',
                  }}>{tag}</div>
                  <div style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '11px', color: '#4B5563',
                    lineHeight: 1.5,
                  }}>{line}</div>
                  <div style={{
                    marginLeft: 'auto', flexShrink: 0,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '11px', color: '#374151',
                  }}>&#8594;</div>
                </a>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* ── TRUTH IN NUMBERS ─────────────────────────────────────────── */}
      <div style={{
        background: '#0a0b0e',
        borderTop: '1px solid #1f2937',
        borderBottom: '1px solid #1f2937',
        padding: '64px 0',
      }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: '2rem', letterSpacing: '0.08em',
            color: '#C8922A', marginBottom: '36px',
          }}>BY THE NUMBERS</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '2px',
          }}>
            {TRUTH_LINES.map(({ stat, label }) => (
              <div key={stat} style={{
                background: '#0d0e12',
                border: '1px solid #1f2937',
                padding: '28px 20px',
              }}>
                <div style={{
                  fontFamily: "'Bebas Neue', cursive",
                  fontSize: '3.2rem', color: '#C8922A',
                  lineHeight: 1, marginBottom: '10px',
                  letterSpacing: '0.03em',
                }}>{stat}</div>
                <p style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '11px', color: '#6B7280',
                  lineHeight: 1.65, margin: 0,
                  textAlign: 'justify',
                }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── EDITORIAL POLICY ─────────────────────────────────────────── */}
      <div style={{ background: '#09090B', padding: '72px 0', borderBottom: '1px solid #1f2937' }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: '2rem', letterSpacing: '0.08em',
            color: '#C8922A', marginBottom: '12px',
          }}>THE RULES WE OPERATE BY</h2>
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '13px', color: '#4B5563',
            marginBottom: '32px', lineHeight: 1.7,
          }}>
            These aren't aspirational. They're the conditions under which DownRange operates — and if we violate them, you should call it out.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '2px' }}>
            {[
              {
                rule: 'No Manufacturer Money',
                detail: 'We don\'t accept payments or gifts for coverage. A Glock announcement gets the same treatment as a brand you\'ve never heard of. No exceptions.',
              },
              {
                rule: 'No Political Funding',
                detail: 'No NRA money, no Everytown money, no PAC money. We don\'t endorse candidates. We cover legislation on its merits, not on who paid for the campaign.',
              },
              {
                rule: 'No Paywalls. Ever.',
                detail: 'Every article, every law update, every tool — free. The goal is more informed gun owners, not more paid subscribers.',
              },
              {
                rule: 'We Fix Our Mistakes',
                detail: 'If we got something wrong, we correct it — with a visible note, not a quiet edit. Email legal@downrangeco.com and it gets fixed.',
              },
            ].map(({ rule, detail }) => (
              <div key={rule} style={{
                background: '#0d0e12',
                border: '1px solid #1f2937',
                padding: '24px 20px',
              }}>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '12px', fontWeight: 700,
                  color: '#F0EDE6', marginBottom: '10px',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>{rule}</div>
                <p style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '12px', color: '#4B5563',
                  lineHeight: 1.7, margin: 0,
                  textAlign: 'justify',
                }}>{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CLOSING CTA ──────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(180deg, #09090B 0%, #0a0b0e 100%)',
        padding: '80px 0',
      }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <div style={{
            border: '1px solid #C8922A40',
            padding: '48px 40px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Corner marks */}
            {['top:0;left:0', 'top:0;right:0', 'bottom:0;left:0', 'bottom:0;right:0'].map((pos, i) => (
              <div key={i} aria-hidden style={{
                position: 'absolute',
                ...Object.fromEntries(pos.split(';').map(p => p.split(':'))),
                width: 12, height: 12,
                borderTop: ['top', 'top', 'none', 'none'][i] !== 'none' ? '2px solid #C8922A' : undefined,
                borderBottom: ['none', 'none', 'bottom', 'bottom'][i] !== 'none' ? '2px solid #C8922A' : undefined,
                borderLeft: ['left', 'none', 'left', 'none'][i] !== 'none' ? '2px solid #C8922A' : undefined,
                borderRight: ['none', 'right', 'none', 'right'][i] !== 'none' ? '2px solid #C8922A' : undefined,
              }} />
            ))}

            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '11px', letterSpacing: '0.2em',
              color: '#C8922A', marginBottom: '16px',
              textTransform: 'uppercase',
            }}>◉ &nbsp;The Mission</div>

            <h2 style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              color: '#F0EDE6', lineHeight: 1.05,
              letterSpacing: '0.04em', marginBottom: '20px',
            }}>
              EVERY GUN OWNER DESERVES<br />
              <span style={{ color: '#C8922A' }}>ACCESS TO THE TRUTH.</span>
            </h2>

            <p style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '14px', color: '#6B7280',
              lineHeight: 1.8, marginBottom: '32px',
              maxWidth: 540,
            }}>
              No gatekeeping. No subscriptions. No editorial slant for hire.
              Just clean, fast, unfiltered intelligence — so you always know
              what's happening to your rights, your state, and your community.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a href="/news" style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '12px', letterSpacing: '0.12em',
                background: '#C8922A', color: '#09090B',
                padding: '12px 28px', textDecoration: 'none',
                fontWeight: 700, textTransform: 'uppercase',
              }}>Start Reading →</a>
              <a href="/contact" style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '11px', letterSpacing: '0.1em',
                color: '#4B5563', textDecoration: 'none',
                textTransform: 'uppercase', padding: '12px 0',
              }}>Contact Us</a>
              <a href="mailto:press@downrangeco.com" style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '11px', letterSpacing: '0.1em',
                color: '#4B5563', textDecoration: 'none',
                textTransform: 'uppercase', padding: '12px 0',
              }}>press@downrangeco.com</a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
