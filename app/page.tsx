import type { Metadata } from 'next'
import PageLayout from '../components/layout/PageLayout'

export const metadata: Metadata = {
  title: 'Sourcing de Armas Americanas para Importadores Latino-Americanos',
  description:
    'FFL licenciado nos EUA. Acesso direto a 200+ fabricantes americanos — Glock, Sig Sauer, Smith & Wesson, Colt e mais. Compliance ATF/ITAR/EAR completo. Cotação em 48 horas.',
  keywords: [
    'sourcing armas EUA',
    'importação armas Brasil',
    'FFL americano',
    'importador armas América Latina',
    'Glock Brasil',
    'Sig Sauer Brasil importação',
    'compliance ITAR EAR',
    'cotação armas americanas',
    'distribuidor armas EUA',
  ],
  alternates: { canonical: 'https://arsenalamericano.com.br' },
  openGraph: {
    type: 'website',
    url: 'https://arsenalamericano.com.br',
    title: 'Arsenal Americano — Sourcing de Armas Americanas',
    description:
      'FFL licenciado nos EUA. Acesso direto a 200+ fabricantes americanos com compliance ATF/ITAR/EAR completo.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Arsenal Americano' }],
  },
}

const BRANDS = [
  { name: 'Smith & Wesson', cat: 'Pistolas & Revólveres' },
  { name: 'Glock', cat: 'Pistolas' },
  { name: 'Sig Sauer', cat: 'Pistolas & Rifles' },
  { name: 'Ruger', cat: 'Pistolas & Rifles' },
  { name: 'Springfield Armory', cat: 'Pistolas & Rifles' },
  { name: 'Colt', cat: 'Pistolas & Rifles' },
  { name: 'Remington', cat: 'Rifles & Espingardas' },
  { name: 'Winchester', cat: 'Espingardas & Munição' },
  { name: 'Mossberg', cat: 'Espingardas' },
  { name: 'Daniel Defense', cat: 'Rifles Táticos' },
  { name: 'Taurus USA', cat: 'Pistolas & Revólveres' },
  { name: 'Beretta', cat: 'Pistolas & Espingardas' },
  { name: 'Browning', cat: 'Rifles & Espingardas' },
  { name: 'Savage Arms', cat: 'Rifles de Precisão' },
  { name: 'Heckler & Koch', cat: 'Pistolas & Rifles' },
  { name: 'Kimber', cat: 'Pistolas 1911' },
]

const SERVICES = [
  {
    icon: '🎯',
    title: 'Sourcing de Armas de Fogo',
    desc: 'Pistolas, revólveres, rifles, espingardas — qualquer modelo, qualquer fabricante americano. Acesso direto a distribuidores Tier-1.',
  },
  {
    icon: '🔫',
    title: 'Munição & Recarga',
    desc: 'Federal, Hornady, Remington, Winchester e mais de 40 marcas. Pistola, rifle, shotgun — calibres para todas as aplicações.',
  },
  {
    icon: '🔭',
    title: 'Acessórios & Ópticas',
    desc: 'Viper, Vortex, Nightforce, Trijicon. Holsters, coletes, compensadores, coronhas táticas e equipamentos de treinamento.',
  },
  {
    icon: '📋',
    title: 'Compliance & Documentação',
    desc: 'Gestão completa de ATF, ITAR/EAR, licenças de exportação, End-User Certificates e coordenação com DPF/Exército.',
  },
  {
    icon: '🚢',
    title: 'Logística Internacional',
    desc: 'Consolidação de carga, seguro especializado, rotas marítimas São Paulo/Rio, rastreamento em tempo real e desembaraço.',
  },
  {
    icon: '📊',
    title: 'Inteligência de Mercado',
    desc: 'Relatórios mensais: preços FOB, tendências de demanda, novos lançamentos, análise regulatória. Dados para decisão estratégica.',
  },
]

const STATS = [
  { val: '200+', label: 'Fabricantes Americanos' },
  { val: '15+', label: 'Anos de Experiência' },
  { val: '8', label: 'Países Atendidos' },
  { val: '100%', label: 'Conformidade Legal' },
]

