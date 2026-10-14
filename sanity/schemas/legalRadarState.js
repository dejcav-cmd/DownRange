// Singleton written by the radar cron so the admin panels can show source health.
export const legalRadarState = {
  name: 'legalRadarState',
  title: '2A Radar Run State',
  type: 'document',
  fields: [
    { name: 'lastRunAt', type: 'datetime' },
    { name: 'mode', type: 'string' },
    { name: 'result', type: 'text' },
  ],
}
