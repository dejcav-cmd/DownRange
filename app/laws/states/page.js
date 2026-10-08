import Masthead from '../../../components/layout/Masthead'
import Footer from '../../../components/layout/Footer'
import PageHero from '../../../components/home/PageHero'
import StatesTable from './StatesTable'
import { fetchAllStateProfiles } from '../../../sanity/lib/client'
import { STATE_SEED } from '../../../lib/stateSeed'

export const metadata = {
  title: 'Gun Laws by State — All 50 States',
  description: 'Complete gun law comparison for all 50 states: constitutional carry, CCW permits, magazine limits, AWB status, and red flag laws.',
  alternates: { canonical: 'https://www.downrangeco.com/laws/states' },
}
export const revalidate = 3600

const S = { mono:"'IBM Plex Mono',monospace", bebas:"'Bebas Neue',sans-serif", sans:"'IBM Plex Sans',sans-serif", cond:"'Barlow Condensed',sans-serif" }

function num(v) {
  if (v === null || v === undefined || v === '' || v === false) return 0
  if (typeof v === 'number') return v
  const m = String(v).match(/\d+/)
  if (!m) return 0
  let n = parseInt(m[0], 10)
  if (/hour/i.test(String(v)) || n > 30) n = Math.ceil(n / 24) // 72 (hours) -> 3 days
  return n
}
const hasBan = v => !!v && !/^(none|no)$/i.test(String(v).trim())

export default async function StatesPage() {
  const sanityProfiles = await fetchAllStateProfiles().catch(() => [])
  const profileMap = {}
  for (const p of Object.values(STATE_SEED)) { profileMap[p.abbr] = { ...p } }
  for (const p of sanityProfiles) { if (p?.abbr && profileMap[p.abbr]) { for (const [k,v] of Object.entries(p)) { if (v !== null && v !== undefined) profileMap[p.abbr][k] = v } } }
  const profiles = Object.values(profileMap).sort((a,b) => a.name.localeCompare(b.name))

  const rows = profiles.map(p => ({
    abbr: p.abbr, name: p.name, rating: p.rating || null,
    cc: !!p.constitutionalCarry, mag: num(p.magLimit) || null, awb: hasBan(p.awbStatus), awbLabel: /partial/i.test(String(p.awbStatus)) ? 'Partial' : 'Banned',
    wait: num(p.waitPeriod), rf: !!p.redFlagLaw, recip: (p.reciprocityStates || []).length,
  }))
  const verified = profiles.map(p => p.reciprocityVerified).filter(Boolean).sort().pop() || null

  const ccCount = rows.filter(r => r.cc).length
  const magCount = rows.filter(r => r.mag).length
  const awbCount = rows.filter(r => r.awb).length
  const rfCount = rows.filter(r => r.rf).length

  return (
    <>
      <Masthead />
      <PageHero img="/img/laws-hero.jpg" imgSm="/img/laws-hero-sm.jpg" pos="58% 55%" posSm="82% 50%"
        eyebrow="Laws · State by state"
        title={<>Gun laws, <span>all 50 states.</span></>}
        sub="Carry rules, magazine limits, assault weapon bans, waiting periods, red flag laws and permit reciprocity. Search, filter and sort to compare."
      >
        <ul className="hh-chips">
          <li><b>{ccCount}</b><span>Permitless carry</span></li>
          <li><b>{50 - ccCount}</b><span>Permit required</span></li>
          <li><b>{magCount}</b><span>Magazine limits</span></li>
          <li><b>{awbCount}</b><span>Assault weapon bans</span></li>
          <li><b>{rfCount}</b><span>Red flag laws</span></li>
        </ul>
      </PageHero>
      <StatesTable rows={rows} verified={verified} />
      <Footer />
    </>
  )
}
