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
  const articles = await sanity.fetch(`*[_type == "article" && slug.current match "is-the-ps6*"] { _id, title, "slug": slug.current, publishedAt, _createdAt }`)
  console.log('Article:', JSON.stringify(articles, null, 2))

  for (const article of articles) {
    if (!article.publishedAt) {
      console.log('Missing publishedAt — fixing...')
      await sanity.patch(article._id).set({ publishedAt: article._createdAt || new Date().toISOString() }).commit()
      console.log('✅ publishedAt set')
    }
  }
}

run().catch(console.error)
