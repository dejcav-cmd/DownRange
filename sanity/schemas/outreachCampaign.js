import { defineType, defineField } from 'sanity'

export const outreachCampaign = defineType({
  name: 'outreachCampaign',
  title: 'Outreach Campaign',
  type: 'document',
  fields: [
    defineField({ name: 'name',     title: 'Campaign Name', type: 'string', validation: R => R.required() }),
    defineField({ name: 'slug',     title: 'Slug', type: 'slug', options: { source: 'name' } }),
    defineField({ name: 'type',     title: 'Campaign Type', type: 'string',
      options: { list: ['launch_announcement','youtube_permission','shop_partnership','instructor_network','press_outreach','follow_up','newsletter_invite'] } }),
    defineField({ name: 'status',   title: 'Status', type: 'string',
      options: { list: ['draft','scheduled','active','paused','completed','archived'] }, initialValue: 'draft' }),
    defineField({ name: 'template', title: 'Email Template', type: 'reference', to: [{ type: 'outreachTemplate' }] }),
    defineField({ name: 'targetTypes', title: 'Target Contact Types', type: 'array', of: [{ type: 'string' }],
      options: { list: ['gun_shop','instructor','youtuber','influencer','ffl_dealer','range','organization','press','other'] } }),
    defineField({ name: 'targetTags',  title: 'Target Tags (filter)', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'targetStates', title: 'Target States (filter)', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'scheduledAt', title: 'Scheduled Send Date', type: 'datetime' }),
    defineField({ name: 'sentAt',      title: 'Sent At', type: 'datetime' }),
    defineField({ name: 'fromName',    title: 'From Name', type: 'string', initialValue: 'DJ Cavalcanti — DownRange' }),
    defineField({ name: 'fromEmail',   title: 'From Email', type: 'string', initialValue: 'dj@downrangeco.com' }),
    defineField({ name: 'replyTo',     title: 'Reply-To', type: 'string', initialValue: 'dj@downrangeco.com' }),
    defineField({ name: 'stats', title: 'Stats', type: 'object', fields: [
      { name: 'sent',       type: 'number', title: 'Sent',         initialValue: 0 },
      { name: 'delivered',  type: 'number', title: 'Delivered',    initialValue: 0 },
      { name: 'opened',     type: 'number', title: 'Opened',       initialValue: 0 },
      { name: 'clicked',    type: 'number', title: 'Clicked',      initialValue: 0 },
      { name: 'replied',    type: 'number', title: 'Replied',      initialValue: 0 },
      { name: 'bounced',    type: 'number', title: 'Bounced',      initialValue: 0 },
      { name: 'unsubscribed', type: 'number', title: 'Unsubscribed', initialValue: 0 },
    ]}),
    defineField({ name: 'notes', title: 'Notes', type: 'text', rows: 2 }),
    defineField({ name: 'createdAt', title: 'Created At', type: 'datetime', initialValue: () => new Date().toISOString() }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'status' },
    prepare: ({ title, subtitle }) => ({ title, subtitle: subtitle?.toUpperCase() })
  }
})
