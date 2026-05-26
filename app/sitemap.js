import { client } from '../sanity/lib/client'

export default async function sitemap() {
  const base = 'https://downrangeco.com'
  const [articles, reviews, states, guns] = await Promise.all([
    client.fetch(`*[_type=="newsArticle"&&approved==true]{slug,publishedAt,_updatedAt}`).catch(()=>[]),
    client.fetch(`*[_type=="review"]{slug,_updatedAt}`).catch(()=>[]),
    client.fetch(`*[_type=="stateProfile"]{abbr,_updatedAt}`).catch(()=>[]),
    client.fetch(`*[_type=="firearmRelease"&&defined(slug)]{slug,_updatedAt}`).catch(()=>[]),
  ])

  const statics = [
    '','/news','/laws','/laws?tab=federal','/laws?tab=state','/laws?tab=atf','/laws?tab=scotus',
    '/reviews','/releases','/state-hub','/market','/video','/search','/about',
    '/deals','/ranges','/guns','/widget','/ffl-finder','/nfa-tracker','/training',
    '/ammo/9mm','/ammo/556','/ammo/308','/ammo/45-acp','/ammo/22lr',
  ].map(p=>({ url:base+p, lastModified:new Date(), changeFrequency:p===''?'hourly':'daily', priority:p===''?1:0.8 }))

  const statePaths = ['al','ak','az','ar','ca','co','ct','de','fl','ga','hi','id','il','in','ia','ks','ky','la','me','md','ma','mi','mn','ms','mo','mt','ne','nv','nh','nj','nm','ny','nc','nd','oh','ok','or','pa','ri','sc','sd','tn','tx','ut','vt','va','wa','wv','wi','wy']
    .map(s=>({ url:`${base}/state-hub/${s}`, lastModified:new Date(), changeFrequency:'weekly', priority:0.7 }))

  return [
    ...statics,
    ...statePaths,
    ...articles.map(a=>({ url:`${base}/news/${a.slug?.current}`, lastModified:new Date(a._updatedAt||a.publishedAt||Date.now()), changeFrequency:'weekly', priority:0.7 })),
    ...reviews.map(r=>({ url:`${base}/reviews/${r.slug?.current}`, lastModified:new Date(r._updatedAt||Date.now()), changeFrequency:'monthly', priority:0.6 })),
  ]
}
