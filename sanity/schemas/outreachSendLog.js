import { defineType, defineField } from 'sanity'

export const outreachSendLog = defineType({
  name: 'outreachSendLog',
  title: 'Send Log',
  type: 'document',
  fields: [
    defineField({ name: 'campaign',  title: 'Campaign', type: 'reference', to: [{ type: 'outreachCampaign' }] }),
    defineField({ name: 'contact',   title: 'Contact',  type: 'reference', to: [{ type: 'outreachContact' }] }),
    defineField({ name: 'toEmail',   title: 'To Email', type: 'string' }),
    defineField({ name: 'toName',    title: 'To Name',  type: 'string' }),
    defineField({ name: 'subject',   title: 'Subject',  type: 'string' }),
    defineField({ name: 'status',    title: 'Status',   type: 'string',
      options: { list: ['queued','sent','delivered','opened','clicked','replied','bounced','failed','unsubscribed'] },
      initialValue: 'queued' }),
    defineField({ name: 'resendId',  title: 'Resend Message ID', type: 'string' }),
    defineField({ name: 'error',     title: 'Error', type: 'string' }),
    defineField({ name: 'sentAt',    title: 'Sent At',   type: 'datetime' }),
    defineField({ name: 'openedAt',  title: 'Opened At', type: 'datetime' }),
    defineField({ name: 'clickedAt', title: 'Clicked At', type: 'datetime' }),
    defineField({ name: 'repliedAt', title: 'Replied At', type: 'datetime' }),
  ],
  preview: {
    select: { title: 'toName', subtitle: 'status', description: 'toEmail' },
    prepare: ({ title, subtitle, description }) => ({ title, subtitle: `${subtitle} · ${description}` })
  }
})
