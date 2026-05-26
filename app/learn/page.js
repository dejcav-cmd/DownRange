import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Firearms Learning Center — DownRange',
  description: 'Beginner-friendly guides on buying your first gun, CCW licensing, safe storage, firearms safety, and more. Written for new gun owners.',
}

const AUTHOR = { name: 'DJ Cavalcanti', title: 'DownRange Founder', avatar: '🎯' }

const ARTICLES = [
  {
    slug: 'buying-your-first-gun',
    title: 'Buying Your First Gun: The Complete Beginner\'s Guide',
    subtitle: 'Everything you need to know before walking into a gun store — from caliber selection to the background check process.',
    category: 'Getting Started',
    readTime: '12 min read',
    date: 'May 2026',
    featured: true,
    image: '🔫',
    tags: ['First Gun', 'Beginner', 'Handgun', 'Budget'],
    excerpt: 'Most first-time buyers make the same mistake: they walk into a gun store with no plan and let a salesperson decide for them. Here\'s what to know before you go.',
  },
  {
    slug: 'how-to-get-ccw-license',
    title: 'How to Get Your CCW License (State-by-State Guide)',
    subtitle: 'Concealed carry permits explained: requirements, costs, training, and exactly what to expect in your state.',
    category: 'CCW & Carry',
    readTime: '15 min read',
    date: 'May 2026',
    featured: true,
    image: '🪪',
    tags: ['CCW', 'Carry Permit', 'Legal', 'Training'],
    excerpt: 'A CCW license lets you legally carry a concealed firearm in public. But the process varies wildly by state — here\'s a complete breakdown.',
  },
  {
    slug: 'firearms-safety-four-rules',
    title: 'The Four Rules of Firearms Safety (And Why They Save Lives)',
    subtitle: 'These four rules are not suggestions. Every accident with a firearm traces back to violating at least one of them.',
    category: 'Safety',
    readTime: '8 min read',
    date: 'May 2026',
    featured: true,
    image: '🛡',
    tags: ['Safety', 'Fundamentals', 'Beginner', 'Rules'],
    excerpt: 'Colonel Jeff Cooper codified these four rules decades ago. Every serious instructor teaches them. Learn them before you touch a firearm.',
  },
  {
    slug: 'home-defense-basics',
    title: 'Home Defense Basics: What You Actually Need',
    subtitle: 'A practical guide to protecting your home — the right gun, storage, lighting, plan, and what the movies get wrong.',
    category: 'Home Defense',
    readTime: '11 min read',
    date: 'May 2026',
    image: '🏠',
    tags: ['Home Defense', 'Shotgun', 'Pistol', 'Plan'],
    excerpt: 'Most people buy a gun for home defense, then put it in a drawer and never think about it again. That\'s not a plan — it\'s a liability.',
  },
  {
    slug: 'safe-storage-guide-beginners',
    title: 'Safe Storage 101: Keeping Your Guns Secure and Accessible',
    subtitle: 'How to prevent theft and unauthorized access while keeping your defensive firearm ready when you need it.',
    category: 'Safe Storage',
    readTime: '9 min read',
    date: 'May 2026',
    image: '🔒',
    tags: ['Storage', 'Safe', 'Biometric', 'Children'],
    excerpt: 'You have a moral and often legal obligation to secure your firearms. Here\'s how to do it without sacrificing defensive access.',
  },
  {
    slug: 'ammo-guide-beginners',
    title: 'Ammunition Explained: What to Buy and Why',
    subtitle: 'Calibers, grain weights, hollow points vs. FMJ — everything a beginner needs to know about buying the right ammo.',
    category: 'Ammunition',
    readTime: '10 min read',
    date: 'May 2026',
    image: '🔶',
    tags: ['Ammo', '9mm', 'Caliber', 'Hollow Point'],
    excerpt: 'Walk into any gun store and you\'ll see hundreds of ammo choices. Here\'s what actually matters — and what\'s marketing.',
  },
  {
    slug: 'shooting-range-first-visit',
    title: 'Your First Time at a Shooting Range: What to Expect',
    subtitle: 'Range rules, etiquette, what to bring, what to wear, and how to not embarrass yourself your first time out.',
    category: 'Getting Started',
    readTime: '7 min read',
    date: 'May 2026',
    image: '◎',
    tags: ['Range', 'Beginner', 'Etiquette', 'Tips'],
    excerpt: 'Shooting ranges have specific rules and culture. Breaking them ranges from embarrassing to dangerous. Here\'s what to know.',
  },
  {
    slug: 'cleaning-maintaining-your-gun',
    title: 'How to Clean and Maintain Your Firearm',
    subtitle: 'A dirty gun is an unreliable gun. This beginner-friendly guide covers field strip, cleaning, and lubrication for common pistols.',
    category: 'Maintenance',
    readTime: '10 min read',
    date: 'May 2026',
    image: '🔧',
    tags: ['Cleaning', 'Maintenance', 'Reliability', 'Tools'],
    excerpt: 'You don\'t need to be a gunsmith. But you do need to know how to keep your firearm running reliably. Start here.',
  },
  {
    slug: 'understanding-gun-laws',
    title: 'Understanding Gun Laws: A Beginner\'s Legal Overview',
    subtitle: 'Federal laws, state laws, and how they interact — what new gun owners need to know to stay legal.',
    category: 'Legal',
    readTime: '13 min read',
    date: 'May 2026',
    image: '⚖',
    tags: ['Legal', 'Laws', 'Federal', 'State', 'Compliance'],
    excerpt: 'Gun laws are a patchwork of federal, state, and local regulations that interact in non-obvious ways. Here\'s the framework you need.',
  },
  {
    slug: 'choosing-holster-beginners',
    title: 'How to Choose a Holster for Concealed Carry',
    subtitle: 'IWB, OWB, appendix, shoulder — the different types of holsters and how to choose the right one for your lifestyle.',
    category: 'CCW & Carry',
    readTime: '11 min read',
    date: 'May 2026',
    image: '🔫',
    tags: ['Holster', 'IWB', 'Appendix', 'Carry'],
    excerpt: 'Buying a carry gun without buying a good holster is like buying a car without seatbelts. The holster is half the system.',
  },
  {
    slug: 'dry-fire-training-beginners',
    title: 'Dry Fire Training: How to Get Better Without Spending on Ammo',
    subtitle: 'Dry fire practice builds the fundamentals faster than live fire — and it\'s free. Here\'s how to do it safely and effectively.',
    category: 'Training',
    readTime: '9 min read',
    date: 'May 2026',
    image: '🎯',
    tags: ['Training', 'Dry Fire', 'Free', 'Fundamentals'],
    excerpt: 'Professional shooters spend more time dry firing than live firing. You should too — especially as a beginner.',
  },
  {
    slug: 'what-is-nfa',
    title: 'What Is the NFA? Suppressors, SBRs, and Machine Guns Explained',
    subtitle: 'The National Firearms Act regulates some of the most interesting (and legal) items available. Here\'s how it works in 2026.',
    category: 'Legal',
    readTime: '12 min read',
    date: 'May 2026',
    image: '📋',
    tags: ['NFA', 'Suppressor', 'SBR', 'Tax Stamp'],
    excerpt: 'After the NFA tax stamp was eliminated in January 2026, interest in suppressors and SBRs exploded. Here\'s what you need to know.',
  },
]

