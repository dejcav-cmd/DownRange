export const blogPost = {
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    { name: 'title',       title: 'Title',          type: 'string' },
    { name: 'slug',        title: 'Slug',           type: 'slug', options: { source: 'title' } },
    { name: 'author',      title: 'Author',         type: 'string' },
    { name: 'category',    title: 'Category',       type: 'string' },
    { name: 'excerpt',     title: 'Excerpt',        type: 'text' },
    { name: 'body',        title: 'Body (HTML)',     type: 'text' },
    { name: 'imageUrl',    title: 'Image URL',      type: 'url' },
    { name: 'readTime',    title: 'Read Time (min)', type: 'number' },
    { name: 'status',      title: 'Status',         type: 'string', options: { list: ['draft','published'] } },
    { name: 'featured',    title: 'Featured',       type: 'boolean' },
    { name: 'publishedAt', title: 'Published At',   type: 'datetime' },
    { name: 'tags',        title: 'Tags',           type: 'array', of: [{ type: 'string' }] },
    { name: 'qualityReviewed', title: 'Quality Reviewed (AI standard met)', type: 'boolean', initialValue: false },
  ],
  preview: {
    select: { title: 'title', subtitle: 'category' },
  },
}
