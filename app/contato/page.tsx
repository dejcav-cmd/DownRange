import type { Metadata } from 'next'
import PageLayout from '../../components/layout/PageLayout'
import Breadcrumb from '../../components/layout/Breadcrumb'
import ContatoForm from './ContatoForm'

export const metadata: Metadata = {
  title: 'Contato — Solicitar Cotação de Armas Americanas',
  description:
    'Fale com nossa equipe de especialistas em importação de armas americanas. Importadores licenciados do Brasil e América Latina. Resposta em até 24 horas.',
  alternates: { canonical: 'https://arsenalamericano.com.br/contato' },
  openGraph: {
    type: 'website',
    url: 'https://arsenalamericano.com.br/contato',
    title: 'Contato | Arsenal Americano',
    description: 'Entre em contato com nossa equipe. Cotações em 48h para importadores licenciados.',
  },
}

export default function ContatoPage() {
  return (
    <PageLayout>
      <Breadcrumb crumbs={[{ label: 'HOME', href: '/' }, { label: 'CONTATO' }]} />

      <div className="page-hero" data-title="CONTATO">
        <div className="container">
          <p className="dr-eyebrow">Vamos Conversar</p>
          <h1 className="page-hero-title">Entre em Contato</h1>
          <p className="page-hero-sub">
            Preencha o formulário abaixo e nossa equipe entrará em contato em até 24 horas. Para
            respostas imediatas, use nosso WhatsApp.
          </p>
        </div>
      </div>

      <ContatoForm />
    </PageLayout>
  )
}
