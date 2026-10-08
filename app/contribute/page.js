import PageContent from "./PageClient"

export const metadata = {
  title:       "Contribute to DownRange — Submit Tips and Articles",
  description: "Submit news tips, reader reports, and guest articles to DownRange Intelligence Hub.",
  alternates:  { canonical: "https://www.downrangeco.com/contribute" },
  openGraph:   { images:[{url:'https://www.downrangeco.com/og-default.png',width:1200,height:630,alt:'DownRange'}],  title: "Contribute to DownRange — Submit Tips and Articles", description: "Submit news tips, reader reports, and guest articles to DownRange Intelligence Hub.", url: "https://www.downrangeco.com/contribute", type: "website" },
}

export default function Page() { return <PageContent /> }
