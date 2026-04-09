import {createClient} from '@sanity/client'
import {readFileSync} from 'fs'
import {resolve} from 'path'

try {
  const envContent = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  })
} catch (e) {
  try {
    const envContent = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, ...vals] = line.split('=')
      if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
    })
  } catch (e2) {}
}

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN,
  apiVersion: '2023-05-03',
  useCdn: false
})

const articles = await c.fetch(`*[_type == "article"] | order(publishedAt desc) {
  title, "slug": slug.current, excerpt
}`)

articles.forEach(a => {
  console.log(`\n=== ${a.title} ===`)
  console.log(`Slug: ${a.slug}`)
  console.log(`Excerpt: ${a.excerpt || '(none)'}`)
})
