import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'prepContent',
  title: 'prepContent',
  type: 'document',
  fields: [
    defineField({ name: 'title',      title: 'Title',      type: 'string',   validation: R => R.required() }),
    defineField({ name: 'body',       title: 'Body (HTML)', type: 'text'     }),
    defineField({ name: 'category',   title: 'Category',   type: 'string',
      options: { list: ['hunting', 'preparedness', 'gear', 'seasons', 'tactics', 'medical', 'homedefense'] }
    }),
    defineField({ name: 'slug',       title: 'Slug',       type: 'slug',     options: { source: 'title' } }),
    defineField({ name: 'publishedAt',title: 'Published',  type: 'datetime' }),
    defineField({ name: 'weekNumber', title: 'Week Number',type: 'number'   }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'category' },
  },
})
