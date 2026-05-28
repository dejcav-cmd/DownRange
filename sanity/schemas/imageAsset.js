export default {
  name: 'imageAsset',
  title: 'Image Repository',
  type: 'document',
  fields: [
    { name: 'title',    title: 'Title',    type: 'string', validation: R => R.required() },
    { name: 'alt',      title: 'Alt Text', type: 'string' },
    {
      name: 'image', title: 'Image (optional — cdnUrl used for display)', type: 'image',
      options: { hotspot: true },
    },
    { name: 'cdnUrl',   title: 'CDN / Static URL', type: 'string' },
    { name: 'imageUrl', title: 'Image URL (display)', type: 'string' },
    {
      name: 'category', title: 'Category', type: 'string',
      options: { list: [
        { title: 'Pistol / Handgun',   value: 'pistol' },
        { title: 'Rifle / Carbine',    value: 'rifle' },
        { title: 'Shotgun',            value: 'shotgun' },
        { title: 'Suppressor / NFA',   value: 'suppressor' },
        { title: 'Ammunition',         value: 'ammo' },
        { title: 'Law / Legal / 2A',   value: 'law' },
        { title: 'Training / Range',   value: 'training' },
        { title: 'Competition',        value: 'competition' },
        { title: 'Hunting / Outdoors', value: 'hunting' },
        { title: 'Industry / News',    value: 'news' },
        { title: 'Gear / Accessories', value: 'gear' },
        { title: 'Home Defense',       value: 'homedefense' },
      ]},
    },
    { name: 'tags',   title: 'Tags',   type: 'array', of: [{ type: 'string' }] },
    { name: 'source', title: 'Source / Credit', type: 'string' },
    { name: 'approved', title: 'Approved for Use', type: 'boolean', initialValue: true },
    { name: 'usageCount', title: 'Times Used', type: 'number', initialValue: 0 },
  ],
  preview: {
    select: { title: 'title', media: 'image', category: 'category' },
    prepare: ({ title, media, category }) => ({
      title, media, subtitle: category,
    }),
  },
}