const STEPS = [
  {
    n: '01',
    title: 'Consulta Inicial',
    desc: 'Nos conte o que você precisa — modelo, volume, prazo, orçamento. Sem compromisso, sem burocracia.',
  },
  {
    n: '02',
    title: 'Proposta Personalizada',
    desc: 'Em até 48 horas, entregamos cotação detalhada com preço FOB, custo de compliance e estimativa de frete.',
  },
  {
    n: '03',
    title: 'Processamento & Compliance',
    desc: 'Gerenciamos toda a documentação: ATF, licenças ITAR/EAR, End-User Certificate e autorizações brasileiras.',
  },
  {
    n: '04',
    title: 'Entrega Garantida',
    desc: 'Logística especializada porta a porta, seguro de carga, rastreamento contínuo e suporte no desembaraço aduaneiro.',
  },
]

const NEWS_PREVIEW = [
  {
    cat: 'MERCADO',
    catColor: '#C8922A',
    icon: '🔫',
    title: 'Smith & Wesson lança nova linha M&P de 2025 com melhorias na ergonomia',
    date: 'Jan 2025',
  },
  {
    cat: 'LEGISLAÇÃO',
    catColor: '#EF4444',
    icon: '⚖️',
    title: 'STF mantém decreto que facilita acesso de CACs a armas de uso restrito',
    date: 'Dez 2024',
  },
  {
    cat: 'PRODUTO',
    catColor: '#C8922A',
    icon: '🎯',
    title: 'Glock 47 chega ao mercado com capacidade MOS de fábrica para todos os calibres',
    date: 'Jan 2025',
  },
]

