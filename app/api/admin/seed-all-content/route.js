export const dynamic = 'force-dynamic'

// Retired: seeding re-created sample content for sections that were removed.
export async function POST() {
  return Response.json({ error: 'seed-all-content has been retired' }, { status: 410 })
}
