'use client'
import { useState } from 'react'
import Masthead from '../../components/layout/Masthead'
import Footer   from '../../components/layout/Footer'
import BreakingTicker from '../../components/layout/BreakingTicker'

// ── DADOS ESTÁTICOS — Base de conhecimento sobre armas no Brasil ──────────────

const LEIS_BASE = [
  {
    nome: 'Estatuto do Desarmamento (Lei 10.826/2003)',
    status: 'EM VIGOR', data: 'Dez 2003', impacto: 'CRÍTICO',
    resumo: 'Principal lei de controle de armas do Brasil. Restringe porte, exige registro, e define categorias. Aprovada após campanha nacional de desarmamento. Proibiu armas de calibre restrito para civis e elevou exigências para registro.',
    detalhe: 'O Estatuto define as categorias de uso permitido e restrito. Armas de uso permitido (calibres como .38, .32, 9mm em versão civil) podem ser registradas por civis com requisitos. Uso restrito (calibres militares, full-auto) são exclusivos para Forças Armadas e forças de segurança. O porte (carregada fora de casa) é quase impossível para civis — exige "efetiva necessidade" e aprovação da Polícia Federal.',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.826.htm'
  },
  {
    nome: 'Decretos Bolsonaro (2019–2022)',
    status: 'PARCIALMENTE VIGENTE', data: '2019–2022', impacto: 'ALTO',
    resumo: 'Série de decretos presidenciais que expandiram significativamente acesso a armas para CAC, atiradores desportivos, caçadores e cidadãos rurais. Calibres expandidos, limites de munição elevados, registro simplificado.',
    detalhe: 'Entre 2019 e 2022, o governo Bolsonaro editou mais de 20 decretos expandindo o acesso a armas. Destacam-se: aumento do limite de armas para CAC (de 6 para até 60 para colecionadores), liberação de calibres .40 e .45 para uso civil, permissão de armas de uso restrito para CAC, aumento do limite de munição (5.000 unidades para .22 LR), e simplificação do processo de registro na PF.',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/decreto/D9785.htm'
  },
  {
    nome: 'Decreto Lula (2023) — Reversão das Medidas',
    status: 'EM VIGOR', data: 'Jan 2023', impacto: 'CRÍTICO',
    resumo: 'Ao assumir, o governo Lula revogou a maioria dos decretos de flexibilização. Reduziu limites de armas para CAC, suspendeu novos registros de CAC, endureceu requisitos e reverteu liberação de calibres.',
    detalhe: 'O Decreto 11.366/2023 reverteu boa parte das expansões da era Bolsonaro. Novos registros CAC foram suspensos por meses. Limites de armas foram reduzidos. A batalha continua nos tribunais — diversas ações no STF e TRF questionam a constitucionalidade das restrições. O cenário ainda é instável para atiradores desportivos.',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/decreto/D11366.htm'
  },
  {
    nome: 'Sistema de Gerenciamento Militar de Armas (SIGMA)',
    status: 'EM VIGOR', data: 'Contínuo', impacto: 'ALTO',
    resumo: 'Sistema do Exército para registro e rastreamento de armas de colecionadores, atiradores e caçadores (CAC). Todo registro CAC é feito via SIGMA. Fiscalizações periódicas obrigatórias.',
    detalhe: 'O SIGMA é administrado pelo Exército Brasileiro e gerencia todo o ciclo de vida de armas CAC: aquisição, transferência, desfazimento e fiscalização. Atiradores devem comprovar prática mínima em clube de tiro a cada 6 meses. Colecionadores passam por inspeção domiciliar periódica. Caçadores precisam de autorização específica por espécie e área.',
    url: 'https://www.defesa.gov.br/exercito-brasileiro'
  },
  {
    nome: 'Lei do Porte (Portaria PF 1.246/2022)',
    status: 'EM VIGOR', data: '2022', impacto: 'ALTO',
    resumo: 'Regulamenta o porte de arma para civis. Exige comprovação de "efetiva necessidade", residência ou trabalho em área rural, ou exercício de atividade de risco. Renovação anual. Pouquíssimos portes concedidos.',
    detalhe: 'Na prática, porte civil é extremamente raro no Brasil. As categorias que conseguem com mais facilidade: residentes de zonas rurais (especialmente fazendeiros), transportadores de valores, profissionais de segurança privada, e juízes/promotores em situação de risco comprovado. O processo envolve aprovação psicológica, teste de tiro, e análise caso a caso pela Polícia Federal.',
    url: 'https://www.pf.gov.br/servicos-pf/armas'
  },
  {
    nome: 'Marco Regulatório CAC — Resolução CGGAB',
    status: 'EM VIGOR', data: 'Contínuo', impacto: 'ALTO',
    resumo: 'Regulamenta as três categorias de acesso especial: Colecionador (C), Atirador Desportivo (A) e Caçador (C). Cada categoria tem requisitos específicos de armas, munição e atividade mínima.',
    detalhe: 'CAC é o principal caminho legal para brasileiros terem mais de uma arma registrada e acessar calibres mais potentes. Atirador Desportivo (CR/CF/CH): exige vínculo com clube de tiro homologado pelo Exército, mínimo de uma competição por semestre. Colecionador: foco em armas históricas/raras, inspeção domiciliar obrigatória. Caçador: autorização restrita para espécies invasoras.',
    url: 'https://www.defesa.gov.br/exercito-brasileiro/cac'
  },
]