export default function HomePage() {
  return (
    <PageLayout>

      {/* ── HERO ── */}
      <section className="aa-hero">
        <div className="aa-hero-bg" aria-hidden="true" />
        <div className="container aa-hero-content">
          <p className="dr-eyebrow" style={{ marginBottom: '1rem' }}>
            🇺🇸 O Maior Portfólio de Armas Americanas para Importadores Latino-Americanos
          </p>
          <h1 className="aa-hero-title">
            Qualquer Arma.<br />
            Qualquer Marca.<br />
            <span style={{ color: 'var(--gold)' }}>Qualquer Volume.</span>
          </h1>
          <p className="aa-hero-sub">
            Da pistola compacta ao rifle de precisão — acesso direto a mais de 200 fabricantes
            americanos com compliance total ATF/ITAR/EAR e entrega porta a porta para Brasil,
            Colômbia, Peru, Chile e toda a América Latina.
          </p>
          <div className="aa-hero-ctas">
            <a href="/contato" className="dr-btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2.5rem' }}>
              Solicitar Cotação
            </a>
            <a href="/catalogo" className="dr-btn-outline" style={{ fontSize: '1rem', padding: '0.9rem 2.5rem' }}>
              Ver Catálogo
            </a>
          </div>

          {/* Stats bar */}
          <div className="aa-hero-stats">
            {STATS.map((s) => (
              <div key={s.val} className="aa-hero-stat">
                <span className="aa-hero-stat-val">{s.val}</span>
                <span className="aa-hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="aa-trust-bar">
        <div className="container aa-trust-items">
          <div className="aa-trust-item">
            <span className="aa-trust-icon">🏛️</span>
            <span>Licenciado ATF</span>
          </div>
          <div className="aa-trust-item">
            <span className="aa-trust-icon">📜</span>
            <span>Compliance ITAR/EAR</span>
          </div>
          <div className="aa-trust-item">
            <span className="aa-trust-icon">🛡️</span>
            <span>Seguro de Carga</span>
          </div>
          <div className="aa-trust-item">
            <span className="aa-trust-icon">🌎</span>
            <span>8 Países</span>
          </div>
          <div className="aa-trust-item">
            <span className="aa-trust-icon">⚡</span>
            <span>Cotação em 48h</span>
          </div>
        </div>
      </div>

      {/* ── MARKET INTEL TICKER ── */}
      <div className="market-ticker">
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="market-ticker-label">MERCADO EUA</span>
          <div className="market-ticker-track">
            <div className="market-ticker-items">
              <span className="ticker-item"><span className="ticker-cat">PISTOLA</span> Glock 19 Gen5 · <span className="ticker-up">USD 520–560</span></span>
              <span className="ticker-sep">|</span>
              <span className="ticker-item"><span className="ticker-cat">RIFLE</span> AR-15 Budget Build · <span className="ticker-up">USD 650–800</span></span>
              <span className="ticker-sep">|</span>
              <span className="ticker-item"><span className="ticker-cat">PRECISÃO</span> Remington 700 .308 · <span className="ticker-up">USD 780–950</span></span>
              <span className="ticker-sep">|</span>
              <span className="ticker-item"><span className="ticker-cat">REVÓLVER</span> S&amp;W Model 686 · <span className="ticker-up">USD 760–820</span></span>
              <span className="ticker-sep">|</span>
              <span className="ticker-item"><span className="ticker-cat">SHOTGUN</span> Mossberg 500 · <span className="ticker-up">USD 350–420</span></span>
              <span className="ticker-sep">|</span>
              <span className="ticker-item"><span className="ticker-cat">MUNIÇÃO</span> 9mm 1000rd FMJ · <span className="ticker-up">USD 210–260</span></span>
              <span className="ticker-sep">|</span>
              <span className="ticker-item"><span className="ticker-cat">PISTOLA</span> Sig P320 X-Carry · <span className="ticker-up">USD 580–640</span></span>
              <span className="ticker-sep">|</span>
              <span className="ticker-item"><span className="ticker-cat">RIFLE</span> Daniel Defense DDM4 · <span className="ticker-up">USD 1.800–2.100</span></span>
            </div>
            <div className="market-ticker-items" aria-hidden="true">
              <span className="ticker-item"><span className="ticker-cat">PISTOLA</span> Glock 19 Gen5 · <span className="ticker-up">USD 520–560</span></span>
              <span className="ticker-sep">|</span>
              <span className="ticker-item"><span className="ticker-cat">RIFLE</span> AR-15 Budget Build · <span className="ticker-up">USD 650–800</span></span>
              <span className="ticker-sep">|</span>
              <span className="ticker-item"><span className="ticker-cat">PRECISÃO</span> Remington 700 .308 · <span className="ticker-up">USD 780–950</span></span>
              <span className="ticker-sep">|</span>
              <span className="ticker-item"><span className="ticker-cat">REVÓLVER</span> S&amp;W Model 686 · <span className="ticker-up">USD 760–820</span></span>
              <span className="ticker-sep">|</span>
              <span className="ticker-item"><span className="ticker-cat">SHOTGUN</span> Mossberg 500 · <span className="ticker-up">USD 350–420</span></span>
              <span className="ticker-sep">|</span>
              <span className="ticker-item"><span className="ticker-cat">MUNIÇÃO</span> 9mm 1000rd FMJ · <span className="ticker-up">USD 210–260</span></span>
              <span className="ticker-sep">|</span>
              <span className="ticker-item"><span className="ticker-cat">PISTOLA</span> Sig P320 X-Carry · <span className="ticker-up">USD 580–640</span></span>
              <span className="ticker-sep">|</span>
              <span className="ticker-item"><span className="ticker-cat">RIFLE</span> Daniel Defense DDM4 · <span className="ticker-up">USD 1.800–2.100</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SERVICES ── */}
      <section className="dr-section" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <p className="dr-eyebrow text-center">O Que Fazemos</p>
          <h2 className="dr-section-title text-center">Soluções Completas para Importadores</h2>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 640, margin: '0 auto 3rem', lineHeight: 1.7 }}>
            Do sourcing ao desembaraço aduaneiro, cobrimos cada etapa da importação de armas e
            acessórios americanos. Uma única parceira, resultado garantido.
          </p>
          <div className="dr-grid-3" style={{ gap: '1.5rem' }}>
            {SERVICES.map((s) => (
              <div key={s.title} className="aa-service-card">
                <div className="aa-service-icon">{s.icon}</div>
                <h3 className="aa-service-title">{s.title}</h3>
                <p className="aa-service-desc">{s.desc}</p>
                <a href="/servicos" className="aa-service-link">
                  Saiba mais →
                </a>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <a href="/servicos" className="dr-btn-outline">Ver Todos os Serviços</a>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="dr-section" style={{ background: 'var(--bg2)' }}>
        <div className="container">
          <p className="dr-eyebrow text-center">Processo</p>
          <h2 className="dr-section-title text-center">Como Funciona</h2>
          <div className="aa-steps">
            {STEPS.map((step) => (
              <div key={step.n} className="aa-step">
                <div className="aa-step-number">{step.n}</div>
                <h3 className="aa-step-title">{step.title}</h3>
                <p className="aa-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWS PREVIEW ── */}
      <section className="dr-section" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p className="dr-eyebrow">Inteligência de Mercado</p>
              <h2 className="dr-section-title" style={{ marginBottom: 0 }}>Últimas Notícias</h2>
            </div>
            <a href="/noticias" className="dr-btn-outline" style={{ fontSize: '0.875rem' }}>
              Ver Todas as Notícias →
            </a>
          </div>
          <div className="dr-grid-3">
            {NEWS_PREVIEW.map((n) => (
              <a key={n.title} href="/noticias" className="news-preview-card">
                <div
                  className="news-preview-img"
                  style={{ background: `linear-gradient(135deg, ${n.catColor}28 0%, #16191F 70%, #0D0F12 100%)` }}
                >
                  <span className="news-preview-icon">{n.icon}</span>
                </div>
                <div className="news-preview-body">
                  <span className="dr-badge-gold" style={{ background: n.catColor, color: '#09090B', fontSize: '0.7rem' }}>{n.cat}</span>
                  <h3 className="news-preview-title">{n.title}</h3>
                  <span className="news-preview-date">{n.date}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── BRANDS ── */}
      <section className="dr-section" style={{ background: 'var(--bg2)' }}>
        <div className="container">
          <p className="dr-eyebrow text-center">Portfólio</p>
          <h2 className="dr-section-title text-center">Marcas que Sourciamos</h2>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 560, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Acesso direto aos maiores fabricantes americanos. Se existe no mercado dos EUA, conseguimos para você.
          </p>
          <div className="brands-grid">
            {BRANDS.map((b) => (
              <div key={b.name} className="brand-chip">
                <span className="brand-chip-name">{b.name}</span>
                <span className="brand-chip-cat">{b.cat}</span>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            + Mais de 180 outros fabricantes disponíveis sob demanda
          </p>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="dr-section" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <p className="dr-eyebrow text-center">Por Que Escolher</p>
          <h2 className="dr-section-title text-center">A Arsenal Americano</h2>
          <div className="dr-grid-3" style={{ gap: '1.5rem', marginTop: '2.5rem' }}>
            {[
              { icon: '🏛️', t: 'Acesso de Insider', d: 'Relações diretas com distribuidores, atacadistas e fabricantes. Preços que varejistas não conseguem.' },
              { icon: '⚖️', t: '100% Legal & Documentado', d: 'Zero improvisação em compliance. ATF, ITAR, EAR — processado por especialistas.' },
              { icon: '🌎', t: 'Presença Física nos EUA', d: 'Operações em solo americano. Inspeção, consolidação e despacho sob nosso controle.' },
              { icon: '🕐', t: 'Resposta em 48 Horas', d: 'Cotação detalhada com preço FOB, frete e prazo de entrega estimado.' },
              { icon: '🔒', t: 'Confidencialidade Total', d: 'Seus volumes, fornecedores e estratégias nunca são compartilhados.' },
              { icon: '📱', t: 'Suporte WhatsApp', d: 'Comunicação direta com nossa equipe. Atualizações em tempo real de cada pedido.' },
            ].map((w) => (
              <div key={w.t} className="dr-card" style={{ padding: '1.75rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{w.icon}</div>
                <h3 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.9rem', color: 'var(--gold)', marginBottom: '0.5rem', letterSpacing: 1 }}>{w.t}</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.65, fontSize: '0.9rem', margin: 0 }}>{w.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="aa-cta-banner">
        <div className="container aa-cta-content">
          <h2 className="aa-cta-title">Pronto para importar?</h2>
          <p className="aa-cta-sub">
            Fale com nossa equipe agora. Cotação sem compromisso em até 48 horas.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="/contato" className="dr-btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2.5rem' }}>
              Solicitar Cotação
            </a>
            <a
              href="https://wa.me/15551234567?text=Olá,%20quero%20importar%20armas%20americanas"
              target="_blank"
              rel="noopener noreferrer"
              className="dr-btn-whatsapp"
              style={{ fontSize: '1rem', padding: '0.9rem 2.5rem' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp Agora
            </a>
          </div>
        </div>
      </section>

    </PageLayout>
  )
}
