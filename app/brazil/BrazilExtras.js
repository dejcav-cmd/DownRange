'use client'
import { useState } from 'react'

const LEIS = [
  { id:1, nome:'Estatuto do Desarmamento (Lei 10.826/2003)', status:'EM VIGOR', data:'Dez 2003', impacto:'CRÍTICO',
    resumo:'Principal lei de controle de armas do Brasil. Restringe porte, exige registro, define categorias de uso permitido vs restrito.',
    detalhe:'Define armas de uso permitido (calibres como .38, .32, 9mm civil) e uso restrito (calibres militares, full-auto). O porte é quase impossível para civis — exige efetiva necessidade e aprovação da Polícia Federal.',
    url:'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.826.htm' },
  { id:2, nome:'Decretos Bolsonaro (2019-2022)', status:'PARCIALMENTE VIGENTE', data:'2019-2022', impacto:'ALTO',
    resumo:'Série de decretos que expandiram acesso a armas para CAC: calibres .40 e .45 liberados, limites de armas aumentados, registro simplificado.',
    detalhe:'Mais de 20 decretos expandiram o acesso. Highlights: aumento do limite de armas para CAC (até 60 para colecionadores), liberação de calibres .40 e .45, aumento do limite de munição para 5.000 unidades de .22 LR.',
    url:'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/decreto/D9785.htm' },
  { id:3, nome:'Decreto Lula (2023) — Reversão', status:'EM VIGOR', data:'Jan 2023', impacto:'CRÍTICO',
    resumo:'Revogou a maioria dos decretos de flexibilização. Reduziu limites CAC, suspendeu novos registros, reverteu liberação de calibres.',
    detalhe:'O Decreto 11.366/2023 reverteu boa parte das expansões. Novos registros CAC suspensos por meses. Limites de armas reduzidos. Batalha nos tribunais — diversas ações no STF e TRF questionam as restrições.',
    url:'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/decreto/D11366.htm' },
  { id:4, nome:'SIGMA — Sistema de Gerenciamento Militar', status:'EM VIGOR', data:'Contínuo', impacto:'ALTO',
    resumo:'Sistema do Exército para registro e rastreamento de armas CAC. Todo registro é feito via SIGMA. Fiscalizações periódicas obrigatórias.',
    detalhe:'O SIGMA gerencia todo o ciclo de vida de armas CAC: aquisição, transferência, desfazimento e fiscalização. Atiradores devem comprovar prática mínima em clube a cada 6 meses.',
    url:'https://www.defesa.gov.br/exercito-brasileiro' },
  { id:5, nome:'Lei do Porte (Portaria PF 1.246/2022)', status:'EM VIGOR', data:'2022', impacto:'ALTO',
    resumo:'Regulamenta o porte civil. Exige efetiva necessidade, residência rural, ou atividade de risco. Renovação anual. Pouquíssimos portes concedidos.',
    detalhe:'Na prática, porte civil é extremamente raro. Quem consegue com mais facilidade: residentes rurais, transportadores de valores, profissionais de segurança privada, juízes em risco comprovado.',
    url:'https://www.pf.gov.br/servicos-pf/armas' },
]

