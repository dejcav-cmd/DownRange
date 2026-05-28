import { defineType, defineField } from 'sanity'

export const video = defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  fields: [
    defineField({ name: 'title',       title: 'Title', type: 'string', validation: R => R.required() }),
    defineField({ name: 'youtubeId',   title: 'YouTube Video ID', type: 'string', validation: R => R.required() }),
    defineField({ name: 'videoId',     title: 'Video ID (alias)', type: 'string' }),
    defineField({ name: 'channelName', title: 'Channel Name', type: 'string' }),
    defineField({ name: 'channelId',   title: 'Channel ID', type: 'string' }),
    defineField({ name: 'thumbnail',   title: 'Thumbnail URL', type: 'url' }),
    defineField({ name: 'thumbnailUrl',title: 'Thumbnail URL (alias)', type: 'url' }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
    defineField({ name: 'category',    title: 'Category', type: 'string',
      options: { list: [
        'review','training','news','comparison','maintenance','competition',
        'history','build','ammo','hunting',
        'Review','Training','News','Comparison','Maintenance','Competition',
        'History','Build','Ammo','Hunting',
      ] }
    }),
    defineField({ name: 'duration',    title: 'Duration', type: 'string' }),
    defineField({ name: 'featured',    title: 'Featured', type: 'boolean', initialValue: false }),
    defineField({ name: 'active',      title: 'Active', type: 'boolean', initialValue: true }),
    defineField({ name: 'publishedAt', title: 'Published At (YouTube)', type: 'datetime' }),
    defineField({ name: 'addedAt',     title: 'Added to DownRange', type: 'datetime' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'channelName' },
    prepare: ({ title, subtitle }) => ({ title, subtitle })
  }
})
