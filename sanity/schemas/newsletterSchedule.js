// sanity/schemas/newsletterSchedule.js
export default {
  name: 'newsletterSchedule',
  title: 'Newsletter Schedule',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      initialValue: 'Daily Newsletter Schedule',
      readOnly: true,
    },
    {
      name: 'enabled',
      title: 'Enable Automatic Sends',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'days',
      title: 'Send On Days',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Monday', value: 'monday' },
          { title: 'Tuesday', value: 'tuesday' },
          { title: 'Wednesday', value: 'wednesday' },
          { title: 'Thursday', value: 'thursday' },
          { title: 'Friday', value: 'friday' },
          { title: 'Saturday', value: 'saturday' },
          { title: 'Sunday', value: 'sunday' },
        ],
      },
      initialValue: ['monday', 'thursday'],
    },
    {
      name: 'hour',
      title: 'Send Hour (UTC)',
      type: 'number',
      validation: Rule => Rule.min(0).max(23),
      initialValue: 7,
      description: '0-23 in UTC timezone',
    },
    {
      name: 'minute',
      title: 'Send Minute',
      type: 'number',
      validation: Rule => Rule.min(0).max(59),
      initialValue: 0,
    },
    {
      name: 'lastSent',
      title: 'Last Sent At',
      type: 'datetime',
      readOnly: true,
    },
    {
      name: 'nextSend',
      title: 'Next Scheduled Send',
      type: 'datetime',
      readOnly: true,
    },
    {
      name: 'notes',
      title: 'Notes',
      type: 'text',
    },
  ],
  preview: {
    select: {
      days: 'days',
      hour: 'hour',
      minute: 'minute',
      enabled: 'enabled',
    },
    prepare(selection) {
      const { days, hour, minute, enabled } = selection
      const daysStr = days?.join(', ') || 'No days'
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} UTC`
      const status = enabled ? '✓' : '✗'
      return {
        title: `${status} ${daysStr}`,
        subtitle: timeStr,
      }
    },
  },
}
