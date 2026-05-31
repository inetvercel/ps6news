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
  // Get the published coming-soon article and check/fix its slug
  const articles = await sanity.fetch(`*[_type == "article" && slug.current match "is-the-ps6*"] { _id, title, "slug": slug.current }`)
  console.log('Matching articles:', articles)

  for (const article of articles) {
    if (article.slug && article.slug !== 'is-the-ps6-coming-soon') {
      console.log(`Fixing slug: "${article.slug}" → "is-the-ps6-coming-soon"`)
      await sanity.patch(article._id).set({ 'slug.current': 'is-the-ps6-coming-soon' }).commit()
      console.log('✅ Slug fixed')
    } else {
      console.log('Slug is already correct:', article.slug)
    }
  }
}

run().catch(console.error)
