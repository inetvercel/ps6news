/**
 * Test the watermark on any image URL without modifying Sanity.
 * Downloads the image, applies the PS6News watermark, and writes the result
 * to a local file so you can inspect it.
 *
 * Usage:
 *   node scripts/watermark-test.js "<imageUrl>" [outputPath]
 * Default output: watermark-test.jpg in the project root.
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { applyWatermark } = require('./lib/watermark-buffer')

async function run() {
  const url = process.argv[2]
  const out = process.argv[3] || 'watermark-test.jpg'
  if (!url) {
    console.error('Usage: node scripts/watermark-test.js "<imageUrl>" [outputPath]')
    process.exit(1)
  }

  console.log(`\n⬇️  Downloading: ${url}`)
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
  console.log(`   ${(res.data.byteLength / 1024).toFixed(0)} KB downloaded`)

  console.log('🔥 Applying watermark…')
  const watermarked = await applyWatermark(Buffer.from(res.data))

  const outPath = path.resolve(out)
  fs.writeFileSync(outPath, watermarked)
  console.log(`\n✅ Saved watermarked image to ${outPath} (${(watermarked.length / 1024).toFixed(0)} KB)\n`)
}

run().catch((e) => { console.error('❌', e.message); process.exit(1) })
