import { defineType, defineField } from 'sanity'

export const legislation = defineType({
  name: 'legislation',
  title: 'Legislation',
  type: 'document',
  fields: [
    defineField({ name: 'title',    title: 'Bill Title',  type: 'string', validation: R => R.required() }),
    defineField({ name: 'billNumber', title: 'Bill Number', type: 'string' }),
    defineField({ name: 'slug',     title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'level',    title: 'Level', type: 'string',
      options: { list: ['Federal','State'], layout: 'radio' } }),
    defineField({ name: 'state',    title: 'State (if state-level)', type: 'string' }),
    defineField({ name: 'status',   title: 'Status', type: 'string',
      options: { list: ['Introduced','In Committee','Passed House','Passed Senate','Signed','Vetoed','Challenged','Failed'] } }),
    defineField({ name: 'summary',  title: 'Summary', type: 'text', rows: 4 }),
    defineField({ name: 'impact',   title: 'Impact on Gun Owners', type: 'string',
      options: { list: ['Restrictive','Neutral','Pro-2A'] } }),
    defineField({ name: 'sponsor',  title: 'Primary Sponsor', type: 'string' }),
    defineField({ name: 'sourceUrl', title: 'Source URL', type: 'url' }),
    defineField({ name: 'lastAction', title: 'Last Action', type: 'string' }),
    defineField({ name: 'lastActionDate', title: 'Last Action Date', type: 'date' }),
    defineField({ name: 'congress', title: 'Congress Session', type: 'number' }),
    defineField({ name: 'updatedAt', title: 'Last Updated', type: 'datetime' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'status', media: 'level' },
    prepare: ({ title, subtitle }) => ({ title, subtitle })
  }
})