const ESTADOS = [
  { abbr:'RS', nome:'Rio Grande do Sul', rating:'B',  color:'#22c55e', resumo:'Estado mais gun-friendly. Cultura gaúcha, fronteira com vizinhos, tradição rural criam ambiente favorável.', destaques:['Cultura gaúcha favorável a armas','Delegacias PF acessíveis','Forte presença CAC'] },
  { abbr:'MT', nome:'Mato Grosso',       rating:'B+', color:'#22c55e', resumo:'Maior estado agricultural. Fazendeiros com porte rural. Caça de javali autorizada. Ambiente permissivo.', destaques:['Bancada ruralista forte','Porte rural mais acessível','Javali — caça autorizada'] },
  { abbr:'MG', nome:'Minas Gerais',      rating:'C+', color:'#f59e0b', resumo:'Tradição de caça e interior rural forte. Burocracia moderada. Clubes bem estruturados em BH e interior.', destaques:['Tradição cinegética no interior','Clubes CBTP ativos','Burocracia menor que SP/RJ'] },
  { abbr:'PR', nome:'Paraná',            rating:'C+', color:'#f59e0b', resumo:'Estado equilibrado. Curitiba tem clubes ativos, interior com tradição. PF cooperativa.', destaques:['Clubes em Curitiba e interior','Tradição rural forte','PF em prazo razoável'] },
  { abbr:'DF', nome:'Distrito Federal',  rating:'C',  color:'#f97316', resumo:'Alta concentração de militares CAC. Mas politicamente, epicentro do debate pelo desarmamento.', destaques:['Alta concentração de militares','PF com sede principal','Clubes ativos no Sudoeste'] },
  { abbr:'SP', nome:'São Paulo',         rating:'D',  color:'#dc2626', resumo:'Estado mais restritivo. SSP com postura restritiva máxima. Processos lentos. Alta pressão política.', destaques:['SSP extremamente restritiva','Processos lentos','CAC ativo via clubes no interior'] },
  { abbr:'RJ', nome:'Rio de Janeiro',    rating:'D',  color:'#dc2626', resumo:'Situação complexa. Violência extrema criou pressão pro desarmamento. Cidadão de bem com acesso limitado.', destaques:['Maior homicídio por AF','Milícias com armamento pesado','Registro civil longo e burocrático'] },
]

const CAC = [
  { passo:1, titulo:'Escolha sua categoria CAC', tempo:'Decisão inicial', custo:'Gratuito', detalhe:'Atirador Desportivo (CR/CF/CH): exige clube homologado + competições. Melhor acesso a armas de uso permitido. Colecionador: foco histórico, inspeção domiciliar. Caçador: muito restrito, só espécies invasoras.' },
  { passo:2, titulo:'Filie-se a um clube de tiro homologado', tempo:'1-4 semanas', custo:'R$200-800/ano', detalhe:'O clube deve ser registrado pelo Exército no SIGMA. Não basta qualquer clube — precisa ser homologado. Verifique no portal do Exército. Frequência mínima: uma competição por semestre.' },
  { passo:3, titulo:'Reúna a documentação', tempo:'1-2 semanas', custo:'~R$300-500', detalhe:'Documentos: RG/CPF, comprovante de residência, certidão de antecedentes criminais (Federal + Estadual + TJ), atestado de capacidade técnica, laudo psicológico (CRP), carteira do clube.' },
  { passo:4, titulo:'Curso de tiro e laudo psicológico', tempo:'1-3 meses', custo:'R$500-1.500', detalhe:'Curso de atirador desportivo: mínimo 16h teóricas + práticas. Laudo psicológico: emitido por psicólogo credenciado CRP. Ambos têm validade de 5 anos.' },
  { passo:5, titulo:'Registro no SIGMA (Exército)', tempo:'30-90 dias', custo:'~R$100-200 em taxas', detalhe:'Acesse o portal SIGMA. Preencha o Certificado de Registro (CR). Aguarde análise. Com CR aprovado, você pode adquirir arma em loja autorizada.' },
  { passo:6, titulo:'Compra da arma em loja CAC', tempo:'1-4 semanas', custo:'Valor da arma', detalhe:'Com CR em mãos, vá a uma loja CAC autorizada pelo Exército. Transferência registrada no SIGMA em tempo real. Transporte: desmontada em case rígido, munição separada.' },
]

