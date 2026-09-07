import { fetchBreakingAlerts } from '../../sanity/lib/client'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
export const metadata = { title: 'DMCA Policy — DownRange', description: 'DownRange\u2019s DMCA copyright policy and process for submitting takedown notices.', alternates: { canonical: 'https://www.downrangeco.com/dmca' } }
export default async function DMCA() {
  const sections = [
    ['Copyright Policy','DownRange respects the intellectual property rights of others and expects users of its platform to do the same. In accordance with the Digital Millennium Copyright Act ("DMCA"), we will respond to valid notices of alleged copyright infringement.'],
    ['Filing a Notice','If you believe content on DownRange infringes your copyright, submit a written notice to our designated agent that includes: (1) a physical or electronic signature of the copyright owner or authorized representative; (2) identification of the copyrighted work claimed to be infringed; (3) identification of the material you claim is infringing, with enough detail for us to locate it; (4) your contact information (address, phone number, and email); (5) a statement that you have a good faith belief the use is not authorized by the copyright owner, its agent, or the law; and (6) a statement, under penalty of perjury, that the information in the notice is accurate and that you are the copyright owner or authorized to act on their behalf.'],
    ['Designated Agent','Notices can be sent to our designated agent at legal@downrangeco.com. Notices sent to any other address may result in delayed processing.'],
    ['Counter-Notification','If you believe your content was removed in error, you may submit a counter-notification containing your contact information, identification of the removed material, and a statement under penalty of perjury that you have a good faith belief the material was removed by mistake.'],
    ['Repeat Infringers','DownRange reserves the right to remove content and restrict access for users determined to be repeat infringers.'],
  ]
  const alerts = await fetchBreakingAlerts(5).catch(() => [])

  return (
    <>
      <Masthead />
      <div style={{ padding:'60px 0', background:'var(--bg)' }}>
        <div className="container" style={{ maxWidth:720 }}>
          <h1 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'3rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'32px' }}>DMCA POLICY</h1>
          {sections.map(([h,t]) => (
            <div key={h} style={{ marginBottom:'28px' }}>
              <h2 style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', color:'#C8922A', fontWeight:700, marginBottom:'10px' }}>{h.toUpperCase()}</h2>
              <p style={{ fontSize:'14px', color:'#6B7280', lineHeight:1.8 }}>{t}</p>
            </div>
          ))}
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#374151', marginTop:'40px' }}>Last updated: September 2026</p>
        </div>
      </div>
      <Footer />
    </>
  )
}
