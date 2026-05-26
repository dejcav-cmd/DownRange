import NFATrackerPage from "./PageClient"

export const metadata = {
  title:       "NFA Wait Time Tracker — Form 4 and Form 1 Approval Times | DownRange",
  description: "Current ATF NFA wait times for Form 4 suppressors, SBRs, and Form 1 builds. Community-sourced data.",
  alternates:  { canonical: "https://downrangeco.com/nfa-tracker" },
  openGraph: {
    title:       "NFA Wait Time Tracker — Form 4 and Form 1 Approval Times | DownRange",
    description: "Current ATF NFA wait times for Form 4 suppressors, SBRs, and Form 1 builds. Community-sourced data.",
    url:         "https://downrangeco.com/nfa-tracker",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "NFA Wait Time Tracker — Form 4 and Form 1 Approval Times | DownRange",
    description: "Current ATF NFA wait times for Form 4 suppressors, SBRs, and Form 1 builds. Community-sourced data.",
  },
}

export default function Page() {
  return <NFATrackerPage />
}
