'use client'

import { useState } from 'react'

const INTERESTS = [
  'Sourcing de Pistolas',
  'Sourcing de Revólveres',
  'Sourcing de Rifles',
  'Sourcing de Espingardas',
  'Compliance & Documentação',
  'Logística Internacional',
  'Inteligência de Mercado',
  'Parceria Geral',
]

const WaSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
)

export default function ContatoForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    country: '',
    interest: '',
    volume: '',
    message: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setStatus('success')
        setFormData({
          name: '',
          company: '',
          email: '',
          phone: '',
          country: '',
          interest: '',
          volume: '',
          message: '',
        })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="dr-page">
      <div className="container">
        <div className="contact-grid">
          {/* FORM */}
          <div className="contact-form-wrap">
            {status === 'success' ? (
              <div className="contact-success dr-card">
                <div className="contact-success-icon">✅</div>
                <h3 className="contact-success-title">Mensagem Enviada!</h3>
                <p className="contact-success-desc">
                  Nossa equipe recebeu sua mensagem e entrará em contato em até 24 horas. Para
                  assuntos urgentes, use nosso WhatsApp.
                </p>
                <a
                  href="https://wa.me/15551234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dr-btn-whatsapp"
                  style={{ display: 'inline-flex', marginTop: '1.5rem' }}
                >
                  <WaSvg />
                  Continuar pelo WhatsApp
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="aa-form dr-card">
                <h2 className="form-title">Solicitar Contato</h2>

                <div className="form-row">
                  <div className="aa-field">
                    <label htmlFor="name" className="aa-label">
                      Nome Completo *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="aa-input"
                      placeholder="Seu nome"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="aa-field">
                    <label htmlFor="company" className="aa-label">
                      Empresa / Razão Social *
                    </label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      className="aa-input"
                      placeholder="Nome da empresa"
                      value={formData.company}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="aa-field">
                    <label htmlFor="email" className="aa-label">
                      E-mail Comercial *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="aa-input"
                      placeholder="email@empresa.com.br"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="aa-field">
                    <label htmlFor="phone" className="aa-label">
                      WhatsApp / Telefone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      className="aa-input"
                      placeholder="+55 11 99999-9999"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="aa-field">
                    <label htmlFor="country" className="aa-label">
                      País de Operação *
                    </label>
                    <select
                      id="country"
                      name="country"
                      className="aa-select"
                      value={formData.country}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecione o país</option>
                      <option value="BR">🇧🇷 Brasil</option>
                      <option value="CO">🇨🇴 Colômbia</option>
                      <option value="PE">🇵🇪 Peru</option>
                      <option value="CL">🇨🇱 Chile</option>
                      <option value="PA">🇵🇦 Panamá</option>
                      <option value="DO">🇩🇴 República Dominicana</option>
                      <option value="EC">🇪🇨 Equador</option>
                      <option value="UY">🇺🇾 Uruguai</option>
                      <option value="OTHER">Outro</option>
                    </select>
                  </div>
                  <div className="aa-field">
                    <label htmlFor="interest" className="aa-label">
                      Área de Interesse
                    </label>
                    <select
                      id="interest"
                      name="interest"
                      className="aa-select"
                      value={formData.interest}
                      onChange={handleChange}
                    >
                      <option value="">Selecione o interesse</option>
                      {INTERESTS.map((i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="aa-field">
                  <label htmlFor="volume" className="aa-label">
                    Volume Estimado (unidades/ano)
                  </label>
                  <select
                    id="volume"
                    name="volume"
                    className="aa-select"
                    value={formData.volume}
                    onChange={handleChange}
                  >
                    <option value="">Selecione o volume</option>
                    <option value="<100">Menos de 100 unidades</option>
                    <option value="100-500">100 a 500 unidades</option>
                    <option value="500-2000">500 a 2.000 unidades</option>
                    <option value=">2000">Mais de 2.000 unidades</option>
                  </select>
                </div>

                <div className="aa-field">
                  <label htmlFor="message" className="aa-label">
                    Mensagem *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    className="aa-textarea"
                    placeholder="Conte-nos sobre sua empresa, produtos de interesse e como podemos ajudar..."
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                {status === 'error' && (
                  <div className="dr-alert-warn" style={{ marginBottom: '1rem' }}>
                    Erro ao enviar mensagem. Tente novamente ou entre em contato pelo WhatsApp.
                  </div>
                )}

                <button
                  type="submit"
                  className="dr-btn-primary"
                  disabled={status === 'sending'}
                  style={{ width: '100%' }}
                >
                  {status === 'sending' ? 'Enviando...' : 'Enviar Mensagem'}
                </button>

                <p className="form-disclaimer">
                  Suas informações são tratadas com confidencialidade absoluta. Nunca
                  compartilhamos dados de parceiros com terceiros.
                </p>
              </form>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="contact-sidebar">
            <div className="contact-info dr-card">
              <h3 className="contact-info-title">Contato Direto</h3>
              <div className="contact-info-items">
                <div className="contact-info-item">
                  <span className="contact-info-icon">📧</span>
                  <div>
                    <div className="contact-info-label">E-mail</div>
                    <a href="mailto:contato@arsenalamericano.com.br" className="contact-info-val">
                      contato@arsenalamericano.com.br
                    </a>
                  </div>
                </div>
                <div className="contact-info-item">
                  <span className="contact-info-icon">🌐</span>
                  <div>
                    <div className="contact-info-label">Website</div>
                    <span className="contact-info-val">arsenalamericano.com.br</span>
                  </div>
                </div>
                <div className="contact-info-item">
                  <span className="contact-info-icon">🇺🇸</span>
                  <div>
                    <div className="contact-info-label">Operações</div>
                    <span className="contact-info-val">Estados Unidos da América</span>
                  </div>
                </div>
                <div className="contact-info-item">
                  <span className="contact-info-icon">🕐</span>
                  <div>
                    <div className="contact-info-label">Resposta</div>
                    <span className="contact-info-val">Até 24 horas úteis</span>
                  </div>
                </div>
              </div>

              <a
                href="https://wa.me/15551234567?text=Olá,%20sou%20importador%20e%20quero%20saber%20mais%20sobre%20a%20Arsenal%20Americano"
                target="_blank"
                rel="noopener noreferrer"
                className="dr-btn-whatsapp"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}
              >
                <WaSvg />
                WhatsApp Empresarial
              </a>
            </div>

            <div className="contact-note dr-card">
              <h4 className="contact-note-title">🔒 Confidencialidade Garantida</h4>
              <p className="contact-note-desc">
                Toda comunicação é tratada com sigilo absoluto. Suas informações comerciais,
                volumes e estratégias de negócio nunca são compartilhadas com terceiros.
              </p>
            </div>

            <div className="contact-note dr-card">
              <h4 className="contact-note-title">⚖️ Operação 100% Legal</h4>
              <p className="contact-note-desc">
                Todas as exportações são realizadas em conformidade com ATF, ITAR/EAR e legislação
                do país de destino. Você nunca corre riscos regulatórios ao trabalhar com a
                Arsenal Americano.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
