import { client } from '../sanity/lib/client'

export default async function sitemap() {
  const base = 'https://downrangeco.com'
  const [articles, reviews, states] = await Promise.all([
    client.fetch(`*[_type=="newsArticle"&&approved==true]{slug,publishedAt,_updatedAt}`).catch(()=>[]),
    client.fetch(`*[_type=="review"]{slug,_updatedAt}`).catch(()=>[]),
    client.fetch(`*[_type=="stateProfile"]{abbr,_updatedAt}`).catch(()=>[]),
  ])
  const statics = ['','/news','/laws','/reviews','/releases','/state-hub','/market','/video','/search','/about','/deals','/ranges'].map(p=>({
    url: base+p, lastModified: new Date(), changeFrequency: p===''?'hourly':'daily', priority: p===''?1:0.8
  }))
  return [
    ...statics,
    ...articles.map(a=>({ url:`${base}/news/${a.slug?.current}`, lastModified:new Date(a._updatedAt||a.publishedAt||Date.now()), changeFrequency:'weekly', priority:0.7 })),
    ...reviews.map(r=>({ url:`${base}/reviews/${r.slug?.current}`, lastModified:new Date(r._updatedAt||Date.now()), changeFrequency:'monthly', priority:0.6 })),
    ...states.map(s=>({ url:`${base}/state-hub/${s.abbr?.toLowerCase()}`, lastModified:new Date(s._updatedAt||Date.now()), changeFrequency:'weekly', priority:0.7 })),
  ]
}
