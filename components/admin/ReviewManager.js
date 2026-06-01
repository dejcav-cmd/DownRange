'use client'
import UniversalContentEditor from './UniversalContentEditor'

const FIELDS = [
  { key:'title',       label:'Review Title',    type:'text' },
  { key:'brand',       label:'Brand',           type:'text' },
  { key:'model',       label:'Model / Product', type:'text' },
  { key:'category',    label:'Category',        opts:['pistol','rifle','shotgun','suppressor','ammo','optic','holster','gear','accessory','training'] },
  { key:'rating',      label:'Rating (1-10)',   type:'number' },
  { key:'verdict',     label:'Verdict',         opts:['Highly Recommended','Recommended','Mixed','Not Recommended'] },
  { key:'pros',        label:'Pros',            rows:3  },
  { key:'cons',        label:'Cons',            rows:3  },
  { key:'summary',     label:'Summary',         rows:3  },
  { key:'body',        label:'Full Review (HTML)',rows:14 },
  { key:'imageUrl',    label:'Image URL',        type:'url' },
  { key:'affiliateUrl',label:'Affiliate / Buy Link',type:'url' },
  { key:'price',       label:'Price / MSRP',    type:'text' },
]

export default function ReviewManager({ adminKey }) {
  return (
    <UniversalContentEditor
      adminKey={adminKey}
      config={{
        label: 'Reviews',
        icon: '★',
        api: '/api/admin/reviews-manager',
        type: 'review',
        publishField: { field: 'approved', publishedValue: true },
        fields: FIELDS,
        responseKey: 'reviews',
        urlFn: item => item?.slug?.current ? '/reviews/' + item.slug.current : null,
        lang: 'en',
        perPage: 25,
      }}
    />
  )
}
