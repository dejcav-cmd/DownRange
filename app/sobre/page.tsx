import type { Metadata } from 'next'
import Link from 'next/link'
import PageLayout from '../../components/layout/PageLayout'
import Breadcrumb from '../../components/layout/Breadcrumb'

export const metadata: Metadata = {
  title: 'Sobre Nós',
  description:
    'Conheça a Arsenal Americano — empresa FFL licenciada nos EUA especializada em sourcing estratégico de armas de fogo para importadores brasileiros e latino-americanos.',
  alternates: { canonical: 'https://arsenalamericano.com.br/sobre' },
}

const TIMELINE = [
  {
    phase: 'Fase 1',
    title: 'Fundação & Licenciamento',
    desc: 'Obtenção da licença FFL federal americana e estabelecimento das bases regulatórias para operação de exportação. Construção de relacionamentos com distribuidores-chave nos EUA.',
  },
  {
    phase: 'Fase 2',
    title: 'Expansão B2B',
    desc: 'Desenvolvimento do portfólio de parceiros importadores no Brasil e América Latina. Implementação de processos de CRM e gestão de relacionamento com clientes B2B.',
  },
  {
    phase: 'Fase 3',
    title: 'Escala Regional',
    desc: 'Expansão para 8+ mercados latino-americanos com operações locais de suporte, inteligência de mercado e cobertura completa da região.',
  },
]

const VALUES = [
  {
    icon: '⚖️',
    title: 'Integridade Legal',
    desc: 'Cada operação segue rigorosamente as regulamentações ATF, ITAR e EAR. Compliance não é opcional — é o alicerce do nosso negócio.',
  },
  {
    icon: '🎯',
    title: 'Foco no Parceiro',
    desc: 'Tratamos cada importador como um sócio de negócio. O sucesso do seu negócio é o nosso sucesso.',
  },
  {
    icon: '💡',
    title: 'Inovação Contínua',
    desc: 'Usamos tecnologia e inteligência artificial para entregar vantagem competitiva real — preços melhores, informação mais rápida, processos mais eficientes.',
  },
  {
    icon: '🤝',
    title: 'Transparência Total',
    desc: 'Sem taxas ocultas, sem surpresas. Você sabe exatamente o que está comprando, quanto custa e quando chega.',
  },
]

const MARKETS = [
  { country: '🇧🇷 Brasil', status: 'Principal mercado' },
  { country: '🇨🇴 Colômbia', status: 'Expansão ativa' },
  { country: '🇵🇪 Peru', status: 'Expansão ativa' },
  { country: '🇨🇱 Chile', status: 'Em desenvolvimento' },
  { country: '🇵🇦 Panamá', status: 'Em desenvolvimento' },
  { country: '🇩🇴 Rep. Dominicana', status: 'Mapeado' },
  { country: '🇪🇨 Equador', status: 'Mapeado' },
  { country: '🇺🇾 Uruguai', status: 'Mapeado' },
]

