import { defineType, defineField } from 'sanity'

export const competition = defineType({
  name: 'competition',
  title: 'Competition / Match',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Match Name', type: 'string', validation: R => R.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' } }),
    defineField({ name: 'org', title: 'Organization', type: 'string',
      options: { list: ['NRA','USPSA/IPSC','IDPA','PRS','F-Class','3-Gun','NSSF','ICORE','SB Tactical','Other'] } }),
    defineField({ name: 'discipline', title: 'Discipline', type: 'string',
      options: { list: ['Practical Pistol','Precision Rifle','3-Gun','Shotgun','Rimfire','Long Range','Hunting','NRL','Steel Challenge','Bull\'s Eye','Cowboy Action','Other'] } }),
    defineField({ name: 'matchType', title: 'Match Type', type: 'string',
      options: { list: ['Club Match','Area Match','Sectional','Regional','National','World','Online/Virtual'] } }),
    defineField({ name: 'level', title: 'Competitor Level', type: 'string',
      options: { list: ['Beginner Friendly','All Levels','Intermediate','Advanced','Open'] } }),
    defineField({ name: 'startDate', title: 'Start Date', type: 'date', validation: R => R.required() }),
    defineField({ name: 'endDate', title: 'End Date', type: 'date' }),
    defineField({ name: 'registrationDeadline', title: 'Registration Deadline', type: 'date' }),
    defineField({ name: 'venue', title: 'Venue / Range Name', type: 'string' }),
    defineField({ name: 'city', title: 'City', type: 'string' }),
    defineField({ name: 'state', title: 'State', type: 'string' }),
    defineField({ name: 'country', title: 'Country', type: 'string', initialValue: 'USA' }),
    defineField({ name: 'lat', title: 'Latitude', type: 'number' }),
    defineField({ name: 'lng', title: 'Longitude', type: 'number' }),
    defineField({ name: 'entryFee', title: 'Entry Fee ($)', type: 'number' }),
    defineField({ name: 'capacity', title: 'Capacity (slots)', type: 'number' }),
    defineField({ name: 'registrationUrl', title: 'Registration URL', type: 'url' }),
    defineField({ name: 'websiteUrl', title: 'Website / Info URL', type: 'url' }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 4 }),
    defineField({ name: 'imageUrl', title: 'Image URL', type: 'url' }),
    defineField({ name: 'featured', title: 'Featured Match', type: 'boolean', initialValue: false }),
    defineField({ name: 'approved', title: 'Approved / Visible', type: 'boolean', initialValue: false }),
    defineField({ name: 'source', title: 'Source', type: 'string',
      options: { list: ['Manual','PracticeScore','Practiscore','NRA Calendar','PRS Calendar','Scraped'] } }),
    defineField({ name: 'externalId', title: 'External ID (for dedup)', type: 'string' }),
    defineField({ name: 'createdAt', title: 'Created At', type: 'datetime' }),
  ],
  orderings: [{ title: 'Date', name: 'dateAsc', by: [{ field: 'startDate', direction: 'asc' }] }],
  preview: {
    select: { title: 'name', subtitle: 'org', date: 'startDate', city: 'city', state: 'state' },
    prepare: ({ title, subtitle, date, city, state }) => ({
      title, subtitle: `${subtitle} · ${city}, ${state} · ${date}`
    })
  }
})
