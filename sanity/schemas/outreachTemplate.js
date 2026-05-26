import { defineType, defineField } from 'sanity'

export const outreachTemplate = defineType({
  name: 'outreachTemplate',
  title: 'Email Template',
  type: 'document',
  fields: [
    defineField({ name: 'name',    title: 'Template Name', type: 'string', validation: R => R.required() }),
    defineField({ name: 'type',    title: 'Template Type', type: 'string',
      options: { list: ['gun_shop','instructor','youtuber','influencer','ffl_dealer','range','organization','press','follow_up','generic'] } }),
    defineField({ name: 'subject', title: 'Email Subject', type: 'string', validation: R => R.required() }),
    defineField({ name: 'body',    title: 'Email Body (HTML)', type: 'text', rows: 20, validation: R => R.required() }),
    defineField({ name: 'previewText', title: 'Preview Text (shown in inbox)', type: 'string' }),
    defineField({ name: 'variables', title: 'Available Variables', type: 'array', of: [{ type: 'string' }],
      description: 'e.g. {{firstName}}, {{businessName}}, {{city}}, {{state}}, {{channelName}}, {{subscriberCount}}' }),
    defineField({ name: 'tags',    title: 'Tags', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'isActive', title: 'Active', type: 'boolean', initialValue: true }),
    defineField({ name: 'createdAt', title: 'Created', type: 'datetime', initialValue: () => new Date().toISOString() }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'type' },
    prepare: ({ title, subtitle }) => ({ title, subtitle })
  }
})
