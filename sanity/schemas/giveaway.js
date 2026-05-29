import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'giveaway',
  title: 'Giveaway',
  type: 'document',
  fields: [
    defineField({ name: 'title',      title: 'Title',        type: 'string',   validation: R => R.required() }),
    defineField({ name: 'sponsor',    title: 'Sponsor',      type: 'string',   validation: R => R.required() }),
    defineField({ name: 'prize',      title: 'Prize',        type: 'string'    }),
    defineField({ name: 'entryUrl',   title: 'Entry URL',    type: 'url',      validation: R => R.required() }),
    defineField({ name: 'imageUrl',   title: 'Image URL',    type: 'string'    }),
    defineField({ name: 'category',   title: 'Category',     type: 'string',
      options: { list: ['pistol','rifle','shotgun','ammo','gear','accessories','nfa','optics'] }
    }),
    defineField({ name: 'sourceType', title: 'Source Type',  type: 'string',
      options: { list: ['manufacturer','retailer','youtuber','organization'] }
    }),
    defineField({ name: 'endDate',    title: 'End Date',     type: 'datetime'  }),
    defineField({ name: 'active',     title: 'Active',       type: 'boolean',  initialValue: true }),
    defineField({ name: 'featured',   title: 'Featured',     type: 'boolean',  initialValue: false }),
    defineField({ name: 'addedAt',    title: 'Added At',     type: 'datetime'  }),
    defineField({ name: 'editorNote', title: 'Editor Note',  type: 'text'      }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'sponsor', media: 'imageUrl' },
  },
})
