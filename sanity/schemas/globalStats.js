import { defineType, defineField } from 'sanity'

export const globalStats = defineType({
  name: 'globalStats',
  title: 'Global Stats',
  type: 'document',
  fields: [
    defineField({ name: 'nicsMonthlyTotal', title: 'NICS Monthly Total', type: 'number' }),
    defineField({ name: 'nicsLastUpdated',  title: 'NICS Last Updated',  type: 'datetime' }),
    defineField({ name: 'activeStateLaws',  title: 'Active State Laws Count', type: 'number' }),
    defineField({ name: 'federalBillsPending', title: 'Federal Bills Pending', type: 'number' }),
    defineField({ name: 'avgAmmoPrice9mm',  title: 'Avg 9mm CPR ($)', type: 'number' }),
    defineField({ name: 'trackerLastRun',   title: 'Tracker Last Run',  type: 'datetime' }),
  ],
  preview: {
    select: { title: 'nicsMonthlyTotal' },
    prepare: ({ title }) => ({ title: `NICS Total: ${title?.toLocaleString() || 'N/A'}` })
  }
})
