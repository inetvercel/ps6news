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
  _id,
  title,
  "slug": slug.current,
  "bodyBlocks": count(body),
  "hasLists": count(body[listItem != null]) > 0,
  "hasLinks": count(body[count(markDefs) > 0]) > 0
}`)

console.log(`\nTotal articles: ${articles.length}\n`)
articles.forEach(a => {
  console.log(`${a.title}`)
  console.log(`  slug: ${a.slug} | blocks: ${a.bodyBlocks} | lists: ${a.hasLists} | links: ${a.hasLinks}`)
})
