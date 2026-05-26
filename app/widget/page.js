import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

export const metadata = { title: 'Embed DownRange Widget — Free Gun Law Widget for Your Site', description: 'Free embeddable firearms law widget for gun stores and 2A websites.' }

export default function WidgetPage() {
  return (
    <>
      <Masthead />
      <div className="page-hero">
        <div className="container">
          <h1 className="page-hero-title">Free Embeddable Law Widget</h1>
          <p className="page-hero-sub">Free embed for gun shops and instructors — live state carry law summary, always current</p>
        </div>
      </div>
      <div style={{ padding: '40px 0' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <div style={{ background: '#111318', border: '1px solid var(--border)', padding: '32px', marginBottom: '32px' }}>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', color: '#C8922A', letterSpacing: '0.05em', marginBottom: '16px' }}>HOW TO EMBED</h2>
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '13px', color: '#6B7280', marginBottom: '20px', lineHeight: 1.7 }}>
              Add two lines to any page on your website. Replace TX with your state abbreviation.
            </p>
            <div style={{ background: '#0D1117', border: '1px solid var(--border)', padding: '20px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '13px', color: '#34D399', lineHeight: 2 }}>
              {'<div id="downrange-widget"></div>'}<br/>
              {'<script src="https://downrangeco.com/api/widget?state=TX&format=js"></script>'}
            </div>
          </div>
          <div style={{ background: '#111318', border: '1px solid var(--border)', padding: '32px' }}>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: '#C8922A', letterSpacing: '0.05em', marginBottom: '16px' }}>AVAILABLE STATES</h2>
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', color: '#4B5563', lineHeight: 1.7 }}>
              All 50 US states supported. Use the 2-letter abbreviation: AL, AK, AZ, AR, CA, CO, CT, DE, FL, GA, HI, ID, IL, IN, IA, KS, KY, LA, ME, MD, MA, MI, MN, MS, MO, MT, NE, NV, NH, NJ, NM, NY, NC, ND, OH, OK, OR, PA, RI, SC, SD, TN, TX, UT, VT, VA, WA, WV, WI, WY
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
