import VideoPageClient from './VideoPageClient'
import { fetchVideos, fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = {
  title: 'Video — DownRange',
  description: 'Firearms video reviews, training, news, and interviews from trusted channels.',
}
export const revalidate = 3600

const SEED_VIDEOS = [
  { _id:'v1',  title:'How a Neutral Country Built One of the Best Combat Rifles Ever', videoId:'IdCJNilFjVM', channelName:'Garand Thumb',    category:'review',   duration:'28:14', thumbnail:'https://i.ytimg.com/vi/IdCJNilFjVM/hqdefault.jpg' },
  { _id:'v2',  title:'Garand Thumb Roasts Our Guns',                                   videoId:'GYifZbidKw0', channelName:'Garand Thumb',    category:'review',   duration:'18:42', thumbnail:'https://i.ytimg.com/vi/GYifZbidKw0/hqdefault.jpg' },
  { _id:'v3',  title:'The Best Handgun For You',                                        videoId:'XtpGpnWkSgU', channelName:'Garand Thumb',    category:'review',   duration:'22:08', thumbnail:'https://i.ytimg.com/vi/XtpGpnWkSgU/hqdefault.jpg' },
  { _id:'v4',  title:'Garand Thumbs Favorite Guns — Inside the Armory',                videoId:'4qLAOsm5vuE', channelName:'Classic Firearms', category:'review',   duration:'31:17', thumbnail:'https://i.ytimg.com/vi/4qLAOsm5vuE/hqdefault.jpg' },
  { _id:'v5',  title:"Garand Thumb's Coolest Guns (Top Five)",                         videoId:'YEW4U9DUtrw', channelName:'Classic Firearms', category:'review',   duration:'15:52', thumbnail:'https://i.ytimg.com/vi/YEW4U9DUtrw/hqdefault.jpg' },
  { _id:'v6',  title:'AR-15 Complete Build — Start to Finish',                         videoId:'A2PficRFAHM', channelName:'Brownells',        category:'training', duration:'41:03', thumbnail:'https://i.ytimg.com/vi/A2PficRFAHM/hqdefault.jpg' },
  { _id:'v7',  title:'Best Budget AR-15 2026 — Full Test',                             videoId:'LQpHBaEJFqk', channelName:'Paul Harrell',     category:'review',   duration:'19:28', thumbnail:'https://i.ytimg.com/vi/LQpHBaEJFqk/hqdefault.jpg' },
  { _id:'v8',  title:'Pistol Fundamentals — Grip, Stance, Trigger',                   videoId:'WQKNHUmLIlU', channelName:'Active Self Protection', category:'training', duration:'12:44', thumbnail:'https://i.ytimg.com/vi/WQKNHUmLIlU/hqdefault.jpg' },
  { _id:'v9',  title:'SIG P365XL vs Glock 43X — Which Should You Carry?',              videoId:'IgKaBagCFj4', channelName:'Pew Pew Tactical',  category:'review',   duration:'14:22', thumbnail:'https://i.ytimg.com/vi/IgKaBagCFj4/hqdefault.jpg' },
  { _id:'v10', title:'Home Defense Shotgun — Mossberg 590A1 Deep Dive',                videoId:'2j4rMqc3vT0', channelName:'IV8888',            category:'review',   duration:'24:11', thumbnail:'https://i.ytimg.com/vi/2j4rMqc3vT0/hqdefault.jpg' },
  { _id:'v11', title:'Concealed Carry Mistakes You Are Probably Making',               videoId:'Zy9sN_LJaa4', channelName:'Active Self Protection', category:'training', duration:'16:33', thumbnail:'https://i.ytimg.com/vi/Zy9sN_LJaa4/hqdefault.jpg' },
  { _id:'v12', title:'ATF Rule Changes — What You Need to Know',                        videoId:'tIyBnC3C9v0', channelName:'Gun Owners of America', category:'news', duration:'08:17', thumbnail:'https://i.ytimg.com/vi/tIyBnC3C9v0/hqdefault.jpg' },
]

export default async function VideoPage() {
  const [sanityVideos, alerts] = await Promise.all([
    fetchVideos(24).catch(() => []),
    fetchBreakingAlerts(3).catch(() => []),
  ])

  const videos = sanityVideos.length > 0 ? sanityVideos : SEED_VIDEOS

  return <VideoPageClient videos={videos} alerts={alerts} />
}
