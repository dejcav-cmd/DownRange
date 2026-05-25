import { defineType, defineField } from 'sanity'

export const review = defineType({
  name: 'review',
  title: 'Review',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Review Title', type: 'string', validation: R => R.required() }),
    defineField({ name: 'slug',  title: 'Slug', type: 'slug', options: { source: 'title' }, validation: R => R.required() }),
    defineField({ name: 'category', title: 'Category', type: 'string',
      options: { list: ['Pistol','Rifle','Shotgun','Optic','Suppressor','Accessory','Ammo'] } }),
    defineField({ name: 'heroImage', title: 'Hero Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'score', title: 'Score (0-10)', type: 'number', validation: R => R.min(0).max(10) }),
    defineField({ name: 'verdict', title: 'Verdict', type: 'string',
      options: { list: ['Best in Class','Highly Recommended','Recommended','Good Value','Average','Skip It'] } }),
    defineField({ name: 'summary', title: 'Summary', type: 'text', rows: 3 }),
    defineField({ name: 'pros',    title: 'Pros',  type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'cons',    title: 'Cons',  type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'specs',   title: 'Specs', type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'label', type: 'string', title: 'Label' },
        { name: 'value', type: 'string', title: 'Value' },
      ]}]
    }),
    defineField({ name: 'body', title: 'Full Review', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'testRounds', title: 'Rounds Tested', type: 'number' }),
    defineField({ name: 'msrp', title: 'MSRP ($)', type: 'number' }),
    defineField({ name: 'brand', title: 'Brand', type: 'string' }),
    defineField({ name: 'model', title: 'Model', type: 'string' }),
    defineField({ name: 'caliber', title: 'Caliber', type: 'string' }),
    defineField({ name: 'author', title: 'Author', type: 'reference', to: [{ type: 'author' }] }),
    defineField({ name: 'featured', title: 'Featured', type: 'boolean', initialValue: false }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'score', media: 'heroImage' },
    prepare: ({ title, subtitle, media }) => ({ title, subtitle: `Score: ${subtitle}/10`, media })
  }
})
