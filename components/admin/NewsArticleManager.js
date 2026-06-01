'use client'
import UniversalContentEditor from './UniversalContentEditor'

const FIELDS = [
  { key:'title',       label:'Title',              type:'text'  },
  { key:'category',    label:'Category',           opts:['breaking','law','industry','training','opinion','review','news'] },
  { key:'source',      label:'Source',             type:'text', hint:'Publication name' },
  { key:'summary',     label:'Summary / Excerpt',  rows:4  },
  { key:'body',        label:'Body (HTML)',          rows:14 },
  { key:'imageUrl',    label:'Image URL',            type:'url'  },
  { key:'externalUrl', label:'Original Source URL',  type:'url'  },
  { key:'author',      label:'Author / Byline',     type:'text' },
  { key:'urgencyScore',label:'Urgency Score (0-10)', type:'number', hint:'≥8 shows BREAKING badge' },
]

export default function NewsArticleManager({ adminKey }) {
  function pullNews(flash, reload) {
    flash('⏳ Triggering news feed agent...')
    return fetch('/api/agent?feed=news', {
      headers:{'x-admin-key':adminKey},
    }).then(r=>r.json()).then(()=>{
      flash('✅ News agent triggered — check back in 2 min')
    }).catch(()=>flash('❌ Failed to trigger agent'))
  }

  function fetchRealImages(flash, reload) {
    flash('⏳ Fetching real images for all articles...')
    return fetch('/api/admin/fetch-article-images', {
      method:'POST',
      headers:{'x-admin-key':adminKey,'Content-Type':'application/json'},
      body:JSON.stringify({batch:50}),
    }).then(r=>r.json()).then(d=>{
      flash('✅ Images: ' + (d.fixed||d.updated||0) + ' fixed')
      reload()
    }).catch(()=>flash('❌ Image fetch failed'))
  }

  return (
    <UniversalContentEditor
      adminKey={adminKey}
      config={{
        label: 'News Articles',
        icon: '📰',
        api: '/api/admin/articles-list',
        type: 'newsArticle',
        publishField: { field: 'approved', publishedValue: true },
        fields: FIELDS,
        responseKey: 'articles',
        urlFn: item => item?.slug?.current ? '/news/' + item.slug.current : null,
        lang: 'en',
        pullFn: pullNews,
        perPage: 25,
        extraActions: [
          { label:'📷 Fetch Images (50)', fn: fetchRealImages },
        ],
      }}
    />
  )
}
