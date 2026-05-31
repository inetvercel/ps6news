require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@sanity/client')

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zzzwo1aw',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

async function run() {
  const all = await sanity.fetch(
    `*[_type == "article"] | order(publishedAt asc) { _id, title, publishedAt, "slug": slug.current, _type }`
  )
  const match = all.filter(a => a.slug && a.slug.includes('coming-soon'))
  console.log('coming-soon articles:', match)

  console.log('\nAll articles:')
  all.forEach(a => console.log(` ${a._id}  ${a.slug}`))

  // Delete specific known duplicate IDs — the two older "delay" articles from test runs
  const hardDeleteIds = [
    'knwK28U60BjhoMgpyZAzn2', // ps6-what-we-know-and-dont-know-report (keep if not dupe)
    '3t6llZQaFQjH9aqOkHPkTy', // ps6-delay-likely-sony-weighs-date-price
  ]
  // Find all auto-published "delay Sony" articles and keep only the newest
  const autoPublished = all.filter(a => a._id && !a._id.startsWith('article-') && !a._id.startsWith('drafts.') && !['d509ab84-41e5-45a3-9848-c0a939e97866','7511211f-c311-488e-9fbf-6079fa69d0cd','45610874-d92c-4c3a-adec-d43a8caa42e1'].includes(a._id))
  console.log('\nAuto-published:')
  autoPublished.forEach(a => console.log(` ${a._id}  ${a.slug}  ${a.title}`))

  // Among auto-published, find ones about the same "delay" story (3 versions exist)
  const delaySony = autoPublished.filter(a => a.slug && a.slug.includes('delay') && a.slug.includes('ps6'))
  if (delaySony.length > 1) {
    const sorted = delaySony.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    for (const doc of sorted.slice(1)) {
      await sanity.delete(doc._id)
      console.log(`✅ Deleted: "${doc.title}"`)
    }
    console.log(`✅ Kept: "${sorted[0].title}"`)
  }
}

run().catch(console.error)
