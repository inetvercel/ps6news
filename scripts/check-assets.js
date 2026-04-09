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
  console.log('=== Checking Sanity Assets ===\n')
  
  // Check any recent assets
  const assets = await client.fetch(`*[_type == "sanity.imageAsset"] | order(_createdAt desc) [0...5] {
    _id,
    url,
    originalFilename,
    _createdAt
  }`)

  console.log('Recent image assets:')
  assets.forEach(asset => {
    console.log(`- ${asset.originalFilename} (${asset._id})`)
    console.log(`  URL: ${asset.url || 'null'}`)
    console.log(`  Created: ${asset._createdAt}`)
  })

  // Check one article's full mainImage structure
  const article = await client.fetch(`*[_type == "article"][0] {
    title,
    mainImage {
      _type,
      _ref,
      asset {
        _id,
        url,
        originalFilename,
        metadata {
          dimensions
        }
      }
    }
  }`)

  console.log('\n=== First Article Image Structure ===')
  console.log(JSON.stringify(article, null, 2))
}

run()