const ESTADOS_BASE = [
  { abbr:'SP', nome:'São Paulo', rating:'D', cor:'#dc2626',
    resumo:'Estado mais restritivo. PM e PC aplicam o Estatuto com rigor máximo. Delegacias especializadas em armas. Poucas FAs (Forças Armadas) para referência CAC no interior.',
    destaques:['SSP com postura extremamente restritiva','Processos de registro lentos','CAC mais ativo via clubes em Campinas e interior','Alta pressão política pelo desarmamento'] },
  { abbr:'RJ', nome:'Rio de Janeiro', rating:'D', cor:'#dc2626',
    resumo:'Situação complexa. Violência armada extrema criou pressão para desarmamento. Mas milícias e tráfico dominam o debate. Cidadão de bem tem acesso extremamente limitado.',
    destaques:['Maior homicídio por arma de fogo do país','Milícias com acesso a armamento pesado','Registro civil: processo longo e burocrático','CAC ativo em clubes da Zona Oeste e interior'] },
  { abbr:'MG', nome:'Minas Gerais', rating:'C+', cor:'#f59e0b',
    resumo:'Estado com tradição de caça e interior rural forte. Burocracia moderada. Clubes de tiro bem estruturados em BH e municípios do interior. CAC com boa base.',
    destaques:['Forte tradição cinegética no interior','Clubes CBTP ativos','Burocracia menor que SP/RJ','Polícia Militar relativamente colaborativa'] },
  { abbr:'RS', nome:'Rio Grande do Sul', rating:'B', cor:'#22c55e',
    resumo:'Estado mais "gun-friendly" do Brasil. Cultura gaúcha, fronteira com países vizinhos, e tradição rural criam ambiente mais favorável. Delegacias PF acessíveis.',
    destaques:['Cultura gaúcha favorável a armas','Fronteira gera mercado informal (desafio)','Delegacias PF com boa capacidade','Forte representação CAC no estado'] },
  { abbr:'MT', nome:'Mato Grosso', rating:'B+', cor:'#22c55e',
    resumo:'Maior estado em área agricultural do país. Fazendeiros têm acesso a porte rural. Caça de espécies invasoras (javali) autorizada. Ambiente mais permissivo.',
    destaques:['Maior bancada ruralista no Congresso','Porte rural mais acessível','Javali — caça autorizada e necessária','CAC com forte presença agropecuária'] },
  { abbr:'PR', nome:'Paraná', rating:'C+', cor:'#f59e0b',
    resumo:'Estado equilibrado. Curitiba tem clubes ativos, interior com tradição de caça e pesca. Polícia Federal cooperativa. Processo de registro dentro da média nacional.',
    destaques:['Clubes CBTP em Curitiba e interior','Interior com forte tradição rural','PF Curitiba: processos em prazo razoável','CAC moderadamente ativo'] },
  { abbr:'DF', nome:'Distrito Federal', rating:'C', cor:'#f97316',
    resumo:'Brasília tem estrutura CAC ativa por conta de militares e funcionários públicos. Mas politicamente é epicentro do debate pelo desarmamento.',
    destaques:['Alta concentração de militares CAC','Polícia Federal com sede principal','Politicamente, capital do desarmamento','Clubes ativos no Sudoeste e Lago Norte'] },
]

