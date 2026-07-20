import type { Metadata } from 'next'
import Link from 'next/link'
import PageLayout from '../../components/layout/PageLayout'
import Breadcrumb from '../../components/layout/Breadcrumb'

export const metadata: Metadata = {
  title: 'Catálogo de Marcas Americanas',
  description:
    'Portfólio completo de armas de fogo americanas disponíveis para importação: Glock, Sig Sauer, Colt, Smith & Wesson, Ruger, Daniel Defense e 200+ marcas. Cotação em 48h.',
  alternates: { canonical: 'https://arsenalamericano.com.br/catalogo' },
  openGraph: {
    type: 'website',
    url: 'https://arsenalamericano.com.br/catalogo',
    title: 'Catálogo de Marcas Americanas | Arsenal Americano',
    description: 'Glock, Sig Sauer, Colt, S&W e 200+ marcas disponíveis para importação.',
  },
}

const CATEGORIES = [
  {
    cat: 'Pistolas',
    icon: '🔫',
    brands: [
      {
        name: 'Glock',
        origin: 'Áustria/EUA',
        highlight: 'Série G17, G19, G45 — as mais vendidas do mundo',
        tags: ['Polímero', 'Semi-auto', 'Alta confiabilidade'],
      },
      {
        name: 'Sig Sauer',
        origin: 'Suíça/EUA',
        highlight: 'P320, P226, P365 — escolha das forças especiais americanas',
        tags: ['Premium', 'Modular', 'Military Grade'],
      },
      {
        name: 'Smith & Wesson',
        origin: 'EUA',
        highlight: 'M&P Shield, M&P 2.0 — líderes em porte oculto',
        tags: ['M&P Series', 'Porte oculto', 'Compacto'],
      },
      {
        name: 'Springfield Armory',
        origin: 'EUA',
        highlight: 'Hellcat, XD-M Elite — inovação americana em pistolas',
        tags: ['Hellcat', 'XD-M', 'Alta capacidade'],
      },
      {
        name: 'Walther',
        origin: 'Alemanha/EUA',
        highlight: 'PDP, PPQ — ergonomia e precisão alemãs',
        tags: ['Alemã', 'PDP', 'Competição'],
      },
      {
        name: 'CZ-USA',
        origin: 'Rep. Tcheca/EUA',
        highlight: 'P-10, Shadow 2 — favoritas de atiradores esportivos',
        tags: ['Esportiva', 'Shadow 2', 'IPSC'],
      },
    ],
  },
  {
    cat: 'Revólveres',
    icon: '🎯',
    brands: [
      {
        name: 'Smith & Wesson',
        origin: 'EUA',
        highlight: 'Série Model 686, 642 — tradição americana em revólveres',
        tags: ['686', '642', 'Aço inox'],
      },
      {
        name: 'Ruger',
        origin: 'EUA',
        highlight: 'GP100, SP101 — robustez e confiabilidade americanas',
        tags: ['GP100', 'SP101', 'Robusto'],
      },
      {
        name: 'Taurus USA',
        origin: 'Brasil/EUA',
        highlight: 'Judge, 856 — opções versáteis e acessíveis',
        tags: ['Judge', 'Acessível', 'Versátil'],
      },
    ],
  },
  {
    cat: 'Rifles',
    icon: '🏹',
    brands: [
      {
        name: 'Colt',
        origin: 'EUA',
        highlight: 'AR-15, M4 Carbine — lenda americana em plataforma AR',
        tags: ['AR-15', 'M4', 'Clássico'],
      },
      {
        name: 'Ruger',
        origin: 'EUA',
        highlight: 'AR-556, Precision Rifle — confiabilidade americana',
        tags: ['AR-556', 'Precision', 'Custo-benefício'],
      },
      {
        name: 'Heckler & Koch',
        origin: 'Alemanha/EUA',
        highlight: 'HK433, SFP9 — engenharia alemã para forças de segurança',
        tags: ['Militar', 'LE Grade', 'HK433'],
      },
    ],
  },
  {
    cat: 'Espingardas',
    icon: '💥',
    brands: [
      {
        name: 'Mossberg',
        origin: 'EUA',
        highlight: '500, 590 — a espingarda mais confiável do mundo',
        tags: ['500 Series', '590', 'Tático'],
      },
      {
        name: 'Remington',
        origin: 'EUA',
        highlight: '870, 1100 — ícone americano com 70+ anos de história',
        tags: ['870', '1100', 'Clássico'],
      },
      {
        name: 'Beretta USA',
        origin: 'Itália/EUA',
        highlight: 'A400, DT11 — preferência de atiradores olímpicos',
        tags: ['Olímpico', 'A400', 'Esportivo'],
      },
    ],
  },
]

