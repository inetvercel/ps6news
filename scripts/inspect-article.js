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

const slug = process.argv[2] || 'ps6-cost'

const article = await c.fetch(
  `*[_type == "article" && slug.current == $slug][0] { title, body }`,
  { slug }
)

if (!article) {
  console.log('Article not found')
  process.exit(1)
}

console.log(`\n=== ${article.title} ===\n`)
article.body.forEach((block, i) => {
  const text = block.children?.map(c => c.text).join('') || ''
  const marks = block.children?.flatMap(c => c.marks || []) || []
  const hasMD = block.markDefs?.length > 0
  console.log(`[${i}] style=${block.style} ${block.listItem ? 'list=' + block.listItem : ''} ${hasMD ? 'LINKS' : ''} ${marks.includes('strong') ? 'BOLD' : ''}`)
  console.log(`    "${text.substring(0, 120)}${text.length > 120 ? '...' : ''}"`)
})
