'use client'
import UniversalContentEditor from './UniversalContentEditor'

const FIELDS = [
  { key:'title',    label:'Title',            type:'text' },
  { key:'brand',    label:'Manufacturer',     type:'text' },
  { key:'kind',     label:'Type',             opts:['product','corporate','event','recall','partnership'] },
  { key:'category', label:'Category',         opts:['pistol','revolver','rifle','shotgun','suppressor','optic','ammo','gear','news'] },
  { key:'summary',  label:'Summary',          rows:3 },
  { key:'body',     label:'Body (HTML)',      rows:14 },
  { key:'imageUrl', label:'Image URL',        type:'url' },
  { key:'sourceUrl',label:'Original release URL', type:'url' },
]

export default function PressReleaseManager({ adminKey }) {
  // Runs the pull in chunks: each call handles a slice of manufacturers and reports "done" when finished.
  async function pullPress(flash, reload) {
    let created = 0, failed = 0, rounds = 0
    try {
      for (; rounds < 12; rounds++) {
        flash('⏳ Pulling manufacturer press releases, round ' + (rounds + 1) + ' (each round takes up to 4 min)...')
        const r = await fetch('/api/cron/press-releases?max=24', {
          headers: { 'x-admin-key': adminKey },
        })
        const d = await r.json().catch(() => ({}))
        if (!r.ok) { flash('❌ ' + (d.error || ('HTTP ' + r.status))); break }
        created += d.created || 0
        failed  += d.failed  || 0
        if (d.done || !d.remaining) break
      }
      let fixed = 0
      for (let k = 0; k < 12; k++) {
        flash('⏳ Adding real manufacturer images to articles, round ' + (k + 1) + '...')
        const r2 = await fetch('/api/cron/press-releases?mode=images&max=30', { headers: { 'x-admin-key': adminKey } })
        const d2 = await r2.json().catch(() => ({}))
        if (!r2.ok) break
        fixed += d2.fixed || 0
        if (d2.done || !d2.remaining) break
      }
      flash('✅ Done: ' + created + ' new articles, ' + fixed + ' articles updated with real images' + (failed ? ', ' + failed + ' failed' : ''))
    } catch {
      flash('❌ Request failed or timed out')
    }
    setTimeout(reload, 1500)
  }

  return (
    <UniversalContentEditor
      adminKey={adminKey}
      config={{
        label: 'Press Releases',
        icon: '🏭',
        api: '/api/admin/press-releases-manager',
        type: 'pressRelease',
        publishField: { field: 'approved', publishedValue: true },
        fields: FIELDS,
        responseKey: 'releases',
        urlFn: item => item?.slug?.current ? '/news/manufacturer-press-releases/' + item.slug.current : null,
        lang: 'en',
        pullFn: pullPress,
        perPage: 25,
      }}
    />
  )
}
