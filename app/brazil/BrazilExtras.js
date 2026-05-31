'use client'
import { useState } from 'react'

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


const GOLD='#C8922A', BG2='#111318', BDR='#1e293b'
const GRN='#22c55e', YEL='#f59e0b', RED='#ef4444'

function impactColor(imp='') {
  if (!imp) return '#4b5563'
  if (imp.includes('CRÍT')||imp.includes('CRIT')) return RED
  if (imp.includes('ALTO')||imp.includes('HIGH')) return YEL
  if (imp.includes('MED')||imp.includes('MÉDIO')) return '#3b82f6'
  if (imp.includes('VIGOR')||imp.includes('FORCE')) return GRN
  return '#4b5563'
}

export default function BrazilExtras({ leis=[], estados=[], municao=[] }) {
  const [openLei, setOpenLei] = useState(null)
  const [openCac, setOpenCac] = useState(null)

  const allLeis    = leis.length > 0 ? leis : LEIS_BASE.map((l,i) => ({
    ...l, _id:'lei'+i, title:l.nome, summary:l.resumo, detail:l.detalhe,
    status:l.status, impact:l.impacto, effectiveDate:l.data, sourceUrl:l.url
  }))
  const allEstados = estados.length > 0 ? estados : ESTADOS_BASE.map((e,i) => ({
    ...e, _id:'est'+i, title:e.nome, summary:e.resumo, highlights:e.destaques
  }))
  const allMunicao = municao.length > 0 ? municao : MUNICAO_BASE.map((m,i) => ({
    ...m, _id:'mun'+i, title:m.calibre, brlPrice:m.brlPreco, usdEquiv:m.usdEq,
    availability:m.disp, note:m.obs
  }))

  return (
    <div style={{ borderTop:'1px solid var(--border)', background:'var(--bg)' }}>

      {/* ── LEIS FEDERAIS ── */}
      <div id="leis" style={{ padding:'48px 0' }}>
        <div className="container">
          <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:GOLD, marginBottom:6 }}>Legislação Federal de Armas</h2>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>As principais leis e decretos que regulam armas no Brasil. Atualizados conforme mudanças políticas.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {allLeis.map((lei,i) => (
              <div key={lei._id||i} style={{ background:BG2, border:`1px solid ${BDR}`, borderLeft:`4px solid ${impactColor(lei.impact)}` }}>
                <button onClick={()=>setOpenLei(openLei===i?null:i)} style={{ width:'100%', background:'none', border:'none', padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, textAlign:'left', flexWrap:'wrap' }}>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1rem', color:'#F5F5F3' }}>{lei.title||lei.nome}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:impactColor(lei.impact), background:impactColor(lei.impact)+'20', border:`1px solid ${impactColor(lei.impact)}40`, padding:'2px 8px', flexShrink:0 }}>{lei.impact||lei.impacto}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563', flexShrink:0 }}>{lei.effectiveDate||lei.data}</span>
                  </div>
                  <span style={{ color:GOLD, fontSize:14 }}>{openLei===i?'▲':'▼'}</span>
                </button>
                {openLei===i && (
                  <div style={{ padding:'0 18px 16px', borderTop:`1px solid ${BDR}` }}>
                    <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#9ca3af', lineHeight:1.7, margin:'12px 0', textAlign:'justify' }}>{lei.summary||lei.resumo}</p>
                    {(lei.detail||lei.detalhe) && <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', lineHeight:1.75, textAlign:'justify' }}>{lei.detail||lei.detalhe}</p>}
                    {(lei.sourceUrl||lei.url) && <a href={lei.sourceUrl||lei.url} target="_blank" rel="noreferrer" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:GOLD, textDecoration:'none', display:'inline-block', marginTop:8 }}>→ Texto oficial ↗</a>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── GUIA CAC ── */}
      <div id="cac" style={{ padding:'48px 0', borderTop:`1px solid ${BDR}` }}>
        <div className="container">
          <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:GOLD, marginBottom:6 }}>Como se Tornar CAC — Guia Completo</h2>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>Passo a passo para Atirador Desportivo, Colecionador ou Caçador. Custos e prazos reais.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {CAC_GUIDE.map((s,i) => (
              <div key={i} style={{ background:BG2, border:`1px solid ${BDR}`, overflow:'hidden' }}>
                <button onClick={()=>setOpenCac(openCac===i?null:i)} style={{ width:'100%', background:'none', border:'none', padding:'14px 18px', display:'flex', alignItems:'center', gap:14, cursor:'pointer', textAlign:'left' }}>
                  <div style={{ minWidth:38, height:38, background:`rgba(200,146,42,.1)`, border:`2px solid ${GOLD}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',cursive", fontSize:'1.3rem', color:GOLD, flexShrink:0 }}>{s.passo||i+1}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1rem', color:'#F5F5F3' }}>{s.titulo}</div>
                    <div style={{ display:'flex', gap:10, marginTop:4 }}>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563' }}>⏱ {s.tempo}</span>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:GOLD }}>💰 {s.custo}</span>
                    </div>
                  </div>
                  <span style={{ color:GOLD, fontSize:14 }}>{openCac===i?'▲':'▼'}</span>
                </button>
                {openCac===i && <div style={{ padding:'0 18px 14px', borderTop:`1px solid ${BDR}` }}><p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af', lineHeight:1.7, margin:'10px 0', textAlign:'justify' }}>{s.detalhe}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ESTADOS ── */}
      <div id="estados" style={{ padding:'48px 0', borderTop:`1px solid ${BDR}` }}>
        <div className="container">
          <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:GOLD, marginBottom:6 }}>Análise por Estado</h2>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>O ambiente para atiradores varia muito entre estados. Burocracia local, postura da PF e cultura política fazem a diferença.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
            {allEstados.map((e,i) => {
              const rc = e.rating?.startsWith('A')?GRN:e.rating?.startsWith('B')?'#86efac':e.rating?.startsWith('C')?YEL:RED
              return (
                <div key={e._id||i} style={{ background:BG2, border:`1px solid ${BDR}`, borderLeft:`4px solid ${e.color||e.cor||rc}`, padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:GOLD, marginBottom:3 }}>{e.abbr}</div>
                      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1.05rem', color:'#F5F5F3' }}>{e.title||e.nome}</div>
                    </div>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:e.color||e.cor||rc }}>{e.rating}</div>
                  </div>
                  <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af', lineHeight:1.6, marginBottom:8, textAlign:'justify' }}>{e.summary||e.resumo}</p>
                  {(e.highlights||e.destaques||[]).map((h,j)=>(
                    <div key={j} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6b7280', display:'flex', gap:6, marginBottom:3 }}>
                      <span style={{ color:GOLD }}>›</span>{h}
                    </div>
                  ))}
                </div>
              )
            }}
          </div>
        </div>
      </div>

      {/* ── MUNIÇÃO ── */}
      <div id="municao" style={{ padding:'48px 0', borderTop:`1px solid ${BDR}` }}>
        <div className="container">
          <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:GOLD, marginBottom:6 }}>Preços de Munição no Brasil</h2>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>Mercado dominado pela CBC. Importação tributada em até 70% — tudo é mais caro que nos EUA.</p>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'rgba(255,255,255,.03)', borderBottom:`1px solid ${BDR}` }}>
                  {['Calibre','Preço BRL','Equiv. USD','Disponib.','Tendência','Observações'].map(h=>(
                    <th key={h} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, color:'#4b5563', padding:'10px 14px', textAlign:'left', letterSpacing:'.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allMunicao.map((m,i) => {
                  const tc = (m.trend)==='up'?RED:(m.trend)==='down'?GRN:'#4b5563'
                  const dc = (m.availability||m.disp)==='Alta'?GRN:(m.availability||m.disp)==='Baixa'?RED:YEL
                  return (
                    <tr key={m._id||i} style={{ borderBottom:`1px solid ${BDR}`, background:i%2?'rgba(255,255,255,.01)':'transparent' }}>
                      <td style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1rem', color:'#F5F5F3', padding:'10px 14px' }}>{m.title||m.calibre}</td>
                      <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:GOLD, padding:'10px 14px' }}>{m.brlPrice||m.brlPreco}</td>
                      <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563', padding:'10px 14px' }}>{m.usdEquiv||m.usdEq}</td>
                      <td style={{ padding:'10px 14px' }}><span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:dc, background:dc+'20', border:`1px solid ${dc}40`, padding:'2px 8px' }}>{m.availability||m.disp}</span></td>
                      <td style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:tc, padding:'10px 14px' }}>{(m.trend)==='up'?'↑':(m.trend)==='down'?'↓':'→'}</td>
                      <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', padding:'10px 14px', maxWidth:260, lineHeight:1.5 }}>{m.note||m.obs}</td>
                    </tr>
                  )
                }}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}