export default function SobrePage() {
  return (
    <PageLayout>
      <Breadcrumb crumbs={[{ label: 'HOME', href: '/' }, { label: 'SOBRE NÓS' }]} />

      <div className="page-hero" data-title="SOBRE NÓS">
        <div className="container">
          <p className="dr-eyebrow">Nossa História</p>
          <h1 className="page-hero-title">O Elo Que o Mercado Precisava</h1>
          <p className="page-hero-sub">
            Nascemos da necessidade real de importadores latino-americanos de ter um parceiro
            americano confiável, licenciado e bilíngue no mercado de armas de fogo.
          </p>
        </div>
      </div>

      {/* MISSION */}
      <section className="dr-section">
        <div className="container">
          <div className="about-split">
            <div className="about-text">
              <p className="dr-eyebrow">Nossa Missão</p>
              <h2 className="dr-section-title">Mais que Exportação. Parceria Estratégica.</h2>
              <p className="about-body">
                A Arsenal Americano nasceu com um propósito claro: ser o parceiro americano que
                importadores brasileiros e latino-americanos sempre precisaram e nunca encontraram.
              </p>
              <p className="about-body">
                Operamos com licença FFL federal emitida pelo ATF — a mesma exigida de qualquer
                negociante de armas nos Estados Unidos. Isso nos permite acessar o mercado atacadista
                americano, negociar diretamente com distribuidores e fabricantes, e exportar com
                total conformidade legal.
              </p>
              <p className="about-body">
                Não somos um intermediário genérico. Somos especialistas bilíngues com conhecimento
                profundo tanto do mercado americano quanto das regulamentações de importação de cada
                país latino-americano onde atuamos.
              </p>
            </div>
            <div className="about-stats">
              <div className="about-stat-card dr-card">
                <div className="aa-stat-number" style={{ fontSize: '3rem' }}>FFL</div>
                <div className="aa-stat-label">Licença Federal ATF</div>
              </div>
              <div className="about-stat-card dr-card">
                <div className="aa-stat-number" style={{ fontSize: '3rem' }}>50+</div>
                <div className="aa-stat-label">Marcas no Portfólio</div>
              </div>
              <div className="about-stat-card dr-card">
                <div className="aa-stat-number" style={{ fontSize: '3rem' }}>8+</div>
                <div className="aa-stat-label">Países Atendidos</div>
              </div>
              <div className="about-stat-card dr-card">
                <div className="aa-stat-number" style={{ fontSize: '3rem' }}>100%</div>
                <div className="aa-stat-label">Compliance ITAR/EAR</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="dr-section aa-how-bg">
        <div className="container">
          <div className="section-header">
            <p className="dr-eyebrow">Roadmap</p>
            <h2 className="dr-section-title">Nossa Jornada de Crescimento</h2>
          </div>
          <div className="aa-timeline">
            {TIMELINE.map((item) => (
              <div key={item.phase} className="aa-tl-item">
                <div className="aa-tl-phase">{item.phase}</div>
                <div className="aa-tl-content">
                  <h3 className="aa-tl-title">{item.title}</h3>
                  <p className="aa-tl-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="dr-section">
        <div className="container">
          <div className="section-header">
            <p className="dr-eyebrow">Princípios</p>
            <h2 className="dr-section-title">Nossos Valores</h2>
          </div>
          <div className="dr-grid-2">
            {VALUES.map((v) => (
              <div key={v.title} className="dr-card aa-why-item">
                <div className="aa-why-icon">{v.icon}</div>
                <h3 className="aa-why-title">{v.title}</h3>
                <p className="aa-why-desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARKETS */}
      <section className="dr-section aa-brands-bg">
        <div className="container">
          <div className="section-header">
            <p className="dr-eyebrow">Atuação</p>
            <h2 className="dr-section-title">Mercados que Atendemos</h2>
            <p className="dr-section-sub">
              Cobertura estratégica da América Latina com foco inicial no Brasil e expansão ativa
              para os mercados de maior potencial.
            </p>
          </div>
          <div className="markets-grid">
            {MARKETS.map((m) => (
              <div key={m.country} className="market-item dr-card">
                <div className="market-country">{m.country}</div>
                <span className="dr-badge-gold">{m.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="aa-cta-banner">
        <div className="container">
          <h2 className="aa-cta-title">Vamos Construir Esta Parceria?</h2>
          <p className="aa-cta-sub">
            Entre em contato com nossa equipe e descubra como a Arsenal Americano pode transformar
            sua operação de importação.
          </p>
          <div className="aa-cta-actions">
            <Link href="/contato" className="dr-btn-primary">
              Falar com Nossa Equipe
            </Link>
            <Link href="/servicos" className="dr-btn-outline">
              Ver Nossos Serviços
            </Link>
          </div>
        </div>
      </section>

    </PageLayout>
  )
}
