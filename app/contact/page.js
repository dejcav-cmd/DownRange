import PageContent from "./PageClient"

export const metadata = {
  title:       "Contact DownRange — News Tips, Press and Partnerships",
  description: "Contact the DownRange editorial team for news tips, press inquiries, and partnership opportunities.",
  alternates:  { canonical: "https://www.downrangeco.com/contact" },
  openGraph:   { images:[{url:'https://www.downrangeco.com/og-default.png',width:1200,height:630,alt:'DownRange'}],  title: "Contact DownRange — News Tips, Press and Partnerships", description: "Contact the DownRange editorial team for news tips, press inquiries, and partnership opportunities.", url: "https://www.downrangeco.com/contact", type: "website" },
}

export default function Page() { return <PageContent /> }