const CATEGORIES = [...new Set(ARTICLES.map(a => a.category))]
const CAT_ICONS = {
  'Getting Started': '🚀',
  'CCW & Carry': '🪪',
  'Safety': '🛡',
  'Home Defense': '🏠',
  'Safe Storage': '🔒',
  'Ammunition': '🔶',
  'Maintenance': '🔧',
  'Legal': '⚖',
  'Training': '🎯',
}

export default function LearnPage({ searchParams }) {
  const catFilter = searchParams?.cat || null
  const filtered = catFilter ? ARTICLES.filter(a => a.category === catFilter) : ARTICLES
  const featured = ARTICLES.filter(a => a.featured)
  const rest = filtered.filter(a => !a.featured || catFilter)

  return (
    <>
      <Masthead />

      {/* Hero */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'48px 0 32px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 30% 50%, rgba(200,146,42,0.06), transparent 60%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', right:'-20px', top:'-20px', fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(80px,15vw,180px)', color:'rgba(200,146,42,0.04)', lineHeight:1, pointerEvents:'none', userSelect:'none' }}>LEARN</div>
        <div className="container" style={{ position:'relative', zIndex:1 }}>
          <div className="dr-breadcrumb" style={{ marginBottom:'12px' }}>
            <Link href="/" style={{ color:'var(--text-dim)', textDecoration:'none' }}>Home</Link>
            <span className="dr-breadcrumb-sep">›</span>
            <span className="dr-breadcrumb-cur">Learning Center</span>
          </div>
          <h1 className="page-hero-title" style={{ marginBottom:'8px' }}>Learning Center</h1>
          <p className="page-hero-sub" style={{ marginBottom:'16px' }}>Beginner-friendly guides written by firearms owners, for firearms owners</p>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'var(--bg3)', border:'1px solid var(--border)', padding:'8px 14px' }}>
              <span style={{ fontSize:'16px' }}>🎯</span>
              <div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', fontWeight:700, color:'var(--text)' }}>DJ Cavalcanti</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--text-dim)' }}>DownRange Founder · All articles</div>
              </div>
            </div>
            <span className="dr-badge dr-badge-gold">{ARTICLES.length} Articles</span>
            <span className="dr-badge dr-badge-green">Beginner Friendly</span>
          </div>
        </div>
      </div>

      <div className="dr-page">
        <div className="container">

          {/* Category filters */}
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'32px', paddingBottom:'16px', borderBottom:'1px solid var(--border)' }}>
            <a href="/learn" className={`dr-badge ${!catFilter ? 'dr-badge-gold' : 'dr-badge-dim'}`} style={{ textDecoration:'none', padding:'6px 14px', fontSize:'10px' }}>
              All Topics
            </a>
            {CATEGORIES.map(cat => (
              <a key={cat} href={`/learn?cat=${encodeURIComponent(cat)}`}
                className={`dr-badge ${catFilter===cat ? 'dr-badge-gold' : 'dr-badge-dim'}`}
                style={{ textDecoration:'none', padding:'6px 14px', fontSize:'10px' }}>
                {CAT_ICONS[cat]} {cat}
              </a>
            ))}
          </div>

          {/* Featured 3 articles */}
          {!catFilter && (
            <div style={{ marginBottom:'40px' }}>
              <h2 className="dr-section-title">Start Here</h2>
              <p className="dr-section-sub">The three most important guides for anyone new to firearms</p>
              <div className="dr-grid-3" style={{ gap:'16px' }}>
                {featured.map(article => (
                  <Link key={article.slug} href={`/learn/${article.slug}`} style={{ textDecoration:'none' }}>
                    <div className="dr-card" style={{ height:'100%', borderTop:`3px solid var(--gold)`, padding:0, overflow:'hidden' }}>
                      {/* Category + icon bar */}
                      <div style={{ background:'var(--bg3)', padding:'20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span className="dr-badge dr-badge-gold">{article.category}</span>
                        <span style={{ fontSize:'28px' }}>{article.image}</span>
                      </div>
                      <div style={{ padding:'20px' }}>
                        <h3 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.3rem', color:'var(--text)', letterSpacing:'0.03em', lineHeight:1.2, marginBottom:'8px' }}>{article.title}</h3>
                        <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text-dim)', lineHeight:1.6, marginBottom:'12px' }}>{article.excerpt}</p>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--text-dim)' }}>{article.readTime}</span>
                          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'12px', fontWeight:700, color:'var(--gold)', letterSpacing:'0.08em' }}>READ →</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* All articles grid */}
          <div>
            <h2 className="dr-section-title">{catFilter ? `${CAT_ICONS[catFilter]} ${catFilter}` : 'All Articles'}</h2>
            <p className="dr-section-sub">{filtered.length} guides · Written by DJ Cavalcanti</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {(catFilter ? filtered : rest).map(article => (
                <Link key={article.slug} href={`/learn/${article.slug}`} style={{ textDecoration:'none' }}>
                  <div className="dr-card" style={{ display:'grid', gridTemplateColumns:'56px 1fr auto', gap:'16px', alignItems:'center' }}>
                    <div style={{ width:56, height:56, background:'var(--bg3)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>
                      {article.image}
                    </div>
                    <div>
                      <div style={{ display:'flex', gap:'6px', marginBottom:'4px', flexWrap:'wrap' }}>
                        <span className="dr-badge dr-badge-dim">{article.category}</span>
                        <span className="dr-badge dr-badge-dim">{article.readTime}</span>
                      </div>
                      <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'16px', fontWeight:700, color:'var(--text)', lineHeight:1.2, marginBottom:'3px' }}>{article.title}</h3>
                      <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)', lineHeight:1.5 }}>{article.subtitle}</p>
                    </div>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--gold)', flexShrink:0 }}>→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}
