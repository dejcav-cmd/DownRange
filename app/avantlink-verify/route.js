import { NextResponse } from 'next/server'

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AvantLink Verification | DownRange</title>
  <script type="text/javascript" src="http://classic.avantlink.com/affiliate_app_confirm.php?mode=js&authResponse=958faffc401d524371e92683a1faf7458c69da50"></script>
</head>
<body>
  <p>AvantLink affiliate ownership verification for downrangeco.com — application ID 1619841</p>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
