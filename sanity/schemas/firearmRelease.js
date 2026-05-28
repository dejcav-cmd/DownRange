import { defineType, defineField } from 'sanity'

export const firearmRelease = defineType({
  name: 'firearmRelease',
  title: 'Firearm Release',
  type: 'document',
  fields: [
    defineField({ name: 'title',  title: 'Product Name', type: 'string', validation: R => R.required() }),
    defineField({ name: 'slug',   title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'brand',  title: 'Brand', type: 'string' }),
    defineField({ name: 'model',  title: 'Model', type: 'string' }),
    defineField({ name: 'category', title: 'Category', type: 'string',
      options: { list: ['Pistol','Rifle','Shotgun','Revolver','Suppressor','Optic','Accessory','Ammo'] } }),
    defineField({ name: 'caliber', title: 'Caliber', type: 'string' }),
    defineField({ name: 'action',  title: 'Action Type', type: 'string' }),
    defineField({ name: 'msrp',    title: 'MSRP ($)', type: 'number' }),
    defineField({ name: 'heroImage', title: 'Hero Image (Upload)', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'imageUrl', title: 'Image URL (Auto-scraped)', type: 'url' }),
    defineField({ name: 'summary',  title: 'Summary', type: 'text', rows: 3 }),
    defineField({ name: 'body',  title: 'Full Article Body (HTML)', type: 'text', rows: 12 }),
    defineField({ name: 'pressReleaseExcerpt', title: 'Press Release Excerpt', type: 'text', rows: 3 }),
    defineField({ name: 'approved', title: 'Published', type: 'boolean', initialValue: false }),
    defineField({ name: 'qualityReviewed', title: 'Quality Reviewed (AI standard met)', type: 'boolean', initialValue: false }),
    defineField({ name: 'specs', title: 'Specs', type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'label', type: 'string', title: 'Label' },
        { name: 'value', type: 'string', title: 'Value' },
      ]}]
    }),
    defineField({ name: 'sourceUrl', title: 'Manufacturer Source URL', type: 'url' }),
    defineField({ name: 'availableDate', title: 'Available Date', type: 'date' }),
    defineField({ name: 'isJustDropped', title: 'Just Dropped', type: 'boolean', initialValue: true }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'brand', media: 'heroImage' },
    prepare: ({ title, subtitle, media }) => ({ title, subtitle, media })
  }
})
