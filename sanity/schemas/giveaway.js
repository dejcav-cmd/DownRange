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
      // 'external' is retained for documents written before the scraper rewrite.
      options: { list: ['aggregator','manufacturer','retailer','youtuber','organization','external'] }
    }),
    defineField({ name: 'prizeValue', title: 'Prize Value ($)', type: 'number' }),
    // Deliberately `date`, not `datetime`: the cron writes bare YYYY-MM-DD and
    // /giveaways does `new Date(endDate + 'T23:59:59Z')`, which yields Invalid
    // Date if a full ISO timestamp is stored.
    defineField({ name: 'endDate',    title: 'End Date',     type: 'date'      }),
    defineField({ name: 'active',     title: 'Active',       type: 'boolean',  initialValue: true }),
    defineField({ name: 'featured',   title: 'Featured',     type: 'boolean',  initialValue: false }),
    defineField({ name: 'addedAt',    title: 'Added At',     type: 'datetime'  }),
    defineField({ name: 'editorNote', title: 'Editor Note',  type: 'text'      }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'sponsor', media: 'imageUrl' },
  },
})
