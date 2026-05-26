export const marketAnalysis = {
  name: 'marketAnalysis',
  title: 'Market Analysis',
  type: 'document',
  fields: [
    { name:'title', title:'Headline', type:'string', validation: R=>R.required() },
    { name:'summary', title:'Summary', type:'text', rows:3 },
    { name:'bullets', title:'Bullet Points', type:'array', of:[{ type:'string' }] },
    { name:'author', title:'Author/Model', type:'string' },
    { name:'publishedAt', title:'Published At', type:'datetime' },
  ]
}
