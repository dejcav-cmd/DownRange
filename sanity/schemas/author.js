import { defineType, defineField } from 'sanity'

export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({ name: 'name',  title: 'Name', type: 'string', validation: R => R.required() }),
    defineField({ name: 'slug',  title: 'Slug', type: 'slug', options: { source: 'name' } }),
    defineField({ name: 'bio',   title: 'Bio', type: 'text', rows: 3 }),
    defineField({ name: 'photo', title: 'Photo', type: 'image' }),
    defineField({ name: 'role',  title: 'Role', type: 'string' }),
    defineField({ name: 'twitter', title: 'Twitter Handle', type: 'string' }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'photo' },
    prepare: v => v
  }
})
