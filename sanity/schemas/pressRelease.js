// Manufacturer press releases: rewritten by DownRange, linked back to the original.
export const pressRelease = {
  name: 'pressRelease',
  title: 'Manufacturer Press Release',
  type: 'document',
  fields: [
    { name: 'title',       title: 'Title',                   type: 'string' },
    { name: 'slug',        title: 'Slug',                    type: 'slug', options: { source: 'title' } },
    { name: 'brand',       title: 'Manufacturer',            type: 'string' },
    { name: 'brandSlug',   title: 'Manufacturer slug',       type: 'string' },
    { name: 'kind',        title: 'Release type',            type: 'string', options: { list: ['product', 'corporate', 'event', 'recall', 'partnership'] } },
    { name: 'category',    title: 'Firearm category',        type: 'string' },
    { name: 'summary',     title: 'Summary',                 type: 'text' },
    { name: 'body',        title: 'Body (HTML)',             type: 'text' },
    { name: 'sourceUrl',   title: 'Original press release URL', type: 'url' },
    { name: 'sourceTitle', title: 'Original headline',       type: 'string' },
    { name: 'sourceDate',  title: 'Original publish date',   type: 'datetime' },
    { name: 'imageUrl',    title: 'Image URL',               type: 'url' },
    { name: 'heroImage',   title: 'Hero image',              type: 'image' },
    { name: 'tags',        title: 'Tags',                    type: 'array', of: [{ type: 'string' }] },
    { name: 'readTime',    title: 'Read time (min)',         type: 'number' },
    { name: 'approved',    title: 'Published',               type: 'boolean', initialValue: true },
    { name: 'editorLocked', title: 'Editor locked (no AI changes)', type: 'boolean', initialValue: false },
    { name: 'publishedAt', title: 'Published at',            type: 'datetime' },
    { name: 'heroSourceUrl', title: 'Hero image source URL', type: 'url' },
    { name: 'imagesDone',  title: 'Images processed',        type: 'boolean', initialValue: false },
    { name: 'imageStatus', title: 'Image status',            type: 'string' },
    { name: 'imageTries',  title: 'Image attempts',          type: 'number' },
    { name: 'imagesVersion', title: 'Image rules version',   type: 'number' },
    { name: 'imageHashes', title: 'Image hashes',            type: 'array', of: [{ type: 'string' }] },
  ],
  preview: { select: { title: 'title', subtitle: 'brand' } },
}

// One document that remembers how each manufacturer source did on the last pull.
export const pressPullState = {
  name: 'pressPullState',
  title: 'Press Pull State',
  type: 'document',
  fields: [
    { name: 'lastRunAt', title: 'Last run', type: 'datetime' },
    { name: 'lastCreated', title: 'Created last run', type: 'number' },
    { name: 'sources', title: 'Sources', type: 'array', of: [{ type: 'object', fields: [
      { name: 'brand',      type: 'string' },
      { name: 'status',     type: 'string' },
      { name: 'candidates', type: 'number' },
      { name: 'created',    type: 'number' },
      { name: 'checkedAt',  type: 'datetime' },
      { name: 'note',       type: 'string' },
    ] }] },
  ],
}
