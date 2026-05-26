'use client'

import { useState, useEffect, useRef } from 'react'
import NewsCard from './NewsCard'

/**
 * LiveNewsRefresher — drops into the news grid, auto-polls /api/news-feed
 * every 2 minutes. Animates new articles in. Shows live indicator + count.
 */
export default function LiveNewsRefresher({ initialArticles = [], category = null }) {
  const [articles, setArticles]   = useState(initialArticles)
  const [newIds, setNewIds]        = useState(new Set())
  const [newCount, setNewCount]    = useState(0)
  const [lastPoll, setLastPoll]    = useState(null)
  const [polling, setPolling]      = useState(false)
  const prevIds                    = useRef(new Set(initialArticles.map(a => a._id)))

  useEffect(() => {
    const poll = async () => {
      try {
        setPolling(true)
        const params = new URLSearchParams({ limit: '29' })
        if (category) params.set('category', category)
        const res  = await fetch(`/api/news-feed?${params}`)
        const data = await res.json()
        if (!data.articles?.length) return

        const incoming   = data.articles
        const fresh      = incoming.filter(a => !prevIds.current.has(a._id))
        const freshIds   = new Set(fresh.map(a => a._id))

        if (fresh.length > 0) {
          setNewCount(n => n + fresh.length)
          setNewIds(freshIds)
          setArticles(incoming)
          prevIds.current = new Set(incoming.map(a => a._id))
          // Clear new highlight after 8 seconds
          setTimeout(() => setNewIds(new Set()), 8000)
        }
        setLastPoll(new Date())
      } catch {}
      finally { setPolling(false) }
    }

    const timer = setInterval(poll, 2 * 60 * 1000) // 2 minutes
    return () => clearInterval(timer)
  }, [category])

  const displayArticles = articles.length > 0 ? articles : initialArticles

  return (
    <div>
      {/* Live status bar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, paddingBottom:10, borderBottom:'1px solid rgba(30,41,59,0.5)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', display:'inline-block', animation:'pulse 1.5s infinite' }} />
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#22c55e', letterSpacing:'0.08em' }}>LIVE FEED</span>
        </div>
        {polling && (
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#475569' }}>
            Checking for new stories…
          </span>
        )}
        {newCount > 0 && (
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#C8922A', background:'rgba(200,146,42,0.12)', border:'1px solid rgba(200,146,42,0.3)', padding:'1px 8px', borderRadius:2 }}>
            +{newCount} new {newCount === 1 ? 'story' : 'stories'} this session
          </span>
        )}
        {lastPoll && (
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#334155', marginLeft:'auto' }}>
            {displayArticles.length} stories · refreshes every 2 min
          </span>
        )}
      </div>

      <style>{`
        @keyframes newArticlePop {
          0%   { opacity: 0; transform: translateY(8px) scale(0.99); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .article-new { animation: newArticlePop 0.5s ease forwards; }
      `}</style>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px' }}>
        {displayArticles.map(article => (
          <div key={article._id} className={newIds.has(article._id) ? 'article-new' : ''}
            style={{ position:'relative' }}>
            {newIds.has(article._id) && (
              <div style={{ position:'absolute', top:8, right:8, zIndex:10, fontFamily:"'IBM Plex Mono',monospace", fontSize:7, fontWeight:700, color:'#22c55e', background:'#14532d', border:'1px solid #22c55e40', padding:'2px 6px', borderRadius:2, letterSpacing:'0.1em' }}>
                NEW
              </div>
            )}
            <NewsCard article={article} />
          </div>
        ))}
      </div>
    </div>
  )
}