export default function CatalogoPage() {
  return (
    <PageLayout>
      <Breadcrumb crumbs={[{ label: 'HOME', href: '/' }, { label: 'CATÁLOGO' }]} />

      <div className="page-hero" data-title="CATÁLOGO">
        <div className="container">
          <p className="dr-eyebrow">Portfólio de Marcas</p>
          <h1 className="page-hero-title">As Melhores Marcas Americanas</h1>
          <p className="page-hero-sub">
            Acesso a mais de 50 marcas premium do mercado americano — pistolas, revólveres, rifles e
            espingardas para todos os segmentos do mercado de defesa e segurança.
          </p>
        </div>
      </div>

      <div className="dr-page">
        <div className="container">
          <div className="dr-alert-info catalog-notice">
            <strong>Para Importadores Licenciados.</strong> Este catálogo é destinado exclusivamente
            a importadores com licença válida no país de destino. Todas as exportações estão sujeitas
            a aprovação governamental e regulamentações ATF/ITAR/EAR.
          </div>

          {CATEGORIES.map((category) => (
            <div key={category.cat} className="dr-section">
              <div className="cat-header">
                <span className="cat-icon">{category.icon}</span>
                <h2 className="dr-section-title">{category.cat}</h2>
              </div>
              <div className="dr-grid-3">
                {category.brands.map((brand) => (
                  <div key={brand.name} className="aa-brand-card dr-card">
                    <div className="brand-card-header">
                      <h3 className="brand-card-name">{brand.name}</h3>
                      <span className="brand-card-origin">{brand.origin}</span>
                    </div>
                    <p className="brand-card-highlight">{brand.highlight}</p>
                    <div className="brand-card-tags">
                      {brand.tags.map((tag) => (
                        <span key={tag} className="dr-badge-gold brand-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="catalog-more dr-card">
            <div className="catalog-more-content">
              <h3 className="catalog-more-title">Não encontrou o que procura?</h3>
              <p className="catalog-more-desc">
                Este catálogo representa apenas uma parte do nosso portfólio. Temos acesso a
                virtualmente qualquer marca ou modelo disponível no mercado americano. Entre em
                contato com nossa equipe com sua lista de interesse.
              </p>
            </div>
            <Link href="/contato" className="dr-btn-primary">
              Consultar Disponibilidade
            </Link>
          </div>
        </div>
      </div>

      <section className="aa-cta-banner">
        <div className="container">
          <h2 className="aa-cta-title">Pronto para Solicitar uma Cotação?</h2>
          <p className="aa-cta-sub">
            Envie sua lista de interesse e nossa equipe preparará uma proposta detalhada com preços,
            prazos e documentação necessária.
          </p>
          <div className="aa-cta-actions">
            <Link href="/contato" className="dr-btn-primary">
              Solicitar Cotação
            </Link>
            <a
              href="https://wa.me/15551234567?text=Olá,%20quero%20solicitar%20uma%20cotação%20de%20armas%20americanas"
              target="_blank"
              rel="noopener noreferrer"
              className="dr-btn-whatsapp"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp Direto
            </a>
          </div>
        </div>
      </section>

    </PageLayout>
  )
}
