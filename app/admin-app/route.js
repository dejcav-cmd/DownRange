import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const html = readFileSync(join(process.cwd(), 'public/admin-app/index.html'), 'utf8')
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  } catch (e) {
    return new NextResponse('Not found', { status: 404 })
  }
}
