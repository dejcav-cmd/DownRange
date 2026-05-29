import { NextResponse } from 'next/server'

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AvantLink Verification | DownRange</title>
  <script src="https://classic.avantlink.com/affiliate_app_confirm.php?mode=js&application_id=1604521"></script>
</head>
<body>
  <p>AvantLink affiliate ownership verification for downrangeco.com — application ID 1604521</p>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
