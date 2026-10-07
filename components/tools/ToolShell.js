import Masthead from '../layout/Masthead'
import Footer from '../layout/Footer'

const BASE = 'https://www.downrangeco.com'

// Shared page frame for the Tools section: header, JSON-LD (SoftwareApplication + BreadcrumbList), styles.
export default function ToolShell({ path, name, headline, accent, intro, description, children, schema = true }) {
  const url = BASE + path
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'SoftwareApplication', name, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web', url, description, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@id': BASE + '/#organization' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
        { '@type': 'ListItem', position: 2, name: 'Tools', item: BASE + '/tools' },
        { '@type': 'ListItem', position: 3, name: name, item: url },
      ] },
    ],
  }
  return (
    <>
      {schema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} /> : null}
      <Masthead />
      <style>{CSS}</style>
      <header className="tl-hero">
        <div className="container">
          <div className="tl-eyebrow">DownRange Tools</div>
          <h1 className="tl-h1">{headline} <span>{accent}</span></h1>
          <p className="tl-intro">{intro}</p>
        </div>
      </header>
      <main className="container tl-main">{children}</main>
      <Footer />
    </>
  )
}

const CSS = `
.tl-hero{padding:72px 0 40px;min-height:clamp(430px,34vw,700px);display:flex;align-items:flex-end;background:linear-gradient(90deg,rgba(9,9,11,.95) 0%,rgba(9,9,11,.82) 28%,rgba(9,9,11,.2) 58%,rgba(9,9,11,.05) 100%),linear-gradient(0deg,rgba(9,9,11,.8) 0%,rgba(9,9,11,0) 35%),url(/img/tools-hero.jpg) center 60%/cover no-repeat,#09090B;border-bottom:1px solid var(--border)}
.tl-hero>.container{width:100%}
.tl-eyebrow{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:10px}
.tl-h1{font-family:'Bebas Neue',cursive;font-weight:400;font-size:clamp(2.6rem,7vw,4.6rem);line-height:.95;margin:0 0 12px;color:var(--text)}
.tl-h1 span{color:var(--gold)}
.tl-intro{max-width:680px;font-size:16px;line-height:1.6;color:var(--text-muted);margin:0}
.tl-main{padding-top:26px;padding-bottom:60px}
.tl-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.tl-card{background:var(--bg2);border:1px solid var(--border);border-top:2px solid var(--gold);padding:18px}
.tl-card h2{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:21px;letter-spacing:.05em;text-transform:uppercase;color:var(--gold);margin:0 0 12px}
.tl-f{display:block;margin-bottom:10px}
.tl-f span{display:block;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px}
.tl-f input,.tl-f select{width:100%;box-sizing:border-box;background:var(--bg3);border:1px solid var(--border-mid);color:var(--text);padding:9px 10px;font-size:14px;font-family:'IBM Plex Mono',monospace;min-height:42px}
.tl-f input:focus,.tl-f select:focus{outline:2px solid var(--gold);outline-offset:-1px}
.tl-r2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tl-out{margin-top:6px;padding:12px 14px;background:var(--bg3);border:1px solid var(--border);display:grid;gap:6px}
.tl-out div{display:flex;justify-content:space-between;gap:10px;align-items:baseline;font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--text-muted)}
.tl-out b{font-family:'Bebas Neue',cursive;font-weight:400;font-size:26px;color:var(--gold);line-height:1}
.tl-note{font-size:12px;line-height:1.6;color:var(--text-dim);margin:10px 0 0}
.tl-links{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.tl-link{display:block;padding:18px;background:var(--bg2);border:1px solid var(--border);text-decoration:none;transition:border-color .15s,transform .15s}
.tl-link:hover{border-color:var(--gold);transform:translateY(-2px)}
.tl-link h3{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:21px;letter-spacing:.03em;color:var(--gold);margin:0 0 6px}
.tl-link p{font-size:14px;line-height:1.5;color:var(--text-muted);margin:0}
.tl-link i{display:inline-block;font-style:normal;font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#09090B;background:var(--gold);padding:2px 6px;margin-bottom:8px}
@media(max-width:900px){.tl-links{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:700px){.tl-grid,.tl-links{grid-template-columns:1fr}.tl-hero{background:linear-gradient(0deg,#09090B 0%,rgba(9,9,11,0) 20vw),url(/img/tools-hero-sm.jpg) center top/100% auto no-repeat,#09090B;padding:calc(60vw + 10px) 0 24px;min-height:0}}
`
