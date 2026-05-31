/**
 * Backfill / re-categorise existing PS6News articles.
 *
 * Reads every article, detects the best category from its title + excerpt +
 * body text using the shared detector, and sets the article's category
 * reference accordingly.
 *
 * Usage:
 *   node scripts/categorize-articles.js            (preview only, no writes)
 *   node scripts/categorize-articles.js --apply    (write changes to Sanity)
 *   node scripts/categorize-articles.js --apply --force   (overwrite even if already categorised)
 *
 * Env vars: NEXT_PUBLIC_SANITY_PROJECT_ID, SANITY_API_TOKEN
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@sanity/client')
const { detectCategorySlug } = require('./lib/categorize')

const APPLY = process.argv.includes('--apply')
const FORCE = process.argv.includes('--force')

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zzzwo1aw',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
})

// Extract plain text from a Portable Text body array
function bodyToText(body) {
  if (!Array.isArray(body)) return ''
  const parts = []
  for (const block of body) {
    if (!block || typeof block !== 'object') continue
    if (block._type === 'block' && Array.isArray(block.children)) {
      parts.push(block.children.map(c => c.text || '').join(' '))
    } else if (block._type === 'keyTakeaways' && Array.isArray(block.items)) {
      parts.push(block.items.join(' '))
    }
  }
  return parts.join(' ')
}

async function run() {
  if (!process.env.SANITY_API_TOKEN && !process.env.SANITY_TOKEN) {
    console.error('❌ SANITY_API_TOKEN env var is missing. Add it to .env.local')
    process.exit(1)
  }

  console.log(`\n🏷️  Re-categorising articles ${APPLY ? '(APPLY mode — writing changes)' : '(DRY RUN — no writes)'}${FORCE ? ' [force]' : ''}\n`)

  // Build slug -> id map
  const cats = await sanity.fetch(`*[_type == "category"]{ "slug": slug.current, _id }`)
  const categoryMap = {}
  for (const c of cats) if (c.slug) categoryMap[c.slug] = c._id
  console.log(`Categories available: ${Object.keys(categoryMap).join(', ')}\n`)

  const articles = await sanity.fetch(`*[_type == "article"]{
    _id, title, excerpt, body,
    "currentSlug": category->slug.current
  }`)
  console.log(`Found ${articles.length} articles\n`)

  const counts = {}
  let changed = 0
  let skipped = 0

  for (const a of articles) {
    const bodyText = `${a.excerpt || ''} ${bodyToText(a.body)}`
    const detected = detectCategorySlug(a.title || '', bodyText)
    counts[detected] = (counts[detected] || 0) + 1

    const targetId = categoryMap[detected] || categoryMap['news']
    if (!targetId) {
      console.log(`   ⚠️  No category id for "${detected}" — skipping "${a.title}"`)
      skipped++
      continue
    }

    const alreadyCorrect = a.currentSlug === detected
    if (alreadyCorrect && !FORCE) {
      skipped++
      continue
    }

    const arrow = a.currentSlug ? `${a.currentSlug} → ${detected}` : `(none) → ${detected}`
    console.log(`   ${alreadyCorrect ? '↻' : '✏️ '} ${arrow}  |  ${a.title}`)

    if (APPLY) {
      await sanity
        .patch(a._id)
        .set({ category: { _type: 'reference', _ref: targetId } })
        .commit()
    }
    changed++
  }

  console.log(`\n📊 Detected distribution:`)
  for (const [slug, n] of Object.entries(counts).sort((x, y) => y[1] - x[1])) {
    console.log(`   ${slug.padEnd(14)} ${n}`)
  }
  console.log(`\n${APPLY ? '✅ Updated' : '🔎 Would update'}: ${changed} | Unchanged: ${skipped}`)
  if (!APPLY) console.log(`\nRe-run with --apply to write these changes.\n`)
}

run().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
