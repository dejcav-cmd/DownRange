import type { Metadata } from 'next'
import PageLayout from '../../components/layout/PageLayout'
import Breadcrumb from '../../components/layout/Breadcrumb'

export const metadata: Metadata = {
  title: 'Serviços de Importação de Armas Americanas',
  description:
    'Sourcing de pistolas, rifles, espingardas e munição americanas. Compliance ATF/ITAR/EAR, logística internacional e inteligência de mercado para importadores da América Latina.',
  alternates: { canonical: 'https://arsenalamericano.com.br/servicos' },
  openGraph: {
    type: 'website',
    url: 'https://arsenalamericano.com.br/servicos',
    title: 'Serviços de Importação de Armas Americanas | Arsenal Americano',
    description: 'Sourcing, compliance e logística de armas americanas para importadores latino-americanos.',
  },
}

const SERVICES = [
  {
    id: 'sourcing-armas',
    icon: '🎯',
    badge: 'PRINCIPAL',
    title: 'Sourcing de Armas de Fogo',
    tagline: 'Pistolas · Revólveres · Rifles · Espingardas',
    desc: 'Acesso direto a mais de 200 fabricantes americanos. Qualquer modelo, qualquer calibre — se existe no mercado dos EUA, conseguimos para você. Trabalhamos com distribuidores Tier-1 que varejistas não alcançam.',
    features: [
      'Pistolas semi-automáticas de todos os calibres e capacidades',
      'Revólveres de porte ao .500 Magnum — uso pessoal e duty',
      'Rifles bolt-action, semi-automáticos e de alavanca',
      'Espingardas táticas, de caça e de competição',
      'Armas de uso restrito para importadores habilitados',
      'Modelos descontinuados via sourcing especial sob consulta',
    ],
    brands: ['Smith & Wesson', 'Glock', 'Sig Sauer', 'Ruger', 'Springfield', 'Colt', 'Beretta', 'Kimber', 'HK', 'Daniel Defense'],
  },
  {
    id: 'opticas-acessorios',
    icon: '🔭',
    badge: 'PREMIUM',
    title: 'Ópticas & Acessórios',
    tagline: 'Lunetas · Red Dots · Holsters · Táticos',
    desc: 'O importador que só vende armas deixa metade da margem na mesa. Ópticas e equipamentos táticos completam o portfólio, fidelizam o cliente e têm ticket médio superior. Tier-1 ao básico — nós sourciamos tudo.',
    features: [
      'Lunetas de precisão: Nightforce, Vortex, Leupold, US Optics',
      'Red dots e colimadores: Aimpoint, Trijicon MRO, Holosun',
      'Holsters duty e IWB: Safariland, Blackhawk, Alien Gear',
      'Rail systems, bipodes e coronhas: Magpul, B5 Systems',
      'Lanternas e lasers táticos: SureFire, Streamlight, Crimson Trace',
      'Supressores (Form 4 ATF) para importadores habilitados',
    ],
    brands: ['Nightforce', 'Vortex', 'Trijicon', 'Aimpoint', 'SureFire', 'Magpul'],
  },
  {
    id: 'compliance',
    icon: '📋',
    badge: 'ESSENCIAL',
    title: 'Compliance & Documentação',
    tagline: 'ATF · ITAR/EAR · DPF · Exército Brasileiro',
    desc: 'Compliance é o que separa importações bem-sucedidas de mercadorias retidas ou devolvidas. Nossa equipe gerencia toda a cadeia documental nos dois sentidos — EUA e Brasil — para que você não corra nenhum risco.',
    features: [
      'Licenças de exportação ATF DSP-5 e DSP-73',
      'Classificação e gestão ITAR/EAR por produto',
      'End-User Certificates (EUC) e Statement of End Use',
      'Coordenação com DPF — Departamento Federal de Polícia',
      'Autorização prévia do Comando do Exército (COLOG)',
      'Arquivo e gestão documental por 5 anos',
    ],
    brands: [],
  },
  {
    id: 'logistica',
    icon: '🚢',
    badge: 'PORTA A PORTA',
    title: 'Logística Internacional',
    tagline: 'Marítimo · Aéreo · Seguro · Desembaraço',
    desc: 'Da fábrica nos EUA até a porta do seu armazém no Brasil — gerenciamos cada etapa. Transportadoras especializadas em material bélico, seguro adequado e parceiros aduaneiros de confiança em Santos, Rio e Manaus.',
    features: [
      'Consolidação de cargas para reduzir custo por unidade',
      'Rotas marítimas Miami–Santos e Nova York–Rio',
      'Frete aéreo para pedidos urgentes (aprovação caso a caso)',
      'Seguro de carga especializado para material bélico',
      'Rastreamento em tempo real do início ao fim',
      'Desembaraço em Santos, Rio de Janeiro e Manaus (ZFM)',
    ],
    brands: [],
  },
  {
    id: 'inteligencia-mercado',
    icon: '📊',
    badge: 'ASSINATURA',
    title: 'Inteligência de Mercado',
    tagline: 'Preços · Tendências · Legislação · Lançamentos',
    desc: 'Decisões de importação baseadas em intuição custam caro. Nossos relatórios mensais entregam dados reais: preços FOB atuais, análise de demanda por categoria, novos lançamentos e monitoramento regulatório.',
    features: [
      'Relatório mensal com preços FOB por categoria e marca',
      'Alertas de novos lançamentos antes da chegada ao varejo',
      'Análise de demanda por estado e perfil de comprador',
      'Monitoramento de decretos, portarias e decisões judiciais',
      'Benchmark de preços praticados no mercado nacional',
      'Recomendação de mix de estoque por nível de investimento',
    ],
    brands: [],
  },
  {
    id: 'seguranca-le',
    icon: '🛡️',
    badge: 'B2B',
    title: 'Segurança Privada & Policial',
    tagline: 'Empresas de Segurança · Corporativo · Contratos Gov.',
    desc: 'Empresas de segurança privada e forças policiais têm necessidades específicas: volumes padronizados, documentação adicional, prazos rígidos. Temos experiência em licitações públicas e contratos corporativos de grande porte.',
    features: [
      'Pistolas de serviço em lotes de 50 a 2.000 unidades',
      'Espingardas táticas para segurança patrimonial',
      'Fardamento, coletes balísticos e equipamentos NLL',
      'Documentação completa para licitações públicas',
      'Treinamento técnico de manutenção incluso nas entregas',
      'Contratos de reposição de partes e peças sobressalentes',
    ],
    brands: [],
  },
]

