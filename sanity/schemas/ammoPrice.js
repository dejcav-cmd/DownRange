import { defineType, defineField } from 'sanity'

export const ammoPrice = defineType({
  name: 'ammoPrice',
  title: 'Ammo Price',
  type: 'document',
  fields: [
    defineField({ name: 'caliber',    title: 'Caliber', type: 'string', validation: R => R.required() }),
    defineField({ name: 'pricePerRound', title: 'Price Per Round ($)', type: 'number' }),
    defineField({ name: 'price30DayAvg', title: '30-Day Average ($)', type: 'number' }),
    defineField({ name: 'trendPct',   title: 'Trend % vs 30-day avg', type: 'number' }),
    defineField({ name: 'trendDir',   title: 'Trend Direction', type: 'string',
      options: { list: ['up','down','stable'] } }),
    defineField({ name: 'bestVendor', title: 'Best Price Vendor', type: 'string' }),
    defineField({ name: 'bestPrice',  title: 'Best Price ($)', type: 'number' }),
    defineField({ name: 'bestUrl',    title: 'Best Price URL', type: 'url' }),
    defineField({ name: 'inStock',    title: 'In Stock Status', type: 'string',
      options: { list: ['Available','Limited','Out of Stock'] } }),
    defineField({ name: 'recordedAt', title: 'Recorded At', type: 'datetime' }),
    defineField({
      name: 'retailers',
      title: 'Live Retailer Listings',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'vendor',  title: 'Vendor Name', type: 'string' },
          { name: 'price',   title: 'Price Per Round ($)', type: 'number' },
          { name: 'url',     title: 'Listing URL', type: 'url' },
          { name: 'inStock', title: 'In Stock', type: 'boolean' },
          { name: 'label',   title: 'Product Label', type: 'string' },
        ]
      }]
    }),
  ],
  preview: {
    select: { title: 'caliber', subtitle: 'pricePerRound' },
    prepare: ({ title, subtitle }) => ({ title, subtitle: `$${subtitle}/rd` })
  }
})
