import VideoPageClient from './VideoPageClient'
import JsonLd, { breadcrumb, collectionPage } from '../../components/seo/JsonLd'
import { fetchVideos, fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = {
  title: 'Video',
  description: 'The DownRange video library — the latest firearms videos from trusted channels, in one feed.',
  alternates: { canonical: 'https://www.downrangeco.com/video' },
}
export const revalidate = 3600

// IMPORTANT: All video IDs must be verified by checking the actual YouTube URL.
// Never use a generated/guessed video ID. Verify at youtube.com/watch?v=VIDEO_ID before adding.
// Fallback — Garand Thumb only (matches active channel config)
const SEED_VIDEOS = [
  { _id:'v1', title:'How a Neutral Country Built One of the Best Combat Rifles Ever', videoId:'IdCJNilFjVM', channelName:'Garand Thumb', category:'review',  duration:'28:14', thumbnail:'https://i.ytimg.com/vi/IdCJNilFjVM/hqdefault.jpg' },
  { _id:'v2', title:'Garand Thumb Roasts Our Guns',                                   videoId:'GYifZbidKw0', channelName:'Garand Thumb', category:'review',  duration:'18:42', thumbnail:'https://i.ytimg.com/vi/GYifZbidKw0/hqdefault.jpg' },
  { _id:'v3', title:'The Best Handgun For You',                                        videoId:'XtpGpnWkSgU', channelName:'Garand Thumb', category:'review',  duration:'22:08', thumbnail:'https://i.ytimg.com/vi/XtpGpnWkSgU/hqdefault.jpg' },
  { _id:'v6', title:'2024 Guide to Your First AR-15',                                  videoId:'EtkwiXgnsaE', channelName:'Garand Thumb', category:'review',  duration:'28:14', thumbnail:'https://i.ytimg.com/vi/EtkwiXgnsaE/hqdefault.jpg' },
  { _id:'v7', title:'AR-15 Lower Pistol Build (Aero Precision)',                       videoId:'BT5Ai-rJwjI', channelName:'Garand Thumb', category:'build',   duration:'18:23', thumbnail:'https://i.ytimg.com/vi/BT5Ai-rJwjI/hqdefault.jpg' },
  { _id:'v13',title:'The Legendary Paul Harrell',                                      videoId:'ANdUqpCW2SM', channelName:'Garand Thumb', category:'review',  duration:'22:41', thumbnail:'https://i.ytimg.com/vi/ANdUqpCW2SM/hqdefault.jpg' },
  { _id:'v14',title:'Travis Haley and Garand Thumb — Carbine Setups',                  videoId:'polxptTGKMk', channelName:'Garand Thumb', category:'review',  duration:'26:17', thumbnail:'https://i.ytimg.com/vi/polxptTGKMk/hqdefault.jpg' },
]

export default async function VideoPage({ searchParams }) {
  const sort   = searchParams?.sort || 'newest'
  const search = searchParams?.q    || null

  const [sanityVideos, alerts] = await Promise.all([
    fetchVideos(80).catch(() => []),
    fetchBreakingAlerts(3).catch(() => []),
  ])

  const videos = sanityVideos.length > 0 ? sanityVideos : SEED_VIDEOS

  // VideoObject needs name, thumbnailUrl and uploadDate — only include videos that have them
  const toIsoDuration = d => {
    if (!d) return undefined
    const p = String(d).split(':').map(Number)
    if (!p.length || p.some(isNaN) || p.every(n => n === 0)) return undefined
    const [h, m, sec] = p.length === 3 ? p : [0, ...(p.length === 2 ? p : [0, p[0]])]
    return `PT${h ? h + 'H' : ''}${m ? m + 'M' : ''}${sec || 0}S`
  }
  const videoItems = videos
    .map(v => ({ v, id: v.youtubeId || v.videoId, date: v.publishedAt || v.addedAt }))
    .filter(({ v, id, date }) => id && v.title && date)
    .slice(0, 20)
    .map(({ v, id, date }, i) => ({
      '@type': 'ListItem', position: i + 1,
      item: {
        '@type': 'VideoObject', name: v.title,
        description: `${v.title}${v.channelName ? ' — ' + v.channelName : ''}`,
        thumbnailUrl: v.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        uploadDate: date,
        embedUrl: `https://www.youtube.com/embed/${id}`,
        contentUrl: `https://www.youtube.com/watch?v=${id}`,
        ...(toIsoDuration(v.duration) ? { duration: toIsoDuration(v.duration) } : {}),
      },
    }))

  return (
    <>
      <JsonLd data={[
        { ...collectionPage({ name: 'DownRange Video Library', path: '/video', description: 'The latest firearms videos from trusted channels, in one feed.' }),
          mainEntity: { '@type': 'ItemList', itemListElement: videoItems } },
        breadcrumb([{ name: 'Video', path: '/video' }]),
      ]} />
      <VideoPageClient videos={videos} alerts={alerts} initialSort={sort} initialSearch={search} />
    </>
  )
}
