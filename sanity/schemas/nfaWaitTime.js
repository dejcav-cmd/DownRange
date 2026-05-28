export const nfaWaitTime = {
  name: 'nfaWaitTime',
  title: 'NFA Wait Time Snapshot',
  type: 'document',
  fields: [
    { name: 'fetchedAt',    title: 'Fetched At',       type: 'datetime' },
    { name: 'reportMonth',  title: 'Report Month',     type: 'string' },  // e.g. "March 2026"
    { name: 'reportedByAtf',title: 'ATF Official Data',type: 'boolean',   initialValue: false },
    { name: 'sourceUrl',    title: 'Source URL',        type: 'url' },
    {
      name: 'forms', title: 'Form Data', type: 'array',
      of: [{
        type: 'object', fields: [
          { name: 'formType',   title: 'Form Type',    type: 'string' },  // "Form 4 eFile Individual"
          { name: 'category',   title: 'Category',     type: 'string' },  // "suppressor"
          { name: 'method',     title: 'Filing Method',type: 'string' },  // "eForms" | "Paper"
          { name: 'avgDays',    title: 'Avg Days',     type: 'number' },
          { name: 'minDays',    title: 'Min Days',     type: 'number' },
          { name: 'maxDays',    title: 'Max Days',     type: 'number' },
          { name: 'trend',      title: 'Trend',        type: 'string' },  // "up"|"down"|"stable"
          { name: 'note',       title: 'Note',         type: 'string' },
        ]
      }]
    },
    { name: 'communityNotes', title: 'Community Notes', type: 'text' },
  ],
  preview: {
    select: { title: 'reportMonth', subtitle: 'fetchedAt' },
  },
}
