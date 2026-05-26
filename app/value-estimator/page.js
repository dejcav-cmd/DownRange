import ValueEstimatorPage from "./PageClient"

export const metadata = {
  title:       "Gun Value Estimator — What Is Your Firearm Worth? | DownRange",
  description: "Estimate the current market value of your firearm. Compare used gun prices across platforms.",
  alternates:  { canonical: "https://downrangeco.com/value-estimator" },
  openGraph: {
    title:       "Gun Value Estimator — What Is Your Firearm Worth? | DownRange",
    description: "Estimate the current market value of your firearm. Compare used gun prices across platforms.",
    url:         "https://downrangeco.com/value-estimator",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Gun Value Estimator — What Is Your Firearm Worth? | DownRange",
    description: "Estimate the current market value of your firearm. Compare used gun prices across platforms.",
  },
}

export default function Page() {
  return <ValueEstimatorPage />
}
