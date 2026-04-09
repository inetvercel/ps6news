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
  const articles = await client.fetch(`*[_type == "article"] | order(publishedAt desc) [0...5] {
    title,
    "slug": slug.current,
    "hasImage": defined(mainImage),
    "imageUrl": mainImage.asset.url,
    "imageAsset": mainImage.asset
  }`)

  console.log('=== Article Images Check ===')
  articles.forEach((article, i) => {
    console.log(`\n${i + 1}. ${article.title}`)
    console.log(`   Has image: ${article.hasImage}`)
    console.log(`   Image URL: ${article.imageUrl || 'null'}`)
    if (article.imageAsset) {
      console.log(`   Image asset ID: ${article.imageAsset._id}`)
    }
  })
}

run()
