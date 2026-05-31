/**
 * Backfill SEO meta tags (metaTitle + metaDescription) for existing articles.
 *
 * Usage:
 *   node scripts/seo-backfill.js              # all articles missing seo
 *   node scripts/seo-backfill.js --force      # regenerate for ALL articles
 *   node scripts/seo-backfill.js <slug>       # a single article by slug
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@sanity/client')
const OpenAI = require('openai').default || require('openai')
const { generateSeo } = require('./lib/seo')

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zzzwo1aw',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
})

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function bodyToText(blocks) {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .filter((b) => b && b._type === 'block' && Array.isArray(b.children))
    .map((b) => b.children.map((c) => c.text || '').join(''))
    .join(' ')
    .slice(0, 1500)
}

async function run() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not set')
    process.exit(1)
  }

  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const slug = args.find((a) => !a.startsWith('--'))

  let filter = '_type == "article"'
  const params = {}
  if (slug) {
    filter += ' && slug.current == $slug'
    params.slug = slug
  } else if (!force) {
    filter += ' && !defined(seo.metaTitle)'
  }

  const articles = await sanity.fetch(
    `*[${filter}]{ _id, title, "slug": slug.current, excerpt, body }`,
    params
  )

  console.log(`\nFound ${articles.length} article(s) to process.\n`)
  let done = 0
  let failed = 0

  for (const a of articles) {
    try {
      const seo = await generateSeo(openai, {
        title: a.title,
        excerpt: a.excerpt,
        body: bodyToText(a.body),
      })
      await sanity.patch(a._id).set({ seo }).commit()
      console.log(`  ✅ ${a.slug}`)
      console.log(`     T(${seo.metaTitle.length}): ${seo.metaTitle}`)
      console.log(`     D(${seo.metaDescription.length}): ${seo.metaDescription}`)
      done++
    } catch (e) {
      console.warn(`  ⚠️  ${a.slug} — ${e.message}`)
      failed++
    }
  }

  console.log(`\nDone. Updated: ${done}, failed: ${failed}.\n`)
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
