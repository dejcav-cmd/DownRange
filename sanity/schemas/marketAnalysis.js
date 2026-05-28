export const marketAnalysis = {
  name: 'marketAnalysis',
  title: 'Market Analysis',
  type: 'document',
  fields: [
    { name:'title',       title:'Headline',          type:'string',   validation: R=>R.required() },
    { name:'summary',     title:'Summary',           type:'text',     rows:3 },
    { name:'bullets',     title:'Bullet Points',     type:'array',    of:[{ type:'string' }] },
    { name:'signal',      title:'Market Signal',     type:'string',   options:{ list:['BUY','HOLD','WATCH','SELL'] } },
    { name:'signalReason',title:'Signal Reason',     type:'string' },
    { name:'session',     title:'Session (AM/PM)',   type:'string' },
    { name:'author',      title:'Author/Model',      type:'string' },
    { name:'publishedAt', title:'Published At',      type:'datetime' },
  ],
  orderings: [{ title:'Newest', name:'publishedAtDesc', by:[{ field:'publishedAt', direction:'desc' }] }],
  preview: {
    select: { title:'title', subtitle:'publishedAt', signal:'signal' },
    prepare: ({ title, subtitle, signal }) => ({
      title: (signal ? '[' + signal + '] ' : '') + (title || 'Market Brief'),
      subtitle: subtitle ? new Date(subtitle).toLocaleString() : 'No date',
    })
  }
}
