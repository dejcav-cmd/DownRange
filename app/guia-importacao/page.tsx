import type { Metadata } from 'next'
import Link from 'next/link'
import PageLayout from '../../components/layout/PageLayout'
import Breadcrumb from '../../components/layout/Breadcrumb'

export const metadata: Metadata = {
  title: 'Guia de Importação de Armas Americanas',
  description:
    'Guia completo para importadores brasileiros que querem trazer armas de fogo americanas — legislação ATF/ITAR/EAR, documentação, processos e passo a passo completo.',
  alternates: { canonical: 'https://arsenalamericano.com.br/guia-importacao' },
  openGraph: {
    type: 'website',
    url: 'https://arsenalamericano.com.br/guia-importacao',
    title: 'Guia de Importação de Armas Americanas | Arsenal Americano',
    description: 'Passo a passo completo: habilitação, licenças ATF/ITAR, logística e desembaraço.',
  },
}

const FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Qualquer empresa pode importar armas dos EUA?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Não. O importador precisa ter habilitação específica junto ao Exército Brasileiro (DGM) e estar em conformidade com o Estatuto do Desarmamento. Empresas de segurança privada têm requisitos adicionais da SENASP/Polícia Federal.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quanto tempo demora o processo de importação?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'O prazo varia conforme o tipo de produto e os órgãos envolvidos. Em média, o processo completo — desde a solicitação das licenças até o desembaraço aduaneiro — leva de 60 a 120 dias. Trabalhamos para otimizar cada etapa.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quais são os custos além do produto?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Os custos adicionais incluem: frete internacional especializado, seguro de carga, taxas de exportação EUA, taxas de importação Brasil (II, IPI, PIS/COFINS), despesas de desembaraço aduaneiro e honorários de despachante. Fornecemos estimativa detalhada na proposta.',
      },
    },
    {
      '@type': 'Question',
      name: 'Vocês trabalham com pedidos mínimos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim. Por questões logísticas e de custo-benefício, trabalhamos com pedidos mínimos que variam por produto. Entre em contato para discutir volumes e condições específicas para sua operação.',
      },
    },
    {
      '@type': 'Question',
      name: 'É possível importar munição junto com as armas?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim, com as devidas autorizações. Munição tem processo de licenciamento próprio, tanto nos EUA quanto no Brasil. Coordenamos a importação combinada para otimizar custos logísticos.',
      },
    },
    {
      '@type': 'Question',
      name: 'Como funciona o pagamento?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Trabalhamos com carta de crédito (L/C) e pagamento antecipado via transferência internacional. As condições específicas são definidas conforme o perfil e histórico do importador. Discutimos os termos durante a fase de proposta.',
      },
    },
  ],
}

const STEPS = [
  {
    num: '01',
    title: 'Verificar Habilitação do Importador',
    desc: 'O importador no Brasil precisa ter registro válido no Exército Brasileiro (DGM) e/ou no SINARM/SIGMA, conforme o tipo de produto. Empresas de segurança privada têm requisitos específicos da SENASP.',
    docs: ['Registro DGM ativo', 'CNPJ com atividade compatível', 'Certidão negativa de débitos'],
  },
  {
    num: '02',
    title: 'Obter Autorização de Importação',
    desc: 'A autorização de importação é emitida pela autoridade competente no país de destino. No Brasil, o processo envolve o Exército, o DECEX e, dependendo do produto, a DPF.',
    docs: [
      'Formulário de solicitação ao Exército',
      'Descrição técnica dos produtos',
      'Justificativa de uso',
    ],
  },
  {
    num: '03',
    title: 'Arsenal Americano Solicita Licença de Exportação',
    desc: 'Com a autorização de importação em mãos, a Arsenal Americano solicita a licença de exportação junto ao BIS (Bureau of Industry and Security) ou DDTC, conforme a classificação do produto sob EAR ou ITAR.',
    docs: [
      'Cópia da autorização de importação',
      'End-User Certificate (EUC)',
      'Documentação ITAR/EAR',
    ],
  },
  {
    num: '04',
    title: 'Aprovação e Logística',
    desc: 'Após aprovação de ambas as licenças (exportação nos EUA e importação no Brasil), coordenamos o embarque com transportadora especializada em carga de armamentos.',
    docs: ['Commercial Invoice', 'Packing List', 'Export License', 'Airway Bill / Bill of Lading'],
  },
  {
    num: '05',
    title: 'Desembaraço Aduaneiro',
    desc: 'O importador, com auxílio de despachante aduaneiro especializado, realiza o desembaraço junto à Receita Federal, com apresentação de toda a documentação de importação.',
    docs: ['DI (Declaração de Importação)', 'LI (Licença de Importação)', 'Documentos de embarque'],
  },
  {
    num: '06',
    title: 'Registro e Disponibilização',
    desc: 'Após desembaraço, os produtos são registrados nos sistemas competentes (SIGMA/SINARM) e liberados para comercialização pelo importador conforme autorização.',
    docs: ['Nota Fiscal de Importação', 'Registro SIGMA/SINARM', 'Laudos técnicos se exigidos'],
  },
]

