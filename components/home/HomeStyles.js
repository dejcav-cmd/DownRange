export default function HomeStyles() {
  return (
    <style>{`
.hr-sec{padding:34px 0 8px;background:var(--bg);border-bottom:1px solid var(--border)}
.hr-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:14px}
.hr-title{font-family:'Bebas Neue',cursive;font-size:clamp(1.9rem,4vw,2.6rem);letter-spacing:.03em;line-height:1;color:var(--text);margin:0}
.hr-title span{color:var(--gold)}
.hr-sub{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--text-dim);margin-top:4px}
.hr-all{font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:.1em;font-size:14px;color:var(--gold);text-decoration:none;white-space:nowrap}
.hr-all:hover{color:var(--gold-light)}
.hr-wrap{position:relative;margin:0 -16px}
.hr-rail{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding:0 16px;padding:4px 16px 26px;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:var(--border-mid) transparent;overscroll-behavior-x:contain}
.hr-rail:focus-visible{outline:2px solid var(--gold);outline-offset:-2px}
.hr-card{position:relative;flex:0 0 72vw;max-width:300px;scroll-snap-align:start;display:flex;flex-direction:column;background:var(--bg2);border:1px solid var(--border);text-decoration:none;color:var(--text);transition:border-color .15s,transform .15s}
.hr-card:hover{border-color:var(--gold);transform:translateY(-2px)}
.hr-card-lead{flex-basis:86vw;max-width:620px}
.hr-img{position:relative;aspect-ratio:16/10;background:var(--bg3);overflow:hidden}
.hr-img img{width:100%;height:100%;object-fit:cover;display:block}
.hr-card:not(.hr-card-lead) .hr-img{aspect-ratio:auto;flex:1 1 auto;min-height:170px}
.hr-card:not(.hr-card-lead) .hr-body{flex:0 0 auto}
.hr-tag{position:absolute;left:10px;top:10px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;background:rgba(9,9,11,.82);color:var(--gold);border:1px solid rgba(200,146,42,.45);padding:3px 7px}
.hr-rank{position:absolute;right:10px;top:6px;font-family:'Bebas Neue',cursive;font-size:44px;line-height:1;color:var(--gold);text-shadow:0 2px 8px rgba(0,0,0,.75)}
.hr-body{padding:12px 14px 14px;display:flex;flex-direction:column;gap:8px;flex:1}
.hr-h{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:19px;line-height:1.18;margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.hr-card-lead .hr-h{font-size:clamp(23px,3vw,30px);-webkit-line-clamp:4}
.hr-sum{font-size:13px;line-height:1.5;color:var(--text-muted);margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.hr-meta{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:8px;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--text-dim)}
.hr-price{font-family:'Bebas Neue',cursive;font-size:26px;letter-spacing:.02em;color:var(--gold);line-height:1}
.hr-end{flex:0 0 200px;scroll-snap-align:start;display:flex;align-items:center;justify-content:center;text-align:center;border:1px dashed var(--border-mid);text-decoration:none;color:var(--gold);font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:20px;letter-spacing:.06em;padding:20px}
.hr-end:hover{border-color:var(--gold)}
.hr-arrow{display:none}
@media(hover:hover) and (min-width:900px){
  .hr-wrap{margin:0}
  .hr-rail{padding-left:0;padding-right:0;scroll-padding:0}
  .hr-card{flex-basis:290px}
  .hr-card-lead{flex-basis:600px}
  .hr-arrow{display:flex;align-items:center;justify-content:center;position:absolute;top:34%;z-index:3;width:44px;height:44px;border-radius:50%;background:rgba(9,9,11,.88);color:var(--gold);border:1px solid var(--gold-dim);font-size:26px;line-height:1;cursor:pointer;transition:opacity .15s}
  .hr-arrow:hover:not(:disabled){background:var(--gold);color:#09090B}
  .hr-arrow:disabled{opacity:0;pointer-events:none}
  .hr-prev{left:-14px}.hr-next{right:-14px}
}
@media(prefers-reduced-motion:reduce){.hr-card{transition:none}.hr-rail{scroll-behavior:auto}}
.hr-state{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;justify-content:space-between;padding:16px 0;font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--text-muted)}
.hr-state a{color:var(--gold);text-decoration:none;font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:.08em;font-size:15px}
`}</style>
  )
}
