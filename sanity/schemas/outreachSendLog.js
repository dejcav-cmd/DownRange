import { defineType, defineField } from 'sanity'

export const outreachSendLog = defineType({
  name: 'outreachSendLog',
  title: 'Send Log / Queue',
  type: 'document',
  fields: [
    defineField({ name: 'campaign',  title: 'Campaign', type: 'reference', to: [{ type: 'outreachCampaign' }] }),
    defineField({ name: 'contact',   title: 'Contact',  type: 'reference', to: [{ type: 'outreachContact' }] }),
    defineField({ name: 'template',  title: 'Template', type: 'reference', to: [{ type: 'outreachTemplate' }] }),
    defineField({ name: 'toEmail',   title: 'To Email', type: 'string' }),
    defineField({ name: 'toName',    title: 'To Name',  type: 'string' }),
    defineField({ name: 'subject',   title: 'Subject',  type: 'string' }),
    defineField({ name: 'bodyHtml',  title: 'Email Body (rendered HTML)', type: 'text' }),
    defineField({ name: 'status',    title: 'Status',   type: 'string',
      options: { list: ['draft','approved','sent','delivered','opened','clicked','replied','bounced','failed','skipped','snoozed'] },
      initialValue: 'draft' }),
    defineField({ name: 'approvalNote', title: 'Approval Note / Edit', type: 'text', rows: 2 }),
    defineField({ name: 'snoozeUntil',  title: 'Snooze Until', type: 'datetime' }),
    defineField({ name: 'resendId',  title: 'Resend Message ID', type: 'string' }),
    defineField({ name: 'error',     title: 'Error', type: 'string' }),
    defineField({ name: 'draftedAt', title: 'Drafted At',  type: 'datetime' }),
    defineField({ name: 'approvedAt',title: 'Approved At', type: 'datetime' }),
    defineField({ name: 'sentAt',    title: 'Sent At',     type: 'datetime' }),
    defineField({ name: 'openedAt',  title: 'Opened At',   type: 'datetime' }),
    defineField({ name: 'clickedAt', title: 'Clicked At',  type: 'datetime' }),
    defineField({ name: 'repliedAt', title: 'Replied At',  type: 'datetime' }),
  ],
  preview: {
    select: { title: 'toName', subtitle: 'status', description: 'toEmail' },
    prepare: ({ title, subtitle, description }) => ({ title, subtitle: `${subtitle} · ${description}` })
  }
})
