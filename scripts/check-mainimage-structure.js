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
  const article = await client.fetch(`*[_type == "article"][0] {
    title,
    mainImage
  }`)

  console.log('=== Article mainImage Structure ===')
  console.log(JSON.stringify(article, null, 2))

  // Check if there are any articles with proper images
  const goodArticles = await client.fetch(`*[_type == "article" && mainImage.asset._ref != null] {
    title,
    "imageRef": mainImage.asset._ref
  }`)

  console.log(`\n=== Articles with proper image refs: ${goodArticles.length} ===`)
  goodArticles.forEach(a => {
    console.log(`- ${a.title}: ${a.imageRef}`)
  })
}

run()
