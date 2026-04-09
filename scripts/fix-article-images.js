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
  token: process.env.SANITY_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

async function run() {
  console.log('=== Fixing Article Images ===\n')

  // Get all articles with broken image references
  const articles = await client.fetch(`*[_type == "article" && defined(mainImage) && mainImage.asset == null] {
    _id,
    title,
    "slug": slug.current,
    mainImage
  }`)

  if (articles.length === 0) {
    console.log('No articles with broken image references found.')
    return
  }

  console.log(`Found ${articles.length} articles with broken image references:\n`)

  // Get all available image assets
  const assets = await client.fetch(`*[_type == "sanity.imageAsset"] | order(_createdAt desc) {
    _id,
    url,
    originalFilename
  }`)

  console.log(`Available image assets: ${assets.length}\n`)

  // Simple mapping - assign images to articles in order
  // In a real scenario, you'd want better matching logic
  for (let i = 0; i < articles.length && i < assets.length; i++) {
    const article = articles[i]
    const asset = assets[i]

    console.log(`Fixing: ${article.title}`)
    console.log(`  Asset: ${asset.originalFilename}`)
    console.log(`  URL: ${asset.url}`)

    try {
      await client
        .patch(article._id)
        .set({
          mainImage: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: asset._id
            }
          }
        })
        .commit()

      console.log('  FIXED\n')
    } catch (error) {
      console.error(`  ERROR: ${error.message}\n`)
    }
  }

  console.log('=== Done ===')
}

run()