const MUNICAO = [
  { calibre:'9mm (9x19mm)', brl:'R$3,50-4,50/rd', usd:'~US$0,70-0,90', disp:'Moderada', trend:'up',   obs:'Calibre mais usado. CBC produz domesticamente. Importação tributada eleva preço.' },
  { calibre:'.38 Special',  brl:'R$3,00-4,00/rd', usd:'~US$0,60-0,80', disp:'Alta',      trend:'flat', obs:'Mais popular historicamente. Revólver .38 é a arma civil mais registrada no Brasil.' },
  { calibre:'.22 LR',       brl:'R$0,80-1,20/rd', usd:'~US$0,16-0,24', disp:'Alta',      trend:'flat', obs:'Mais barato e acessível. CBC produz localmente. Favorito para treinamento.' },
  { calibre:'.40 S&W',      brl:'R$5,00-6,50/rd', usd:'~US$1,00-1,30', disp:'Baixa',     trend:'up',   obs:'Uso restrito, liberado para CAC. Importação dependente de decretos.' },
  { calibre:'.45 ACP',      brl:'R$6,00-8,00/rd', usd:'~US$1,20-1,60', disp:'Baixa',     trend:'up',   obs:'Uso restrito. Acessível apenas via CAC. Importação tributada.' },
  { calibre:'12 Gauge',     brl:'R$2,50-4,00/rd', usd:'~US$0,50-0,80', disp:'Alta',      trend:'flat', obs:'Espingarda é uso permitido. CBC produz amplamente. Usado para caça legal.' },
]

function impactColor(impact) {
  if (!impact) return '#4b5563'
  const s = impact.toUpperCase()
  if (s.includes('CRÍT') || s.includes('CRIT')) return '#ef4444'
  if (s.includes('ALTO') || s.includes('HIGH')) return '#f59e0b'
  if (s.includes('MED') || s.includes('MÉDIO')) return '#3b82f6'
  if (s.includes('VIGOR') || s.includes('FORCE')) return '#22c55e'
  return '#4b5563'
}

