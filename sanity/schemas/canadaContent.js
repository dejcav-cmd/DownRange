import { defineType, defineField } from 'sanity'

export const canadaContent = defineType({
  name: 'canadaContent',
  title: 'Canada Page Content',
  type: 'document',
  fields: [
    defineField({ name: 'type', title: 'Content Type', type: 'string',
      options: { list: ['law','province','article','ammo','alert','stat'] }, validation: R => R.required() }),
    defineField({ name: 'title', title: 'Title / Name', type: 'string', validation: R => R.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    // Law fields
    defineField({ name: 'status', title: 'Status', type: 'string' }),
    defineField({ name: 'impact', title: 'Impact Level', type: 'string',
      options: { list: ['CRITICAL','HIGH','MED','LOW','REQUIRED','IN FORCE'] } }),
    defineField({ name: 'effectiveDate', title: 'Effective Date', type: 'string' }),
    defineField({ name: 'summary', title: 'Summary', type: 'text', rows: 3 }),
    defineField({ name: 'detail', title: 'Full Detail', type: 'text', rows: 8 }),
    defineField({ name: 'sourceUrl', title: 'Source URL', type: 'url' }),
    // Province fields
    defineField({ name: 'abbr', title: 'Province Abbreviation', type: 'string' }),
    defineField({ name: 'rating', title: 'Rating (A/B/C/D)', type: 'string' }),
    defineField({ name: 'highlights', title: 'Highlights', type: 'array', of: [{ type: 'string' }] }),
    // Article fields
    defineField({ name: 'body', title: 'Article Body (HTML)', type: 'text', rows: 15 }),
    defineField({ name: 'qualityReviewed', title: 'Quality Reviewed (AI standard met)', type: 'boolean', initialValue: false }),
    defineField({ name: 'imageUrl', title: 'Image URL', type: 'url' }),
    defineField({ name: 'tag', title: 'Tag (LAW/GUIDE/POLICY)', type: 'string' }),
    defineField({ name: 'readMins', title: 'Read Time (e.g. 7 min)', type: 'string' }),
    defineField({ name: 'author', title: 'Author', type: 'string', initialValue: 'DJ Cavalcanti' }),
    // Ammo fields
    defineField({ name: 'cadPrice', title: 'CAD Price (e.g. C$0.42/rd)', type: 'string' }),
    defineField({ name: 'usdEquiv', title: 'USD Equivalent', type: 'string' }),
    defineField({ name: 'availability', title: 'Availability', type: 'string',
      options: { list: ['High','Moderate','Low'] } }),
    defineField({ name: 'trend', title: 'Price Trend', type: 'string',
      options: { list: ['up','down','flat'] } }),
    defineField({ name: 'note', title: 'Notes', type: 'text', rows: 2 }),
    // Alert/stat fields
    defineField({ name: 'value', title: 'Value / Stat', type: 'string' }),
    defineField({ name: 'color', title: 'Color (hex)', type: 'string' }),
    // Common
    defineField({ name: 'order', title: 'Sort Order', type: 'number', initialValue: 99 }),
    defineField({ name: 'active', title: 'Active / Visible', type: 'boolean', initialValue: true }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'type', status: 'status' },
    prepare: ({ title, subtitle, status }) => ({ title, subtitle: `[${subtitle}] ${status || ''}` })
  }
})