const MUNICAO_BASE = [
  { calibre:'9mm (9x19mm)', brlPreco:'R$3,50–4,50/rd', usdEq:'~US$0,70–0,90', disp:'Moderada', trend:'up',
    obs:'Calibre mais usado no Brasil para armas de uso permitido. CBC/Imbel produz domesticamente. Importação tributada eleva preço.' },
  { calibre:'.38 Special',  brlPreco:'R$3,00–4,00/rd', usdEq:'~US$0,60–0,80', disp:'Alta',      trend:'flat',
    obs:'Calibre mais popular historicamente. Revólver .38 é a arma civil mais registrada no Brasil. Ampla disponibilidade em lojas.' },
  { calibre:'.22 LR',       brlPreco:'R$0,80–1,20/rd', usdEq:'~US$0,16–0,24', disp:'Alta',      trend:'flat',
    obs:'Mais barato e acessível. Favorito para treinamento. CBC produz localmente. Limites de estoque ampliados em alguns decretos.' },
  { calibre:'.40 S&W',      brlPreco:'R$5,00–6,50/rd', usdEq:'~US$1,00–1,30', disp:'Baixa',     trend:'up',
    obs:'Uso restrito, mas liberado para CAC. Importação dependente de decisões de decreto. Oferta instável conforme regulamentação.' },
  { calibre:'.45 ACP',      brlPreco:'R$6,00–8,00/rd', usdEq:'~US$1,20–1,60', disp:'Baixa',     trend:'up',
    obs:'Uso restrito. Acessível apenas via CAC. Importação tributada. Disponível em lojas especializadas em SP e RS.' },
  { calibre:'.308 Win',     brlPreco:'R$8,00–12,00/rd',usdEq:'~US$1,60–2,40', disp:'Baixa',     trend:'up',
    obs:'Uso restrito. CAC tem acesso com autorização. Preço alto por tributos de importação. CBC tem produção limitada.' },
  { calibre:'12 Gauge',     brlPreco:'R$2,50–4,00/rd', usdEq:'~US$0,50–0,80', disp:'Alta',      trend:'flat',
    obs:'Espingarda é uso permitido. Calibre mais acessível para zonas rurais. CBC produz amplamente. Usado também para caça legal.' },
]

const CAC_GUIDE = [
  { passo:1, titulo:'Escolha sua categoria CAC', tempo:'Decisão inicial', custo:'Gratuito',
    detalhe:'Atirador Desportivo (CR/CF/CH): exige clube homologado + competições. Melhor acesso a armas de uso permitido. Colecionador: foco histórico, inspeção domiciliar, mais restritivo. Caçador: muito restrito, só espécies invasoras. A maioria dos brasileiros vai pelo caminho do Atirador Desportivo.' },
  { passo:2, titulo:'Filie-se a um clube de tiro homologado', tempo:'1–4 semanas', custo:'R$200–800/ano',
    detalhe:'O clube deve ser registrado pelo Exército no SIGMA. Não basta qualquer clube — precisa ser homologado. Verifique no site do Exército. Precisará de ficha de filiação, documentos pessoais e pagamento de mensalidade. Frequência mínima obrigatória: pelo menos uma competição ou treinamento documentado por semestre.' },
  { passo:3, titulo:'Reúna a documentação inicial', tempo:'1–2 semanas', custo:'~R$300–500',
    detalhe:'Documentos necessários: RG/CPF, comprovante de residência, certidão de antecedentes criminais (Federal + Estadual + TJ), atestado de capacidade técnica (curso de armas), laudo psicológico emitido por psicólogo credenciado CRP, e carteira do clube de tiro.' },
  { passo:4, titulo:'Faça o curso de tiro e laudo psicológico', tempo:'1–3 meses', custo:'R$500–1.500',
    detalhe:'O curso de atirador desportivo é obrigatório — mínimo 16h teóricas + práticas. O laudo psicológico deve ser emitido por psicólogo credenciado no CRP. Ambos têm validade de 5 anos. Custo varia muito por estado — em SP e RJ é mais caro que no interior.' },
  { passo:5, titulo:'Registro no SIGMA (Exército)', tempo:'30–90 dias', custo:'~R$100–200 em taxas',
    detalhe:'Acesse o portal SIGMA do Exército Brasileiro. Preencha o formulário de Certificado de Registro (CR) para atiradores. Aguarde análise. O processo online reduziu burocracias mas ainda há filas. Com o registro aprovado, você pode adquirir a arma em loja autorizada.' },
  { passo:6, titulo:'Compra da arma em loja CAC', tempo:'1–4 semanas', custo:'Valor da arma',
    detalhe:'Com o CR em mãos, dirija-se a uma loja CAC autorizada pelo Exército. A transferência é registrada no SIGMA em tempo real. O vendedor verifica seu CR diretamente no sistema. A arma só pode ser transportada carregada dentro do clube de tiro — fora do clube, deve estar desmontada em case rígido, munição separada.' },
]

const ESTATISTICAS = [
  { valor: '~17M', label: 'Armas registradas no Brasil (est.)', cor: '#C8922A' },
  { valor: '~35–40M', label: 'Armas em circulação (lícitas + ilícitas)', cor: '#ef4444' },
  { valor: '#2', label: 'Maior número de mortes por arma de fogo do mundo', cor: '#ef4444' },
  { valor: '47.000+', label: 'Homicídios por arma de fogo/ano (est. 2023)', cor: '#ef4444' },
  { valor: '~2,5M', label: 'Registros CAC ativos (estimativa 2023)', cor: '#22c55e' },
  { valor: '80%+', label: 'Armas usadas em crimes são ilegais', cor: '#f59e0b' },
]

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────

