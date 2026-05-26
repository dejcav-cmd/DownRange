import { defineType, defineField } from 'sanity'

export const outreachContact = defineType({
  name: 'outreachContact',
  title: 'Outreach Contact',
  type: 'document',
  fields: [
    defineField({ name: 'type', title: 'Contact Type', type: 'string',
      options: { list: ['gun_shop','instructor','youtuber','influencer','ffl_dealer','range','organization','press','other'] },
      validation: R => R.required() }),
    defineField({ name: 'name',         title: 'Full Name / Business Name', type: 'string', validation: R => R.required() }),
    defineField({ name: 'firstName',    title: 'First Name', type: 'string' }),
    defineField({ name: 'email',        title: 'Email', type: 'string' }),
    defineField({ name: 'phone',        title: 'Phone', type: 'string' }),
    defineField({ name: 'website',      title: 'Website', type: 'url' }),
    defineField({ name: 'youtubeUrl',   title: 'YouTube Channel URL', type: 'url' }),
    defineField({ name: 'youtubeChannel', title: 'YouTube Channel ID', type: 'string' }),
    defineField({ name: 'subscribers',  title: 'Subscriber Count', type: 'number' }),
    defineField({ name: 'instagram',    title: 'Instagram Handle', type: 'string' }),
    defineField({ name: 'twitter',      title: 'Twitter/X Handle', type: 'string' }),
    defineField({ name: 'city',         title: 'City', type: 'string' }),
    defineField({ name: 'state',        title: 'State', type: 'string' }),
    defineField({ name: 'zip',          title: 'ZIP Code', type: 'string' }),
    defineField({ name: 'country',      title: 'Country', type: 'string', initialValue: 'USA' }),
    defineField({ name: 'fflLicense',   title: 'FFL License Number', type: 'string' }),
    defineField({ name: 'nraInstructorId', title: 'NRA Instructor ID', type: 'string' }),
    defineField({ name: 'specialties',  title: 'Specialties / Niches', type: 'array', of: [{ type: 'string' }],
      options: { list: ['pistol','rifle','shotgun','CCW','hunting','NFA','long-range','competition','home-defense','2A-advocacy','legal','military','law-enforcement'] } }),
    defineField({ name: 'notes',        title: 'Notes', type: 'text', rows: 2 }),
    defineField({ name: 'tags',         title: 'Tags', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'status',       title: 'Status', type: 'string',
      options: { list: ['active','unsubscribed','bounced','do_not_contact','pending'] }, initialValue: 'active' }),
    defineField({ name: 'source',       title: 'Source', type: 'string',
      options: { list: ['ffl_database','nra_instructor','manual','youtube_scrape','csv_import','web_scrape'] } }),
    defineField({ name: 'addedAt',      title: 'Added At', type: 'datetime', initialValue: () => new Date().toISOString() }),
    defineField({ name: 'lastContactedAt', title: 'Last Contacted', type: 'datetime' }),
    defineField({ name: 'emailPermission', title: 'YouTube Embed Permission', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'type', description: 'email' },
    prepare: ({ title, subtitle, description }) => ({
      title, subtitle: `${subtitle?.replace('_',' ')} · ${description || 'no email'}`
    })
  }
})
