import { defineType, defineField } from 'sanity'

export const stateProfile = defineType({
  name: 'stateProfile',
  title: 'State Profile',
  type: 'document',
  fields: [
    defineField({ name: 'name',  title: 'State Name',  type: 'string', validation: R => R.required() }),
    defineField({ name: 'abbr',  title: 'Abbreviation', type: 'string', validation: R => R.required().max(2) }),
    defineField({ name: 'slug',  title: 'Slug', type: 'slug', options: { source: 'abbr' } }),
    defineField({ name: 'rating', title: 'Freedom Rating (A-F)', type: 'string',
      options: { list: ['A+','A','B+','B','C','D','F'] } }),
    defineField({ name: 'constitutionalCarry', title: 'Constitutional Carry', type: 'boolean' }),
    defineField({ name: 'ccwPermit', title: 'CCW Permit Name', type: 'string' }),
    defineField({ name: 'redFlagLaw', title: 'Red Flag Law (ERPO)', type: 'boolean' }),
    defineField({ name: 'magLimit',   title: 'Magazine Limit (null = none)', type: 'number' }),
    defineField({ name: 'waitPeriod', title: 'Wait Period (days, null = none)', type: 'number' }),
    defineField({ name: 'awbStatus',  title: 'Assault Weapon Ban', type: 'string',
      options: { list: ['None','Partial','Full'] } }),
    defineField({ name: 'suppressors', title: 'Suppressors Legal', type: 'boolean' }),
    defineField({ name: 'openCarry',  title: 'Open Carry', type: 'string',
      options: { list: ['Legal','Permit Required','Prohibited'] } }),
    defineField({ name: 'bgcPrivate', title: 'Background Check on Private Sales', type: 'boolean' }),
    defineField({ name: 'reciprocityStates', title: 'Reciprocity States', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'recentBills', title: 'Recent Bills', type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'title',  title: 'Bill Title',  type: 'string' },
        { name: 'status', title: 'Status',      type: 'string' },
        { name: 'url',    title: 'URL',         type: 'url' },
        { name: 'date',   title: 'Date',        type: 'date' },
      ]}]
    }),
    defineField({ name: 'summary', title: 'Summary Notes', type: 'text', rows: 3 }),
    defineField({ name: 'lastUpdated', title: 'Last Updated', type: 'datetime' }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'rating' },
    prepare: ({ title, subtitle }) => ({ title, subtitle: `Rating: ${subtitle || 'N/A'}` })
  }
})
