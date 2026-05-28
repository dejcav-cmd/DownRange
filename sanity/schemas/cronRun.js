export const cronRun = {
  name: 'cronRun',
  title: 'Cron Run Log',
  type: 'document',
  fields: [
    { name: 'jobId',   title: 'Job ID',   type: 'string' },
    { name: 'status',  title: 'Status',   type: 'string' },  // success|failed|warning
    { name: 'ms',      title: 'Duration (ms)', type: 'number' },
    { name: 'at',      title: 'Run At',   type: 'datetime' },
    { name: 'trigger', title: 'Trigger',  type: 'string' },  // cron|manual
    { name: 'details', title: 'Details',  type: 'text' },
    { name: 'error',   title: 'Error',    type: 'text' },
  ],
  preview: {
    select: { title: 'jobId', subtitle: 'at' },
  },
}
