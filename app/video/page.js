import VideoPageClient from './VideoPageClient'
import { fetchVideos, fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = {
  title: 'Video — DownRange',
  description: 'Firearms video reviews, training, news, and interviews from trusted channels.',
}
export const revalidate = 3600

// IMPORTANT: All video IDs must be verified by checking the actual YouTube URL.
// Never use a generated/guessed video ID. Verify at youtube.com/watch?v=VIDEO_ID before adding.
const SEED_VIDEOS = [
  { _id:'v1',  title:'How a Neutral Country Built One of the Best Combat Rifles Ever', videoId:'IdCJNilFjVM', channelName:'Garand Thumb',          category:'review',    duration:'28:14', thumbnail:'https://i.ytimg.com/vi/IdCJNilFjVM/hqdefault.jpg' },
  { _id:'v2',  title:'Garand Thumb Roasts Our Guns',                                   videoId:'GYifZbidKw0', channelName:'Garand Thumb',          category:'review',    duration:'18:42', thumbnail:'https://i.ytimg.com/vi/GYifZbidKw0/hqdefault.jpg' },
  { _id:'v3',  title:'The Best Handgun For You',                                        videoId:'XtpGpnWkSgU', channelName:'Garand Thumb',          category:'review',    duration:'22:08', thumbnail:'https://i.ytimg.com/vi/XtpGpnWkSgU/hqdefault.jpg' },
  { _id:'v4',  title:"Garand Thumb's Favorite Guns — Inside the Armory",               videoId:'4qLAOsm5vuE', channelName:'Classic Firearms',      category:'review',    duration:'31:17', thumbnail:'https://i.ytimg.com/vi/4qLAOsm5vuE/hqdefault.jpg' },
  { _id:'v5',  title:"Garand Thumb's Coolest Guns (Top Five)",                         videoId:'YEW4U9DUtrw', channelName:'Classic Firearms',      category:'review',    duration:'15:52', thumbnail:'https://i.ytimg.com/vi/YEW4U9DUtrw/hqdefault.jpg' },
  { _id:'v6',  title:'2024 Guide to Your First AR-15',                                 videoId:'EtkwiXgnsaE', channelName:'Garand Thumb',          category:'review',    duration:'28:14', thumbnail:'https://i.ytimg.com/vi/EtkwiXgnsaE/hqdefault.jpg' },
  { _id:'v7',  title:'AR-15 Lower Pistol Build (Aero Precision)',                      videoId:'BT5Ai-rJwjI', channelName:'Garand Thumb',          category:'build',     duration:'18:23', thumbnail:'https://i.ytimg.com/vi/BT5Ai-rJwjI/hqdefault.jpg' },
  { _id:'v8',  title:'Concealed Pro Makes It Look Easy',                               videoId:'GcnA9KpKcXo', channelName:'Active Self Protection', category:'training',  duration:'4:12',  thumbnail:'https://i.ytimg.com/vi/GcnA9KpKcXo/hqdefault.jpg' },
  { _id:'v9',  title:'My Every Day Carry (EDC)',                                        videoId:'HFOmW3EN0EM', channelName:'Active Self Protection', category:'training',  duration:'12:44', thumbnail:'https://i.ytimg.com/vi/HFOmW3EN0EM/hqdefault.jpg' },
  { _id:'v10', title:'Perfectly Timed Counter-Ambush',                                 videoId:'RcSDVC42DTg', channelName:'Active Self Protection', category:'training',  duration:'3:58',  thumbnail:'https://i.ytimg.com/vi/RcSDVC42DTg/hqdefault.jpg' },
  { _id:'v11', title:'How To Start With Concealed Carry',                              videoId:'FfVNca7nGXk', channelName:'Paul Harrell',           category:'training',  duration:'19:33', thumbnail:'https://i.ytimg.com/vi/FfVNca7nGXk/hqdefault.jpg' },
  { _id:'v12', title:'Best All Around AR-15 Build',                                    videoId:'tPStQ6UgSNI', channelName:'Military Arms Channel',  category:'build',     duration:'24:08', thumbnail:'https://i.ytimg.com/vi/tPStQ6UgSNI/hqdefault.jpg' },
  { _id:'v13', title:'The Legendary Paul Harrell',                                     videoId:'ANdUqpCW2SM', channelName:'Garand Thumb',           category:'review',    duration:'22:41', thumbnail:'https://i.ytimg.com/vi/ANdUqpCW2SM/hqdefault.jpg' },
  { _id:'v14', title:'Travis Haley and Garand Thumb — Carbine Setups',                 videoId:'polxptTGKMk', channelName:'Garand Thumb',           category:'review',    duration:'26:17', thumbnail:'https://i.ytimg.com/vi/polxptTGKMk/hqdefault.jpg' },
]

export default async function VideoPage({ searchParams }) {
  const cat    = searchParams?.cat  || null
  const sort   = searchParams?.sort || 'newest'
  const search = searchParams?.q    || null

  const [sanityVideos, alerts] = await Promise.all([
    fetchVideos(80).catch(() => []),
    fetchBreakingAlerts(3).catch(() => []),
  ])

  const videos = sanityVideos.length > 0 ? sanityVideos : SEED_VIDEOS

  return <VideoPageClient videos={videos} alerts={alerts} initialCat={cat} initialSort={sort} initialSearch={search} />
}
