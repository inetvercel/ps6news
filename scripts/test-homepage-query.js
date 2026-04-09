import {createClient} from '@sanity/client'
import {readFileSync} from 'fs'
import {resolve} from 'path'

// Load env
try {
  const envContent = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  })
} catch (e) {}
try {
  const envContent = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  })
} catch (e) {}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

async function run() {
  // Test the exact query used on homepage
  const articles = await client.fetch(`*[_type == "article"] | order(publishedAt desc) [0...5] {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    featured,
    "author": author->name,
    "category": category->title,
    mainImage {
      asset->{
        _id,
        url
      },
      alt
    }
  }`)

  console.log('=== Homepage Query Test ===')
  articles.forEach((article, i) => {
    console.log(`\n${i + 1}. ${article.title}`)
    console.log(`   Has mainImage: ${!!article.mainImage}`)
    if (article.mainImage) {
      console.log(`   Asset URL: ${article.mainImage.asset?.url || 'null'}`)
      console.log(`   Asset ID: ${article.mainImage.asset?._id || 'null'}`)
    }
  })
}

run()