export default function BrazilClient({ leis=[], estados=[], artigos=[], municao=[], alertas=[], stats=[], cac_info=[] }) {
  const [tab, setTab] = useState('leis')

  const allLeis    = [...LEIS_BASE.map((l,i) => ({...l, _id:'base'+i, type:'lei', title:l.nome, summary:l.resumo, detail:l.detalhe, status:l.status, impact:l.impacto, effectiveDate:l.data, sourceUrl:l.url})), ...leis]
  const allEstados = [...ESTADOS_BASE.map((e,i) => ({...e, _id:'est'+i, type:'estado', title:e.nome, abbr:e.abbr, rating:e.rating, color:e.cor, summary:e.resumo, highlights:e.destaques})), ...estados]
  const allMunicao = [...MUNICAO_BASE.map((m,i) => ({...m, _id:'mun'+i, type:'municao', title:m.calibre, brlPrice:m.brlPreco, usdEquiv:m.usdEq, availability:m.disp, trend:m.trend, note:m.obs})), ...municao]
  const allStats   = [...ESTATISTICAS.map((s,i) => ({...s, _id:'stat'+i, type:'stat', title:s.label, value:s.valor, color:s.cor})), ...stats]
  const allCac     = cac_info.length > 0 ? cac_info : CAC_GUIDE.map((c,i) => ({...c, _id:'cac'+i}))
  const allArtigos = artigos

  const TABS = [
    { id:'leis',    label:'⚖️ Leis' },
    { id:'cac',     label:'🎯 Guia CAC' },
    { id:'estados', label:'🗺️ Estados' },
    { id:'municao', label:'🔴 Munição' },
    { id:'noticias',label:'📰 Notícias' },
    { id:'stats',   label:'📊 Dados' },
  ]

  const GOLD = '#C8922A'
  const BG   = '#09090B'
  const BG2  = '#111318'
  const BDR  = '#1e293b'
  const GRN  = '#22c55e'
  const YEL  = '#f59e0b'
  const RED  = '#ef4444'

  const impactColor = (imp='') => {
    if (!imp) return '#4b5563'
    if (imp.includes('CRÍT') || imp.includes('CRIT')) return RED
    if (imp.includes('ALTO') || imp.includes('HIGH')) return YEL
    if (imp.includes('MED') || imp.includes('MÉDIO')) return '#3b82f6'
    if (imp.includes('VIGOR') || imp.includes('FORCE')) return GRN
    return '#4b5563'
  }

  return (
    <>
      <Masthead />
      <div style={{ background: BG, minHeight: '100vh' }}>

        {/* ── HERO SECTION ── */}
        <div style={{
          background: `linear-gradient(135deg, ${BG} 0%, #0d1117 40%, #1a0a00 70%, #0d0500 100%)`,
          borderBottom: `1px solid ${BDR}`,
          padding: '48px 0 36px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background flag strips */}
          <div style={{ position:'absolute', inset:0, opacity:0.04, display:'flex', flexDirection:'column' }}>
            <div style={{ flex:1, background:'#009C3B' }} />
            <div style={{ flex:0.6, background:'#FFDF00' }} />
            <div style={{ flex:1, background:'#002776' }} />
          </div>

          <div className="container" style={{ maxWidth:1100, position:'relative' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:24, flexWrap:'wrap' }}>
              {/* Brazilian flag */}
              <div style={{ fontSize:'4rem', lineHeight:1, filter:'drop-shadow(0 4px 12px rgba(0,156,59,0.4))' }}>
                🇧🇷
              </div>
              <div style={{ flex:1, minWidth:280 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8, flexWrap:'wrap' }}>
                  <span style={{
                    fontFamily:"'IBM Plex Mono',monospace", fontSize:10, letterSpacing:'.12em',
                    color: GOLD, background:'rgba(200,146,42,.12)',
                    border:`1px solid ${GOLD}40`, padding:'3px 12px'
                  }}>SEÇÃO BRASIL</span>
                  <span style={{
                    fontFamily:"'IBM Plex Mono',monospace", fontSize:10, letterSpacing:'.08em',
                    color:'#009C3B', background:'rgba(0,156,59,.1)',
                    border:'1px solid rgba(0,156,59,.3)', padding:'3px 12px'
                  }}>EM PORTUGUÊS</span>
                </div>
                <h1 style={{
                  fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.2rem,5vw,3.8rem)',
                  color:'#F5F5F3', letterSpacing:'.04em', lineHeight:1, marginBottom:12
                }}>
                  ARMAS DE FOGO NO <span style={{ color:'#009C3B' }}>BRASIL</span>
                </h1>
                <p style={{
                  fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#9ca3af',
                  lineHeight:1.7, maxWidth:600, textAlign:'justify'
                }}>
                  O panorama completo para o atirador, colecionador e caçador brasileiro.
                  Legislação atualizada, guia CAC passo a passo, análise por estado, e
                  as notícias que o mainstream não te conta.
                </p>

                {/* Quick stats bar */}
                <div style={{ display:'flex', gap:16, marginTop:20, flexWrap:'wrap' }}>
                  {[
                    { v:'~17M', l:'armas registradas' },
                    { v:'2.5M+', l:'registros CAC' },
                    { v:'80%+', l:'crimes: armas ilegais' },
                  ].map(s => (
                    <div key={s.l} style={{ background:'rgba(255,255,255,.04)', border:`1px solid ${BDR}`, padding:'8px 14px' }}>
                      <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:GOLD, lineHeight:1 }}>{s.v}</div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563', textTransform:'uppercase' }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── NAV TABS ── */}
        <div style={{
          position:'sticky', top:60, zIndex:20,
          background:BG2, borderBottom:`2px solid ${BDR}`,
          overflowX:'auto',
        }}>
          <div className="container" style={{ maxWidth:1100, display:'flex', gap:0 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                fontFamily:"'IBM Plex Mono',monospace", fontSize:11, letterSpacing:'.06em',
                padding:'14px 20px', background:'none',
                border:'none', borderBottom: tab===t.id ? `2px solid ${GOLD}` : '2px solid transparent',
                color: tab===t.id ? GOLD : '#6b7280',
                cursor:'pointer', whiteSpace:'nowrap',
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        <div className="container" style={{ maxWidth:1100, padding:'32px 0 64px' }}>

          {/* ── LEIS ── */}
          {tab === 'leis' && (
            <div>
              <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:GOLD, marginBottom:6 }}>
                Legislação Federal de Armas
              </h2>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>
                As principais leis e decretos que regulam armas no Brasil. Atualizados conforme mudanças políticas.
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {allLeis.map((lei, i) => (
                  <div key={lei._id||i} style={{
                    background:BG2, border:`1px solid ${BDR}`,
                    borderLeft:`4px solid ${impactColor(lei.impact||lei.impacto)}`,
                  }}>
                    <div style={{ padding:'16px 20px', borderBottom:`1px solid ${BDR}` }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginBottom:8 }}>
                        <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1.1rem', color:'#F5F5F3' }}>
                          {lei.title||lei.nome}
                        </h3>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          <span style={{
                            fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700,
                            color: impactColor(lei.impact||lei.impacto),
                            background: (impactColor(lei.impact||lei.impacto))+'20',
                            border:`1px solid ${impactColor(lei.impact||lei.impacto)}40`,
                            padding:'2px 8px', letterSpacing:'.06em'
                          }}>{lei.impact||lei.impacto}</span>
                          <span style={{
                            fontFamily:"'IBM Plex Mono',monospace", fontSize:9,
                            color:'#4b5563', border:`1px solid ${BDR}`, padding:'2px 8px'
                          }}>{lei.effectiveDate||lei.data}</span>
                          {(lei.status) && <span style={{
                            fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:GRN,
                            background:'rgba(34,197,94,.08)', border:'1px solid rgba(34,197,94,.2)', padding:'2px 8px'
                          }}>{lei.status}</span>}
                        </div>
                      </div>
                      <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#9ca3af', lineHeight:1.7, textAlign:'justify' }}>
                        {lei.summary||lei.resumo}
                      </p>
                    </div>
                    {(lei.detail||lei.detalhe) && (
                      <div style={{ padding:'14px 20px', background:'rgba(0,0,0,.3)' }}>
                        <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', lineHeight:1.75, textAlign:'justify' }}>
                          {lei.detail||lei.detalhe}
                        </p>
                        {(lei.sourceUrl||lei.url) && (
                          <a href={lei.sourceUrl||lei.url} target="_blank" rel="noopener noreferrer"
                            style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:GOLD, textDecoration:'none', display:'inline-block', marginTop:8 }}>
                            → Ver texto oficial ↗
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── GUIA CAC ── */}
          {tab === 'cac' && (
            <div>
              <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:GOLD, marginBottom:6 }}>
                Como se tornar CAC no Brasil
              </h2>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>
                Guia completo para Colecionadores, Atiradores Desportivos e Caçadores. Passo a passo atualizado.
              </p>

              {/* CAC category cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16, marginBottom:32 }}>
                {[
                  { emoji:'🎯', cat:'Atirador Desportivo', sigla:'CR/CF/CH', dif:'⭐⭐', desc:'O caminho mais popular. Exige vínculo com clube homologado e participação em competições. Melhor acesso a armas de uso permitido e alguns de uso restrito.', cor:'#009C3B' },
                  { emoji:'🏛️', cat:'Colecionador', sigla:'CAC-C', dif:'⭐⭐⭐', desc:'Foco em armas históricas, raras ou de interesse militar. Inspeção domiciliar obrigatória pelo Exército. Mais burocrático mas permite certas armas únicas.', cor:'#002776' },
                  { emoji:'🌿', cat:'Caçador', sigla:'CAC-CA', dif:'⭐⭐⭐⭐', desc:'Autorizado apenas para controle de espécies invasoras (javali, ratazana, etc.). Exige autorização específica por espécie, época e área. Muito restrito.', cor:'#FFDF00' },
                ].map(c => (
                  <div key={c.cat} style={{ background:BG2, border:`1px solid ${BDR}`, borderTop:`3px solid ${c.cor}`, padding:20 }}>
                    <div style={{ fontSize:'2rem', marginBottom:8 }}>{c.emoji}</div>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.1rem', color:'#F5F5F3', marginBottom:4 }}>{c.cat}</div>
                    <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:c.cor, border:`1px solid ${c.cor}40`, padding:'2px 8px' }}>{c.sigla}</span>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563', border:`1px solid ${BDR}`, padding:'2px 8px' }}>Dificuldade: {c.dif}</span>
                    </div>
                    <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af', lineHeight:1.65, textAlign:'justify' }}>{c.desc}</p>
                  </div>
                ))}
              </div>

              {/* Steps */}
              <h3 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'#F5F5F3', marginBottom:16 }}>
                Passo a Passo — Atirador Desportivo
              </h3>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {CAC_GUIDE.map((c,i) => (
                  <div key={i} style={{ display:'flex', gap:16, background:BG2, border:`1px solid ${BDR}`, padding:20 }}>
                    <div style={{
                      minWidth:44, height:44, background:`rgba(200,146,42,.1)`,
                      border:`2px solid ${GOLD}`, display:'flex', alignItems:'center', justifyContent:'center',
                      fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:GOLD, flexShrink:0
                    }}>{c.passo||i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8, marginBottom:6 }}>
                        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1rem', color:'#F5F5F3' }}>{c.titulo||c.title}</div>
                        <div style={{ display:'flex', gap:8 }}>
                          {(c.tempo||c.time) && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563', border:`1px solid ${BDR}`, padding:'2px 8px' }}>⏱ {c.tempo||c.time}</span>}
                          {(c.custo||c.cost) && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:GOLD, background:'rgba(200,146,42,.08)', border:`1px solid ${GOLD}30`, padding:'2px 8px' }}>💰 {c.custo||c.cost}</span>}
                        </div>
                      </div>
                      <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af', lineHeight:1.7, textAlign:'justify' }}>{c.detalhe||c.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CAC Warning box */}
              <div style={{ marginTop:24, background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.2)', borderLeft:'4px solid #ef4444', padding:'16px 20px' }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, color:'#ef4444', marginBottom:8 }}>⚠️ ATENÇÃO — Situação Regulatória 2023–2024</div>
                <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af', lineHeight:1.7, textAlign:'justify' }}>
                  O cenário CAC está em constante mudança. O Decreto 11.366/2023 suspendeu novos registros e reduziu limites.
                  Diversas liminares judiciais contestam as restrições. Antes de iniciar o processo, consulte a situação
                  atual no portal do Exército e em entidades como CNCAP e ATIBS. Esta página é informativa — não é aconselhamento jurídico.
                </p>
              </div>
            </div>
          )}

          {/* ── ESTADOS ── */}
          {tab === 'estados' && (
            <div>
              <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:GOLD, marginBottom:6 }}>
                Análise por Estado
              </h2>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>
                O ambiente para atiradores varia muito entre estados. Burocracia local, postura da PF e cultura política fazem a diferença.
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
                {allEstados.map((e, i) => {
                  const ratingColor = e.rating?.startsWith('A') ? GRN : e.rating?.startsWith('B') ? '#86efac' : e.rating?.startsWith('C') ? YEL : RED
                  return (
                    <div key={e._id||i} style={{ background:BG2, border:`1px solid ${BDR}`, borderLeft:`4px solid ${e.color||ratingColor}` }}>
                      <div style={{ padding:'14px 16px', borderBottom:`1px solid ${BDR}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{
                            width:44, height:44, background:'rgba(255,255,255,.04)',
                            border:`1px solid ${BDR}`, display:'flex', alignItems:'center', justifyContent:'center',
                            fontFamily:"'Bebas Neue',cursive", fontSize:'1.1rem', color:GOLD,
                          }}>{e.abbr}</div>
                          <div>
                            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1rem', color:'#F5F5F3' }}>{e.title||e.nome}</div>
                            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563' }}>Classificação atirador</div>
                          </div>
                        </div>
                        <div style={{
                          fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem',
                          color: ratingColor, minWidth:32, textAlign:'center'
                        }}>{e.rating}</div>
                      </div>
                      <div style={{ padding:'12px 16px' }}>
                        <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af', lineHeight:1.65, marginBottom:10, textAlign:'justify' }}>
                          {e.summary||e.resumo}
                        </p>
                        {(e.highlights||e.destaques||[]).map((h, j) => (
                          <div key={j} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6b7280', display:'flex', gap:6, marginBottom:3 }}>
                            <span style={{ color:GOLD }}>›</span> {h}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── MUNIÇÃO ── */}
          {tab === 'municao' && (
            <div>
              <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:GOLD, marginBottom:6 }}>
                Preços de Munição no Brasil
              </h2>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:8 }}>
                O mercado de munição no Brasil é dominado pela CBC (Companhia Brasileira de Cartuchos).
                Importação é tributada pesadamente — impostos chegam a 70%+ sobre produtos importados.
              </p>
              <div style={{ background:'rgba(200,146,42,.06)', border:`1px solid ${GOLD}30`, borderLeft:`3px solid ${GOLD}`, padding:'10px 16px', marginBottom:24 }}>
                <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af' }}>
                  💡 Preços estimados em reais (BRL) para referência. Variam conforme estado, loja e flutuação cambial.
                  CBC domina o mercado doméstico. Armas de uso restrito: munição só via canais oficiais.
                </p>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'rgba(255,255,255,.03)', borderBottom:`1px solid ${BDR}` }}>
                      {['Calibre','Preço (BRL)','Equiv. USD','Disponib.','Tendência','Observações'].map(h => (
                        <th key={h} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700,
                          color:'#4b5563', padding:'10px 14px', textAlign:'left', letterSpacing:'.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allMunicao.map((m, i) => {
                      const trendIcon = (m.trend) === 'up' ? '↑' : (m.trend) === 'down' ? '↓' : '→'
                      const trendColor = (m.trend) === 'up' ? RED : (m.trend) === 'down' ? GRN : '#4b5563'
                      const dispColor = (m.availability||m.disp) === 'Alta' ? GRN : (m.availability||m.disp) === 'Baixa' ? RED : YEL
                      return (
                        <tr key={m._id||i} style={{ borderBottom:`1px solid ${BDR}`, background: i%2===0?'transparent':'rgba(255,255,255,.01)' }}>
                          <td style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1rem', color:'#F5F5F3', padding:'12px 14px' }}>{m.title||m.calibre}</td>
                          <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:GOLD, padding:'12px 14px' }}>{m.brlPrice||m.brlPreco}</td>
                          <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563', padding:'12px 14px' }}>{m.usdEquiv||m.usdEq}</td>
                          <td style={{ padding:'12px 14px' }}>
                            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:dispColor, background:dispColor+'20', border:`1px solid ${dispColor}40`, padding:'2px 8px' }}>{m.availability||m.disp}</span>
                          </td>
                          <td style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:trendColor, padding:'12px 14px' }}>{trendIcon}</td>
                          <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', padding:'12px 14px', maxWidth:280, lineHeight:1.5 }}>{m.note||m.obs}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── NOTÍCIAS — Portal de Notícias ── */}
          {tab === 'noticias' && (
            <div>
              <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:8, flexWrap:'wrap', gap:8 }}>
                <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:GOLD }}>
                  Notícias — Armas no Brasil
                </h2>
                {allArtigos.length > 0 && (
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563' }}>
                    {allArtigos.length} artigos · DownRange Brasil
                  </span>
                )}
              </div>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>
                Análises e notícias sobre armas no Brasil, em português. Sem nota de imprensa. Sem pauta governamental.
              </p>

              {allArtigos.length === 0 ? (
                <div style={{ background:BG2, border:`1px solid ${BDR}`, padding:48, textAlign:'center' }}>
                  <div style={{ fontSize:'3rem', marginBottom:16 }}>📰</div>
                  <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.3rem', color:'#F5F5F3', marginBottom:8 }}>
                    Artigos em Produção
                  </div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563', maxWidth:400, margin:'0 auto', lineHeight:1.7 }}>
                    A redação DownRange Brasil está produzindo conteúdo.
                    Novos artigos são publicados automaticamente — volte em breve.
                  </div>
                </div>
              ) : (<>

                {/* ARTIGO DESTAQUE */}
                {allArtigos[0] && (() => {
                  const a = allArtigos[0]
                  return (
                    <div style={{ border:`1px solid ${BDR}`, background:BG2, overflow:'hidden', marginBottom:24, display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
                      <div style={{ height:'100%', minHeight:280, overflow:'hidden', position:'relative' }}>
                        <img
                          src={a.imageUrl || '/img/photos/law.jpg'}
                          alt={a.title}
                          style={{ width:'100%', height:'100%', objectFit:'cover' }}
                          onError={e => { e.target.src='/img/photos/law.jpg' }}
                        />
                        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, transparent 55%, ' + BG2 + ' 100%)' }} />
                        <div style={{ position:'absolute', top:12, left:12 }}>
                          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, padding:'3px 8px', background:'#009C3B', color:'#fff', letterSpacing:'.08em' }}>DESTAQUE</span>
                        </div>
                      </div>
                      <div style={{ padding:'28px 28px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                          {a.tag && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, padding:'3px 10px', background:GOLD, color:'#000', letterSpacing:'.06em' }}>{a.tag}</span>}
                          {a.readMins && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, padding:'3px 10px', background:'rgba(255,255,255,.06)', color:'#4b5563', border:`1px solid ${BDR}` }}>⏱ {a.readMins}</span>}
                        </div>
                        <h3 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(1.4rem,2.5vw,2rem)', color:'#F5F5F3', letterSpacing:'.03em', lineHeight:1.1, marginBottom:14 }}>{a.title}</h3>
                        <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#9ca3af', lineHeight:1.7, marginBottom:16, textAlign:'justify' }}>
                          {a.summary || (a.body ? a.body.replace(/<[^>]+>/g,'').slice(0,220)+'...' : '')}
                        </p>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563' }}>
                          {a.author && <span>Por {a.author} · </span>}
                          {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('pt-BR',{year:'numeric',month:'long',day:'numeric'}) : ''}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* GRADE DE ARTIGOS */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
                  {allArtigos.slice(1).map((a, i) => (
                    <article key={a._id||i} style={{ background:BG2, border:`1px solid ${BDR}`, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                      <div style={{ height:185, overflow:'hidden', position:'relative', flexShrink:0 }}>
                        <img
                          src={a.imageUrl || '/img/photos/law.jpg'}
                          alt={a.title}
                          style={{ width:'100%', height:'100%', objectFit:'cover' }}
                          onError={e => { e.target.src='/img/photos/law.jpg' }}
                        />
                        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(9,9,11,.88) 0%, transparent 50%)' }} />
                        <div style={{ position:'absolute', bottom:10, left:12, display:'flex', gap:6 }}>
                          {a.tag && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, padding:'2px 8px', background:GOLD, color:'#000' }}>{a.tag}</span>}
                          {a.readMins && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, padding:'2px 8px', background:'rgba(0,0,0,.7)', color:'#6b7280' }}>⏱ {a.readMins}</span>}
                        </div>
                      </div>
                      <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', flex:1 }}>
                        <h3 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:'#F5F5F3', letterSpacing:'.03em', lineHeight:1.15, marginBottom:10, flex:1 }}>{a.title}</h3>
                        <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', lineHeight:1.65, marginBottom:12, textAlign:'justify' }}>
                          {a.summary || (a.body ? a.body.replace(/<[^>]+>/g,'').slice(0,140)+'...' : '')}
                        </p>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151' }}>
                          {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('pt-BR',{month:'short',day:'numeric',year:'numeric'}) : ''}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>)}
            </div>
          )}

          {/* ── DADOS ── */}
          {tab === 'stats' && (
            <div>
              <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:GOLD, marginBottom:6 }}>
                Brasil em Números
              </h2>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>
                Estatísticas sobre armas de fogo no Brasil. Fontes: FBSP, IPEA, Exército Brasileiro.
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16, marginBottom:32 }}>
                {allStats.map((s, i) => (
                  <div key={s._id||i} style={{ background:BG2, border:`1px solid ${BDR}`, borderTop:`3px solid ${s.color||GOLD}`, padding:24, textAlign:'center' }}>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2.4rem', color:s.color||GOLD, lineHeight:1, marginBottom:8 }}>
                      {s.value||s.valor}
                    </div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', lineHeight:1.5 }}>
                      {s.title||s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Context section */}
              <div style={{ background:BG2, border:`1px solid ${BDR}`, borderLeft:`4px solid ${GOLD}`, padding:'20px 24px' }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:GOLD, marginBottom:12 }}>
                  Contexto — O que os números não mostram
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
                  {[
                    { titulo:'O problema é ilegal', texto:'Mais de 80% das armas usadas em homicídios no Brasil são ilegais. A discussão sobre o CAC do atirador esportivo é uma distração do problema real: o tráfico e as milícias.' },
                    { titulo:'CBC — monopólio nacional', texto:'A Companhia Brasileira de Cartuchos (CBC/IMBEL) domina a produção doméstica. Isso cria dependência e preços elevados. A concorrência via importação é bloqueada por impostos.' },
                    { titulo:'Judiciário vs Executivo', texto:'A batalha sobre armas no Brasil se joga nos tribunais. STF, TRF e juízes federais têm impacto maior nas regras CAC do que o Congresso, gerando incerteza jurídica permanente.' },
                  ].map((c, i) => (
                    <div key={i}>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, fontWeight:700, color:'#F5F5F3', marginBottom:6 }}>{c.titulo}</div>
                      <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', lineHeight:1.7, textAlign:'justify' }}>{c.texto}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  )
}