export default function BrazilExtras({ leis, estados, municao }) {
  const [openLei, setOpenLei] = useState(null)
  const [openCac, setOpenCac] = useState(null)

  const allLeis = (leis && leis.length > 0) ? leis.map(l => ({
    id: l._id, nome: l.title, status: l.status, data: l.effectiveDate,
    impacto: l.impact, resumo: l.summary, detalhe: l.detail, url: l.sourceUrl
  })) : LEIS

  const allEstados = (estados && estados.length > 0) ? estados.map(e => ({
    abbr: e.abbr, nome: e.title, rating: e.rating, color: e.color,
    resumo: e.summary, destaques: e.highlights || []
  })) : ESTADOS

  const allMunicao = (municao && municao.length > 0) ? municao.map(m => ({
    calibre: m.title, brl: m.brlPrice, usd: m.usdEquiv,
    disp: m.availability, trend: m.trend, obs: m.note
  })) : MUNICAO

  return (
    <div style={{ borderTop:'1px solid var(--border)', background:'var(--bg)' }}>

      <div id="leis" style={{ padding:'48px 0' }}>
        <div className="container">
          <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'var(--gold)', marginBottom:6 }}>Legislação Federal de Armas</h2>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>As principais leis e decretos que regulam armas no Brasil.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {allLeis.map((lei, i) => (
              <div key={lei.id || i} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderLeft:'4px solid ' + impactColor(lei.impacto) }}>
                <button onClick={() => setOpenLei(openLei === i ? null : i)}
                  style={{ width:'100%', background:'none', border:'none', padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, textAlign:'left', flexWrap:'wrap' }}>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1rem', color:'var(--text)' }}>{lei.nome}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:impactColor(lei.impacto), padding:'2px 8px', border:'1px solid ' + impactColor(lei.impacto) + '40', flexShrink:0 }}>{lei.impacto}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563', flexShrink:0 }}>{lei.data}</span>
                  </div>
                  <span style={{ color:'var(--gold)', fontSize:14 }}>{openLei === i ? '▲' : '▼'}</span>
                </button>
                {openLei === i && (
                  <div style={{ padding:'0 18px 16px', borderTop:'1px solid var(--border)' }}>
                    <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#9ca3af', lineHeight:1.7, margin:'12px 0', textAlign:'justify' }}>{lei.resumo}</p>
                    {lei.detalhe && <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', lineHeight:1.75, textAlign:'justify' }}>{lei.detalhe}</p>}
                    {lei.url && <a href={lei.url} target="_blank" rel="noreferrer" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'var(--gold)', textDecoration:'none', display:'inline-block', marginTop:8 }}>→ Texto oficial ↗</a>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="cac" style={{ padding:'48px 0', borderTop:'1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'var(--gold)', marginBottom:6 }}>Como se Tornar CAC</h2>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>Passo a passo para Atirador Desportivo. Custos e prazos reais.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {CAC.map((s, i) => (
              <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
                <button onClick={() => setOpenCac(openCac === i ? null : i)}
                  style={{ width:'100%', background:'none', border:'none', padding:'14px 18px', display:'flex', alignItems:'center', gap:14, cursor:'pointer', textAlign:'left' }}>
                  <div style={{ minWidth:38, height:38, background:'rgba(200,146,42,.1)', border:'2px solid var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',cursive", fontSize:'1.3rem', color:'var(--gold)', flexShrink:0 }}>{s.passo}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1rem', color:'var(--text)' }}>{s.titulo}</div>
                    <div style={{ display:'flex', gap:12, marginTop:4 }}>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563' }}>⏱ {s.tempo}</span>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'var(--gold)' }}>💰 {s.custo}</span>
                    </div>
                  </div>
                  <span style={{ color:'var(--gold)', fontSize:14 }}>{openCac === i ? '▲' : '▼'}</span>
                </button>
                {openCac === i && (
                  <div style={{ padding:'0 18px 14px', borderTop:'1px solid var(--border)' }}>
                    <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af', lineHeight:1.7, margin:'10px 0', textAlign:'justify' }}>{s.detalhe}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="estados" style={{ padding:'48px 0', borderTop:'1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'var(--gold)', marginBottom:6 }}>Análise por Estado</h2>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>O ambiente para atiradores varia muito entre estados.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
            {allEstados.map((e, i) => {
              const rc = e.rating && e.rating.startsWith('A') ? '#22c55e' : e.rating && e.rating.startsWith('B') ? '#86efac' : e.rating && e.rating.startsWith('C') ? '#f59e0b' : '#ef4444'
              return (
                <div key={e.abbr || i} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderLeft:'4px solid ' + (e.color || rc), padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'var(--gold)', marginBottom:3 }}>{e.abbr}</div>
                      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1.05rem', color:'var(--text)' }}>{e.nome}</div>
                    </div>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:e.color || rc }}>{e.rating}</div>
                  </div>
                  <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af', lineHeight:1.6, marginBottom:8, textAlign:'justify' }}>{e.resumo}</p>
                  {(e.destaques || []).map((h, j) => (
                    <div key={j} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6b7280', display:'flex', gap:6, marginBottom:3 }}>
                      <span style={{ color:'var(--gold)' }}>›</span>{h}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div id="municao" style={{ padding:'48px 0', borderTop:'1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'var(--gold)', marginBottom:6 }}>Preços de Munição no Brasil</h2>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>Mercado dominado pela CBC. Importação tributada em até 70%.</p>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'rgba(255,255,255,.03)', borderBottom:'1px solid var(--border)' }}>
                  {['Calibre','Preço BRL','Equiv. USD','Disponib.','Tendência','Observações'].map(h => (
                    <th key={h} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, color:'#4b5563', padding:'10px 14px', textAlign:'left', letterSpacing:'.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allMunicao.map((m, i) => {
                  const tc = m.trend === 'up' ? '#ef4444' : m.trend === 'down' ? '#22c55e' : '#4b5563'
                  const dc = m.disp === 'Alta' ? '#22c55e' : m.disp === 'Baixa' ? '#ef4444' : '#f59e0b'
                  return (
                    <tr key={m.calibre || i} style={{ borderBottom:'1px solid var(--border)', background: i % 2 ? 'rgba(255,255,255,.01)' : 'transparent' }}>
                      <td style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1rem', color:'var(--text)', padding:'10px 14px' }}>{m.calibre}</td>
                      <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--gold)', padding:'10px 14px' }}>{m.brl}</td>
                      <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563', padding:'10px 14px' }}>{m.usd}</td>
                      <td style={{ padding:'10px 14px' }}><span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:dc, padding:'2px 8px', border:'1px solid ' + dc + '40' }}>{m.disp}</span></td>
                      <td style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:tc, padding:'10px 14px' }}>{m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→'}</td>
                      <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', padding:'10px 14px', maxWidth:260, lineHeight:1.5 }}>{m.obs}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}
