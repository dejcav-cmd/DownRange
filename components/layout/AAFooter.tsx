import Link from 'next/link'
import Image from 'next/image'

const SERVICOS = [
  { href: '/servicos#sourcing-armas', label: 'Sourcing de Armas de Fogo' },
  { href: '/servicos#opticas-acessorios', label: 'Ópticas & Acessórios' },
  { href: '/servicos#compliance', label: 'Compliance & Documentação' },
  { href: '/servicos#logistica', label: 'Logística Internacional' },
  { href: '/servicos#inteligencia-mercado', label: 'Inteligência de Mercado' },
  { href: '/servicos#seguranca-le', label: 'Segurança Privada & Policial' },
]

const EMPRESA = [
  { href: '/sobre', label: 'Sobre Nós' },
  { href: '/catalogo', label: 'Catálogo de Marcas' },
  { href: '/noticias', label: 'Notícias & Intel' },
  { href: '/guia-importacao', label: 'Guia de Importação' },
  { href: '/contato', label: 'Contato' },
]

// WhatsApp SVG reusable
const WaSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
)

export default function Footer() {
  return (
    <footer className="footer">

      {/* ── DownRange Ecosystem Strip ── */}
      <div className="footer-dr-strip">
        <div className="container footer-dr-inner">
          <div className="footer-dr-brand">
            <span className="footer-dr-wordmark">DOWNRANGE</span>
            <span className="footer-dr-sub">Intelligence Platform</span>
          </div>
          <div className="footer-dr-divider" aria-hidden="true" />
          <div className="footer-dr-content">
            <p className="footer-dr-desc">
              Arsenal Americano é parte do grupo{' '}
              <a
                href="https://downrangeco.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-dr-link"
              >
                DownRange
              </a>
              {' '}— a maior plataforma de inteligência de armas de fogo das Américas.
              Acesse dados de mercado em tempo real, legislação atualizada e lançamentos exclusivos.
            </p>
            <div className="footer-dr-pills">
              <a href="https://downrangeco.com/market" target="_blank" rel="noopener noreferrer" className="footer-dr-pill">
                Preços de Mercado
              </a>
              <a href="https://downrangeco.com/laws" target="_blank" rel="noopener noreferrer" className="footer-dr-pill">
                Leis & Regulações
              </a>
              <a href="https://downrangeco.com/noticias" target="_blank" rel="noopener noreferrer" className="footer-dr-pill">
                Notícias do Setor
              </a>
              <a href="https://downrangeco.com/ballistics" target="_blank" rel="noopener noreferrer" className="footer-dr-pill">
                Calculadora Balística
              </a>
              <a href="https://downrangeco.com" target="_blank" rel="noopener noreferrer" className="footer-dr-cta-link">
                Acessar DownRange →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Footer Grid ── */}
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <Image
                src="/logo-web.png"
                alt="Arsenal Americano"
                width={356}
                height={200}
                style={{ height: 56, width: 'auto', display: 'block' }}
              />
            </div>
            <p className="footer-brand-desc">
              Parceiro estratégico de sourcing internacional de armas de fogo para importadores
              brasileiros e latino-americanos. FFL licenciado nos Estados Unidos.
            </p>
            <div className="footer-badges">
              <span className="dr-badge dr-badge-gold">FFL Licenciado EUA</span>
              <span className="dr-badge dr-badge-green">Exportador Certificado</span>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Serviços</h4>
            {SERVICOS.map((item) => (
              <Link key={item.href} href={item.href} className="footer-link">
                {item.label}
              </Link>
            ))}
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Empresa</h4>
            {EMPRESA.map((item) => (
              <Link key={item.href} href={item.href} className="footer-link">
                {item.label}
              </Link>
            ))}
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Contato</h4>
            <p className="footer-contact-item">
              <span className="footer-contact-icon">📧</span>
              contato@arsenalamericano.com.br
            </p>
            <p className="footer-contact-item">
              <span className="footer-contact-icon">🇺🇸</span>
              Operações nos EUA
            </p>
            <p className="footer-contact-item">
              <span className="footer-contact-icon">🇧🇷</span>
              Atendimento em Português
            </p>
            <a
              href="https://wa.me/15551234567?text=Olá,%20tenho%20interesse%20em%20importar%20armas%20dos%20EUA"
              target="_blank"
              rel="noopener noreferrer"
              className="dr-btn-whatsapp footer-wa"
            >
              <WaSvg />
              WhatsApp
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-disclaimer">
            Arsenal Americano opera em conformidade com todas as regulamentações federais dos EUA
            (ATF/ITAR/EAR). Exportações sujeitas à aprovação governamental. Destinado exclusivamente
            a importadores licenciados. Parte do grupo DownRange —{' '}
            <a href="https://downrangeco.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)' }}>
              downrangeco.com
            </a>
            .
          </p>
          <p className="footer-copyright">
            © {new Date().getFullYear()} Arsenal Americano. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
