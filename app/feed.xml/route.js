export const dynamic = 'force-dynamic'
import { buildFeed, sanity } from '@/lib/feedHelper'

export async function GET() {
  // Master feed — combines news + blog + releases, most recent 60 items
  const [news, blog, releases] = await Promise.all([
    sanity.fetch('*[_type=="newsArticle"&&approved==true]|order(publishedAt desc)[0...40]{title,slug,summary,excerpt,category,publishedAt,imageUrl,source}').catch(()=>[]),
    sanity.fetch('*[_type=="blogPost"&&status=="published"]|order(publishedAt desc)[0...10]{title,slug,excerpt,category,publishedAt,imageUrl,author}').catch(()=>[]),
    sanity.fetch('*[_type=="firearmRelease"&&approved==true]|order(publishedAt desc)[0...10]{title,slug,brand,model,category,publishedAt,imageUrl,summary}').catch(()=>[]),
  ])

  const items = [
    ...news.map(a => ({ title:a.title, url:`https://downrangeco.com/news/${a.slug?.current}`, description:a.summary||a.excerpt||'', date:a.publishedAt, category:a.category, author:a.source||'DownRange', image:a.imageUrl })),
    ...blog.map(a => ({ title:a.title, url:`https://downrangeco.com/blog/${a.slug?.current}`, description:a.excerpt||'', date:a.publishedAt, category:a.category, author:a.author||'DJ Cavalcanti', image:a.imageUrl })),
    ...releases.map(r => ({ title:`NEW: ${r.brand} ${r.model||r.title}`, url:`https://downrangeco.com/releases/${r.slug?.current}`, description:r.summary||'', date:r.publishedAt, category:'release', author:r.brand, image:r.imageUrl })),
  ]
  .filter(i => i.url && !i.url.includes('undefined'))
  .sort((a,b) => new Date(b.date||0) - new Date(a.date||0))
  .slice(0, 60)

  return buildFeed({
    title:       'DownRange — All Content',
    description: 'Firearms news, legislation, gear reviews, new releases, and 2A intelligence. Live. Loaded. Lawful.',
    feedUrl:     'https://downrangeco.com/feed.xml',
    items,
  })
}