const REGULATIONS = [
  {
    title: 'ATF — Bureau of Alcohol, Tobacco, Firearms and Explosives',
    desc: 'Órgão federal americano que regula a indústria de armas nos EUA. A Arsenal Americano possui licença FFL emitida pelo ATF, habilitando-nos a comercializar e exportar armas de fogo.',
    type: 'us',
  },
  {
    title: 'ITAR — International Traffic in Arms Regulations',
    desc: 'Regulamenta a exportação de armas de fogo, munições e equipamentos de defesa dos EUA. Itens na US Munitions List requerem licença DDTC. A Arsenal Americano é registrada no DDTC.',
    type: 'us',
  },
  {
    title: 'EAR — Export Administration Regulations',
    desc: 'Regulamenta exportações de itens de duplo uso e alguns itens de defesa não cobertos pelo ITAR. Administrado pelo BIS do Departamento de Comércio dos EUA.',
    type: 'us',
  },
  {
    title: 'Estatuto do Desarmamento (Lei 10.826/2003)',
    desc: 'Lei brasileira que regula o registro, posse e comercialização de armas de fogo no Brasil. Importações devem estar em conformidade com esta lei e seus decretos regulamentadores.',
    type: 'br',
  },
  {
    title: 'Regulamentação do Exército Brasileiro',
    desc: 'O EB é a autoridade competente para autorizar importações de armas de fogo, munições e produtos controlados no Brasil. Importadores precisam de registro ativo na DGM.',
    type: 'br',
  },
]

const FAQS = [
  {
    q: 'Qualquer empresa pode importar armas dos EUA?',
    a: 'Não. O importador precisa ter habilitação específica junto ao Exército Brasileiro (DGM) e estar em conformidade com o Estatuto do Desarmamento. Empresas de segurança privada têm requisitos adicionais da SENASP/Polícia Federal.',
  },
  {
    q: 'Quanto tempo demora o processo de importação?',
    a: 'O prazo varia conforme o tipo de produto e os órgãos envolvidos. Em média, o processo completo — desde a solicitação das licenças até o desembaraço aduaneiro — leva de 60 a 120 dias. Trabalhamos para otimizar cada etapa.',
  },
  {
    q: 'Quais são os custos além do produto?',
    a: 'Os custos adicionais incluem: frete internacional especializado, seguro de carga, taxas de exportação EUA, taxas de importação Brasil (II, IPI, PIS/COFINS), despesas de desembaraço aduaneiro e honorários de despachante. Fornecemos estimativa detalhada na proposta.',
  },
  {
    q: 'Vocês trabalham com pedidos mínimos?',
    a: 'Sim. Por questões logísticas e de custo-benefício, trabalhamos com pedidos mínimos que variam por produto. Entre em contato para discutir volumes e condições específicas para sua operação.',
  },
  {
    q: 'É possível importar munição junto com as armas?',
    a: 'Sim, com as devidas autorizações. Munição tem processo de licenciamento próprio, tanto nos EUA quanto no Brasil. Coordenamos a importação combinada para otimizar custos logísticos.',
  },
  {
    q: 'Como funciona o pagamento?',
    a: 'Trabalhamos com carta de crédito (L/C) e pagamento antecipado via transferência internacional. As condições específicas são definidas conforme o perfil e histórico do importador. Discutimos os termos durante a fase de proposta.',
  },
]

