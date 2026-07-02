// app/state-intel/page.js
// UNIFIED STATE INTELLIGENCE HUB
// Combines: State Laws + CCW Reciprocity + Gun Laws
// Smart geolocation detection for user's home state

import { Suspense } from 'react'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import StateIntelClient from './StateIntelClient'
import { fetchAllStateProfiles, fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = {
  title: 'State Intelligence Hub — Complete Gun Laws & Reciprocity | DownRange',
  description: 'Know your state\'s gun laws, CCW reciprocity, magazine limits, and how to carry across state lines. All 50 states with court cases and scenarios.',
  alternates: { canonical: 'https://downrangeco.com/laws/my-state' },
  openGraph: {
    type: 'website',
    url: 'https://downrangeco.com/laws/my-state',
    title: 'State Intelligence Hub — Gun Laws & Reciprocity',
    description: 'Complete gun law guide: constitutional carry, permits, magazines, local rules, and travel reciprocity for all 50 states.',
    images: [{ url: 'https://downrangeco.com/og-default.png', width: 1200, height: 630 }],
  },
}

export const revalidate = 1800 // 30 min

export default async function StateIntelPage({ searchParams }) {
  const [profiles, alerts] = await Promise.all([
    fetchAllStateProfiles().catch(() => []),
    fetchBreakingAlerts(3).catch(() => []),
  ])

  // Build map for quick lookup
  const profileMap = {}
  for (const p of profiles) {
    if (p?.abbr) profileMap[p.abbr] = p
  }

  // Reciprocity matrix: which states honor which other states' permits
  const reciprocityMatrix = buildReciprocityMatrix(profiles)

  return (
    <>
      <Masthead />

      <div className="page-hero" data-title="STATE INTELLIGENCE HUB">
        <div className="container">
          <h1 className="page-hero-title">State Intelligence Hub</h1>
          <p className="page-hero-sub">
            Know your state's gun laws, CCW reciprocity rules, and travel guides.
            Court cases, local restrictions, and real scenarios for all 50 states.
          </p>
        </div>
      </div>

      {/* Geolocation prompt + alerts */}
      <div style={{ background: '#111318', borderBottom: '1px solid var(--border)', padding: '20px 0' }}>
        <div className="container">
          <Suspense fallback={<div style={{ height: '60px' }} />}>
            <StateIntelClient
              profiles={profiles}
              profileMap={profileMap}
              reciprocityMatrix={reciprocityMatrix}
              userState={searchParams?.state || null}
              alerts={alerts}
            />
          </Suspense>
        </div>
      </div>

      <Footer />
    </>
  )
}

function buildReciprocityMatrix(profiles) {
  const matrix = {}
  for (const state of profiles) {
    matrix[state.abbr] = {
      name: state.name,
      honorsStates: state.reciprocityStates || [],
      honoredByStates: [],
    }
  }
  // Bidirectional: if TX honors FL, then FL is honored by TX
  for (const [stateCode, data] of Object.entries(matrix)) {
    for (const honoredState of data.honorsStates) {
      if (matrix[honoredState]) {
        matrix[honoredState].honoredByStates.push(stateCode)
      }
    }
  }
  return matrix
}
