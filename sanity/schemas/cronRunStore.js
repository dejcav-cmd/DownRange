import { defineType, defineField } from 'sanity'

export const cronRunStore = defineType({
  name: 'cronRunStore',
  title: 'Cron Run Store',
  type: 'document',
  // Hide from studio content list — this is internal system storage
  __experimental_actions: ['update', 'publish'],
  fields: [
    defineField({
      name: 'data',
      title: 'JSON Data',
      type: 'text',
      description: 'Internal JSON storage for cron run history. Do not edit manually.',
    }),
  ],
  preview: {
    select: { title: '_id' },
    prepare: ({ title }) => ({ title: `Cron Store: ${title}` }),
  },
})
