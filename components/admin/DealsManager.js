'use client'
import { useState } from 'react'
import UniversalContentEditor from './UniversalContentEditor'
import AmazonImportPanel from './AmazonImportPanel'

const MONO = "'IBM Plex Mono',monospace"

const FIELDS = [
  { key:'title',       label:'Title',             type:'text' },
  { key:'category',    label:'Category',          opts:['deals','news','law','industry','opinion','training','breaking'] },
  { key:'source',      label:'Source',            type:'text' },
  { key:'summary',     label:'Summary / Excerpt', rows:3 },
  { key:'body',        label:'Body (HTML)',        rows:10 },
  { key:'imageUrl',    label:'Image URL',          type:'url' },
  { key:'externalUrl', label:'Deal / Source URL',  type:'url' },
]

export default function DealsManager({ adminKey }) {
  const [migrating,  setMigrating]  = useState(false)
  const [migrateMsg, setMigrateMsg] = useState(null)
  const H = { 'x-admin-key': adminKey, 'Content-Type': 'application/json' }

  async function runMigration(flash, reload) {
    setMigrating(true)
    setMigrateMsg(null)
    flash('⏳ Running deals migration...')
    try {
      const r = await fetch('/api/admin/fix-deal-articles', { method: 'POST', headers: H })
      const d = await r.json()
      const msg = d.ok
        ? `✅ Done — removed ${d.movedFromDeals.count} non-deals, promoted ${d.movedToDeals.count} to deals`
        : `⚠️ Ran with ${d.errors} errors — removed ${d.movedFromDeals?.count||0}, promoted ${d.movedToDeals?.count||0}`
      setMigrateMsg({ ok: d.ok, detail: d, text: msg })
      flash(msg)
      reload()
    } catch (e) {
      flash('❌ Migration failed: ' + e.message)
      setMigrateMsg({ ok: false, text: '❌ ' + e.message })
    }
    setMigrating(false)
  }

  async function triggerFeed(flash, reload) {
    flash('⏳ Triggering deals feed pull...')
    try {
      await fetch('/api/agent?feed=news', { headers: H })
      flash('✅ Feed agent triggered — deals refresh in ~2 min')
      setTimeout(reload, 5000)
    } catch (e) { flash('❌ ' + e.message) }
  }

  async function triggerBrandScrape(brand, flash) {
    flash(`⏳ Scraping ${brand} brand page...`)
    try {
      const r = await fetch(`/api/cron/amazon-brands?brand=${brand}`, { headers: H })
      const d = await r.json()
      if (d.ok) flash(`✅ ${brand}: added ${d.added}, skipped ${d.skipped}, filtered ${d.filtered}`)
      else flash(`❌ ${brand}: ${d.error}`)
    } catch (e) { flash('❌ ' + e.message) }
  }

  return (
    <div>
      {/* Amazon ASIN import — no PA API needed */}
      <AmazonImportPanel adminKey={adminKey} />

      {migrateMsg && (
        <div style={{
          margin:'0 0 12px', padding:'10px 14px',
          background: migrateMsg.ok ? '#0a1f0a' : '#1f0a0a',
          border: `1px solid ${migrateMsg.ok ? '#22c55e33' : '#ef444433'}`,
          borderRadius: 4, fontFamily: MONO, fontSize: 11,
          color: migrateMsg.ok ? '#22c55e' : '#f87171',
        }}>
          {migrateMsg.text}
          {migrateMsg.detail && (
            <div style={{marginTop:6, color:'#6b7280'}}>
              {(migrateMsg.detail.movedFromDeals?.items||[]).slice(0,8).map((a,i) => (
                <div key={i} style={{paddingLeft:12, color:'#4b5563'}}>✗ [{a.to}] {a.title}</div>
              ))}
              {(migrateMsg.detail.movedFromDeals?.count||0) > 8 && (
                <div style={{paddingLeft:12,color:'#374151'}}>
                  ...and {migrateMsg.detail.movedFromDeals.count - 8} more removed
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <UniversalContentEditor
        adminKey={adminKey}
        config={{
          label:        'Deals Manager',
          icon:         '🔥',
          api:          '/api/admin/deals-list',
          type:         'gunDeal',
          publishField: { field: 'approved', publishedValue: true },
          fields:       FIELDS,
          responseKey:  'articles',
          urlFn:        item => item?.externalUrl || '#',
          perPage:      50,
          extraActions: [
            { label: migrating ? '⏳ Running...' : '🔧 Fix Miscategorized', fn: runMigration, disabled: migrating },
            { label: '⚡ Pull Deals Feed', fn: triggerFeed },
            { label: '🔦 Olight',       fn: (f) => triggerBrandScrape('olight', f)          },
            { label: '💡 Streamlight',  fn: (f) => triggerBrandScrape('streamlight', f)    },
            { label: '🎯 Vortex',       fn: (f) => triggerBrandScrape('vortex', f)          },
            { label: '⭕ Holosun',      fn: (f) => triggerBrandScrape('holosun', f)         },
            { label: '🔭 Monstrum',     fn: (f) => triggerBrandScrape('monstrum', f)        },
            { label: '🟩 Magpul',       fn: (f) => triggerBrandScrape('magpul', f)          },
            { label: '🏹 Mathews',      fn: (f) => triggerBrandScrape('mathews', f)         },
            { label: '🏹 Gold Tip',     fn: (f) => triggerBrandScrape('goldtip', f)         },
            { label: '🏹 Rage',         fn: (f) => triggerBrandScrape('rage', f)            },
            { label: '🏹 Carbon Expr.', fn: (f) => triggerBrandScrape('carbon-express', f)  },
            { label: '🏹 Barnett',      fn: (f) => triggerBrandScrape('barnett', f)         },
            { label: '🏹 TenPoint',     fn: (f) => triggerBrandScrape('tenpoint', f)        },
          ],
        }}
      />
    </div>
  )
}
