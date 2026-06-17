'use client'
import UniversalContentEditor from './UniversalContentEditor'

const FIELDS = [
  { key:'title',    label:'Title',         type:'text' },
  { key:'brand',    label:'Brand',         type:'text' },
  { key:'model',    label:'Model',         type:'text' },
  { key:'category', label:'Category',      opts:['pistol','rifle','shotgun','suppressor','ammo','optic','gear','accessory'] },
  { key:'caliber',  label:'Caliber',       type:'text' },
  { key:'msrp',     label:'MSRP',          type:'text' },
  { key:'summary',  label:'Summary',       rows:3  },
  { key:'body',     label:'Body (HTML)',    rows:12 },
  { key:'imageUrl', label:'Image URL',      type:'url' },
  { key:'sourceUrl',label:'Source URL',     type:'url' },
]

export default function ReleaseManager({ adminKey }) {
  function pullReleases(flash, reload) {
    flash('⏳ Pulling new releases from Google News + PRN (takes 2-3 min)...')
    return fetch('/api/agent?feed=releases', {
      method: 'GET',
      headers: { 'x-admin-key': adminKey, 'Authorization': 'Bearer ' + adminKey },
    })
    .then(r => r.json())
    .then(d => {
      const r = d.result || {}
      if (d.success || d.ok) {
        flash('✅ Done — ' + (r.done||0) + ' new releases saved, ' + (r.skipped||0) + ' skipped')
      } else {
        flash('❌ Error: ' + (d.error || 'Unknown error'))
      }
      setTimeout(reload, 2000)
    })
    .catch(() => flash('❌ Request failed or timed out'))
  }

  return (
    <UniversalContentEditor
      adminKey={adminKey}
      config={{
        label: 'Gun Releases',
        icon: '🔫',
        api: '/api/admin/releases-manager',
        type: 'firearmRelease',
        publishField: { field: 'approved', publishedValue: true },
        fields: FIELDS,
        responseKey: 'releases',
        urlFn: item => item?.slug?.current ? '/releases/' + item.slug.current : null,
        lang: 'en',
        pullFn: pullReleases,
        perPage: 25,
      }}
    />
  )
}
