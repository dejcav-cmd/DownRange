export const dynamic = 'force-dynamic'
/**
 * On-demand revalidation for ISR pages
 * Called by Sanity webhook on content publish
 */
export async function POST(req) {
  const secret = req.headers.get('x-revalidate-secret')
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { type, slug } = await req.json()
    const paths = []
    if (type === 'newsArticle')    paths.push('/news', slug ? `/news/${slug}` : null)
    if (type === 'breakingAlert')  paths.push('/')
    if (type === 'legislation')    paths.push('/laws', '/')
    if (type === 'review')         paths.push('/reviews', slug ? `/reviews/${slug}` : null)
    if (type === 'firearmRelease') paths.push('/releases', '/')
    if (type === 'stateProfile')   paths.push('/state-hub', slug ? `/state-hub/${slug}` : null)
    if (type === 'ammoPrice')      paths.push('/market', '/')
    if (type === 'video')          paths.push('/video')
    const { revalidatePath } = await import('next/cache')
    for (const p of paths.filter(Boolean)) revalidatePath(p)
    return Response.json({ revalidated: paths.filter(Boolean) })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
