'use client'
import UniversalContentEditor from './UniversalContentEditor'

const FIELDS = [
  { key:'title',    label:'Title',           type:'text'  },
  { key:'category', label:'Category',        opts:['law','industry','training','review','opinion','news','gear','hunting','competition'] },
  { key:'status',   label:'Status',          opts:['draft','published'] },
  { key:'readTime', label:'Read Time',       type:'text', hint:'e.g. 7 min' },
  { key:'excerpt',  label:'Excerpt',         rows:3  },
  { key:'body',     label:'Body (HTML)',      rows:16 },
  { key:'imageUrl', label:'Image URL',        type:'url'  },
  { key:'author',   label:'Author',          type:'text' },
  { key:'seoTitle', label:'SEO Title',       type:'text' },
  { key:'metaDesc', label:'Meta Description',rows:2  },
]

export default function BlogManager({ adminKey, setMsg }) {
  function pullArticles(flash, reload) {
    flash('⏳ Writing blog articles with AI...')
    return fetch('/api/admin/write-blog-articles', {
      method:'POST', headers:{'x-admin-key':adminKey},
    }).then(r=>r.json()).then(d=>{
      flash('✅ Blog articles generated')
      reload()
    }).catch(()=>flash('❌ Failed'))
  }

  return (
    <UniversalContentEditor
      adminKey={adminKey}
      config={{
        label: 'Blog Posts',
        icon: '✍',
        api: '/api/admin/blog-posts',
        type: 'blogPost',
        fields: FIELDS,
        responseKey: 'posts',
        baseUrl: '/blog',
        urlFn: item => item?.slug?.current ? '/blog/' + item.slug.current : null,
        lang: 'en',
        pullFn: pullArticles,
        perPage: 25,
      }}
    />
  )
}
