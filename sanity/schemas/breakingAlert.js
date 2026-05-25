import { defineType, defineField } from 'sanity'

export const breakingAlert = defineType({
  name: 'breakingAlert',
  title: 'Breaking Alert',
  type: 'document',
  fields: [
    defineField({ name: 'headline', title: 'Headline', type: 'string', validation: R => R.required() }),
    defineField({ name: 'summary',  title: 'Summary',  type: 'text',   rows: 3 }),
    defineField({ name: 'urgencyScore', title: 'Urgency Score (1-10)', type: 'number',
      validation: R => R.min(1).max(10) }),
    defineField({ name: 'sourceUrl', title: 'Source URL', type: 'url' }),
    defineField({ name: 'active', title: 'Active (show in ticker)', type: 'boolean', initialValue: true }),
    defineField({ name: 'category', title: 'Category', type: 'string',
      options: { list: ['ATF Ruling','SCOTUS','Legislation','State Law','Industry','Safety'] } }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime' }),
  ],
  orderings: [{ title: 'Urgency', name: 'urgency', by: [{ field: 'urgencyScore', direction: 'desc' }] }],
  preview: {
    select: { title: 'headline', subtitle: 'urgencyScore' },
    prepare: ({ title, subtitle }) => ({ title, subtitle: `Score: ${subtitle}` })
  }
})
