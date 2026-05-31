/**
 * Backfill: watermark the mainImage of existing articles.
 *
 * Downloads each article's main image, bakes the PS6News watermark in, uploads
 * the new asset, and repoints the article's mainImage to it. Skips images whose
 * asset filename already indicates a watermark (so it is safe to re-run).
 *
 * Usage:
 *   node scripts/watermark-existing.js          # all articles (skips already-watermarked)
 *   node scripts/watermark-existing.js <slug>   # a single article by slug
 *   node scripts/watermark-existing.js --force  # re-watermark even already-watermarked
 *                                                 images (use to fix broken watermarks)
 */

require('dotenv').config({ path: '.env.local' })
const axios = require('axios')
const { createClient } = require('@sanity/client')
const { applyWatermark } = require('./lib/watermark-buffer')

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zzzwo1aw',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
})

async function run() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const slugArg = args.find((a) => !a.startsWith('--'))
  const filter = slugArg
    ? `_type == "article" && slug.current == $slug`
    : `_type == "article" && defined(mainImage.asset)`

  const articles = await sanity.fetch(
    `*[${filter}]{
      _id,
      title,
      "slug": slug.current,
      "assetId": mainImage.asset._ref,
      "url": mainImage.asset->url,
      "filename": mainImage.asset->originalFilename
    }`,
    slugArg ? { slug: slugArg } : {}
  )

  console.log(`\nFound ${articles.length} article(s) with a main image.\n`)
  let done = 0
  let skipped = 0

  for (const a of articles) {
    if (!a.url) {
      console.log(`  ⏭️  ${a.slug} — no image url`)
      skipped++
      continue
    }
    if (!force && a.filename && /watermark/i.test(a.filename)) {
      console.log(`  ⏭️  ${a.slug} — already watermarked (use --force to redo)`)
      skipped++
      continue
    }
    try {
      const res = await axios.get(a.url, { responseType: 'arraybuffer', timeout: 20000 })
      const watermarked = await applyWatermark(Buffer.from(res.data))
      const asset = await sanity.assets.upload('image', watermarked, {
        filename: `ps6-watermarked-${Date.now()}.jpg`,
        contentType: 'image/jpeg',
      })
      await sanity
        .patch(a._id)
        .set({ 'mainImage.asset': { _type: 'reference', _ref: asset._id } })
        .commit()
      console.log(`  ✅ ${a.slug} — watermarked (${asset._id})`)
      done++
    } catch (e) {
      console.warn(`  ⚠️  ${a.slug} — failed: ${e.message}`)
      skipped++
    }
  }

  console.log(`\nDone. Watermarked: ${done}, skipped: ${skipped}.\n`)
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