const BADGE_COLORS: Record<string, string> = {
  PRINCIPAL: 'var(--gold)',
  PREMIUM: '#8B5CF6',
  ESSENCIAL: '#3B82F6',
  'PORTA A PORTA': '#16A34A',
  ASSINATURA: 'var(--gold)',
  B2B: 'var(--text-dim)',
}

export default function ServicosPage() {
  return (
    <PageLayout>
      <Breadcrumb crumbs={[{ label: 'HOME', href: '/' }, { label: 'SERVIÇOS' }]} />

      {/* ── HERO ── */}
      <div className="page-hero" data-title="SERVIÇOS">
        <div className="container">
          <p className="dr-eyebrow">O Que Oferecemos</p>
          <h1 className="page-hero-title">Serviços & Soluções</h1>
          <p className="page-hero-sub">
            Do sourcing de uma pistola específica à gestão de contratos corporativos de grande porte —
            cobrimos todo o espectro da importação de armas e acessórios americanos para a América Latina.
          </p>
        </div>
      </div>

      {/* ── SERVICES GRID ── */}
      <div className="dr-page">
        <div className="container">

          {/* Quick nav */}
          <div className="sv-quicknav">
            {SERVICES.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="sv-quicknav-item">
                <span style={{ marginRight: '0.4rem' }}>{s.icon}</span>{s.title}
              </a>
            ))}
          </div>

          {/* Service sections */}
          {SERVICES.map((s) => (
            <section key={s.id} id={s.id} className="sv-section">
              <div className="sv-section-header">
                <div className="sv-section-icon">{s.icon}</div>
                <div>
                  <span
                    className="sv-badge"
                    style={{ background: BADGE_COLORS[s.badge] || 'var(--gold)' }}
                  >
                    {s.badge}
                  </span>
                  <h2 className="sv-section-title">{s.title}</h2>
                  <p className="sv-section-tagline">{s.tagline}</p>
                </div>
              </div>

              <div className="sv-section-body">
                <div className="sv-desc-col">
                  <p className="sv-desc">{s.desc}</p>

                  {s.brands.length > 0 && (
                    <div className="sv-brands">
                      <span className="sv-brands-label">Marcas que sourciamos:</span>
                      <div className="sv-brands-list">
                        {s.brands.map((b) => (
                          <span key={b} className="pill-tag">{b}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <a href="/contato" className="dr-btn-primary sv-cta">
                    Consultar {s.title} →
                  </a>
                </div>

                <div className="sv-features-col dr-card">
                  <p className="sv-features-label">O QUE ESTÁ INCLUÍDO</p>
                  <ul className="sv-features-list">
                    {s.features.map((f) => (
                      <li key={f} className="sv-feature-item">
                        <span className="sv-check">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ))}

          {/* CTA */}
          <section className="aa-cta-banner" style={{ marginTop: '1rem', marginBottom: '2rem' }}>
            <div className="container aa-cta-content">
              <h2 className="aa-cta-title">Não Encontrou o que Precisa?</h2>
              <p className="aa-cta-sub">
                Se existe no mercado americano, conseguimos. Nossa equipe responde em até 48 horas.
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <a href="/contato" className="dr-btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2.5rem' }}>
                  Consulta Personalizada
                </a>
                <a
                  href="https://wa.me/15551234567"
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

        </div>
      </div>

    </PageLayout>
  )
}
