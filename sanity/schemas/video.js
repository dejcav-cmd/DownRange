import { defineType, defineField } from 'sanity'

export const video = defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  fields: [
    defineField({ name: 'title',       title: 'Title', type: 'string', validation: R => R.required() }),
    defineField({ name: 'youtubeId',   title: 'YouTube Video ID', type: 'string', validation: R => R.required() }),
    defineField({ name: 'channelName', title: 'Channel Name', type: 'string' }),
    defineField({ name: 'channelId',   title: 'Channel ID', type: 'string' }),
    defineField({ name: 'thumbnail',   title: 'Thumbnail URL', type: 'url' }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
    defineField({ name: 'category',    title: 'Category', type: 'string',
      options: { list: ['Review','Training','News','Comparison','Maintenance','Competition'] } }),
    defineField({ name: 'duration',    title: 'Duration', type: 'string' }),
    defineField({ name: 'featured',    title: 'Featured', type: 'boolean', initialValue: false }),
    defineField({ name: 'publishedAt', title: 'Published At (YouTube)', type: 'datetime' }),
    defineField({ name: 'addedAt',     title: 'Added to DownRange', type: 'datetime' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'channelName' },
    prepare: ({ title, subtitle }) => ({ title, subtitle })
  }
})
