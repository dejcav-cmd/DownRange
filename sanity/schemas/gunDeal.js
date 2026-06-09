export const gunDeal = {
  name: 'gunDeal',
  title: 'Gun Deal',
  type: 'document',
  fields: [
    { name: 'title',       title: 'Title',        type: 'string', validation: R => R.required() },
    { name: 'externalUrl', title: 'Deal URL',      type: 'url',   validation: R => R.required() },
    { name: 'source',      title: 'Source',        type: 'string',
      description: 'e.g. gun.deals, r/gundeals' },
    { name: 'price',       title: 'Price',         type: 'string',
      description: 'Extracted price string, e.g. "$349.99"' },
    { name: 'category',    title: 'Category',      type: 'string',
      options: { list: ['ammo','rifle','pistol','shotgun','suppressor','optic','accessory','deal'] } },
    { name: 'summary',     title: 'Summary',       type: 'text', rows: 3 },
    { name: 'imageUrl',    title: 'Image URL',     type: 'url' },
    { name: 'store',       title: 'Store/Retailer', type: 'string' },
    { name: 'publishedAt', title: 'Published At',  type: 'datetime' },
    { name: 'approved',    title: 'Approved',      type: 'boolean', initialValue: true },
    { name: 'tags',        title: 'Tags',          type: 'array', of: [{ type: 'string' }] },
  ],
  orderings: [
    { title: 'Published Date, New', name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'title', subtitle: 'price', source: 'source' },
    prepare({ title, subtitle, source }) {
      return { title, subtitle: [subtitle, source].filter(Boolean).join(' · ') }
    }
  }
}
