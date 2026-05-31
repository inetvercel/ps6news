/**
 * Export newsletter subscribers from Sanity to a CSV file.
 * Usage: node scripts/export-subscribers.js [outputPath]
 * Default output: subscribers.csv in the project root.
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@sanity/client')

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zzzwo1aw',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
})

function csvEscape(value) {
  const s = value == null ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

async function run() {
  const outPath = process.argv[2] || 'subscribers.csv'
  const subs = await sanity.fetch(
    `*[_type == "subscriber"] | order(subscribedAt desc){ email, subscribedAt }`
  )

  const header = 'email,subscribedAt'
  const rows = subs.map((s) => `${csvEscape(s.email)},${csvEscape(s.subscribedAt)}`)
  const csv = [header, ...rows].join('\n')

  fs.writeFileSync(path.resolve(outPath), csv, 'utf8')
  console.log(`\n✅ Exported ${subs.length} subscriber(s) to ${path.resolve(outPath)}\n`)
}

run().catch((e) => { console.error(e.message); process.exit(1) })
