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
    defineField({ 
      name: 'nraLawSummary', 
      title: 'Gun Laws Summary (NRA-ILA Source)', 
      type: 'text', 
      rows: 6,
      description: 'Auto-updated every 10 days from NRA-ILA state pages. Paraphrased to avoid copyright.'
    }),
    defineField({
      name: 'nraEnhancedData',
      title: 'Enhanced Law Context (v2.0)',
      type: 'object',
      fields: [
        defineField({
          name: 'summary',
          title: 'Attorney-Style Summary',
          type: 'text',
          rows: 5,
          description: 'Rewritten 3-4 paragraph summary focused on gun owner concerns'
        }),
        defineField({
          name: 'coreLaws',
          title: 'Core Law Snippets (JSON)',
          type: 'text',
          rows: 3,
          description: 'JSON: { magazine, assault_weapons, permit_carry, open_carry, waiting_period, suppressors, red_flag }'
        }),
        defineField({
          name: 'localRestrictions',
          title: 'Local/Municipal Restrictions (JSON)',
          type: 'text',
          rows: 3,
          description: 'JSON: { affected_areas: [...], note: "..." }'
        }),
        defineField({
          name: 'recentCaseLaw',
          title: 'Relevant Court Cases',
          type: 'object',
          fields: [
            defineField({ name: 'cases', title: 'Case names', type: 'array', of: [{ type: 'string' }] }),
            defineField({ name: 'impact', title: 'What it means for this state', type: 'text', rows: 2 })
          ],
          description: 'Landmark cases affecting this state\'s laws (Bruen, state-specific, pending)'
        }),
        defineField({
          name: 'useCases',
          title: 'Practical Scenarios',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'Real gun owner questions: "Can I carry across state lines?" etc'
        }),
        defineField({
          name: 'reciprocityNotes',
          title: 'Reciprocity Context',
          type: 'text',
          description: 'How this state\'s permit is honored elsewhere (or not)'
        }),
        defineField({
          name: 'resources',
          title: 'Official Resources & Links (JSON)',
          type: 'text',
          rows: 3,
          description: 'JSON: { general: url, state_official: { label: url } }'
        }),
        defineField({
          name: 'dataVersion',
          title: 'Data Format Version',
          type: 'string',
        }),
        defineField({
          name: 'updatedAt',
          title: 'Enhanced Data Updated',
          type: 'datetime',
        })
      ],
      description: 'Rich contextual data: court cases, use cases, local rules, resources'
    }),
    defineField({ name: 'lastUpdated', title: 'Last Updated', type: 'datetime' }),
    defineField({ 
      name: 'lastNRAUpdate', 
      title: 'Last NRA-ILA Sync', 
      type: 'datetime',
      readOnly: true,
      description: 'Auto-populated when NRA-ILA cron runs'
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'rating' },
    prepare: ({ title, subtitle }) => ({ title, subtitle: `Rating: ${subtitle || 'N/A'}` })
  }
})

