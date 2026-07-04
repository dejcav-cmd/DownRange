export const newsletterDraft = {
  name: 'newsletterDraft',
  title: 'Newsletter Draft',
  type: 'document',
  fields: [
    {
      name: 'subject',
      title: 'Subject Line',
      type: 'string',
    },
    {
      name: 'preview',
      title: 'Preview Text',
      type: 'string',
      description: 'First ~90 chars shown in inbox before opening',
    },
    {
      name: 'weekOf',
      title: 'Week Of',
      type: 'string',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Ready to Send', value: 'ready' },
          { title: 'Sent', value: 'sent' },
          { title: 'Archived', value: 'archived' },
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
    },
    {
      name: 'bodyHtml',
      title: 'Email Body (HTML)',
      type: 'text',
      rows: 20,
    },
    {
      name: 'bodyText',
      title: 'Plain Text Fallback',
      type: 'text',
      rows: 10,
    },
    {
      name: 'sentAt',
      title: 'Sent At',
      type: 'datetime',
      readOnly: true,
    },
    {
      name: 'sentCount',
      title: 'Recipients Sent To',
      type: 'number',
      readOnly: true,
    },
    {
      name: 'openRate',
      title: 'Open Rate (%)',
      type: 'number',
    },
    {
      name: 'clickRate',
      title: 'Click Rate (%)',
      type: 'number',
    },
  ],
  orderings: [
    {
      title: 'Newest First',
      name: 'createdDesc',
      by: [{ field: '_createdAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      subject: 'subject',
      status: 'status',
      sentAt: 'sentAt',
      sentCount: 'sentCount',
      weekOf: 'weekOf',
    },
    prepare({ subject, status, sentAt, sentCount, weekOf }) {
      const icons = { draft: '✏️', ready: '📋', sent: '✅', archived: '📦' }
      const icon = icons[status] || '📧'
      const sub = sentAt
        ? `Sent ${new Date(sentAt).toLocaleDateString()} · ${sentCount || 0} recipients`
        : weekOf || 'Draft'
      return { title: `${icon} ${subject || 'Untitled'}`, subtitle: sub }
    },
  },
}
