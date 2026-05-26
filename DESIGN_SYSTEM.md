# DownRange Design System

## Visual Identity

**Aesthetic**: Dark intelligence terminal — editorial precision meets tactical utility.  
**Personality**: Authoritative, data-driven, serious but not grim. Pro-2A without being loud.

---

## Typography

| Role | Font | Class | Usage |
|---|---|---|---|
| Headlines | Bebas Neue | `.t-display-xl/lg/md/sm/xs` | Page titles, section headers, stats |
| Labels / Meta | IBM Plex Mono | `.t-label-lg/md/sm/xs` | Metadata, badges, categories, dates |
| Body text | IBM Plex Sans | `.t-body-lg/md/sm` | Prose, descriptions, article text |
| Compact UI | Barlow Condensed | `.t-cond-lg/md/sm` | Nav items, compact card titles |

**Never use**: Inter, Roboto, Arial, system-ui, `fontFamily:'monospace'` (use `'IBM Plex Mono', monospace`)

---

## Color Tokens

```css
var(--bg)          #09090B   /* page background */
var(--bg2)         #111318   /* card / surface background */
var(--bg3)         #16191F   /* elevated surface */
var(--bg4)         #1C2028   /* highest elevation */
var(--gold)        #C8922A   /* primary accent — CTAs, headings, icons */
var(--gold-light)  #E5A83A   /* hover state */
var(--text)        #F0EDE6   /* primary text */
var(--text-muted)  #9CA3AF   /* secondary text */
var(--text-dim)    #6B7280   /* tertiary / metadata */
var(--border)      #1F2428   /* borders (use this, never hardcode) */
var(--green)       #16A34A   /* positive states, live indicators */
var(--red-bright)  #EF4444   /* alerts, urgent, breaking */
var(--blue)        #3B82F6   /* law/legal category */
```

---

## Component Classes

### Page Header
Every page **must** use the standard hero:
```jsx
<div className="page-hero" data-title="YOUR_PAGE_TITLE">
  <div className="container">
    <div className="dr-breadcrumb">...</div>  {/* optional */}
    <h1 className="page-hero-title">Page Title</h1>
    <p className="page-hero-sub">Subtitle tagline</p>
  </div>
</div>
```

### Sections
```jsx
<div className="dr-section">
  <h2 className="dr-section-title">Section Title</h2>
  <p className="dr-section-sub">Optional subtitle</p>
  {/* content */}
</div>
```

### Cards
```jsx
<div className="dr-card">                  {/* base card */}
<div className="dr-card dr-card-accent">   {/* gold top border */}

  <div className="dr-card-meta">CATEGORY · BRAND</div>   {/* gold mono label */}
  <div className="dr-card-title">Title Here</div>         {/* Bebas Neue */}
  <p className="dr-card-body">Body text.</p>              {/* IBM Plex Mono */}
  <div className="dr-card-price">$999</div>               {/* Large gold price */}
```

### Tables
```jsx
<div className="dr-table">
  <div className="dr-table-head" style={{ gridTemplateColumns:'...' }}>
    {['Col1','Col2'].map(h => <span key={h}>{h}</span>)}
  </div>
  <div className="dr-table-row" style={{ gridTemplateColumns:'...' }}>
    <span className="t-label-md">{value}</span>
  </div>
</div>
```

### Badges
```jsx
<span className="dr-badge dr-badge-gold">RECOMMENDED</span>
<span className="dr-badge dr-badge-green">● ACTIVE</span>
<span className="dr-badge dr-badge-red">CRITICAL</span>
<span className="dr-badge dr-badge-blue">LAW</span>
<span className="dr-badge dr-badge-dim">OPTIONAL</span>
```

### Buttons
```jsx
<a href="#" className="dr-btn-primary">Primary Action →</a>
<a href="#" className="dr-btn-outline">Secondary Action →</a>
```

### Info Blocks (skills, tips, warnings)
```jsx
<div className="dr-infoblock">
  <div className="dr-infoblock-title">Title</div>
  <div className="dr-infoblock-body">Body text here.</div>
</div>
```

### Grids
```jsx
<div className="dr-grid-2">   {/* 2 columns */}
<div className="dr-grid-3">   {/* 3 columns */}
<div className="dr-grid-4">   {/* 4 columns */}
```
All grids collapse to 2-col at 768px and 1-col at 500px.

### Alerts
```jsx
<div className="dr-alert-info">ℹ️ Informational message with gold border.</div>
<div className="dr-alert-warn">⚠️ Warning message with red border.</div>
```

---

## Page Template

```jsx
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

export const metadata = { title: 'Page Title — DownRange', description: '...' }

export default function NewPage() {
  return (
    <>
      <Masthead />
      <div className="page-hero" data-title="KEYWORD">
        <div className="container">
          <h1 className="page-hero-title">Page Title</h1>
          <p className="page-hero-sub">Subtitle · More context · Details</p>
        </div>
      </div>
      <div className="dr-page">
        <div className="container">
          <div className="dr-section">
            <h2 className="dr-section-title">Section One</h2>
            <div className="dr-grid-3">
              <div className="dr-card dr-card-accent">
                <div className="dr-card-meta">CATEGORY</div>
                <div className="dr-card-title">Card Title</div>
                <p className="dr-card-body">Description text.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
```

---

## Anti-Patterns (Never Do)

```jsx
// ❌ Wrong
<div style={{ fontFamily:'monospace' }}>
<div style={{ background:'#111318' }}>
<div style={{ color:'#4B5563' }}>
<div style={{ border:'1px solid #1F2428' }}>

// ✅ Correct
<div className="t-label-md">
<div style={{ background:'var(--bg2)' }}>
<div style={{ color:'var(--text-dim)' }}>
<div style={{ border:'1px solid var(--border)' }}>

// ❌ Wrong — custom hero
<div style={{ background:'#111318', padding:'80px 0' }}>
  <h1 style={{ fontFamily:"'Bebas Neue'" }}>Title</h1>

// ✅ Correct — standard hero
<div className="page-hero" data-title="KEYWORD">
  <h1 className="page-hero-title">Title</h1>
```
