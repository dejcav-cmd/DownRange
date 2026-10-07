// Scoped styles for the Manufacturer Press Releases section (all classes prefixed pr-).
export default function PressStyles() {
  return <style>{`
.pr-wrap{max-width:1180px;margin:0 auto;padding:0 16px}
.pr-pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.pr-pill{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.06em;color:var(--text-muted);border:1px solid var(--border);background:var(--bg);padding:6px 11px}
.pr-pill b{color:var(--gold);font-weight:600}
.pr-pill-live{color:var(--green)}

.pr-filter{position:sticky;top:60px;z-index:20;background:var(--bg2);border-bottom:1px solid var(--border)}
.pr-filter-in{display:flex;align-items:stretch;max-width:1180px;margin:0 auto}
.pr-chiprow{flex:1;min-width:0;display:flex;gap:8px;overflow-x:auto;padding:10px 12px;scroll-snap-type:x proximity;scrollbar-width:none;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 12px,#000 calc(100% - 28px),transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 12px,#000 calc(100% - 28px),transparent 100%)}
.pr-chiprow::-webkit-scrollbar{display:none}
.pr-chip{flex:none;scroll-snap-align:center;display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:0 14px;border:1px solid var(--border);border-radius:999px;font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--text-muted);text-decoration:none;white-space:nowrap;background:var(--bg);-webkit-tap-highlight-color:transparent}
.pr-chip b{font-weight:600;color:var(--text-dim);font-size:11px}
.pr-chip.on{background:var(--gold);border-color:var(--gold);color:#09090B}
.pr-chip.on b{color:#09090B}
.pr-allbtn{flex:none;display:flex;align-items:center;gap:8px;border:0;border-left:1px solid var(--border);background:var(--bg2);color:var(--gold);padding:0 16px;font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:13px;cursor:pointer;min-height:56px}
.pr-kindrow{display:flex;gap:6px;overflow-x:auto;padding:0 12px 10px;scrollbar-width:none;max-width:1180px;margin:0 auto;-webkit-overflow-scrolling:touch}
.pr-kindrow::-webkit-scrollbar{display:none}
.pr-kind{flex:none;min-height:34px;display:inline-flex;align-items:center;padding:0 12px;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.04em;color:var(--text-dim);text-decoration:none;border-bottom:2px solid transparent}
.pr-kind.on{color:var(--gold);border-bottom-color:var(--gold)}
.pr-active{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 14px;border-top:1px solid var(--border);font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--text-muted);max-width:1180px;margin:0 auto}
.pr-clear{color:var(--gold);text-decoration:none;white-space:nowrap;min-height:32px;display:inline-flex;align-items:center}

.pr-sheet-wrap{position:fixed;inset:0;z-index:10001;display:flex;align-items:flex-end;justify-content:center}
.pr-sheet-bd{position:absolute;inset:0;background:rgba(0,0,0,.66)}
.pr-sheet{position:relative;width:100%;max-width:560px;max-height:84vh;background:var(--bg);border-top:2px solid var(--gold);border-radius:16px 16px 0 0;display:flex;flex-direction:column;padding-bottom:env(safe-area-inset-bottom);animation:prUp .22s ease-out}
.pr-sheet-handle{width:38px;height:4px;border-radius:2px;background:rgba(255,255,255,.18);margin:9px auto 2px}
.pr-sheet-head{display:flex;justify-content:space-between;align-items:center;padding:8px 16px;font-family:'Bebas Neue',cursive;font-size:24px;letter-spacing:.04em;color:var(--text)}
.pr-sheet-x{background:none;border:0;color:var(--text-muted);font-size:20px;min-width:44px;min-height:44px;cursor:pointer}
.pr-sheet-search{margin:0 16px 8px;padding:12px 14px;font-size:16px;background:var(--bg2);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Sans',sans-serif;border-radius:8px}
.pr-sheet-list{overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 8px 12px;overscroll-behavior:contain}
.pr-sheet-item{display:flex;justify-content:space-between;align-items:center;min-height:52px;padding:0 12px;border-bottom:1px solid var(--border);font-family:'Barlow Condensed',sans-serif;font-size:19px;font-weight:600;letter-spacing:.03em;color:var(--text);text-decoration:none}
.pr-sheet-item b{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--text-dim);font-weight:500}
.pr-sheet-item.on{color:var(--gold)}
.pr-sheet-none{padding:22px;text-align:center;color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:12px}
@keyframes prUp{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}

.pr-results-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin:26px 0 16px;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.08em;color:var(--text-dim);text-transform:uppercase}
.pr-grid{display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(290px,1fr))}
.pr-card{display:flex;flex-direction:column;background:var(--bg2);border:1px solid var(--border);text-decoration:none;color:inherit;transition:transform .15s ease,border-color .15s ease;-webkit-tap-highlight-color:transparent;min-width:0}
.pr-card:active{transform:scale(.99)}
@media (hover:hover){.pr-card:hover{border-color:var(--gold);transform:translateY(-2px)}}
.pr-card-img{position:relative;aspect-ratio:16/9;background:var(--bg3);overflow:hidden}
.pr-card-img img{width:100%;height:100%;object-fit:cover;display:block}
.pr-card-img::after{content:"";position:absolute;inset:auto 0 0 0;height:55%;background:linear-gradient(0deg,rgba(9,9,11,.82),transparent)}
.pr-badge-brand{position:absolute;left:10px;bottom:10px;z-index:1;background:rgba(9,9,11,.88);color:var(--gold);border:1px solid rgba(200,146,42,.45);padding:3px 9px;font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-size:12px}
.pr-badge-kind{position:absolute;right:10px;top:10px;z-index:1;background:rgba(9,9,11,.85);border:1px solid;padding:2px 8px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em}
.pr-card-body{padding:14px 16px 16px;display:flex;flex-direction:column;gap:9px;flex:1}
.pr-card-title{margin:0;font-family:'Bebas Neue',cursive;font-size:26px;line-height:1.04;letter-spacing:.02em;font-weight:400;color:var(--text);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.pr-card-sum{margin:0;font-family:'IBM Plex Sans',sans-serif;font-size:14px;line-height:1.55;color:var(--text-muted);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.pr-card-meta{margin-top:auto;padding-top:6px;display:flex;gap:12px;align-items:center;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--text-dim)}
.pr-card-go{margin-left:auto;color:var(--gold);letter-spacing:.08em}
.pr-card-featured{grid-column:1/-1}
@media(min-width:900px){
  .pr-card-featured{flex-direction:row}
  .pr-card-featured .pr-card-img{flex:0 0 56%;aspect-ratio:auto;min-height:340px}
  .pr-card-featured .pr-card-body{padding:26px 28px;justify-content:center}
  .pr-card-featured .pr-card-title{font-size:44px;-webkit-line-clamp:4}
  .pr-card-featured .pr-card-sum{font-size:16px;-webkit-line-clamp:5}
}

.pr-pager{margin:34px 0 8px;padding:18px;background:var(--bg2);border:1px solid var(--border)}
.pr-pager-row{display:flex;align-items:stretch;gap:10px}
.pr-pg-btn{flex:1;min-height:52px;display:flex;align-items:center;justify-content:center;border:1px solid var(--gold);color:var(--gold);text-decoration:none;font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-size:16px;-webkit-tap-highlight-color:transparent}
.pr-pg-btn:active{background:var(--gold);color:#09090B}
.pr-pg-off{opacity:.28;border-color:var(--border);color:var(--text-dim)}
.pr-pg-count{display:none;align-self:center;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--text-dim);white-space:nowrap}
.pr-pg-nums{display:flex;justify-content:center;gap:6px;margin-top:14px;flex-wrap:wrap}
.pr-pg-num{min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--border);color:var(--text-muted);text-decoration:none;font-family:'IBM Plex Mono',monospace;font-size:13px}
.pr-pg-cur{background:var(--gold);border-color:var(--gold);color:#09090B;font-weight:700}
.pr-pg-dots{align-self:center;color:var(--text-dim)}
.pr-tl{margin-top:20px;padding-top:16px;border-top:1px solid var(--border)}
.pr-tl-label{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.18em;color:var(--gold);margin-bottom:10px}
.pr-tl-row{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.pr-tl-row::-webkit-scrollbar{display:none}
.pr-tl-chip{flex:none;min-height:42px;display:inline-flex;align-items:center;gap:8px;padding:0 14px;border:1px solid var(--border);background:var(--bg);color:var(--text-muted);text-decoration:none;font-family:'IBM Plex Mono',monospace;font-size:12px;white-space:nowrap}
.pr-tl-chip b{color:var(--text-dim);font-weight:500}
.pr-tl-chip.on{border-color:var(--gold);color:var(--gold)}
.pr-pg-foot{display:flex;justify-content:space-between;margin-top:14px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--text-dim)}
.pr-top{color:var(--gold);text-decoration:none;min-height:32px;display:inline-flex;align-items:center}
@media(min-width:640px){.pr-pg-count{display:block}.pr-pg-btn{flex:0 0 190px}.pr-pager-row{justify-content:space-between}}

.pr-empty{padding:34px 20px;border:1px dashed var(--border);background:var(--bg2);text-align:center}
.pr-empty h3{font-family:'Bebas Neue',cursive;font-size:30px;letter-spacing:.03em;color:var(--text);margin:0 0 8px;font-weight:400}
.pr-empty p{font-family:'IBM Plex Sans',sans-serif;color:var(--text-muted);font-size:15px;line-height:1.6;margin:0 auto 18px;max-width:560px}
.pr-track{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.pr-track a{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--text-muted);border:1px solid var(--border);padding:7px 11px;text-decoration:none;background:var(--bg)}

.pr-art-hero{position:relative;width:100%;height:clamp(240px,42vw,460px);overflow:hidden;background:var(--bg3)}
.pr-art-hero img{width:100%;height:100%;object-fit:cover;display:block}
.pr-art-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,var(--bg) 0%,rgba(9,9,11,.15) 70%)}
.pr-art-head{max-width:760px;margin:-96px auto 0;padding:0 18px 22px;position:relative;z-index:1}
.pr-crumbs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;font-family:'IBM Plex Mono',monospace;font-size:11px}
.pr-crumbs a{color:var(--text-dim);text-decoration:none}
.pr-crumbs span{color:var(--text-dim)}
.pr-art-title{font-family:'Bebas Neue',Impact,sans-serif;font-weight:400;font-size:clamp(2rem,6.4vw,3.4rem);line-height:1.03;letter-spacing:.02em;color:var(--text);margin:14px 0 16px}
.pr-art-lede{font-family:'IBM Plex Sans',sans-serif;font-size:1.06rem;line-height:1.7;color:var(--text-muted);border-left:3px solid var(--gold);padding-left:14px;margin:0 0 18px}
.pr-art-meta{display:flex;flex-wrap:wrap;gap:6px 14px;font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--text-dim)}
.pr-art-body{max-width:760px;margin:0 auto;padding:6px 18px 10px}
.pr-src-btn{display:flex;align-items:center;justify-content:center;gap:10px;min-height:54px;margin:18px 0 4px;background:var(--gold);color:#09090B;text-decoration:none;font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-size:17px}
.pr-src-card{margin:26px 0;padding:16px 18px;background:var(--bg2);border:1px solid var(--border);border-left:3px solid var(--gold);font-family:'IBM Plex Sans',sans-serif;font-size:14px;line-height:1.65;color:var(--text-muted)}
.pr-src-card a{color:var(--gold);word-break:break-all}
.pr-art-nav{display:grid;gap:12px;grid-template-columns:1fr;max-width:760px;margin:10px auto 0;padding:0 18px}
@media(min-width:640px){.pr-art-nav{grid-template-columns:1fr 1fr}}
.pr-navcard{display:flex;flex-direction:column;gap:6px;min-height:92px;padding:14px 16px;background:var(--bg2);border:1px solid var(--border);text-decoration:none;-webkit-tap-highlight-color:transparent}
.pr-navcard small{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.14em;color:var(--gold)}
.pr-navcard span{font-family:'Barlow Condensed',sans-serif;font-weight:600;font-size:18px;line-height:1.2;color:var(--text)}
.pr-navcard.r{text-align:right}
.pr-more{max-width:1180px;margin:34px auto 0;padding:0 16px}
.pr-more h2{font-family:'Bebas Neue',cursive;font-weight:400;font-size:28px;letter-spacing:.04em;color:var(--text);margin:0 0 14px}
.dr-article-body h2{font-family:'Bebas Neue',sans-serif;font-weight:400;font-size:1.6rem;letter-spacing:.04em;color:var(--text);margin:2.2rem 0 .7rem;padding-bottom:.4rem;border-bottom:2px solid var(--gold);line-height:1.1}
.dr-article-body h2:first-child{margin-top:0}
.dr-article-body p{font-size:1.05rem;line-height:1.85;color:var(--text-muted);margin:0 0 1.35rem;font-family:'IBM Plex Sans',Arial,sans-serif;text-align:justify;hyphens:auto}
.dr-article-body strong{color:var(--text);font-weight:700}
.dr-article-body a{color:var(--gold);text-decoration:underline;text-underline-offset:3px;word-break:break-word}
.dr-article-body ul{margin:.6rem 0 1.4rem;padding:0;list-style:none}
.dr-article-body li{font-size:1rem;line-height:1.7;color:var(--text-muted);padding:.4rem 0 .4rem 1.3rem;position:relative;font-family:'IBM Plex Sans',Arial,sans-serif;border-bottom:1px solid var(--border)}
.dr-article-body li:before{content:"";position:absolute;left:0;top:1.05rem;width:6px;height:6px;background:var(--gold)}
@media(max-width:640px){
  .dr-article-body p{text-align:left;font-size:1rem;line-height:1.75}
  .pr-pg-btn{font-size:15px}
  .pr-card-title{font-size:25px}
}
@media (prefers-reduced-motion:reduce){.pr-sheet{animation:none}.pr-card{transition:none}}
`}</style>
}