export default function GuiaImportacaoPage() {
  return (
    <PageLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <Breadcrumb crumbs={[{ label: 'HOME', href: '/' }, { label: 'GUIA DE IMPORTAÇÃO' }]} />

      <div className="page-hero" data-title="GUIA DE IMPORTAÇÃO">
        <div className="container">
          <p className="dr-eyebrow">Conhecimento</p>
          <h1 className="page-hero-title">Guia de Importação</h1>
          <p className="page-hero-sub">
            Tudo o que um importador precisa saber sobre o processo de trazer armas de fogo
            americanas para o Brasil e América Latina.
          </p>
        </div>
      </div>

      {/* DISCLAIMER */}
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="dr-alert-warn">
          <strong>Aviso Legal:</strong> Este guia tem caráter informativo e educacional. A
          legislação de importação de armas de fogo é complexa e sujeita a alterações. Consulte
          sempre um advogado especializado e o despachante aduaneiro antes de iniciar qualquer
          operação.
        </div>
      </div>

      {/* PROCESS */}
      <section className="dr-section">
        <div className="container">
          <div className="section-header">
            <p className="dr-eyebrow">Passo a Passo</p>
            <h2 className="dr-section-title">O Processo de Importação</h2>
            <p className="dr-section-sub">
              Uma visão geral simplificada do processo — da habilitação do importador ao
              desembaraço aduaneiro.
            </p>
          </div>
          <div className="guide-steps">
            {STEPS.map((step) => (
              <div key={step.num} className="guide-step dr-card">
                <div className="guide-step-header">
                  <div className="guide-step-num">{step.num}</div>
                  <h3 className="guide-step-title">{step.title}</h3>
                </div>
                <p className="guide-step-desc">{step.desc}</p>
                <div className="guide-step-docs">
                  <p className="guide-docs-label">Documentos típicos:</p>
                  <ul className="guide-docs-list">
                    {step.docs.map((doc) => (
                      <li key={doc} className="guide-docs-item">
                        <span style={{ color: 'var(--gold)' }}>›</span> {doc}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REGULATIONS */}
      <section className="dr-section aa-how-bg">
        <div className="container">
          <div className="section-header">
            <p className="dr-eyebrow">Marco Legal</p>
            <h2 className="dr-section-title">Regulamentações Aplicáveis</h2>
          </div>
          <div className="regulations-grid">
            <div>
              <h3 className="regs-country-title">🇺🇸 Regulamentações Americanas</h3>
              {REGULATIONS.filter((r) => r.type === 'us').map((reg) => (
                <div key={reg.title} className="reg-card dr-card">
                  <h4 className="reg-title">{reg.title}</h4>
                  <p className="reg-desc">{reg.desc}</p>
                </div>
              ))}
            </div>
            <div>
              <h3 className="regs-country-title">🇧🇷 Regulamentações Brasileiras</h3>
              {REGULATIONS.filter((r) => r.type === 'br').map((reg) => (
                <div key={reg.title} className="reg-card dr-card">
                  <h4 className="reg-title">{reg.title}</h4>
                  <p className="reg-desc">{reg.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="dr-section">
        <div className="container">
          <div className="section-header">
            <p className="dr-eyebrow">Dúvidas Frequentes</p>
            <h2 className="dr-section-title">Perguntas dos Importadores</h2>
          </div>
          <div className="faq-list">
            {FAQS.map((faq) => (
              <div key={faq.q} className="faq-item dr-card">
                <h3 className="faq-q">{faq.q}</h3>
                <p className="faq-a">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="aa-cta-banner">
        <div className="container">
          <h2 className="aa-cta-title">Ainda Tem Dúvidas?</h2>
          <p className="aa-cta-sub">
            Nossa equipe está pronta para esclarecer qualquer questão sobre o processo de
            importação e ajudar você a estruturar sua operação.
          </p>
          <div className="aa-cta-actions">
            <Link href="/contato" className="dr-btn-primary">
              Falar com Especialista
            </Link>
            <a
              href="https://wa.me/15551234567?text=Olá,%20tenho%20dúvidas%20sobre%20importação%20de%20armas%20americanas"
              target="_blank"
              rel="noopener noreferrer"
              className="dr-btn-whatsapp"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </section>

    </PageLayout>
  )
}
